import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyAttempt, applyRetell, applyPurchase, createStore, exportEnvelope, freshProgress, validateEnvelope } from '../server/store.mjs';

const courses=JSON.parse(fs.readFileSync(new URL('../content/grade-3/catalog.json',import.meta.url),'utf8'));
const allCourses=JSON.parse(fs.readFileSync(new URL('../content/catalog.json',import.meta.url),'utf8'));
const first=courses[0];
test('课程包包含基础与奥数，并且每题结构完整',()=>{
  assert.equal(courses.length,54);assert.equal(courses.reduce((n,c)=>n+c.questions.length,0),432);
  assert.ok(courses.some(c=>c.kind==='foundation'));assert.ok(courses.some(c=>c.kind==='thinking')); 
  const lessonIds=new Set(courses.map(c=>c.id)),questionIds=new Set();
  for(const lesson of courses){assert.equal(lesson.questions.length,8);assert.equal(lesson.practiceCount,6);assert.ok(lesson.origin);assert.ok(lesson.mathIdea);assert.ok(lesson.whyQuestion);assert.ok(lesson.humanNeed);assert.ok(lesson.essence);assert.ok(lesson.retellPrompt);assert.ok(lesson.extensionChain?.length>=2);assert.ok(lesson.takeaway);assert.ok(lesson.representations?.length);for(const pre of lesson.prerequisites)assert.ok(lessonIds.has(pre));for(const q of lesson.questions){assert.ok(Number.isFinite(q.answer)&&q.answer>=0);assert.ok(!questionIds.has(q.id));questionIds.add(q.id);assert.equal(q.hints.length,2);assert.ok(['warmup','core','transfer','challenge'].includes(q.level));if(q.choices)assert.ok(q.answer>=1&&q.answer<=q.choices.length);}}
});
test('课程前置关系没有循环，所有思想节点都能从入口到达',()=>{
  const byId=new Map(courses.map(c=>[c.id,c]));const state=new Map();const visit=(id,trail=[])=>{
    if(state.get(id)==='done')return;
    assert.notEqual(state.get(id),'visiting','课程前置出现循环：'+trail.concat(id).join(' -> '));
    state.set(id,'visiting');for(const pre of byId.get(id).prerequisites)visit(pre,trail.concat(id));state.set(id,'done');
  };
  for(const course of courses)visit(course.id);
  const reached=new Set(courses.filter(c=>!c.prerequisites.length).map(c=>c.id));
  for(let round=0;round<courses.length;round++)for(const course of courses)if(!reached.has(course.id)&&course.prerequisites.every(id=>reached.has(id)))reached.add(course.id);
  assert.equal(reached.size,courses.length);
});
test('小学三至六年级课程包可按年级筛选并保持题目唯一',()=>{
  assert.equal(allCourses.length,108);assert.equal(allCourses.reduce((n,c)=>n+c.questions.length,0),864);
  for(const grade of [4,5,6]){const list=allCourses.filter(c=>c.grade===grade);assert.ok(list.length>=14);assert.ok(list.some(c=>c.kind==='foundation'));assert.ok(list.some(c=>c.kind==='thinking'));}
  const ids=new Set();for(const course of allCourses){assert.ok(course.grade===undefined||[4,5,6].includes(course.grade));assert.ok(course.takeaway);for(const question of course.questions){assert.ok(!ids.has(question.id));ids.add(question.id);}}
});
test('同一个作答请求只发一次奖励',()=>{
  const p=freshProgress(),q=first.questions[0],now=Date.UTC(2026,8,6);
  const input={id:'attempt:fixed',lessonId:first.id,questionId:q.id,answer:q.answer,usedHint:false,mode:'learn'};
  const one=applyAttempt(p,input,courses,now),two=applyAttempt(p,input,courses,now);
  assert.equal(one.correct,true);assert.equal(one.earned,5);assert.equal(two.duplicate,true);assert.equal(two.earned,0);assert.equal(p.wallet.coins,5);assert.equal(p.attempts.length,1);
});
test('六道分层练习后仍需复述，完成奖励和复习只结算一次',()=>{
  const p=freshProgress(),now=Date.UTC(2026,8,6);
  first.questions.slice(0,6).forEach((q,i)=>applyAttempt(p,{id:`attempt:${i}`,lessonId:first.id,questionId:q.id,answer:q.answer,usedHint:false,mode:'learn'},courses,now+i));
  assert.equal(p.wallet.coins,30);assert.equal(p.lessons[first.id].completedAt,null);assert.equal(p.reviews[first.id],undefined);
  const one=applyRetell(p,{id:'retell:one',lessonId:first.id,text:'人们为了准确知道有多少，才把每个东西和一个数一一对应。'},courses,now+10);
  const two=applyRetell(p,{id:'retell:one',lessonId:first.id,text:'人们为了准确知道有多少，才把每个东西和一个数一一对应。'},courses,now+11);
  assert.equal(one.earned,20);assert.equal(two.duplicate,true);assert.equal(p.wallet.coins,50);assert.equal(p.wallet.earned,50);assert.ok(p.lessons[first.id].completedAt);assert.ok(p.reviews[first.id]);
  applyAttempt(p,{id:'attempt:replay',lessonId:first.id,questionId:first.questions[1].id,answer:first.questions[1].answer,usedHint:false,mode:'learn'},courses,now+12);
  assert.equal(p.wallet.coins,50);
});
test('错误会建立复习记录，使用提示的当日订正不冒充间隔掌握',()=>{
  const p=freshProgress(),q=first.questions[2],now=Date.UTC(2026,8,6);
  const wrong=applyAttempt(p,{id:'attempt:wrong',lessonId:first.id,questionId:q.id,answer:q.answer+1,usedHint:false,mode:'review'},courses,now);
  assert.equal(wrong.correct,false);assert.equal(p.reviews[first.id].stage,0);assert.equal(p.reviews[first.id].successDates.length,0);
  const retry=applyAttempt(p,{id:'attempt:retry',lessonId:first.id,questionId:q.id,answer:q.answer,usedHint:true,mode:'review'},courses,now+1000);
  assert.equal(retry.correct,true);assert.equal(p.reviews[first.id].stage,0);assert.equal(p.wallet.coins,0);
});
test('到期复习按不同日期推进且不能重复结算',()=>{
  const p=freshProgress(),q=first.questions[2],now=Date.UTC(2026,8,6);
  p.reviews[first.id]={dueAt:new Date(now-1000).toISOString(),stage:0,lastReviewedAt:null,successDates:[],mistakes:[]};
  applyAttempt(p,{id:'attempt:review-one',lessonId:first.id,questionId:q.id,answer:q.answer,usedHint:false,mode:'review'},courses,now);
  const nextDue=p.reviews[first.id].dueAt;
  applyAttempt(p,{id:'attempt:review-two',lessonId:first.id,questionId:q.id,answer:q.answer,usedHint:false,mode:'review'},courses,now+2000);
  assert.equal(p.wallet.coins,10);assert.equal(p.reviews[first.id].stage,1);assert.equal(p.reviews[first.id].dueAt,nextDue);assert.equal(p.reviews[first.id].successDates.length,1);
});
test('购买扣分和发货保持一致，重复请求不再次扣分',()=>{
  const p=freshProgress();p.wallet={coins:200,earned:200,spent:0,ledger:[{id:'seed',amount:200,label:'测试积分',at:new Date().toISOString()}]};
  const input={id:'buy:one',type:'pet',item:'sprout'};
  applyPurchase(p,input);applyPurchase(p,input);
  assert.equal(p.wallet.coins,50);assert.equal(p.wallet.spent,150);assert.deepEqual(p.pets.owned,['bubble','dongdong','sprout']);
});
test('导出校验能发现损坏与积分账目不一致',()=>{
  const p=freshProgress(),envelope=exportEnvelope(p);assert.equal(validateEnvelope(envelope,courses).profile.name,'Kevin');
  const damaged=structuredClone(envelope);damaged.progress.wallet.coins=99;assert.throws(()=>validateEnvelope(damaged,courses),/校验/);
  const inconsistent=exportEnvelope({...p,wallet:{coins:2,earned:0,spent:0,ledger:[]}});assert.throws(()=>validateEnvelope(inconsistent,courses),/流水/);
});
test('旧备份没有所选年级字段时会平滑迁移',()=>{
  const p=freshProgress();delete p.profile.selectedGrade;const envelope=exportEnvelope(p);const restored=validateEnvelope(envelope,courses);assert.equal(restored.profile.selectedGrade,3);
});
test('导入失败不改动原进度，成功导入前自动备份',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-store-'));const store=createStore(directory,courses);
  try{const before=store.get();const bad=exportEnvelope(freshProgress());bad.checksum='bad';assert.throws(()=>store.import(bad));assert.deepEqual(store.get(),before);
    const p=freshProgress();p.profile.name='Kevin 备份';const out=store.import(exportEnvelope(p));assert.equal(out.progress.profile.name,'Kevin 备份');assert.ok(store.listBackups().some(b=>b.name.includes('before-import')));
  }finally{store.close();fs.rmSync(directory,{recursive:true,force:true});}
});
