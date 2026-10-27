import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {applySelfTraining,manageSelfTraining,selfTrainingData} from '../server/detective-self-store.mjs';
import {SELF_FAMILIES,selfQuestion} from '../server/detective-self-questions.mjs';
import {evaluateCheckEvidence,hasReviewableCheckEvidence} from '../server/detective-check-evidence.mjs';
const now=Date.parse('2026-10-27T04:00:00Z'),DAY=86400000;
const copy=x=>structuredClone(x);
function attempt(p,{mode='practice',at=now,expression,explanation='',value,help=false,status='answered',complete='complete'}={}){
 let a=applySelfTraining(p,{action:'start',mode,errorFamilyId:'MASS_AVERAGE',attemptId:crypto.randomUUID(),eventId:crypto.randomUUID()},at);
 const q=selfQuestion('MASS_AVERAGE',Number(a.question.id.split(':').at(-1)));
 const send=(action,extra)=>a=applySelfTraining(p,{action,attemptId:a.id,eventId:crypto.randomUUID(),expectedRevision:a.revision,...extra},at);
 send('first',{value:status==='blank'?'':'9',status,reasoning:''});if(help)send('hint',{});
 const text=typeof expression==='function'?expression(q):expression??q.checkPattern.replaceAll('□',`(${q.answer})`);
 send('final',{value:q.answer,checkValue:value??q.checkTarget,checkExpression:text,checkStatus:complete,explanation});
 return {a,q};
}
const review=(p,a,extra={},at=now)=>manageSelfTraining(p,{action:'review',attemptId:a.id,eventId:crypto.randomUUID(),expectedRevision:p.studio.detective.selfTraining.attempts[a.id].revision,verdict:'check-confirmed',comment:'核对封存条件和当时写出的数量关系成立，未提供辅助。',confirmPreFeedbackEvidence:true,expectedScheduleRevision:p.studio.detective.selfTraining.schedules.MASS_AVERAGE.revision,...extra},at);

test('A：抄目标＋空解释在普通练习/迁移均只算答案改对，不算独立纠错或晋级',()=>{
 for(const mode of ['practice','transfer']){
  const p=freshProgress(),{a}=attempt(p,{mode,expression:''});
  assert(a.result.finalCorrect);assert(!a.result.checkValid);assert(!a.result.independent);assert(!a.currentEvidenceEligible);
  assert.equal(a.result.category,'answer-correct-check-unproven');
  const d=selfTrainingData(p,now);assert.equal(d.stats.preFeedbackCorrection.numerator,1);assert.equal(d.stats.effectiveCorrection.numerator,0);assert.equal(d.stats.transfer.numerator,0);assert.match(d.families[0].evidence,/证据不足/);
  const before=copy(p);assert.throws(()=>review(p,a),/空白证据/);assert.deepEqual(p,before);
 }
});
test('A：裸数值、带单位或括号的抄写不能靠家长勾选升级；计算与文字方法仍可核对',()=>{
 for(const [expression,explanation]of [['12.5',''],['','12.5'],['12.5克',''],['(12.5)','']]){
  const p=freshProgress(),{a}=attempt(p,{expression,explanation});
  assert(!a.result.independent);assert(!a.currentCheckEvidence.reviewable);
  const before=copy(p);assert.throws(()=>review(p,a));assert.deepEqual(p,before);
 }
 assert(hasReviewableCheckEvidence('25×0.5',''));
 assert(hasReviewableCheckEvidence('','我把25份分成20份和5份，分别求重再合并。'));
});
test('A：实际检验式可支持独立纠错，辅助与未确认检查不能混入',()=>{
 for(const [opts,independent]of [[{},true],[{help:true},false],[{complete:'uncertain'},false],[{status:'blank'},false]]){
  const p=freshProgress(),{a}=attempt(p,opts);assert.equal(a.result.independent,independent);assert.equal(a.currentEvidenceEligible,independent);
  if(opts.help){assert.equal(a.result.category,'assisted');assert.throws(()=>review(p,a));}
 }
});
test('B：乘法交换、括号拆分、分配、分数、代入与另一反向方法均按关系核验',()=>{
 const q=selfQuestion('MASS_AVERAGE',0);
 for(const [expression,value]of [['25×0.5','12.5'],['(20+5)×0.5','12.5'],['0.5×20+0.5×5','12.5'],['（20＋5）×□','12.5'],['1/2×25','12.5'],['12.5÷0.5','25'],[Array(25).fill('0.5').join('+'),'12.5']])assert(evaluateCheckEvidence(q,'0.5',value,expression).verified,expression);
 for(const expression of ['', '12.5','12.5/1','12.5+0×0.5','(0.5-0.5)+12.5','0.5+12','12.5+25*(0.5-0.5)','0.5*0.5*50','0.5*26','0.5*25+1','alert(1)','x.constructor','1/0','2**3','('.repeat(30)+'0.5'+')'.repeat(30),'1'.repeat(31)+'*0.5'])assert(!evaluateCheckEvidence(q,'0.5','12.5',expression).verified,expression);
 assert(!evaluateCheckEvidence(q,'0.5','999','25*0.5').verified);
});
test('B：8族256参数的两条独立反向关系均有证明，不靠某一固定标准字符串',()=>{
 let count=0;
 for(const f of SELF_FAMILIES)for(let i=0;i<256;i++){
  const q=selfQuestion(f.id,i);assert.equal(q.checkRelations.length,2);
  for(const r of q.checkRelations){assert(evaluateCheckEvidence(q,q.answer,r.target,r.pattern.replaceAll('□',`(${q.answer})`)).verified,`${f.id}:${i}:${r.pattern}`);count++;}
  assert(!evaluateCheckEvidence(q,q.answer,q.checkTarget,q.checkTarget).verified);
 }
 assert.equal(count,4096);
});
test('B：延迟复测接受交换和拆分的等价式并推进，不把单一写法当标准答案',()=>{
 const p=freshProgress();attempt(p);attempt(p,{mode:'transfer'});
 const {a}=attempt(p,{mode:'review',at:now+DAY,expression:q=>`(20+7)*(${q.answer})`});
 assert(a.result.independent);assert.equal(p.studio.detective.selfTraining.schedules.MASS_AVERAGE.stage,1);assert(!a.question.check);
});
test('B：家长能确认反馈前其他方法，推进最新待核对复测一次；历史与首答二答不变',()=>{
 const p=freshProgress();attempt(p);attempt(p,{mode:'transfer'});
 const {a}=attempt(p,{mode:'review',at:now+DAY,expression:'',explanation:'我画27格，每格1.5克，拆成20格和7格合起来是40.5克。'});
 assert(!a.result.independent);const original=copy(p.studio.detective.selfTraining.attempts[a.id]);
 const body={eventId:'parent-confirm-once'};review(p,a,body,now+DAY);
 let d=selfTrainingData(p,now+DAY),row=d.attempts.find(x=>x.id===a.id);assert(row.currentEvidenceEligible);assert.equal(row.currentCheckEvidence.source,'parent-confirmed');assert.equal(d.families[0].schedule.stage,1);assert.equal(d.stats.delayed[0].numerator,1);

 const stored=p.studio.detective.selfTraining.attempts[a.id];for(const k of ['firstAnswer','firstReasoning','preFeedbackRevision','selfCheckActions','result','feedbackReleasedAt'])assert.deepEqual(stored[k],original[k],k);
 assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
});
test('B：批阅更正/重复/双标签及计划409不覆盖证据、不重复推进',()=>{
 const p=freshProgress();attempt(p);const {a}=attempt(p,{mode:'review',at:now+DAY,expression:'',explanation:'按20份和6份分开相加，原条件一致。'});
 const s=p.studio.detective.selfTraining,original=copy(s.attempts[a.id]),revision=s.schedules.MASS_AVERAGE.revision;
 manageSelfTraining(p,{action:'schedule',errorFamilyId:'MASS_AVERAGE',eventId:'pause',expectedRevision:revision,paused:true,dueDay:'2026-10-30'},now+DAY);
 const before=copy(p);assert.throws(()=>review(p,a,{expectedScheduleRevision:revision},now+DAY),{status:409});assert.deepEqual(p,before);
 const request={action:'review',attemptId:a.id,eventId:'confirm',expectedRevision:a.revision,verdict:'check-confirmed',comment:'核对反馈前分组求和，关系成立且无辅助。',confirmPreFeedbackEvidence:true,expectedScheduleRevision:revision+1};
 manageSelfTraining(p,request,now+DAY);const after=copy(p);manageSelfTraining(p,request,now+DAY);assert.deepEqual(p,after);
 assert.throws(()=>manageSelfTraining(p,{...request,eventId:'stale'},now+DAY),{status:409});assert.deepEqual(p,after);
 review(p,a,{},now+DAY);assert.equal(p.studio.detective.selfTraining.schedules.MASS_AVERAGE.stage,1);
 const stored=p.studio.detective.selfTraining.attempts[a.id];for(const k of ['firstAnswer','firstReasoning','preFeedbackRevision','selfCheckActions','result','feedbackReleasedAt'])assert.deepEqual(stored[k],original[k],k);
 manageSelfTraining(p,{action:'review',attemptId:a.id,eventId:'retract',expectedRevision:stored.revision,verdict:'needs-practice',comment:'更正：仍需独立回补'},now+DAY);
 assert(!selfTrainingData(p,now+DAY).attempts.find(x=>x.id===a.id).currentEvidenceEligible);assert.equal(p.studio.detective.selfTraining.schedules.MASS_AVERAGE.stage,0);
 assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
});
test('B：旧版反馈不可追溯改写；旧薄弱记录不自动继承独立资格',()=>{
 const p=freshProgress(),{a}=attempt(p);const old=p.studio.detective.selfTraining.attempts[a.id];
 old.selfCheckActions.expression=null;delete old.result.checkPolicyVersion;delete old.result.checkEvidence;
 const envelope=exportEnvelope(p),sealed=copy(old);validateEnvelope(envelope,[]);
 const row=selfTrainingData(p,now).attempts[0];assert(row.result.independent);assert(row.currentCheckEvidence.legacySnapshot);assert(!row.currentEvidenceEligible);assert.equal(selfTrainingData(p,now).stats.effectiveCorrection.numerator,0);assert.deepEqual(old,sealed);
 const bad=copy(p);bad.studio.detective.selfTraining.attempts[a.id].result.checkPolicyVersion='detective-check.v999';assert.throws(()=>validateEnvelope(exportEnvelope(bad),[]));
});
test('B：相同数值的不同数学角色不混淆，重复答案的凑数仍不能冒充检验',()=>{
 const q=selfQuestion('OPERATION_ORDER',1);assert.equal(q.answer,'12');
 assert(evaluateCheckEvidence(q,'12','24','12+4×3').verified);
 assert(evaluateCheckEvidence(q,'12','4','(24-12)/3').verified);
 const avg=selfQuestion('MASS_AVERAGE',1);assert(evaluateCheckEvidence(avg,'26','1','26÷26').verified);
 const plain=selfQuestion('MASS_AVERAGE',0);
 for(const expression of ['12.5+25*(0.5-0.5)','0.5*0.5*50','12.5+(0.5-0.5)*25'])assert(!evaluateCheckEvidence(plain,'0.5','12.5',expression).verified);
});
test('B：家长确认需具体依据与反馈前证据；不确定与辅助不能升级',()=>{
 const p=freshProgress(),{a}=attempt(p,{expression:'',explanation:'我用画格的方法核对了条件。'});
 for(const extra of [{confirmPreFeedbackEvidence:false},{comment:''}]){const before=copy(p);assert.throws(()=>review(p,a,extra));assert.deepEqual(p,before);}
 const uncertain=freshProgress(),u=attempt(uncertain,{complete:'uncertain',explanation:'仍不能确定关系。'}).a;assert.throws(()=>review(uncertain,u));
 const helped=freshProgress(),h=attempt(helped,{help:true,explanation:'解释过后算对。'}).a;assert.throws(()=>review(helped,h));
});
test('B：确认早期记录不跳过较新的待核对复测，最新记录一次推进',()=>{
 const p=freshProgress();attempt(p);
 const first=attempt(p,{mode:'review',at:now+DAY,expression:'',explanation:'第一轮用分组说明核对。'}).a;
 const latest=attempt(p,{mode:'review',at:now+2*DAY,expression:'',explanation:'第二轮用另一种图示核对。'}).a;
 review(p,first,{},now+2*DAY);assert.equal(p.studio.detective.selfTraining.schedules.MASS_AVERAGE.stage,0);
 review(p,latest,{},now+2*DAY);assert.equal(p.studio.detective.selfTraining.schedules.MASS_AVERAGE.stage,1);
 const before=copy(p.studio.detective.selfTraining.schedules.MASS_AVERAGE);review(p,latest,{},now+2*DAY);assert.deepEqual(p.studio.detective.selfTraining.schedules.MASS_AVERAGE,before);
});
test('B：批阅容量耗尽仍可回放同一事件，拒绝新事件且不丢历史',()=>{
 const p=freshProgress(),{a}=attempt(p);
 let last;
 for(let i=0;i<30;i++){
  last={action:'review',attemptId:a.id,eventId:'remark-'+i,expectedRevision:p.studio.detective.selfTraining.attempts[a.id].revision,verdict:'explanation-confirmed',comment:'合成审阅备注'};
  manageSelfTraining(p,last,now);
 }
 const before=copy(p);manageSelfTraining(p,last,now);assert.deepEqual(p,before);
 assert.throws(()=>manageSelfTraining(p,{...last,eventId:'beyond-capacity',expectedRevision:p.studio.detective.selfTraining.attempts[a.id].revision},now),/上限/);assert.deepEqual(p,before);
});
