// Complete rollback uses the checkpoint from BEFORE the schema extension.
// An older executable must never be pointed at a newer live database.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
import {createStore} from '../server/store.mjs';import {importVerifiedBundle} from '../server/detective-inbox-store.mjs';import {applySelfTraining} from '../server/detective-self-store.mjs';import {selfQuestion} from '../server/detective-self-questions.mjs';
const baseline='a7c05aaa8d9c5eabae4f3453807f830da1cbf279',root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-v2-rollback-')),old=path.join(temp,'old'),data=path.join(temp,'data'),checkpoint=path.join(temp,'checkpoint'),out='output/playwright/v2-audit';
fs.mkdirSync(old);fs.mkdirSync(out,{recursive:true});const evidence={passed:false,oldSha:baseline,newSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),syntheticOnly:true,steps:[]};let store;
try{
 const archive=path.join(temp,'old-source.tar');execFileSync('git',['archive','-o',archive,baseline,'server','shared','content','package.json'],{stdio:'ignore'});execFileSync('tar',['-xf',archive,'-C',old],{stdio:'ignore'});
 const oldStore=await import(pathToFileURL(path.join(old,'server/store.mjs'))),oldInbox=await import(pathToFileURL(path.join(old,'server/detective-inbox-store.mjs')));
 store=oldStore.createStore(data,[]);const at=Date.now(),bundles=fs.readdirSync('content/detective/reviewed').filter(f=>f.startsWith('DT-20261026')).map(f=>({file:f,bundle:JSON.parse(fs.readFileSync('content/detective/reviewed/'+f))}));
 const manifest=JSON.parse(fs.readFileSync('content/detective/reviewed/v2-source-manifest.json'));
 const source=f=>({branch:'detective-inbox',path:'content/detective/inbox/'+f,sha:manifest.files[f]});
 for(const {file,bundle}of bundles)assert.equal(store.mutate(p=>oldInbox.importVerifiedBundle(p,bundle,source(file),at)).result.status,'needs-review');
 const before=store.export();fs.writeFileSync(path.join(temp,'before.json'),JSON.stringify(before));store.close();store=null;fs.cpSync(data,checkpoint,{recursive:true});
 evidence.steps.push({name:'old-v2-oracle-12-pending-checkpoint',passed:true,cases:12});
 store=createStore(data,[]);assert.deepEqual(store.get(),before.progress);for(const {file,bundle}of bundles)assert.equal(store.mutate(p=>importVerifiedBundle(p,bundle,source(file),at)).result.status,'auto-published');
 const q=selfQuestion('INITIAL_CHANGE',0);let a=store.mutate(p=>applySelfTraining(p,{action:'start',mode:'practice',errorFamilyId:q.family,attemptId:'rollback-v2',eventId:'start'},at)).result;
 a=store.mutate(p=>applySelfTraining(p,{action:'first',attemptId:a.id,eventId:'first',expectedRevision:a.revision,value:'6',status:'answered',reasoning:'匿名升级测试'},at)).result;
 store.mutate(p=>applySelfTraining(p,{action:'final',attemptId:a.id,eventId:'final',expectedRevision:a.revision,value:q.answer,checkValue:q.checkTarget,checkExpression:q.checkPattern.replaceAll('□',`(${q.answer})`),checkStatus:'complete',explanation:'模拟反查'},at));
 const after=store.export();store.import(after);assert.deepEqual(store.get(),after.progress);assert.deepEqual(after.progress.wallet,before.progress.wallet);assert.deepEqual(after.progress.pets,before.progress.pets);assert.deepEqual(after.progress.studio.detective.attempts,before.progress.studio.detective.attempts);
 evidence.steps.push({name:'v3-recheck-and-self-correction-backup-restore',passed:true,newSelfAttempts:1,walletPetsOldHistoryUnchanged:true});
 assert.throws(()=>oldStore.validateEnvelope(after,[]),'Older code must reject the new namespace instead of silently deleting it');store.close();store=null;
 fs.rmSync(data,{recursive:true});fs.cpSync(checkpoint,data,{recursive:true});store=oldStore.createStore(data,[]);assert.deepEqual(store.get(),before.progress);oldStore.validateEnvelope(store.export(),[]);
 evidence.steps.push({name:'rollback-executable-plus-pre-upgrade-checkpoint',passed:true,oldPending12Unchanged:true});evidence.passed=true;
}catch(e){evidence.error=e.stack;throw e;}finally{store?.close();fs.writeFileSync(out+'/detective-v2-upgrade.json',JSON.stringify(evidence,null,2)+'\n');fs.rmSync(temp,{recursive:true,force:true});}
console.log(JSON.stringify({passed:evidence.passed,steps:evidence.steps.length,oldSha:baseline}));
