import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
const root=process.cwd(),baseline='0d7fdf3e606eeae53ccbcc57f9c1887433a074c3',dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-legacy-equivalent-')),old=path.join(dir,'old'),data=path.join(dir,'data'),checkpoint=path.join(dir,'checkpoint');
const moduleAt=(base,file)=>import(pathToFileURL(path.join(base,file))),currentStore=await moduleAt(root,'server/store.mjs'),currentSelf=await moduleAt(root,'server/detective-self-store.mjs');let store;
const report={passed:false,syntheticOnly:true,sourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),baseline};
try{
 fs.mkdirSync(old);const tar=path.join(dir,'old.tar');execFileSync('git',['archive','-o',tar,baseline,'server','shared','content','package.json']);execFileSync('tar',['-xf',tar,'-C',old]);
 const osStore=await moduleAt(old,'server/store.mjs'),osSelf=await moduleAt(old,'server/detective-self-store.mjs');store=osStore.createStore(data,[]);const at=Date.now(),later=at+86400000;
 const send=(body,now)=>store.mutate(p=>osSelf.applySelfTraining(p,body,now)).result;
 let a=send({action:'start',mode:'practice',errorFamilyId:'MASS_AVERAGE',attemptId:'initial',eventId:'s0'},at);
 a=send({action:'first',attemptId:a.id,eventId:'f0',expectedRevision:a.revision,status:'answered',value:'0.5',reasoning:''},at);
 send({action:'final',attemptId:a.id,eventId:'c0',expectedRevision:a.revision,value:'0.5',checkValue:'12.5',checkStatus:'complete',explanation:'0.5×25=12.5，与原条件一致。'},at);
 a=send({action:'start',mode:'review',errorFamilyId:'MASS_AVERAGE',attemptId:'old-rejected-equivalent',eventId:'s1'},later);
 a=send({action:'first',attemptId:a.id,eventId:'f1',expectedRevision:a.revision,status:'answered',value:'26',reasoning:''},later);
 a=send({action:'final',attemptId:a.id,eventId:'c1',expectedRevision:a.revision,value:'26',checkValue:'26',checkExpression:'1×26',checkStatus:'complete',explanation:'用每颗1克乘26颗，回到总重26克。'},later);
 assert(!a.result.checkValid&&!a.result.independent);const before=store.export();store.close();store=null;fs.cpSync(data,checkpoint,{recursive:true});
 store=currentStore.createStore(data,[]);assert.deepEqual(store.export().progress,before.progress);
 let view=currentSelf.selfTrainingData(store.get(),later);assert(view.attempts.find(x=>x.id===a.id).currentEvidenceEligible);assert.equal(view.families[0].schedule.stage,0);
 const prior=structuredClone(store.get().studio.detective.selfTraining.attempts[a.id]);
 const request={action:'review',attemptId:a.id,eventId:'confirm-original-equivalent',expectedRevision:a.revision,expectedScheduleRevision:store.get().studio.detective.selfTraining.schedules.MASS_AVERAGE.revision,verdict:'check-confirmed',confirmPreFeedbackEvidence:true,comment:'原式1×26与26×1等价；反馈前已经写明每颗质量乘颗数，未给提示。'};
 store.mutate(p=>currentSelf.manageSelfTraining(p,request,later));const after=store.export();store.mutate(p=>currentSelf.manageSelfTraining(p,request,later));assert.deepEqual(store.export().progress,after.progress);
 const saved=after.progress.studio.detective.selfTraining.attempts[a.id];for(const key of ['firstAnswer','firstReasoning','preFeedbackRevision','selfCheckActions','result','feedbackReleasedAt'])assert.deepEqual(saved[key],prior[key]);
 assert.equal(after.progress.studio.detective.selfTraining.schedules.MASS_AVERAGE.stage,1);store.import(after);assert.deepEqual(store.export().progress,after.progress);
 store.close();store=null;fs.rmSync(data,{recursive:true});fs.cpSync(checkpoint,data,{recursive:true});store=osStore.createStore(data,[]);assert.deepEqual(store.export().progress,before.progress);
 report.passed=true;report.checks=['real old-code rejection of 1×26 vs 26×1','read-only current requalification without historical rewrite','parent repairs latest review once','exact event replay does not advance twice','backup restore','actual old checkpoint rollback'];
}finally{store?.close();fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync('output/playwright/v2-audit',{recursive:true});fs.writeFileSync('output/playwright/v2-audit/detective-legacy-equivalence.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
