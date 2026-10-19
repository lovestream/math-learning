// Optional real GitHub smoke check. Always uses a fresh OS-temporary learning DB.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import net from 'node:net';import {spawn} from 'node:child_process';import {once} from 'node:events';import {execFileSync} from 'node:child_process';import {chromium} from 'playwright';
export async function verifyLiveInbox({base,dataDir}){
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base)||!fs.existsSync(path.join(dataDir,'.detective-live-test')))throw Error('Live verifier only accepts an explicitly marked isolated temporary learning directory.');
 const out='output/playwright/v2-audit';fs.mkdirSync(out,{recursive:true});
 const today=await(await fetch(base+'/api/detective/today')).json();if(!today.newCases?.some(x=>x.case.id.startsWith('DT-DEMO-CARDS-20261015')))throw Error('匿名演示尚未自动接收。');
 const browser=await chromium.launch({headless:true});try{const context=await browser.newContext(),page=await context.newPage();await context.tracing.start({screenshots:true,snapshots:true,sources:true});await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/?view=detective');const panel=page.locator('.detective-page');await panel.locator('.det-arrivals').waitFor();await panel.screenshot({path:out+'/detective-live-arrivals-1440.png'});
 await context.request.post(base+'/api/parent/access',{data:{action:'setup',pin:'912345'}});const receipt=await(await context.request.get(base+'/api/parent/detective/sync')).json();const file=receipt.files['content/detective/inbox/DT-DEMO-CARDS-20261015.json'];if(file?.status!=='auto-published')throw Error('真实包未自动发布');
 await page.goto(base+'/?view=parent');await page.locator('.det-inbox-parent').waitFor();await page.locator('.det-inbox-parent').screenshot({path:out+'/detective-live-receipt-1440.png'});
 const evidence={passed:true,source:{sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()},checkedAt:new Date().toISOString(),repo:'lovestream/math-learning',branch:'detective-inbox',sourcePath:file.sourcePath,sourceBlobSha:file.sourceBlobSha,bundleId:file.bundleId,status:file.status,caseIds:file.caseIds,mathOracleVersion:file.mathOracleVersion,scope:'真实GitHub只读→启动自动导入→本机回执→浏览器新案可见；数据仅匿名演示，非Kevin新作业。'};
 fs.writeFileSync(out+'/detective-live-inbox.json',JSON.stringify(evidence,null,2)+'\n');await context.tracing.stop({path:out+'/detective-live-inbox.trace.zip'});console.log(JSON.stringify({passed:true,status:file.status,cases:file.caseIds.length,sourceBlobSha:file.sourceBlobSha}));
}finally{await browser.close();}
}
if(process.argv[1]===import.meta.filename){
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-live-inbox-')),out='output/playwright/v2-audit',probe=net.createServer();fs.mkdirSync(out,{recursive:true});probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));const base=`http://127.0.0.1:${port}`;fs.writeFileSync(path.join(dir,'.detective-live-test'),'isolated anonymous delivery check');
const child=spawn(process.execPath,['server/index.mjs',`--data-dir=${dir}`,`--port=${port}`],{stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',x=>{logs=(logs+x).slice(-2000)});child.stderr.on('data',x=>{logs=(logs+x).slice(-2000)});
try{
 let today;for(let i=0;i<180;i++){try{today=await(await fetch(base+'/api/detective/today')).json();if(today.newCases?.some(x=>x.case.id.startsWith('DT-DEMO-CARDS-20261015')))break;}catch{}await new Promise(r=>setTimeout(r,500));}
 if(!today?.newCases?.some(x=>x.case.id.startsWith('DT-DEMO-CARDS-20261015'))){const setup=await fetch(base+'/api/parent/access',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({action:'setup',pin:'912345'})});const cookie=setup.headers.get('set-cookie')?.split(';')[0];const state=await(await fetch(base+'/api/parent/detective/sync',{headers:{Cookie:cookie}})).json();throw Error('真实GitHub启动收件未完成；不宣称导入成功。'+JSON.stringify({lastError:state.lastError,fileCount:Object.keys(state.files??{}).length,newCases:today?.newCases?.map(x=>x.case.id),responseError:today?.error})+logs);}
 await verifyLiveInbox({base,dataDir:dir});
}finally{child.kill('SIGTERM');await once(child,'exit');fs.rmSync(dir,{recursive:true,force:true});}
}
