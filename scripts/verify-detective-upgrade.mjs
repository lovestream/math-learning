// Old-program -> new-program -> restore -> failed start -> old-program rollback.
// Always creates synthetic progress in OS temporary directories. No data-dir option.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {execFileSync,spawn} from 'node:child_process';import {once} from 'node:events';import net from 'node:net';
import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.cwd(),baseSha='1d9c68197449e45dd273978f30fa3844bc4f562e',dataSha='c6e6eaedca53c0976af3ab6e187e2980e4e94430';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:24*1024*1024});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-upgrade-rehearsal-')),old=path.join(temp,'old-program'),data=path.join(temp,'isolated-data'),checkpoint=path.join(temp,'stopped-checkpoint'),inbox=path.join(temp,'mock-inbox');
const out='output/playwright/v2-audit';fs.mkdirSync(out,{recursive:true});fs.mkdirSync(old);fs.mkdirSync(inbox);
const hash=x=>createHash('sha256').update(x).digest('hex');
const evidence={passed:false,source:{prHeadSha:process.env.AUDIT_PR_HEAD_SHA??git('rev-parse','HEAD').trim(),sha:git('rev-parse','HEAD').trim(),dirty:!!git('status','--porcelain').trim(),baseline:baseSha,dataHead:dataSha},syntheticOnly:true,steps:[]};
let child=null,browser=null,context=null;
const stop=async()=>{if(!child)return;const running=child;child=null;if(running.exitCode!==null)return;const done=once(running,'exit');running.kill('SIGTERM');await done;};
const freePort=async()=>{const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));return port;};
const start=async(program,mock=false)=>{
 const port=await freePort(),base=`http://127.0.0.1:${port}`;
 child=spawn(process.execPath,[...(mock?['--import',path.join(root,'scripts/fixtures/detective-inbox-fetch.mjs')]:[]),path.join(program,'server/index.mjs'),`--data-dir=${data}`,`--port=${port}`,...(mock?[]:['--detective-sync=off'])],{cwd:program,stdio:['ignore','pipe','pipe'],env:{...process.env,...(mock?{DETECTIVE_MOCK_INBOX_DIR:inbox}:{})}});
 let logs='';for(const pipe of [child.stdout,child.stderr])pipe.on('data',x=>{logs=(logs+x).slice(-1500)});
 for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Isolated server failed: '+logs);try{if((await fetch(base+'/api/data')).ok)return base;}catch{}await new Promise(r=>setTimeout(r,100));}
 throw Error('Isolated server readiness timeout: '+logs);
};
const json=async(base,url,body)=>{const r=body===undefined?await context.request.get(base+url):await context.request.post(base+url,{data:body});assert(r.ok(),`${url}: HTTP ${r.status()}`);return r.json();};
const unlock=base=>json(base,'/api/parent/access',{action:'unlock',pin:'912345'});
const exportAt=base=>json(base,'/api/parent/export');
const normalized=p=>{const copy=structuredClone(p);const c=copy.studio.detective.cases['DET-G3-PENDING-015'];delete c.draft;delete c.revision;return copy;};
try{
 execFileSync('tar',['-xf','-','-C',old],{input:execFileSync('git',['archive',baseSha,'server','shared','content','scripts/build-grade3-catalog.mjs','scripts/build-upper-primary-catalog.mjs','scripts/build-pilot.mjs','scripts/course-framework.mjs','assets/source/solid-shapes'],{maxBuffer:24*1024*1024})});
 for(const name of ['build-grade3-catalog','build-upper-primary-catalog','build-pilot'])execFileSync(process.execPath,[`scripts/${name}.mjs`],{cwd:old,stdio:'pipe',maxBuffer:1024*1024});
 const load=rel=>import(pathToFileURL(path.join(old,rel)).href),storeApi=await load('server/store.mjs'),detective=await load('server/detective-store.mjs'),pilot=await load('server/pilot-store.mjs'),pet=await load('server/pet-care.mjs'),importer=await load('server/detective-inbox-store.mjs'),model=await load('shared/detective-model.mjs');
 const courses=JSON.parse(fs.readFileSync(path.join(old,'content/catalog.json'))),lessons=JSON.parse(fs.readFileSync(path.join(old,'content/pilot/lessons.json'))),store=storeApi.createStore(data,courses),at=Date.now();
 store.mutate(p=>{
  p.profile.name='升级演练模拟用户';
  // Exercise a real completed course/review, coin ledger, pet care and formal first answer.
  const l=courses[0];for(const q of l.questions.slice(0,l.practiceCount??6))storeApi.applyAttempt(p,{id:crypto.randomUUID(),lessonId:l.id,questionId:q.id,answer:q.answer,usedHint:false,mode:'learn'},courses,at);
  storeApi.applyRetell(p,{id:'synthetic-retell',lessonId:l.id,text:'自动化升级演练：逐个对应，每个对象只数一次。'},courses,at);
  storeApi.applyPurchase(p,{id:'synthetic-food',type:'item',item:'berry'},at);pet.applyFeed(p,{id:'synthetic-feed',item:'berry'},at);
  const s=pilot.createSession(p,{lessonId:'G3-U06-B03',setName:'core'},lessons,at),t=s.tasks[0];
  pilot.selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:'1/5'},eventId:'synthetic-first'},at);
  pilot.revealHelp(p,{sessionId:s.id,revision:s.revision,taskId:t.id,kind:'hint',eventId:'synthetic-hint'},at);
  pilot.selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,phase:'evidence',evidence:{format:'checklist-v1',reflection:'',checks:['读清对象与单位','核对第一步','核对最终量'],finalConfirmed:true},eventId:'synthetic-check'},at);
  pilot.submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:t.expected},eventId:'synthetic-final'},lessons,at);
  for(const file of git('ls-tree','--name-only',dataSha,'content/detective/inbox/').trim().split('\n').filter(x=>/DT-20261015-(ARITH|CARD|EQUAL|ORDER|UNIT)-A.json$/.test(x))){
   const bytes=git('show',`${dataSha}:${file}`),bundle=JSON.parse(bytes);fs.writeFileSync(path.join(inbox,path.basename(file)),bytes);
   importer.importVerifiedBundle(p,bundle,{branch:'detective-inbox',path:file,sha:git('rev-parse',`${dataSha}:${file}`).trim()},at);
  }
  assert.equal(fs.readdirSync(inbox).length,5);
  const wireBytes=fs.readFileSync('content/detective/reviewed/DT-20261016-WIRE-A.json'),wire=JSON.parse(wireBytes);
  const disposition=importer.importVerifiedBundle(p,wire,{branch:'detective-inbox',path:'content/detective/inbox/'+wire.bundleId+'.json',sha:createHash('sha1').update(`blob ${wireBytes.length}\0`).update(wireBytes).digest('hex')},at);
  assert.equal(disposition.status,'needs-review');
  fs.writeFileSync(path.join(inbox,wire.bundleId+'.json'),wireBytes);
  const today=detective.detectiveToday(p,at),entry=today.cases[0],v=p.studio.detective.cases[entry.case.id].versions.find(v=>v.id===entry.case.version),c=v.content;
  let pair=detective.detectiveAttempt(p,{action:'start',attemptId:'synthetic-investigation',caseId:entry.case.id,version:entry.case.version,eventId:crypto.randomUUID()},at);
  const send=(action,extra)=>pair=detective.detectiveAttempt(p,{action,attemptId:pair.attempt.id,expectedRevision:pair.attempt.revision,eventId:crypto.randomUUID(),...extra},at);
  send('judge',{value:c.verdict});send('evidence',{step:c.errorStep,reason:model.orderedReasons(v).findIndex(r=>r.index===c.reason)});send('repair',{value:c.repair.answer});send('verify',{value:c.verify.answer});
 });storeApi.validateEnvelope(store.export(),courses);store.close();
 browser=await chromium.launch({headless:true});context=await browser.newContext();await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 let base=await start(old);await json(base,'/api/parent/access',{action:'setup',pin:'912345'});const before=await exportAt(base),pinHash=hash(fs.readFileSync(path.join(data,'parent-access.json')));await stop();
 fs.cpSync(data,checkpoint,{recursive:true});fs.writeFileSync(path.join(temp,'before-upgrade.json'),JSON.stringify(before));
 evidence.steps.push({name:'old-program-synthetic-checkpoint',passed:true,coins:before.progress.wallet.coins,formalSessions:Object.keys(before.progress.studio.sessions).length,detectiveAttempts:Object.keys(before.progress.studio.detective.attempts).length,importedBundles:5,pendingWireBundle:1});
 base=await start(root);await unlock(base);await json(base,'/api/parent/detective/cases');const upgraded=await exportAt(base);assert.deepEqual(normalized(upgraded.progress),normalized(before.progress));assert.equal(hash(fs.readFileSync(path.join(data,'parent-access.json'))),pinHash);
 assert.equal(upgraded.progress.studio.detective.cases['DET-G3-PENDING-015'].draft.title,'铁丝题：等待原始计算过程');
 await json(base,'/api/parent/import/preview',before);await json(base,'/api/parent/import',before);assert.deepEqual((await exportAt(base)).progress,before.progress);
 const corrupt=structuredClone(before);corrupt.progress.wallet.coins++;const rejected=await context.request.post(base+'/api/parent/import',{data:corrupt});assert(!rejected.ok());assert.deepEqual((await exportAt(base)).progress,before.progress);assert.equal(hash(fs.readFileSync(path.join(data,'parent-access.json'))),pinHash);
 evidence.steps.push({name:'upgrade-and-backup-restore',passed:true,protectedFieldsEqual:true,pinUnchanged:true,onlyExpectedDraftMetadataChanged:true,corruptBackupRejectedWithoutWrite:true});await stop();
 fs.copyFileSync('content/detective/reviewed/DT-20261016-WIRE-A.json',path.join(inbox,'DT-20261016-WIRE-A.json'));
 base=await start(root,true);await unlock(base);let sync;for(let i=0;i<100;i++){sync=await json(base,'/api/parent/detective/sync');if(!sync.syncing&&Object.keys(sync.files).length===6)break;await new Promise(r=>setTimeout(r,100));}assert(!sync.lastError);assert.equal(Object.keys(sync.files).length,6);assert(Object.values(sync.files).every(r=>r.status==='auto-published'));assert.equal(sync.files['content/detective/inbox/DT-20261016-WIRE-A.json'].mathOracleVersion,'detective-oracle.v2');
 const after=await exportAt(base);for(const field of ['wallet','pets','inventory','attempts','lessons','reviews'])assert.deepEqual(after.progress[field],before.progress[field]);for(const field of ['sessions','events','entitlements'])assert.deepEqual(after.progress.studio[field],before.progress.studio[field]);for(const field of ['attempts','plans','badges'])assert.deepEqual(after.progress.studio.detective[field],before.progress.studio.detective[field]);
 const page=await context.newPage();await page.goto(base+'/?view=detective');await page.locator('.det-arrivals .det-case-ticket').first().waitFor();
 for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});await page.screenshot({path:`${out}/detective-upgrade-${width}.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));}
 fs.writeFileSync(path.join(temp,'after-upgrade-preserved.json'),JSON.stringify(after));evidence.steps.push({name:'pinned-five-bundles-and-wire-sync',passed:true,source:'immutable Git blobs replayed through isolated fetch fixture',autoPublished:6,protectedFieldsEqual:true});await stop();
 // Failed startup on an occupied port must not lead to overwriting the checkpoint.
 const blocker=net.createServer();blocker.listen(0,'127.0.0.1');await once(blocker,'listening');
 const failed=spawn(process.execPath,['server/index.mjs',`--data-dir=${data}`,`--port=${blocker.address().port}`,'--detective-sync=off'],{cwd:root,stdio:'ignore'});const [code]=await once(failed,'exit');assert.notEqual(code,0);await new Promise(r=>blocker.close(r));
 fs.rmSync(data,{recursive:true,force:true});fs.cpSync(checkpoint,data,{recursive:true});
 base=await start(old);await unlock(base);const rolledBack=await exportAt(base);assert.deepEqual(rolledBack.progress,before.progress);assert.equal(hash(fs.readFileSync(path.join(data,'parent-access.json'))),pinHash);
 evidence.steps.push({name:'failed-start-and-old-program-rollback',passed:true,failedStartExit:code,oldProgressExactlyRestored:true,pinUnchanged:true,newerExportPreservedBeforeRollback:true});evidence.passed=true;console.log('Upgrade, restore, corruption refusal, six-bundle sync and old-program rollback: passed (synthetic data only)');
}catch(e){evidence.error=e.message;throw e;}finally{
 await context?.tracing.stop({path:`${out}/detective-upgrade-trace.zip`}).catch(()=>{});await browser?.close();await stop();fs.rmSync(temp,{recursive:true,force:true});fs.writeFileSync(`${out}/detective-upgrade.json`,JSON.stringify(evidence,null,2)+'\n');
}
