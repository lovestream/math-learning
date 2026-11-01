import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {lessons} from '../content/pilot/source.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {createSession,submitTask,reviewFormalTask,validatePilot,revealHelp} from '../server/pilot-store.mjs';
import {prepareReview} from '../server/review-schedule.mjs';
import {completeSelfCheck} from './fixtures/self-check.mjs';
const DAY=86400000,base=Date.parse('2026-10-01T09:00:00+08:00'),id='G3-U06-E01';
function submitted(p,setName,now,lessonId=id){
 const s=createSession(p,{lessonId,setName},lessons,now);
 for(const t of s.tasks){const answer={value:t.kind==='explanation'?'仅测试家长批阅链路，不作为数学正确的证据。':t.expected};
  completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:randomUUID()},now);
  submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:randomUUID()},lessons,now);
 }
 return s;
}
function grade(p,s,now,verdict='correct',taskId=s.tasks.find(t=>t.kind==='explanation').id){
 const input={sessionId:s.id,revision:s.revision,taskId,eventId:randomUUID(),verdict,comment:'仅测试批阅与复习调度。'};
 const out=reviewFormalTask(p,input,now);return {input,out};
}
function due(){const p=freshProgress();const c=submitted(p,'core',base);for(const t of c.tasks.filter(t=>t.kind==='explanation'))grade(p,c,base,'correct',t.id);
 // Old backups may only have a due date/stage. The approved core establishes its anchor.
 p.studio.review[id]=prepareReview({stage:0,dueAt:new Date(base+DAY).toISOString()},base,new Date(base).toISOString());
 return p;
}
test('正式复习组最后解释获批后推进1/3/7/21调度，回放或重复审批不重复留存',()=>{
 const p=due(),s=submitted(p,'review',base+DAY),coins=p.wallet.coins;
 for(const t of s.tasks.filter(t=>t.kind==='explanation'))grade(p,s,base+DAY,'correct',t.id);
 const r=p.studio.review[id];assert(s.completedAt);assert.equal(r.history.length,1);assert.equal(r.history[0].independent,true);assert.equal(r.stage,1);assert.equal(Date.parse(r.dueAt),base+3*DAY);assert.equal(p.wallet.coins,coins);
 const last=grade(p,s,base+DAY+1000);reviewFormalTask(p,last.input,base+DAY+2000);
 assert.equal(r.history.length,1);assert.equal(r.successDates.length,1);assert.equal(p.wallet.coins,coins);validatePilot(p.studio);
});
test('需要回补推进至次日，订正获批不冒充本轮独立成功，首答和批阅历史保留',()=>{
 const p=due(),s=submitted(p,'review',base+DAY),t=s.tasks[0],first=structuredClone(s.selfChecks[t.id]);
 grade(p,s,base+DAY,'needs-remediation',t.id);const r=p.studio.review[id];assert.equal(r.history.length,1);assert.equal(r.history[0].independent,false);assert.equal(Date.parse(r.dueAt),base+2*DAY);assert.equal(r.stage,0);
 for(const task of s.tasks)grade(p,s,base+DAY+1000,'correct',task.id);
 assert(s.completedAt);assert.equal(r.history.length,1);assert.equal(r.successDates.length,0);assert.deepEqual(s.selfChecks[t.id],first);assert.equal(s.parentReviews[t.id].length,2);validatePilot(p.studio);
});
test('含解释的核心完成建首次学习锚点，但人工批阅不补发逐题或每日完成奖励',()=>{
 const p=freshProgress(),s=submitted(p,'core',base),coins=p.wallet.coins;
 for(const t of s.tasks.filter(t=>t.kind==='explanation'))grade(p,s,base,'correct',t.id);
 const r=p.studio.review[id];assert.equal(r.firstLearnedAt,new Date(base).toISOString());assert.equal(r.firstLearnedDay,'2026-10-01');assert.equal(r.scheduleVersion,2);assert.equal(Date.parse(r.dueAt),base+DAY);assert.equal(p.wallet.coins,coins);assert.equal(p.studio.daily['2026-10-01'].completion,0);
 // The automatic core award remains capped once per family date.
 const automatic=submitted(p,'core',base,'G3-U02-B04');assert(automatic.completedAt);assert.equal(p.studio.daily['2026-10-01'].completion,5);const paid=p.wallet.coins;grade(p,s,base+1000);assert.equal(p.wallet.coins,paid);assert.equal(p.studio.daily['2026-10-01'].completion,5);
});
test('提示后获批复习仍为辅助成功，预览复习不推进到期记录',()=>{
 const p=due(),s=createSession(p,{lessonId:id,setName:'review'},lessons,base+DAY),t=s.tasks[0];
 revealHelp(p,{sessionId:s.id,revision:s.revision,taskId:t.id,kind:'hint',eventId:randomUUID()},base+DAY);
 submitted(p,'review',base+DAY);for(const task of s.tasks)grade(p,s,base+DAY,'correct',task.id);
 assert.equal(p.studio.review[id].history[0].independent,false);assert.equal(Date.parse(p.studio.review[id].dueAt),base+2*DAY);
 const preview=submitted(p,'review',base+DAY+1000),before=structuredClone(p.studio.review[id]);assert.equal(preview.reviewDue,null);
 for(const task of preview.tasks)grade(p,preview,base+DAY+1000,'correct',task.id);
 assert.deepEqual(p.studio.review[id],before);
});
test('审批409、旧存档恢复及评分版本切换不丢批阅/首答/复习历史或重复积分',()=>{
 const p=due(),s=submitted(p,'review',base+DAY),t=s.tasks[0],old=s.revision,first=structuredClone(s.selfChecks[t.id]);grade(p,s,base+DAY,'correct',t.id);
 assert.throws(()=>reviewFormalTask(p,{sessionId:s.id,revision:old,taskId:t.id,eventId:randomUUID(),verdict:'needs-remediation',comment:'旧页面不得覆盖。'},base+DAY),e=>e.status===409);
 for(const task of s.tasks.slice(1))grade(p,s,base+DAY,'correct',task.id);
 const coins=p.wallet.coins,restored=validateEnvelope(exportEnvelope(p),[]);assert.deepEqual(restored.studio.sessions[s.id],s);assert.deepEqual(restored.studio.review[id],p.studio.review[id]);
 const l=lessons.find(l=>l.lessonId===id),newLesson={...l,contentVersion:'simulated-future-version'};const next=createSession(restored,{lessonId:id,setName:'review'},[newLesson],base+DAY+1000);assert.notEqual(next.id,s.id);assert.equal(next.reviewDue,null);assert.deepEqual(restored.studio.sessions[s.id].selfChecks[t.id],first);assert.equal(restored.wallet.coins,coins);validatePilot(restored.studio);
});


test('已批阅完成后更正为回补：保留原审核与复习历史，次日回补不重发积分',()=>{
 const p=due(),s=submitted(p,'review',base+DAY);for(const t of s.tasks)grade(p,s,base+DAY,'correct',t.id);
 const history=structuredClone(p.studio.review[id].history),first=structuredClone(s.selfChecks[s.tasks[0].id]),coins=p.wallet.coins;
 grade(p,s,base+DAY+1000,'needs-remediation');assert.equal(s.completedAt,null);assert.deepEqual(s.completionHistory,[new Date(base+DAY).toISOString()]);assert.deepEqual(p.studio.review[id].history,history);
 assert(Date.parse(p.studio.review[id].dueAt)<=base+2*DAY+1000);assert.equal(s.parentReviews[s.tasks[0].id].length,2);assert.deepEqual(s.selfChecks[s.tasks[0].id],first);assert.equal(p.wallet.coins,coins);validatePilot(p.studio);
});
