import {completeSelfCheck as selfCheckTask} from './fixtures/self-check.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {lessons} from '../content/pilot/source.mjs';
import {initPilot,publicSession,createSession,saveSession,submitTask,revealHelp,saveReading,saveNote,validatePilot} from '../server/pilot-store.mjs';
import {petMissions,applyPetReward} from '../server/pet-care.mjs';

const lesson=lessons.find(item=>item.lessonId==='numbers.fractions.meaning');
test('文字修订同步到未完成的练习，答案、积分和题目版本保留',()=>{
  const p=freshProgress(),s=createSession(p,{lessonId:lesson.lessonId,setName:'warmup'},lessons);
  s.editorialRevision='previous-editorial';s.tasks[0].prompt='旧题干';s.answers[s.tasks[0].id]={value:'4'};
  const coins=p.wallet.coins,id=s.id;
  const resumed=createSession(p,{lessonId:lesson.lessonId,setName:'warmup'},lessons);
  assert.equal(resumed.id,id);assert.equal(resumed.tasks[0].prompt,lesson.taskSets.warmup[0].prompt);
  assert.deepEqual(resumed.answers[s.tasks[0].id],{value:'4'});assert.equal(p.wallet.coins,coins);
});
const answers={number:t=>({value:t.expected,...(t.unit?{valueUnit:t.unit}:{})}),choice:t=>({value:t.expected}),expression:t=>({value:t.expected}),fields:t=>Object.fromEntries((t.fields??[]).flatMap(f=>[[f.key,f.expected],...(f.unit?[[`${f.key}Unit`,f.unit]]:[])]) )};
test('样板课程能创建会话并区分首答、自查、提示和最终答案',()=>{const p=freshProgress();initPilot(p);const s=createSession(p,{lessonId:lesson.lessonId,setName:'warmup'},lessons,Date.UTC(2026,8,11));const task=s.tasks[0],first={value:'999',...(task.unit?{valueUnit:task.unit}:{})};const check=selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer:first,modelStateVersion:'model:1',eventId:'self:wrong'},Date.UTC(2026,8,11));assert.equal(check.status,'selfCheck');assert.doesNotMatch(check.message,/正确|错误|答对|答错/);const help=revealHelp(p,{sessionId:s.id,revision:s.revision,taskId:task.id,kind:'hint',eventId:'help:1'},Date.UTC(2026,8,11));assert.ok(help.text.length>0);const right=submitTask(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer:answers[task.kind](task),eventId:'attempt:right'},lessons,Date.UTC(2026,8,11));assert.equal(right.status,'correct');assert.deepEqual(right.firstAnswer,first);assert.equal(right.selfCorrection,true);assert.equal(right.helpLevel,'hint');assert.equal(right.paid,2);assert.equal(p.studio.sessions[s.id].index,1);validatePilot(p.studio);});
test('重复事件不会重复发放积分',()=>{const p=freshProgress();const s=createSession(p,{lessonId:lesson.lessonId,setName:'core'},lessons,Date.UTC(2026,8,11));const task=s.tasks[0];selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer:answers[task.kind](task),modelStateVersion:'model:1',eventId:'self:same'},Date.UTC(2026,8,11));const input={sessionId:s.id,revision:s.revision,taskId:task.id,answer:answers[task.kind](task),eventId:'same:event'};const a=submitTask(p,input,lessons,Date.UTC(2026,8,11));const b=submitTask(p,input,lessons,Date.UTC(2026,8,11));assert.deepEqual(a,b);assert.equal(p.wallet.coins,a.paid);});
test('阅读记录与发现手册会保存为待确认',()=>{const p=freshProgress();const saved=saveReading(p,{lessonId:lesson.lessonId,revision:0,blockId:'try',widgets:{try:{take:2}}},lessons,Date.UTC(2026,8,11));assert.equal(saved.revision,1);const note=saveNote(p,{lessonId:lesson.lessonId,id:'note:1',text:'我发现整体不同，分数的实际长度也会不同。'},lessons,Date.UTC(2026,8,11));assert.equal(note.status,'ungraded');validatePilot(p.studio);});
test('完成样板核心练习后，带有课程回忆的存档仍能完整导入',()=>{
  const p=freshProgress(),s=createSession(p,{lessonId:lesson.lessonId,setName:'core'},lessons);
  for(const task of s.tasks){selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer:answers[task.kind](task),modelStateVersion:'model:1',eventId:`self:${task.id.replaceAll('.','-')}`});submitTask(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer:answers[task.kind](task),eventId:`core:${task.id.replaceAll('.','-')}`},lessons);}
  assert.ok(s.completedAt);assert.ok(p.studio.review[lesson.lessonId]);
  assert.ok(p.pets.care.memories.some(m=>m.lessonId===lesson.lessonId));
  assert.equal(petMissions(p,[],Date.now(),lessons).find(m=>m.id==='discover').done,true);
  const before=p.inventory.berry??0;
  applyPetReward(p,{type:'mission',reward:'discover'},[],Date.now(),lessons);
  assert.equal(p.inventory.berry,before+2);
  applyPetReward(p,{type:'mission',reward:'discover'},[],Date.now(),lessons);
  assert.equal(p.inventory.berry,before+2);
  assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
});
test('旧页面保存阅读状态时给出冲突，不覆盖新记录',()=>{
  const p=freshProgress();saveReading(p,{lessonId:lesson.lessonId,revision:0,blockId:'try',widgets:{try:{parts:3,take:1}}},lessons);
  assert.throws(()=>saveReading(p,{lessonId:lesson.lessonId,revision:0,blockId:'try',widgets:{}},lessons),/较新的进度/);
  assert.equal(p.studio.reading[lesson.lessonId].widgets.try.parts,3);
});
test('未提交的练习草稿可导入恢复，旧版本不能覆盖新答案',()=>{
  const p=freshProgress(),s=createSession(p,{lessonId:lesson.lessonId,setName:'warmup'},lessons),id=s.tasks[0].id;
  const oldRevision=s.revision;
  saveSession(p,{sessionId:s.id,revision:oldRevision,index:0,answers:{[id]:{value:'1/4'}}});
  assert.throws(()=>saveSession(p,{sessionId:s.id,revision:oldRevision,index:0,answers:{[id]:{value:'999'}}}),/较新的进度/);
  const restored=validateEnvelope(exportEnvelope(p),[]);
  assert.deepEqual(restored.studio.sessions[s.id].answers[id],{value:'1/4'});
  assert.equal(restored.studio.events.length,0);assert.equal(restored.wallet.coins,0);
});
test('重启恢复首答证据且发给浏览器的题目不提前包含答案',()=>{
  const p=freshProgress(),s=createSession(p,{lessonId:lesson.lessonId,setName:'core'},lessons),task=s.tasks[0];
  selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer:{value:'4'},modelStateVersion:'scene:v1',eventId:'restart:self'});
  const restored=validateEnvelope(exportEnvelope(p),[]),record=restored.studio.sessions[s.id].selfChecks[task.id];
  assert.deepEqual(record.firstAnswer,{value:'4'});assert.equal(record.modelStateVersion,'scene:v1');assert.equal(record.selfCorrection,null);
  const browser=publicSession(restored.studio.sessions[s.id]);assert.equal('expected' in browser.tasks[0],false);assert.equal('solution' in browser.tasks[0],false);assert.equal('hint' in browser.tasks[0],false);
});
test('测量练习只在最终错答后给结构诊断，不提前送到浏览器',()=>{
  const lengthLesson=lessons.find(item=>item.lessonId==='G3-U03-E02');assert.ok(lengthLesson);
  const p=freshProgress(),s=createSession(p,{lessonId:lengthLesson.lessonId,setName:'core'},lessons),task=s.tasks.find(item=>item.diagnostic);assert.ok(task);
  const browser=publicSession(s),publicTask=browser.tasks.find(item=>item.id===task.id);assert.ok(publicTask);assert.equal('diagnostic' in publicTask,false);
  const wrong={value:'999'};selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer:wrong,modelStateVersion:'length:v1',eventId:'length:self'});
  const result=submitTask(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer:wrong,eventId:'length:wrong'},lessons);
  assert.equal(result.status,'incorrect');assert.match(result.diagnostic,/接头|厚度/);assert.equal(result.solution,undefined);
});
