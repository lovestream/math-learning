// Execute the exact previously reviewed program against OS-temporary synthetic data.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {createStore} from '../server/store.mjs';
import {applySelfTraining,manageSelfTraining,selfTrainingData} from '../server/detective-self-store.mjs';
import {selfQuestion} from '../server/detective-self-questions.mjs';
const baseline='0d7fdf3e606eeae53ccbcc57f9c1887433a074c3',temp=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-evidence-upgrade-')),old=path.join(temp,'old'),data=path.join(temp,'data'),checkpoint=path.join(temp,'checkpoint'),out='output/playwright/v2-audit';
const report={passed:false,sourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline,syntheticOnly:true,steps:[]};let store;
try{
 fs.mkdirSync(old);fs.mkdirSync(out,{recursive:true});const archive=path.join(temp,'old.tar');
 execFileSync('git',['archive','-o',archive,baseline,'server','shared','content','package.json']);execFileSync('tar',['-xf',archive,'-C',old]);
 const oldStore=await import(pathToFileURL(path.join(old,'server/store.mjs'))),oldSelf=await import(pathToFileURL(path.join(old,'server/detective-self-store.mjs'))),oldQuestions=await import(pathToFileURL(path.join(old,'server/detective-self-questions.mjs')));
 const at=Date.now(),DAY=86400000;store=oldStore.createStore(data,[]);
 const start=(id,family,mode,time)=>store.mutate(p=>oldSelf.applySelfTraining(p,{action:'start',errorFamilyId:family,mode,attemptId:id,eventId:id+'-start'},time)).result;
 const send=(a,action,body,time)=>store.mutate(p=>oldSelf.applySelfTraining(p,{action,attemptId:a.id,expectedRevision:a.revision,eventId:a.id+'-'+action,...body},time)).result;
 for(const [id,mode,time]of [['weak','practice',at],['transfer','transfer',at+1],['review','review',at+DAY]]){
  let a=start(id,'MASS_AVERAGE',mode,time);const q=oldQuestions.selfQuestion('MASS_AVERAGE',Number(a.question.id.split(':').at(-1)));
  a=send(a,'first',{value:id==='weak'?'9':q.answer,status:'answered',reasoning:''},time);
  a=send(a,'final',{value:q.answer,checkValue:q.checkTarget,...(mode==='review'?{checkExpression:q.checkPattern.replaceAll('□',q.answer)}:{}),checkStatus:'complete',explanation:''},time);
  assert(a.result.independent);
 }
 let open=start('open-before-upgrade','INITIAL_CHANGE','practice',at+DAY);open=send(open,'first',{value:'20',status:'answered',reasoning:'匿名升级夹具'},at+DAY);
 const before=store.export();store.close();store=null;fs.cpSync(data,checkpoint,{recursive:true});
 report.steps.push({name:'execute-0d7fdf3-old-weak-proper-and-open-records',passed:true});
 store=createStore(data,[]);assert.deepEqual(store.export().progress,before.progress);
 const read=store.get(),current=selfTrainingData(read,at+DAY);assert(!current.attempts.find(x=>x.id==='weak').currentEvidenceEligible);assert(current.attempts.find(x=>x.id==='review').currentEvidenceEligible);assert.deepEqual(store.export().progress,before.progress);
 const q=selfQuestion('INITIAL_CHANGE',0);
 store.mutate(p=>applySelfTraining(p,{action:'final',attemptId:open.id,expectedRevision:open.revision,eventId:'finish-old-open',value:q.answer,checkValue:q.checkTarget,checkExpression:q.checkPattern.replaceAll('□',`(${q.answer})`),checkStatus:'complete',explanation:''},at+DAY));
 let a=store.mutate(p=>applySelfTraining(p,{action:'start',attemptId:'new-parent-method',eventId:'new-start',mode:'review',errorFamilyId:'MASS_AVERAGE'},at+3*DAY)).result;
 const nq=selfQuestion('MASS_AVERAGE',Number(a.question.id.split(':').at(-1)));
 a=store.mutate(p=>applySelfTraining(p,{action:'first',attemptId:a.id,eventId:'new-first',expectedRevision:a.revision,value:nq.answer,status:'answered',reasoning:''},at+3*DAY)).result;
 a=store.mutate(p=>applySelfTraining(p,{action:'final',attemptId:a.id,eventId:'new-final',expectedRevision:a.revision,value:nq.answer,checkValue:nq.checkTarget,checkExpression:'',checkStatus:'complete',explanation:'反馈前用实物分组表示原数量关系，已保存纸笔方法的说明。'},at+3*DAY)).result;
 const sealed=structuredClone(store.get().studio.detective.selfTraining.attempts[a.id]);
 store.mutate(p=>manageSelfTraining(p,{action:'review',attemptId:a.id,eventId:'new-parent',expectedRevision:a.revision,expectedScheduleRevision:p.studio.detective.selfTraining.schedules.MASS_AVERAGE.revision,verdict:'check-confirmed',confirmPreFeedbackEvidence:true,comment:'核对原先分组说明，每28颗共56克，每颗2克，关系成立，无辅助。'},at+3*DAY));
 const after=store.export(),saved=after.progress.studio.detective.selfTraining.attempts[a.id];
 for(const key of ['firstAnswer','firstReasoning','preFeedbackRevision','selfCheckActions','result','feedbackReleasedAt'])assert.deepEqual(saved[key],sealed[key]);
 assert.deepEqual(after.progress.studio.detective.selfTraining.attempts.weak,before.progress.studio.detective.selfTraining.attempts.weak);
 assert.deepEqual(after.progress.wallet,before.progress.wallet);assert.deepEqual(after.progress.pets,before.progress.pets);assert.deepEqual(after.progress.studio.detective.attempts,before.progress.studio.detective.attempts);
 store.import(after);assert.deepEqual(store.export().progress,after.progress);assert.throws(()=>oldStore.validateEnvelope(after,[]));
 report.steps.push({name:'upgrade-read-only-evidence-requalification-and-open-attempt-completion',passed:true,oldFeedbackUntouched:true,parentEvidenceRestored:true});
 store.close();store=null;fs.rmSync(data,{recursive:true});fs.cpSync(checkpoint,data,{recursive:true});store=oldStore.createStore(data,[]);assert.deepEqual(store.export().progress,before.progress);
 report.steps.push({name:'actual-old-code-rollback-to-pre-upgrade-checkpoint',passed:true});report.passed=true;
}catch(e){report.error=e.stack;throw e;}finally{store?.close();fs.writeFileSync(out+'/detective-evidence-upgrade.json',JSON.stringify(report,null,2)+'\n');fs.rmSync(temp,{recursive:true,force:true});}
console.log(JSON.stringify({passed:report.passed,baseline,steps:report.steps.length}));
