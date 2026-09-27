import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {learningEntries,learningReviews,articleMistakes,articleAttempts} from '../src/learningMap.ts';
import {freshProgress} from '../server/store.mjs';
import {lessons} from '../content/pilot/source.mjs';
import {createSession,selfCheckTask,submitTask,revealHelp} from '../server/pilot-store.mjs';
const courses=JSON.parse(fs.readFileSync(new URL('../content/catalog.json',import.meta.url),'utf8'));
const data=p=>({progress:p,courses,articleCourses:lessons});
const now=Date.UTC(2026,8,12,7);
const evidenceLesson=()=>lessons.find(l=>l.lessonId==='G3-U03-B01');
test('同一地图按年级包含新旧课，低年级可从数数开始',()=>{
  const d=data(freshProgress());
  for(const grade of [1,2])assert.deepEqual(learningEntries(d,grade).map(e=>e.id),['numbers.quantity.intro','numbers.addition.meaning','numbers.subtraction.meaning']);
  const third=learningEntries(d,3);
  assert.equal(third.filter(e=>e.source==='article').length,lessons.filter(l=>l.grade.includes(3)).length);
  assert.equal(third.filter(e=>e.source==='legacy').length,0,'完整三年级互动课上线后不再混入旧版重复课程');
  assert.equal(third[0].id,'numbers.quantity.intro');
  assert.equal(new Set(third.map(e=>e.id)).size,third.length);
  assert(learningEntries(d,6).some(e=>e.id==='numbers.fractions.meaning'));
});
test('长度单元把基础、提升和奥数做成五节可见课程',()=>{
  const length=lessons.filter(l=>l.parentUnitId==='G3-U03');
  assert.deepEqual(length.map(l=>l.lessonId),['G3-U03-B01','G3-U03-B02','G3-U03-E01','G3-U03-E02','G3-U03-O01']);
  assert.deepEqual(length.map(l=>l.track),['foundation','foundation','enhancement','enhancement','olympiad']);
  for(const lesson of length){
    assert.equal(Object.values(lesson.taskSets).flat().length,12);
    assert.equal(lesson.widget,'lengthWorkbench');
    assert.equal(lesson.lengthScenes.length,1);
  }
  const entries=learningEntries(data(freshProgress()),3);
  for(const id of ['G3-U03-E01','G3-U03-E02','G3-U03-O01'])assert.equal(entries.find(e=>e.id===id)?.kind,'thinking');
});
test('新课错答进入同一复习站与错题分组，订正不抹掉历史',()=>{
  const p=freshProgress(),l=evidenceLesson(),s=createSession(p,{lessonId:l.lessonId,setName:'warmup'},lessons,now),t=s.tasks[0];
  selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:'999'},modelStateVersion:'map:1',eventId:'map:self'},now);
  submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:'999'},eventId:'map:wrong'},lessons,now);
  const rows=learningReviews(data(p));assert.equal(rows.length,1);assert.equal(rows[0].entry.id,l.lessonId);assert.equal(Date.parse(rows[0].review.dueAt),now+86400000);
  let mistakes=articleMistakes(data(p));assert.equal(mistakes[0].wrong,1);assert.equal(mistakes[0].resolved,false);assert.equal(mistakes[0].task.taskId,t.id);
  submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:t.expected},eventId:'map:correct'},lessons,now+1000);
  mistakes=articleMistakes(data(p));assert.equal(mistakes[0].wrong,1);assert.equal(mistakes[0].total,2);assert.equal(mistakes[0].resolved,true);
  assert.equal(articleAttempts(p).length,2);
});
test('格式错误不会制造错题或复习记录',()=>{
  const p=freshProgress(),l=evidenceLesson(),s=createSession(p,{lessonId:l.lessonId,setName:'core'},lessons,now),t=s.tasks[0];
  selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:'1/0'},modelStateVersion:'map:1',eventId:'map:invalid'},now);
  assert.equal(articleAttempts(p).length,0);assert.equal(articleMistakes(data(p)).length,0);assert.equal(learningReviews(data(p)).length,0);
});
test('看提示完成复习不冒充独立保持，独立再做才能推进',()=>{
  const p=freshProgress(),l=evidenceLesson(),seed=createSession(p,{lessonId:l.lessonId,setName:'warmup'},lessons,now);
  selfCheckTask(p,{sessionId:seed.id,revision:seed.revision,taskId:seed.tasks[0].id,answer:{value:'999'},modelStateVersion:'review:1',eventId:'review:self'},now);
  submitTask(p,{sessionId:seed.id,revision:seed.revision,taskId:seed.tasks[0].id,answer:{value:'999'},eventId:'review:wrong'},lessons,now);
  const tomorrow=now+86400000,review=createSession(p,{lessonId:l.lessonId,setName:'review'},lessons,tomorrow);
  revealHelp(p,{sessionId:review.id,revision:review.revision,taskId:review.tasks[0].id,kind:'hint',eventId:'review:hint'},tomorrow);
  for(const t of review.tasks){selfCheckTask(p,{sessionId:review.id,revision:review.revision,taskId:t.id,answer:{value:t.expected},modelStateVersion:'review:1',eventId:`self-assisted:${t.id}`},tomorrow);submitTask(p,{sessionId:review.id,revision:review.revision,taskId:t.id,answer:{value:t.expected},eventId:`assisted:${t.id}`},lessons,tomorrow);}
  assert.equal(p.studio.review[l.lessonId].stage,0);
  const retryAt=tomorrow+86400000;
  assert.equal(Date.parse(p.studio.review[l.lessonId].dueAt),retryAt);
  const retry=createSession(p,{lessonId:l.lessonId,setName:'review'},lessons,retryAt);
  for(const t of retry.tasks){selfCheckTask(p,{sessionId:retry.id,revision:retry.revision,taskId:t.id,answer:{value:t.expected},modelStateVersion:'review:2',eventId:`self-independent:${t.id}`},retryAt);submitTask(p,{sessionId:retry.id,revision:retry.revision,taskId:t.id,answer:{value:t.expected},eventId:`independent:${t.id}`},lessons,retryAt);}
  assert.equal(p.studio.review[l.lessonId].stage,1);
});
