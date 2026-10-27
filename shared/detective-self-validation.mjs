// Data-only validation; this module contains no questions or answer key.
const fail=(ok,msg)=>{if(!ok)throw Error(msg??'自主自查存档损坏；已取消写入或导入。');};
const obj=x=>x&&Object.getPrototypeOf(x)===Object.prototype;
const id=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{1,100}$/.test(x)&&!['__proto__','constructor','prototype'].includes(x);
const text=(x,max=500)=>typeof x==='string'&&x.length<=max;
const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
export function validateSelfTraining(s){
 if(s===undefined)return;
 fail(obj(s)&&s.schemaVersion===1&&s.engineVersion==='detective-self.v1'&&s.timeZone==='Asia/Shanghai'&&obj(s.attempts)&&obj(s.schedules)&&obj(s.seen)&&Object.keys(s.attempts).length<=1000&&Object.keys(s.schedules).length<=8&&Buffer.byteLength(JSON.stringify(s))<=2*1024*1024);
 fail(s.lastObservedAt===null||date(s.lastObservedAt));
 for(const [key,a] of Object.entries(s.attempts)){
  fail(id(key)&&key===a.id&&id(a.errorFamilyId)&&a.engineVersion===s.engineVersion&&Number.isInteger(a.index)&&a.index>=0&&a.index<256&&a.questionVariantId===`${s.engineVersion}:${a.errorFamilyId}:${a.index}`);
  fail(['practice','transfer','review'].includes(a.mode)&&['first','check','feedback'].includes(a.phase)&&Number.isInteger(a.revision)&&a.revision>=1&&date(a.startedAt)&&text(a.draft,1600)&&Array.isArray(a.events)&&a.events.length<=80&&new Set(a.events.map(e=>e.id)).size===a.events.length);
  fail(a.events.every(e=>id(e.id)&&/^[a-f0-9]{64}$/.test(e.signature)&&date(e.at))&&Array.isArray(a.hintExposure)&&a.hintExposure.length<=8&&a.hintExposure.every(e=>['hint','visual','parent'].includes(e.kind)&&date(e.at))&&Array.isArray(a.parentReviews)&&a.parentReviews.length<=30);
  if(a.phase!=='first')fail(obj(a.firstAnswer)&&text(a.firstAnswer.value,80)&&['answered','blank','uncertain'].includes(a.firstAnswer.status)&&text(a.firstReasoning,500)&&date(a.firstAnswer.at)&&/^[a-f0-9]{64}$/.test(a.firstHash));
  if(a.phase==='feedback')fail(obj(a.preFeedbackRevision)&&text(a.preFeedbackRevision.value,80)&&date(a.feedbackReleasedAt)&&obj(a.selfCheckActions)&&text(a.selfCheckActions.value,80)&&['complete','uncertain'].includes(a.selfCheckActions.status)&&obj(a.result)&&typeof a.result.firstCorrect==='boolean'&&typeof a.result.finalCorrect==='boolean'&&typeof a.result.checkValid==='boolean'&&typeof a.result.independent==='boolean'&&date(a.result.at)&&a.result.at===a.feedbackReleasedAt&&date(a.preFeedbackRevision.at)&&a.preFeedbackRevision.at===a.feedbackReleasedAt);
  if(a.selfCheckActions?.expression!==undefined)fail(a.selfCheckActions.expression===null||text(a.selfCheckActions.expression,160));
  for(const r of a.parentReviews)fail(date(r.at)&&['supported','needs-practice','explanation-confirmed'].includes(r.verdict)&&text(r.comment)&&typeof r.reviewer==='string'&&r.reviewer==='local-parent');
 }
 for(const [f,seen]of Object.entries(s.seen))fail(id(f)&&Array.isArray(seen)&&seen.length<=256&&new Set(seen).size===seen.length&&seen.every(n=>Number.isInteger(n)&&n>=0&&n<256));
 for(const [f,r] of Object.entries(s.schedules))fail(id(f)&&Number.isInteger(r.revision)&&r.revision>=1&&Number.isInteger(r.stage)&&r.stage>=0&&r.stage<=4&&typeof r.paused==='boolean'&&day(r.anchorDay)&&(r.dueDay===null||day(r.dueDay))&&(r.lastCompletedDay===null||day(r.lastCompletedDay))&&Array.isArray(r.adjustments)&&r.adjustments.length<=50&&r.adjustments.every(x=>date(x.at)&&typeof x.paused==='boolean'&&(x.dueDay===null||day(x.dueDay))));
}
