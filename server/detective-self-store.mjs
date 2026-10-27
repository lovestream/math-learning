import {createHash} from 'node:crypto';
import {ensureDetective,validateStored} from './detective-store.mjs';
import {insist,validId} from '../shared/detective-model.mjs';
import {equalNumber} from '../shared/detective-mass-spring.mjs';
import {SELF_FAMILIES,SELF_ENGINE_VERSION,selfQuestion,publicSelfQuestion} from './detective-self-questions.mjs';
import {validateSelfTraining} from '../shared/detective-self-validation.mjs';
import {parseLinear} from '../shared/pilot-math.mjs';

const DAY=86400000,intervals=[1,3,7,14],hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=n=>new Date(n).toISOString();
export const selfLocalDay=n=>new Date(n+8*3600000).toISOString().slice(0,10);
const plus=(day,n)=>new Date(Date.parse(day+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
const family=f=>insist(SELF_FAMILIES.some(x=>x.id===f),'这个数学题族尚未开放。');
function ensure(p){const d=ensureDetective(p);return d.selfTraining??={schemaVersion:1,engineVersion:SELF_ENGINE_VERSION,timeZone:'Asia/Shanghai',attempts:{},schedules:{},seen:{},lastObservedAt:null};}
function clock(s,now){insist(Number.isFinite(now)&&now>=Date.parse('2026-01-01')&&now<=Date.parse('2100-01-01'),'设备日期异常，请核对系统时间。');const old=s.lastObservedAt&&Date.parse(s.lastObservedAt);insist(!old||now>=old-5*60000,'设备时间明显倒退。原记录保留，请校准时间后重试。');insist(!old||now-old<=366*DAY,'设备日期跳跃超过一年；请核对日期并在家长端导出备份。');s.lastObservedAt=iso(Math.max(now,old||0));}
function exposure(a){return a.hintExposure.length>0;}
const eligible=a=>!!a.result?.independent&&!['supported','needs-practice'].includes(a.parentReviews.at(-1)?.verdict);
export function checkEvidence(q,a,answer,value,expression){
 try{
  if(!equalNumber(q.checkValue(answer),value)||!equalNumber(value,q.checkTarget))return false;
  if(a.mode!=='review')return true;
  const normalize=x=>x.replace(/[\s（）]/g,c=>c==='（'?'(':c==='）'?')':'').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−－]/g,'-').replace(/＋/g,'+');
  const canonical=normalize(q.checkPattern.replaceAll('□',answer)),typed=normalize(expression??'');
  // This intentionally narrow exact relation checker does not pretend to grade
  // arbitrary prose/proofs. Other valid methods are kept for parent review.
  if(typed!==canonical)return false;
  const result=parseLinear(expression);return !Object.keys(result.terms).length&&equalNumber(`${result.constant.n}/${result.constant.d}`,value);
 }catch{return false;}
}
function publicAttempt(a){
 const q=selfQuestion(a.errorFamilyId,a.index),out={id:a.id,revision:a.revision,phase:a.phase,mode:a.mode,startedAt:a.startedAt,question:publicSelfQuestion(q,a.phase,a.mode),draft:a.draft,firstAnswer:a.firstAnswer??null,firstReasoning:a.firstReasoning??'',hintExposure:a.hintExposure,hintText:exposure(a)?q.hint:null,parentReviews:a.parentReviews.map(({at,verdict,comment})=>({at,verdict,comment}))};
 if(a.phase==='feedback')Object.assign(out,{preFeedbackRevision:a.preFeedbackRevision,selfCheckActions:a.selfCheckActions,feedbackReleasedAt:a.feedbackReleasedAt,result:a.result,currentEvidenceEligible:eligible(a),answer:q.answer,explanation:q.explanation});
 if(a.hintExposure.some(e=>e.kind==='visual'))out.visual={kind:'manual',values:[q.question,'已知条件和所求对象可以分开画在纸上']};
 return out;
}
export function selfStats(s){
 const all=Object.values(s?.attempts??{}).filter(a=>a.phase==='feedback'),scored=all.filter(a=>a.firstAnswer.status==='answered'),firstWrong=scored.filter(a=>!a.result.firstCorrect),firstRight=scored.filter(a=>a.result.firstCorrect);
 const rate=(n,d)=>({numerator:n,denominator:d,rate:d?n/d:null});
 return {firstCorrect:rate(scored.filter(a=>a.result.firstCorrect).length,scored.length),afterCheck:rate(all.filter(a=>a.result.finalCorrect).length,all.length),effectiveCorrection:rate(firstWrong.filter(a=>eligible(a)).length,firstWrong.length),changedWrong:rate(firstRight.filter(a=>!a.result.finalCorrect).length,firstRight.length),transfer:rate(all.filter(a=>a.mode==='transfer'&&eligible(a)).length,all.filter(a=>a.mode==='transfer').length),delayed:intervals.map((days,i)=>({days,...rate(all.filter(a=>a.mode==='review'&&a.reviewStage===i&&eligible(a)).length,all.filter(a=>a.mode==='review'&&a.reviewStage===i).length)})),explanation:'有效纠错分母：已完成反馈前自查的可评分首答错误次数。空白或不确定首答不纳入首次正确率；未到期或未作答不计复测失败。解释文本另由家长核对，家长标记辅助或回补后不计独立证据；历史快照保留。'};
}
export function selfTrainingData(p,now=Date.now(),parent=false){
 const s=p.studio?.detective?.selfTraining;
 const attempts=Object.values(s?.attempts??{});
 const families=SELF_FAMILIES.map(f=>{
  const r=s?.schedules[f.id],rows=attempts.filter(a=>a.errorFamilyId===f.id),done=rows.filter(a=>a.phase==='feedback'),baseline=done.find(a=>a.mode==='practice'&&eligible(a)),transfer=done.find(a=>a.mode==='transfer'&&eligible(a)&&baseline&&a.startedAt>=baseline.feedbackReleasedAt),retained=done.some(a=>a.mode==='review'&&eligible(a)&&transfer&&a.startedAt>transfer.feedbackReleasedAt&&selfLocalDay(Date.parse(a.startedAt))>selfLocalDay(Date.parse(transfer.feedbackReleasedAt)));
  return {...f,available:(s?.seen[f.id]?.length??0)<240,active:rows.find(a=>a.phase!=='feedback')?.id??null,schedule:r?{...r,due:!r.paused&&!!r.dueDay&&r.dueDay<=selfLocalDay(now)}:null,evidence:retained?'有迁移证据（非永久掌握）':transfer?'已完成新情境，待延迟复测':baseline?'本次有独立检查证据，待迁移':'证据不足 / 还未独立检查'};
 });
 const observed=Object.values(p.studio?.detective?.attempts??{}).filter(a=>a.firstEvidence),categories={};for(const a of observed.filter(a=>a.firstEvidence.caseVerdict&&a.firstEvidence.caseVerdict!=='correct')){const k=a.firstEvidence.category??'未分类';categories[k]=(categories[k]??0)+1;}
 const sorted=attempts.sort((a,b)=>b.startedAt.localeCompare(a.startedAt)),visible=parent?sorted:sorted.filter((a,i)=>i<100||a.phase!=='feedback');
 return {schemaVersion:1,engineVersion:SELF_ENGINE_VERSION,day:selfLocalDay(now),timeZone:'Asia/Shanghai',families,stats:{...selfStats(s),diagnosis:{numerator:observed.filter(a=>a.firstEvidence.correct).length,denominator:observed.length,categories,meaning:'只统计本版保存的首次找错证据；不猜测旧记录首次是否正确，也不推断注意力或态度。'}},attempts:visible.map(a=>parent?{...publicAttempt(a),privateEvidence:structuredClone(a)}:publicAttempt(a)),capacity:{used:attempts.length,limit:1000,bytes:Buffer.byteLength(JSON.stringify(s??{})),byteLimit:2*1024*1024,message:'儿童列表显示最近100条及未完成记录；全部证据保留在家长页和整库备份。接近容量请先导出，达到上限停止新增，不自动删除旧证据。'}};
}
function apply(p,b,now){
 const s=ensure(p);insist(b&&validId(b.eventId)&&validId(b.attemptId),'缺少有效操作编号。');
 let a=s.attempts[b.attemptId];const signature=hash(b),prior=a?.events.find(e=>e.id===b.eventId);
 if(prior){insist(prior.signature===signature,'操作编号被用于不同内容。',409);return publicAttempt(a);}
 clock(s,now);const at=iso(now),day=selfLocalDay(now);
 if(b.action==='start'){
  family(b.errorFamilyId);insist(!a,'调查编号已存在。',409);
  const old=Object.values(s.attempts).find(x=>x.errorFamilyId===b.errorFamilyId&&x.phase!=='feedback');if(old)return publicAttempt(old);
  insist(['practice','transfer','review'].includes(b.mode),'请选择自主解题、新情境或到期复测。');
  insist(Object.keys(s.attempts).length<1000,'自主检查记录达到1000次上限，请先导出备份，原记录未删除。');
  const schedule=s.schedules[b.errorFamilyId];
  if(b.mode==='review')insist(schedule&&!schedule.paused&&schedule.dueDay&&schedule.dueDay<=day&&schedule.lastCompletedDay!==day,'这项复测尚未到期、已暂停或今天已经完成。');
  const seen=s.seen[b.errorFamilyId]??=[],pool=Array.from({length:240},(_,i)=>i),candidates=b.mode==='transfer'?[...pool.filter(i=>i%2),...pool.filter(i=>!(i%2))]:pool;
  const index=candidates.find(i=>!seen.includes(i));
  insist(index!==undefined,'当前审定新参数已用完；请家长安排针对性回补，不循环熟题冒充新题。');
  const q=selfQuestion(b.errorFamilyId,index);s.seen[b.errorFamilyId]=[...seen,index];
  a={id:b.attemptId,errorFamilyId:b.errorFamilyId,questionVariantId:q.id,engineVersion:SELF_ENGINE_VERSION,index,unknownRole:q.unknownRole,sourceKind:q.sourceKind,mode:b.mode,reviewStage:b.mode==='review'?schedule.stage:null,reviewDueDay:b.mode==='review'?schedule.dueDay:null,revision:1,phase:'first',startedAt:at,draft:'',events:[],hintExposure:[],parentReviews:[]};s.attempts[a.id]=a;
 }else{
  insist(a,'找不到自主检查记录。',404);insist(a.revision===b.expectedRevision,'另一页已保存新记录；请载入最新记录，当前输入仍保留。',409);
  insist(a.events.length<80,'本题操作记录接近上限，请先导出备份。');const q=selfQuestion(a.errorFamilyId,a.index);
  if(b.action==='draft'){insist(a.phase!=='feedback'&&typeof b.value==='string'&&b.value.length<=1600,'草稿无效或本题已封存。');a.draft=b.value;}
  else if(b.action==='first'){
   insist(a.phase==='first'&&!a.firstAnswer,'首次答案已经封存，不可覆盖。',409);
   insist(['answered','blank','uncertain'].includes(b.status)&&typeof b.value==='string'&&b.value.length<=80&&typeof b.reasoning==='string'&&b.reasoning.length<=500,'请保存答案状态和简短思路。');
   insist(b.status!=='answered'||b.value.trim().length>0,'已作答时请填入答案。');
   if(b.status==='answered')try{parseLinear(b.value);insist(/^[-+]?\d+(?:\.\d+)?(?:\/[-+]?\d+(?:\.\d+)?)?$/.test(b.value.trim()),'请写整数、小数或分数；暂不会做可以保留空白。');}catch{insist(false,'请写整数、小数或分数；暂不会做可以保留空白。');}
   a.firstAnswer={value:b.value,status:b.status,at};a.firstReasoning=b.reasoning;a.firstHash=hash({firstAnswer:a.firstAnswer,firstReasoning:a.firstReasoning});a.phase='check';a.draft='';
  }else if(['hint','visual','parent-help'].includes(b.action)){
   insist(a.phase!=='feedback'&&a.hintExposure.length<8,'本题已封存或辅助记录达到上限。');a.hintExposure.push({kind:b.action==='parent-help'?'parent':b.action,at,phase:a.phase});
  }else if(b.action==='final'){
   insist(a.phase==='check','先封存首答，再提交自查。');
   insist(typeof b.value==='string'&&b.value.length>0&&b.value.length<=80&&typeof b.checkValue==='string'&&b.checkValue.length>0&&b.checkValue.length<=80&&['complete','uncertain'].includes(b.checkStatus)&&typeof b.explanation==='string'&&b.explanation.length<=500,'请提交第二次答案和实际算出的反查结果；不确定也可以如实提交。');
   if(a.mode==='review')insist(typeof b.checkExpression==='string'&&b.checkExpression.trim()&&b.checkExpression.length<=160,'复测请自己写一条反查算式，不提供预填算式。');
   a.preFeedbackRevision={value:b.value,at};a.selfCheckActions={kind:'reverse-substitution',pattern:q.checkPattern,value:b.checkValue,expression:a.mode==='review'?b.checkExpression:null,status:b.checkStatus,explanation:b.explanation,at};
   const firstCorrect=a.firstAnswer.status==='answered'&&equalNumber(a.firstAnswer.value,q.answer),finalCorrect=equalNumber(b.value,q.answer);
   const checkValid=checkEvidence(q,a,b.value,b.checkValue,a.selfCheckActions.expression);
   const independent=finalCorrect&&checkValid&&!exposure(a)&&b.checkStatus==='complete'&&a.firstAnswer.status==='answered';
   const category=exposure(a)?'assisted':a.firstAnswer.status!=='answered'?'first-unscored':firstCorrect?(finalCorrect?'first-correct':'changed-wrong'):(finalCorrect?(checkValid&&b.checkStatus==='complete'?'self-corrected':'answer-correct-check-unproven'):'not-corrected');
   a.result={firstCorrect,finalCorrect,checkValid,independent,category,at,explanationStatus:'parent-review',assistance:structuredClone(a.hintExposure)};a.feedbackReleasedAt=at;a.phase='feedback';a.draft='';
   const r=s.schedules[a.errorFamilyId];
   if(!r)s.schedules[a.errorFamilyId]={revision:1,stage:0,anchorDay:day,dueDay:plus(day,1),paused:false,lastCompletedDay:null,adjustments:[]};
   else if(a.mode==='review'){
    insist(r.lastCompletedDay!==day,'同一题族今天已记录复测，不重复推进。');
    r.lastCompletedDay=day;if(independent)r.stage=Math.min(4,r.stage+1);r.dueDay=r.stage===4?null:plus(day,independent?intervals[r.stage]-intervals[Math.max(0,r.stage-1)]:1);r.revision++;
   }
  }else insist(false,'不支持这个自主检查操作。');
  a.revision++;
 }
 a.events.push({id:b.eventId,signature,action:b.action,at});validateSelfTraining(s);validateStored(p);return publicAttempt(a);
}
// Atomic even for direct library callers; disk transaction is provided by createStore.
export function applySelfTraining(p,b,now=Date.now()){const next=structuredClone(p),result=apply(next,b,now);p.studio=next.studio;return result;}
export function manageSelfTraining(p,b,now=Date.now()){
 const next=structuredClone(p),s=ensure(next);clock(s,now);
 if(b.action==='schedule'){
  family(b.errorFamilyId);const r=s.schedules[b.errorFamilyId];insist(r,'还没有复测安排。');
  insist(validId(b.eventId)&&typeof b.paused==='boolean','暂停或顺延记录无效。');const signature=hash(b),old=r.adjustments.find(e=>e.id===b.eventId);if(old){insist(old.signature===signature,'操作编号冲突。',409);return selfTrainingData(p,now,true);}
  insist(r.revision===b.expectedRevision,'复测安排已有更新，请重新载入。',409);insist(r.adjustments.length<50,'调整记录已满，请先导出备份。');
  const today=selfLocalDay(now);insist(b.dueDay===null&&r.stage===4||typeof b.dueDay==='string'&&b.dueDay>=today&&b.dueDay<=plus(today,90)&&plus(b.dueDay,0)===b.dueDay,'复测只可顺延至未来90天内的有效本地日期。');
  r.dueDay=b.dueDay;r.paused=b.paused;r.revision++;r.adjustments.push({id:b.eventId,signature,at:iso(now),dueDay:r.dueDay,paused:r.paused});
 }else if(b.action==='review'){
  const a=s.attempts[b.attemptId];insist(a?.phase==='feedback','请先提交自查。');
  insist(['supported','needs-practice','explanation-confirmed'].includes(b.verdict)&&typeof b.comment==='string'&&b.comment.length<=500&&a.parentReviews.length<30&&validId(b.eventId),'批阅内容无效。');
  const old=a.events.find(e=>e.id===b.eventId);if(old){insist(old.signature===hash(b),'操作编号冲突。',409);return selfTrainingData(p,now,true);}
  insist(a.revision===b.expectedRevision,'请载入最新记录后再批阅。',409);
  a.parentReviews.push({at:iso(now),verdict:b.verdict,comment:b.comment,reviewer:'local-parent'});a.events.push({id:b.eventId,signature:hash(b),action:'parent-review',at:iso(now)});a.revision++;
  if(['supported','needs-practice'].includes(b.verdict)){
   const r=s.schedules[a.errorFamilyId];if(r){insist(r.adjustments.length<50,'复测调整记录已满，请先导出备份。');r.stage=0;r.anchorDay=selfLocalDay(now);r.dueDay=plus(r.anchorDay,1);r.revision++;r.adjustments.push({id:b.eventId,signature:hash(b),at:iso(now),dueDay:r.dueDay,paused:r.paused,reason:'explicit-parent-remediation'});}
  }
 }else insist(false,'不支持这个管理操作。');
 validateStored(next);p.studio=next.studio;return selfTrainingData(p,now,true);
}
