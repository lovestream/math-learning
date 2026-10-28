// Audit real inbox content against its immutable Git blob, then play every case.
// This optional network/browser audit is never pointed at the learner's real DB.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync,spawn} from 'node:child_process';import net from 'node:net';import {once} from 'node:events';import {chromium} from 'playwright';import assert from 'node:assert/strict';
import {parseInboxBundle,inboxFilename,INBOX_PATH} from '../shared/detective-inbox.mjs';
import {auditDeliveredBundle} from './lib/detective-delivery-audit.mjs';
import {parseNumber,add,rational,formatFraction} from '../shared/pilot-math.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:1024*1024}).trim();
export async function verifyDeliveries({base,dataDir,prefix='DT-',output='output/playwright/detective-deliveries'}){
 assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(base));assert(fs.existsSync(path.join(dataDir,'.detective-live-test')),'Only explicitly marked isolated test data may be used.');fs.mkdirSync(output,{recursive:true});
 const source={sha:git('rev-parse','HEAD'),dirty:!!git('status','--porcelain'),dataHead:git('rev-parse','origin/detective-inbox')};
 const browser=await chromium.launch({headless:true}),context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 const evidence={passed:false,source,prefix,repo:'lovestream/math-learning',branch:'detective-inbox',checkedAt:new Date().toISOString(),bundles:[],cases:[],notes:[]};
 try{
  // Setup/unlock is confined to this explicitly marked temporary test database.
  const setup=await context.request.post(base+'/api/parent/access',{data:{action:'setup',pin:'912345'}});if(!setup.ok())assert((await context.request.post(base+'/api/parent/access',{data:{action:'unlock',pin:'912345'}})).ok());
  let sync;for(let i=0;i<240;i++){sync=await(await context.request.get(base+'/api/parent/detective/sync')).json();if(!sync.syncing)break;await new Promise(r=>setTimeout(r,500));}assert(!sync.syncing,'Inbox sync has not completed');assert(!sync.lastError,sync.lastError);assert(sync.lastSuccessAt,'No successful local receipt');
  const files=Object.values(sync.files).filter(f=>f.bundleId.startsWith(prefix)&&!f.bundleId.includes('DEMO'));assert(files.length,'No matching delivery has arrived; do not pretend GitHub files are locally imported.');
  const entries=[];
  for(const f of files){
   assert.equal(f.status,'auto-published');assert(f.sourcePath.startsWith(INBOX_PATH)&&inboxFilename(f.sourcePath.slice(INBOX_PATH.length)));
   const blob=git('rev-parse',`${source.dataHead}:${f.sourcePath}`);assert.equal(blob,f.sourceBlobSha,'Remote delivery changed; fetch and audit that exact revision again.');
   const bundle=parseInboxBundle(git('show',`${source.dataHead}:${f.sourcePath}`)),audit=auditDeliveredBundle(bundle);evidence.bundles.push({bundleId:bundle.bundleId,path:f.sourcePath,blobSha:blob,disposition:f.status,...audit});
   for(const [i,c]of bundle.cases.entries())entries.push({content:c.content,id:c.id,reference:audit.cases[i],bundleId:bundle.bundleId});
  }
  const initial=await(await context.request.get(base+'/api/detective/today')).json(),originalPlan=initial.cases.map(x=>x.case.version);assert.equal(initial.cases.length,3);
  assert(entries.every(c=>initial.newCases.some(p=>p.case.id===c.id)),'Published delivery missing from child entry');
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/?view=detective');const panel=page.locator('.detective-page');await panel.locator('.det-case-ticket').first().waitFor();
  let dragged=false,wrongTested=false,refreshed=false;
  for(const entry of entries){
   const c=entry.content,ref=entry.reference;const ticket=panel.locator('.det-case-ticket').filter({hasText:c.prompt});assert.equal(await ticket.count(),1,'Question previews must distinguish same-title cases');await ticket.click();
   await panel.getByRole('heading',{name:'这份做法有问题吗？',exact:true}).waitFor();
   const publicBefore=await(await context.request.get(base+'/api/detective/today')).json(),publicCase=publicBefore.history.find(x=>x.case.id===entry.id).case;assert(!('solution'in publicCase)&&!('response'in publicCase)&&!('verdict'in publicCase)&&!('sourceNotes'in publicCase));
   assert((await panel.locator('.det-case-sheet').innerText()).includes(c.prompt));await panel.locator('.det-figure').waitFor();
   if(!evidence.cases.some(x=>x.template===ref.template))await panel.locator('.det-investigation').screenshot({path:`${output}/${entry.bundleId}-question-1440.png`});
   await panel.getByRole('button',{name:c.verdict==='wrong'?'有问题':'没问题',exact:true}).click();await panel.getByRole('heading',{name:c.verdict==='wrong'?'第一处问题在哪里？':'你用什么依据判断正确？',exact:true}).waitFor();
   if(c.verdict==='wrong')await panel.locator('.det-work>button').nth(c.errorStep).click();else assert.equal(await panel.locator('.det-work>button').count(),0);
   await panel.getByLabel(c.reasons[c.reason],{exact:true}).check();await panel.getByRole('button',{name:/保存证据/}).click();await panel.getByRole('button',{name:/保存结果，去验证/}).waitFor();
   if(c.repair.kind==='ordering'){
    const rows=panel.locator('.det-sort li'),target=ref.repair.split('|');
    if(!dragged){await rows.filter({hasText:target[0]}).dragTo(rows.first());await page.waitForFunction(t=>document.querySelector('.det-sort li b')?.textContent===t,target[0]);dragged=true;}
    for(let i=0;i<target.length;i++){
     let position=(await rows.locator('b').allTextContents()).indexOf(target[i]);while(position>i){await panel.getByRole('button',{name:target[i]+'上移',exact:true}).click();position--;await page.waitForFunction(({i,label})=>document.querySelectorAll('.det-sort li b')[i]?.textContent===label,{i:position,label:target[i]});}
    }
    if(await panel.getByRole('button',{name:'保留当前排列',exact:true}).count())await panel.getByRole('button',{name:'保留当前排列',exact:true}).click();
    assert.deepEqual(await rows.locator('b').allTextContents(),target);
   }else{
    if(!wrongTested&&c.verdict==='wrong'){
     await panel.getByLabel('你的答案',{exact:true}).fill(formatFraction(add(parseNumber(ref.repair),rational(1))));await panel.getByRole('button',{name:/保存结果，去验证/}).click();await panel.getByText('这个结果还不能符合全部条件。请回看题目里的数量和单位，再试一次。',{exact:true}).waitFor();await panel.screenshot({path:`${output}/incorrect-repair.png`});wrongTested=true;
    }
    await panel.getByLabel('你的答案',{exact:true}).fill(ref.repair);
   }
   if(!refreshed&&c.repair.kind==='number'){
    await panel.locator('.det-toolbar').getByText('记录已保存在本机',{exact:true}).waitFor();await page.reload();await panel.locator('.det-history').evaluate(e=>e.open=true);const history=panel.locator('.det-history button').filter({hasText:c.prompt});assert.equal(await history.count(),1,'Same-title history cannot identify the question');await history.click();await panel.getByLabel('你的答案',{exact:true}).waitFor();assert.equal(await panel.getByLabel('你的答案',{exact:true}).inputValue(),ref.repair);refreshed=true;
   }
   await panel.getByRole('button',{name:/保存结果，去验证/}).click();await panel.getByRole('button',{name:/保存验证，结案/}).waitFor();await panel.getByLabel('你的答案',{exact:true}).fill(ref.verify);await panel.getByRole('button',{name:/保存验证，结案/}).click();await panel.getByText('核 对 完 成',{exact:true}).waitFor();
   const after=await(await context.request.get(base+'/api/detective/today')).json(),attempt=after.history.find(x=>x.case.id===entry.id).attempt;assert.equal(attempt.firstVerdict,c.verdict);assert(attempt.status.startsWith('closed-'));assert(after.badges<=3);assert.deepEqual(after.cases.map(x=>x.case.version),originalPlan);
   evidence.cases.push({...ref,bundleId:entry.bundleId,status:attempt.status,firstVerdict:attempt.firstVerdict});fs.writeFileSync(output+'/deliveries.json',JSON.stringify(evidence,null,2)+'\n');
   await panel.getByRole('button',{name:/暂停，回案卷柜/}).click();await panel.locator('.det-case-ticket').first().waitFor();console.log(`${entry.id}: passed`);
  }
  await panel.locator('.det-history').evaluate(e=>e.open=true);assert.equal(await panel.locator('.det-history-prompt').count(),entries.length);
  for(const width of [1440,768,390]){await page.setViewportSize({width,height:width===390?844:1024});await panel.locator('.det-case-grid').first().evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`${output}/case-library-${width}.png`});if(width===390){await panel.locator('.det-history').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`${output}/history-390.png`});}assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${width} overflow`);}
  assert((await context.request.post(base+'/api/parent/access',{data:{action:'unlock',pin:'912345'}})).ok());const bank=await(await context.request.get(base+'/api/parent/detective/cases')).json();assert.equal(bank.attempts.length,entries.length);assert.equal(bank.badges.length,3);const before=bank.cases.length;
  const again=await(await context.request.post(base+'/api/parent/detective/sync',{data:{}})).json();assert(!again.lastError,again.lastError);const repeated=await(await context.request.get(base+'/api/parent/detective/cases')).json();assert.equal(repeated.cases.length,before);assert.equal(repeated.attempts.length,entries.length);assert.equal(repeated.badges.length,3);
  const backup=await(await context.request.get(base+'/api/parent/export')).json();assert.equal(backup.progress.wallet.coins,0);assert.equal(backup.progress.studio.detective.attempts[bank.attempts[0].id].firstVerdict,bank.attempts[0].firstVerdict);assert((await context.request.post(base+'/api/parent/import/preview',{data:backup})).ok());assert((await context.request.post(base+'/api/parent/import',{data:backup})).ok());
  assert(!errors.length,errors.join(';'));evidence.passed=true;evidence.notes=['真实GitHub自动接收，与本地不可变blob逐一对照','独立数学复算；全部案件四步浏览器走通','同名题的今日与历史题面可识别',dragged?'实际拖动与上移按钮排序':'本批没有排序题','错误答案拒绝；刷新恢复','今日三案与首判保留','重复同步不多建案，不多奖励','备份恢复与原钱包不变','仅临时学习库，不代表Kevin作答'];
  await context.tracing.stop({path:output+'/deliveries.trace.zip'});return evidence;
 }catch(e){evidence.error=e.message;await page.screenshot({path:output+'/failed.png',fullPage:true}).catch(()=>{});await context.tracing.stop({path:output+'/failed.trace.zip'}).catch(()=>{});throw e;}
 finally{fs.writeFileSync(output+'/deliveries.json',JSON.stringify(evidence,null,2)+'\n');await browser.close();}
}
if(process.argv[1]===import.meta.filename){
 const arg=name=>process.argv.find(v=>v.startsWith(`--${name}=`))?.slice(name.length+3);const baseArg=arg('base'),dataDirArg=arg('data-dir'),prefix=arg('prefix')??'DT-';
 if(baseArg&&dataDirArg){const r=await verifyDeliveries({base:baseArg,dataDir:dataDirArg,prefix});console.log(JSON.stringify({passed:r.passed,bundles:r.bundles.length,cases:r.cases.length}));}
 else{
  assert(!baseArg&&!dataDirArg,'Pass both --base and --data-dir for an isolated existing service');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-content-delivery-')),probe=net.createServer();fs.writeFileSync(path.join(dir,'.detective-live-test'),'isolated public content audit');probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));const base=`http://127.0.0.1:${port}`;
  const child=spawn(process.execPath,['server/index.mjs',`--port=${port}`,`--data-dir=${dir}`],{stdio:'ignore'});
  try{let ready=false;for(let i=0;i<240;i++){try{const t=await(await fetch(base+'/api/detective/today')).json();if(t.newCases?.some(p=>p.case.id.startsWith(prefix)&&!p.case.id.includes('DEMO'))){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert(ready,'Real inbox delivery has not arrived; do not claim success.');const r=await verifyDeliveries({base,dataDir:dir,prefix});console.log(JSON.stringify({passed:r.passed,bundles:r.bundles.length,cases:r.cases.length}));}finally{child.kill('SIGTERM');await once(child,'exit');fs.rmSync(dir,{recursive:true,force:true});}
 }
}
