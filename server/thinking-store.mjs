import {thinkingCards} from '../content/pilot/thinking-source.mjs';
const check=(ok,text,code='INVALID_INPUT')=>{if(!ok)throw Object.assign(new Error(text),{status:code==='STALE_REVISION'?409:400,code})};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=(v,min=1,max=1200)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function validateThinking(records){
 if(records===undefined)return;
 check(object(records),'思维卡记录不完整。');
 for(const [id,r] of Object.entries(records)){
  check(thinkingCards.some(t=>t.id===id&&t.publicationStatus==='guided-study')&&object(r)&&r.taskId===id&&r.contentVersion==='thinking.2026-10-08.1'&&Number.isInteger(r.revision)&&r.revision>=1&&date(r.savedAt)&&['first','self-checked','pendingReview'].includes(r.phase),'思维卡版本或进度无效。');
  check((r.firstAnswer===null||text(r.firstAnswer))&&Array.isArray(r.help)&&r.help.length<=5&&r.help.every(h=>object(h)&&['hint','solution','reference'].includes(h.kind)&&Number.isInteger(h.level)&&h.level>=0&&h.level<=3&&text(h.text,1,4000)&&date(h.at)),'思维卡首答或提示无效。');
  if(r.firstAnswer!==null)check(date(r.firstAt)&&typeof r.firstAssisted==='boolean','思维卡首答证据无效。');
  if(r.phase!=='first')check(text(r.firstAnswer)&&text(r.reflection,2,600)&&Array.isArray(r.checks)&&r.checks.length===3&&r.checks.every(v=>v===true),'思维卡自查证据无效。');
  if(r.phase==='pendingReview')check(text(r.finalAnswer)&&date(r.submittedAt)&&r.status==='pendingReview','思维卡提交记录无效。');
 }
}
export function applyThinking(p,input,now=Date.now()){
 const t=thinkingCards.find(t=>t.id===input.taskId&&t.publicationStatus==='guided-study');check(t,'这张思维卡尚未开放。');
 check(typeof input.eventId==='string'&&/^[a-zA-Z0-9._:-]{1,180}$/.test(input.eventId),'保存编号无效。');
 const st=p.studio??={version:1,reading:{},sessions:{},notes:[],events:[],entitlements:{},daily:{},review:{}};st.thinking??={};
 const signature=JSON.stringify({action:'thinking',...input}),oldEvent=st.events.find(e=>e.id===input.eventId);
 if(oldEvent){check(oldEvent.signature===signature,'相同保存编号不能用于不同操作。');return oldEvent.result}
 const at=new Date(now).toISOString(),old=st.thinking[t.id]??{taskId:t.id,contentVersion:t.contentVersion,revision:0,phase:'first',firstAnswer:null,help:[]};
 check(input.revision===old.revision,'另一个页面已更新这张卡，请重新载入。','STALE_REVISION');const r=structuredClone(old);
 if(input.action==='first'){check(r.firstAnswer===null&&text(input.answer),'请写下自己的首答；保存后会保留原来的想法。');r.firstAnswer=input.answer.trim();r.firstAt=at;r.firstAssisted=r.help.length>0}
 else if(input.action==='check'){check(r.firstAnswer!==null&&r.phase==='first'&&Array.isArray(input.checks)&&input.checks.length===3&&input.checks.every(v=>v===true)&&text(input.reflection,2,600),'请先保存首答，再逐项自查并写下发现。');r.checks=[true,true,true];r.reflection=input.reflection.trim();r.phase='self-checked'}
 else if(input.action==='final'){check(r.phase==='self-checked'&&text(input.answer),'请先完成自查，再提交最终解释。');r.finalAnswer=input.answer.trim();r.phase='pendingReview';r.status='pendingReview';r.submittedAt=at}
 else if(['hint','solution','reference'].includes(input.action)){
  const level=input.action==='hint'?input.level:0;check(Number.isInteger(level)&&level>=0&&level<=3,'提示层级无效。');
  const hint=t.hints.find(h=>h.level===level);check(input.action!=='hint'||hint,'提示尚未整理。');check(input.action!=='solution'||r.firstAnswer!==null,'先保存自己的想法，再看参考解释。');
  if(!r.help.some(h=>h.kind===input.action&&h.level===level))r.help.push({kind:input.action,level,text:input.action==='hint'?hint.text:input.action==='solution'?`${t.answer}\n${t.reason}\n${t.solutionSteps.join('\n')}`:'已回看本章基础讲解；本次迁移会记为参考辅助。',at});
 }else check(false,'未知思维卡操作。');
 r.revision++;r.savedAt=at;validateThinking({[t.id]:r});st.thinking[t.id]=r;const result={record:r,paid:0,status:r.phase==='pendingReview'?'pendingReview':'saved'};st.events.push({id:input.eventId,signature,result});return result;
}
