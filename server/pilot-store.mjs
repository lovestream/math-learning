import {withdrawnTasks, withdrawnLessons} from "../shared/withdrawn-checks.mjs";
import {validateThinking} from './thinking-store.mjs';
import {randomUUID} from 'node:crypto';
import {validateTask} from '../shared/pilot-math.mjs';
import {ensureFriend} from './pet-care.mjs';
import {prepareReview,finishReview,validReviewSchedule} from './review-schedule.mjs';
import {validateWidgetState} from '../shared/widget-state.mjs';

const DAY=86400000;
const key=v=>typeof v==='string'&&/^[a-zA-Z0-9._:-]{1,180}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function check(ok,message,code='INVALID_INPUT'){if(!ok){const e=new Error(message);e.code=code;e.status=code==='STALE_REVISION'?409:400;throw e;}}
export const initPilot=p=>p.studio??={version:1,reading:{},sessions:{},notes:[],events:[],entitlements:{},daily:{},review:{}};
const publicTask=({expected,hint,solution,diagnostic,fields,responseSpec,...t})=>({...t,...(responseSpec?{responseSpec:Object.fromEntries(Object.entries(responseSpec).filter(([key])=>key!=='expectedEvidence'))}:{}) ,...(fields?{fields:fields.map(({expected,...f})=>f)}:{})});
export const publicLesson=l=>({...l,taskSets:Object.fromEntries(Object.entries(l.taskSets).map(([k,tasks])=>[k,tasks.map(publicTask)]))});
export const publicSession=s=>({...s,tasks:s.tasks.map(publicTask)});
const day=now=>new Date(now+8*3600000).toISOString().slice(0,10);
const findLesson=(lessons,id)=>{const l=lessons.find(x=>x.lessonId===id);check(l,'这节课还没有安装到本机。可以返回学习地图选择其他课。','CONTENT_NOT_INSTALLED');return l;};
function sessionOf(p,id){const s=initPilot(p).sessions[id];check(s,'找不到这次练习，请从课程重新进入。','CONTENT_NOT_INSTALLED');return s;}
function revision(s,r){check(Number.isInteger(r)&&s.revision===r,'另一个页面保存了较新的进度。请重新载入，避免覆盖它。','STALE_REVISION');}
function answerCheck(a){check(object(a)&&Object.keys(a).length<=12&&Object.entries(a).every(([k,v])=>key(k)&&typeof v==='string'&&v.length<=200),'答案格式不正确。');}
function evidenceCheck(e,operationMode){
  check(object(e)&&Array.isArray(e.checks)&&e.checks.length===3&&new Set(e.checks).size===3&&e.checks.every(v=>typeof v==='string'&&v.length>0&&v.length<=240),'请逐项完成三项自查。');
  check(e.format===undefined||e.format==='checklist-v1','自查格式暂不支持。');
  check(typeof e.reflection==='string'&&e.reflection.length<=240&&(e.format==='checklist-v1'||e.reflection.trim().length>=2),'自查说明格式不正确。');
  check(e.finalConfirmed===true,'请确认你已经重新检查了最终答案。');
  if(operationMode&&e.format!=='checklist-v1'){check(typeof e.firstOperation==='string'&&e.firstOperation.trim().length>0&&e.firstOperation.length<=120,'请写出先算哪一部分。');check(typeof e.intermediate==='string'&&e.intermediate.trim().length>0&&e.intermediate.length<=120,'请写出第一步的中间结果。');}
}
function credit(p,id,amount,label,now){if(amount<=0||p.wallet.ledger.some(e=>e.id===id))return; p.wallet.coins+=amount;p.wallet.earned+=amount;p.wallet.ledger.push({id,amount,label,at:new Date(now).toISOString()});}
export function saveReading(p,input,lessons,now=Date.now()){
  const l=findLesson(lessons,input.lessonId),state=initPilot(p);const old=state.reading[l.lessonId]??{revision:0};revision(old,input.revision);
  check(l.articleBlocks.some(b=>b.blockId===input.blockId)||(input.blockId==='classroom'&&l.childClassroom),'阅读位置不存在。');check(object(input.widgets)&&JSON.stringify(input.widgets).length<30000,'实验状态太大，请重置后再保存。');
  for(const [id,widget] of Object.entries(input.widgets)){check(key(id),'实验位置不合法。');try{validateWidgetState(widget,l.lessonId,l)}catch(error){check(false,error.message)}}
  const result={revision:old.revision+1,blockId:input.blockId,widgets:input.widgets,savedAt:new Date(now).toISOString()};state.reading[l.lessonId]=result;state.lastLessonId=l.lessonId;return result;
}
export function createSession(p,input,lessons,now=Date.now()){
  const l=findLesson(lessons,input.lessonId),st=initPilot(p);check(['warmup','core','transfer','challenge','review'].includes(input.setName),'请选择练习组。');
  check(!input.assessment || (input.assessment==='withdrawn-v1' && input.setName==='core' && withdrawnLessons.includes(l.lessonId)),'这节课没有撤教具五题小测。');
  const selected=input.assessment?withdrawnTasks(l):l.taskSets[input.setName];
  const existing=Object.values(st.sessions).reverse().find(s=>s.lessonId===l.lessonId&&s.setName===input.setName&&(s.assessment??null)===(input.assessment??null)&&(input.assessment||(!s.completedAt&&!s.submittedAt))&&s.contentVersion===l.contentVersion);
  if(existing){
    // Wording edits refresh unfinished sessions without resetting answers or reward rights.
    if(!existing.submittedAt&&!existing.completedAt&&existing.editorialRevision!==l.editorialRevision){existing.tasks=structuredClone(selected);existing.editorialRevision=l.editorialRevision;existing.revision++;}
    existing.selfChecks??={};return existing;
  }
  const at=new Date(now).toISOString();const review=st.review?.[l.lessonId];
  const s={id:randomUUID(),lessonId:l.lessonId,contentVersion:l.contentVersion,setName:input.setName,editorialRevision:l.editorialRevision,assessment:input.assessment??null,taskIds:selected.map(t=>t.id),tasks:structuredClone(selected),revision:0,index:0,answers:{},help:{},results:{},selfChecks:{},createdAt:at,savedAt:at,completedAt:null,reviewDue:input.setName==='review'&&review&&Date.parse(review.dueAt)<=now?review.dueAt:null};
  st.sessions[s.id]=s;st.lastLessonId=l.lessonId;return s;
}
export function saveSession(p,input,now=Date.now()){
  const s=sessionOf(p,input.sessionId);revision(s,input.revision);check(Number.isInteger(input.index)&&input.index>=0&&input.index<s.taskIds.length,'题目位置不正确。');
  check(object(input.answers)&&Object.entries(input.answers).every(([id,a])=>s.taskIds.includes(id)&&object(a)),'练习草稿不正确。');
  for(const a of Object.values(input.answers))answerCheck(a);
  s.answers=input.answers;s.index=input.index;s.revision++;s.savedAt=new Date(now).toISOString();return s;
}
function receipt(st,eventId,payload,fn){check(key(eventId),'保存编号不正确。');const previous=st.events.find(e=>e.id===eventId);const signature=JSON.stringify(payload);if(previous){check(previous.signature===signature,'同一个保存编号不能用于不同操作。');return previous.result;}const result=fn();st.events.push({id:eventId,signature,result});return result;}
export function revealHelp(p,input,now=Date.now()){
  const st=initPilot(p);return receipt(st,input.eventId,{action:'help',...input},()=>{
    const s=sessionOf(p,input.sessionId);revision(s,input.revision);const task=s.tasks.find(t=>t.id===input.taskId);check(task&&['hint','solution','article'].includes(input.kind),'提示不存在。');
    if(s.help[task.id]!=='solution')s.help[task.id]=input.kind;if(s.selfChecks?.[task.id])s.selfChecks[task.id].helpLevel=s.help[task.id];s.revision++;s.savedAt=new Date(now).toISOString();
    return {text:input.kind==='solution'?task.solution:input.kind==='hint'?task.hint:'可以回看讲解；这道题会记录为参考辅助。',revision:s.revision};
  });
}
export function selfCheckTask(p,input,now=Date.now()){
  const st=initPilot(p);return receipt(st,input.eventId,{action:'self-check',...input},()=>{
    const s=sessionOf(p,input.sessionId);revision(s,input.revision);const task=s.tasks.find(t=>t.id===input.taskId);check(task,'题目不存在。');
    if(input.phase==='evidence'){
      const record=s.selfChecks?.[task.id];check(record,'请先保存首答，再完成自查。');evidenceCheck(input.evidence,s.lessonId.startsWith('G3-U02')&&task.kind!=='choice'&&task.kind!=='explanation');
      record.evidence=structuredClone(input.evidence);record.evidenceCompletedAt=new Date(now).toISOString();s.revision++;s.savedAt=new Date(now).toISOString();
      return {status:'selfCheckComplete',message:'自查证据已保存。现在可以提交最终答案。',revision:s.revision};
    }
    answerCheck(input.answer);
    const shape=validateTask(task,input.answer);if(shape.status==='invalidInput')return {...shape,revision:s.revision};
    s.selfChecks??={};
    if(!s.selfChecks[task.id])s.selfChecks[task.id]={firstAnswer:structuredClone(input.answer),checkedAt:new Date(now).toISOString(),helpLevel:s.help[task.id]??null,modelStateVersion:String(input.modelStateVersion??s.contentVersion),selfCorrection:null};
    s.answers[task.id]=input.answer;s.revision++;s.savedAt=new Date(now).toISOString();
    return {status:'selfCheck',message:'首答已保存。检查下面三件事；想改答案可以直接改，再提交最终答案。',revision:s.revision};
  });
}
export function submitTask(p,input,lessons,now=Date.now()){
  const st=initPilot(p);return receipt(st,input.eventId,{action:'submit',...input},()=>{
    const s=sessionOf(p,input.sessionId);revision(s,input.revision);const task=s.tasks.find(t=>t.id===input.taskId);check(task,'题目不存在。');answerCheck(input.answer);s.selfChecks??={};check(s.selfChecks[task.id]?.evidenceCompletedAt,'请先完成并保存三项自查证据。');
    const verdict=validateTask(task,input.answer);if(verdict.status==='invalidInput')return {...verdict,paid:0,revision:s.revision};
    const assisted=Boolean(s.help[task.id]),at=new Date(now).toISOString();s.answers[task.id]=input.answer;
    if(verdict.status==='incorrect'){st.review??={};st.review[s.lessonId]??={dueAt:new Date(now+DAY).toISOString(),stage:0};s.hadIncorrect=true;}
    const d=st.daily[day(now)]??={tasks:0,completion:0};let paid=0;
    if(verdict.status==='correct'){
      const eligibility=`${s.contentVersion}:${task.id}${s.setName==='review'?`:${s.reviewDue??'preview'}`:''}`;
      const nominal=s.help[task.id]==='solution'?0:2+(!assisted&&task.level==='transfer'?1:0)+(!assisted&&task.responseSpec?.type==='claim-evidence'?1:0);
      const earnedBefore=s.setName==='review'?(st.entitlements[eligibility]??0):Math.max(0,...Object.entries(st.entitlements).filter(([key])=>key.endsWith(`:${task.id}`)).map(([,amount])=>amount));
      const rewardAllowed=s.setName!=='review'||Boolean(s.reviewDue);
      paid=rewardAllowed?Math.min(Math.max(0,nominal-earnedBefore),Math.max(0,30-d.tasks)):0;
      st.entitlements[eligibility]=Math.max(earnedBefore,nominal);d.tasks+=paid;
      credit(p,`pilot:${input.eventId}`,paid,'互动课程任务',now);
    }
    const evidence=s.selfChecks[task.id],responseOnly=a=>Object.fromEntries(Object.entries(a).filter(([key])=>!key.startsWith('check')).sort(([a],[b])=>a.localeCompare(b)));evidence.selfCorrection=JSON.stringify(responseOnly(evidence.firstAnswer))!==JSON.stringify(responseOnly(input.answer));
    const result={...verdict,paid,assisted,at,solution:['correct','pendingReview'].includes(verdict.status)?task.solution:undefined,diagnostic:verdict.status==='incorrect'?task.diagnostic:undefined,firstAnswer:evidence.firstAnswer,finalAnswer:structuredClone(input.answer),selfCorrection:evidence.selfCorrection,helpLevel:evidence.helpLevel,modelStateVersion:evidence.modelStateVersion,selfCheckEvidence:evidence.evidence};
    // A later retry does not erase evidence that a task was already successfully completed.
    if(s.results[task.id]?.status!=='correct'||verdict.status==='correct')s.results[task.id]=result;
    if(['correct','pendingReview'].includes(verdict.status)){const next=s.taskIds.findIndex(id=>!['correct','pendingReview'].includes(s.results[id]?.status));s.index=next<0?s.taskIds.length-1:next;}
    s.revision++;s.savedAt=at;
    if(s.taskIds.every(id=>['correct','pendingReview'].includes(s.results[id]?.status)))s.submittedAt??=at;
    let completionPaid=0;
    if(!s.completedAt&&s.taskIds.every(id=>s.results[id]?.status==='correct')){
      s.completedAt=at;
      if(s.setName==='core'){
        if(!d.completion){d.completion=5;completionPaid=5;credit(p,`pilot:complete:${day(now)}`,5,'完成今天的核心练习',now);ensureFriend(p,now);for(const id of p.pets.owned){const f=p.pets.care.friends[id];if(f)f.growth+=10;}p.pets.xp+=10*p.pets.owned.length;p.pets.care.memories.unshift({pet:p.pets.active,kind:'learn',text:`一起完成「${findLesson(lessons,s.lessonId).shortTitle}」的核心练习。`,at,lessonId:s.lessonId});p.pets.care.memories=p.pets.care.memories.slice(0,160);}
        st.review??={};st.review[s.lessonId]??={dueAt:new Date(now+DAY).toISOString(),stage:0};
        const first=Object.values(st.sessions).filter(item=>item.lessonId===s.lessonId&&item.setName==='core'&&item.completedAt).map(item=>item.completedAt).sort()[0];
        prepareReview(st.review[s.lessonId],now,first);
      }
      if(s.setName==='review'&&s.reviewDue&&st.review?.[s.lessonId]?.dueAt===s.reviewDue){
        const first=Object.values(st.sessions).filter(item=>item.lessonId===s.lessonId&&item.setName==='core'&&item.completedAt).map(item=>item.completedAt).sort()[0];
        finishReview(st.review[s.lessonId],now,!s.hadIncorrect&&s.taskIds.every(id=>!s.results[id].assisted&&!s.results[id].selfCorrection),p.settings.reviewDays,first);
      }
    }
    return {...result,revision:s.revision,completionPaid,completed:Boolean(s.completedAt),dailyCap:d.tasks>=30};
  });
}
export function saveNote(p,input,lessons,now=Date.now()){
  findLesson(lessons,input.lessonId);check(key(input.id)&&typeof input.text==='string'&&input.text.trim().length>0&&input.text.length<=1200,'写下一点想法再保存。');const st=initPilot(p);const prior=st.notes.find(n=>n.id===input.id);if(prior)return prior;
  const note={id:input.id,lessonId:input.lessonId,text:input.text.trim(),status:'ungraded',at:new Date(now).toISOString()};st.notes.push(note);return note;
}
export function validatePilot(st){
  if(st===undefined)return;
  check(object(st)&&st.version===1&&object(st.reading)&&object(st.sessions)&&Array.isArray(st.notes)&&Array.isArray(st.events)&&object(st.entitlements)&&object(st.daily),'互动课程存档不完整。');
  validateThinking(st.thinking);
  check(JSON.stringify(st).length<6*1024*1024,'互动课程存档超过大小限制。');
  for(const [id,r] of Object.entries(st.reading)){
    check(key(id)&&object(r)&&Number.isInteger(r.revision)&&r.revision>=0&&typeof r.blockId==='string'&&object(r.widgets),'阅读记录不完整。');
    for(const [widgetId,widget] of Object.entries(r.widgets)){check(key(widgetId),'实验位置不合法。');try{validateWidgetState(widget,id)}catch(error){check(false,error.message)}}
  }
  for(const [id,s] of Object.entries(st.sessions)){
    if(s.assessment)check(s.assessment==='withdrawn-v1'&&s.setName==='core'&&JSON.stringify(s.taskIds)===JSON.stringify(withdrawnTasks({lessonId:s.lessonId,taskSets:{all:s.tasks}}).map(t=>t.id)),'撤教具小测任务清单无效。');
    if(s.parentReviews){check(object(s.parentReviews),'解释题批阅历史无效。');for(const [taskId,history]of Object.entries(s.parentReviews)){check(s.taskIds.includes(taskId)&&Array.isArray(history)&&history.length<=100&&history.every(v=>['correct','needs-remediation'].includes(v.verdict)&&v.source==='parent-workbench'&&typeof v.comment==='string'&&v.comment.length<=1200&&Number.isFinite(Date.parse(v.at))&&object(v.evidence?.first)&&object(v.evidence?.result)),'解释题批阅证据无效。');}}

    check(key(id)&&s.id===id&&key(s.lessonId)&&Number.isInteger(s.revision)&&s.revision>=0&&Array.isArray(s.taskIds)&&s.taskIds.length>0&&Array.isArray(s.tasks)&&s.tasks.length===s.taskIds.length&&Number.isInteger(s.index)&&s.index>=0&&s.index<s.taskIds.length&&object(s.answers)&&object(s.help)&&object(s.results)&&(s.selfChecks===undefined||object(s.selfChecks)),'练习记录不完整。');
    for(const a of Object.values(s.answers))answerCheck(a);
    for(const [taskId,record] of Object.entries(s.selfChecks??{})){check(s.taskIds.includes(taskId)&&object(record)&&object(record.firstAnswer),'自查记录不完整。');answerCheck(record.firstAnswer);if(record.evidenceCompletedAt){check(Number.isFinite(Date.parse(record.evidenceCompletedAt)),'自查日期无效。');evidenceCheck(record.evidence,s.lessonId.startsWith('G3-U02')&&s.tasks.find(t=>t.id===taskId)?.kind!=='choice'&&s.tasks.find(t=>t.id===taskId)?.kind!=='explanation');}}
    check(Object.values(s.help).every(h=>['hint','solution','article'].includes(h)),'帮助记录不正确。');
  }
  for(const n of st.notes)check(key(n.id)&&key(n.lessonId)&&typeof n.text==='string'&&n.text.length<=1200&&n.status==='ungraded','发现手册格式不正确。');
  for(const e of st.events)check(key(e.id)&&typeof e.signature==='string'&&object(e.result),'保存回执格式不正确。');
  for(const d of Object.values(st.daily))check(Number.isInteger(d.tasks)&&d.tasks>=0&&d.tasks<=30&&[0,5].includes(d.completion),'星点上限记录不正确。');
  if(st.review!==undefined){check(object(st.review),'复习记录不完整。');for(const [id,r] of Object.entries(st.review))check(key(id)&&object(r)&&Number.isFinite(Date.parse(r.dueAt))&&Number.isInteger(r.stage)&&r.stage>=0&&validReviewSchedule(r),'复习日期记录不完整。');}
}

// Human review of explanations in the existing formal bank, including withdrawn
// checks. This endpoint awards no points and never replaces the immutable first answer.
export const parentFormalTasks = p => Object.values(p.studio?.sessions??{}).flatMap(s=>s.tasks.filter(t=>t.kind==='explanation'&&(s.results[t.id]?.status==='pendingReview'||s.parentReviews?.[t.id])).map(t=>({sessionId:s.id,revision:s.revision,lessonId:s.lessonId,assessment:s.assessment,task:t,result:s.results[t.id],selfCheck:s.selfChecks[t.id],help:s.help[t.id]??null,history:s.parentReviews?.[t.id]??[]})));
export function reviewFormalTask(p,input,now=Date.now()) {
 const st=initPilot(p);
 return receipt(st,input.eventId,{action:'parent-formal-review',...input},()=>{
  const s=sessionOf(p,input.sessionId);revision(s,input.revision);
  const t=s.tasks.find(t=>t.id===input.taskId),r=s.results[input.taskId];
  check(t?.kind==='explanation'&&r&&['pendingReview','correct','incorrect'].includes(r.status),'请核对已提交的解释题。');
  check(['correct','needs-remediation'].includes(input.verdict)&&typeof input.comment==='string'&&input.comment.trim().length>=2&&input.comment.length<=1200,'请写下批阅依据。');
  s.parentReviews??={};const history=s.parentReviews[t.id]??=[];check(history.length<100,'请导出过多的批阅历史。');
  history.push({verdict:input.verdict,comment:input.comment.trim(),at:new Date(now).toISOString(),source:'parent-workbench',evidence:structuredClone({first:s.selfChecks[t.id],result:r,help:s.help[t.id]??null})});
  r.status=input.verdict==='correct'?'correct':'incorrect';r.message=`家长核对：${input.comment.trim()}`;r.paid=0;
  if(input.verdict!=='correct')s.hadIncorrect=true;
  if(s.tasks.every(t=>s.results[t.id]?.status==='correct')) {
   s.completedAt??=new Date(now).toISOString();
   st.review[s.lessonId]??={stage:0,dueAt:new Date(now+DAY).toISOString()};
  } else {if(s.completedAt){s.completionHistory??=[];s.completionHistory.push(s.completedAt);}s.completedAt=null;}
  s.revision++;s.savedAt=new Date(now).toISOString();
  return {status:r.status,paid:0,revision:s.revision};
 });
}
