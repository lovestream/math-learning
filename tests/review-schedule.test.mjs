import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReview,finishReview} from '../server/review-schedule.mjs';
const day=86400000,start=Date.parse('2026-09-13T09:00:00+08:00');
const fresh=()=>prepareReview({stage:0,dueAt:new Date(start+day).toISOString()},start,new Date(start).toISOString());
test('1、3、7、21天始终锚定首次完成日期，之后28天再复习',()=>{
  const r=fresh();
  for(const [offset,next] of [[1,3],[3,7],[7,21],[21,49]]){finishReview(r,start+offset*day,true);assert.equal(Date.parse(r.dueAt),start+next*day)}
  assert.equal(r.firstLearnedDay,'2026-09-13');assert.equal(r.successDates.length,4);
});
test('晚来几天只复习一次，直接选未来的锚定日期',()=>{
  const r=fresh();finishReview(r,start+5*day,true);assert.equal(Date.parse(r.dueAt),start+7*day);assert.equal(r.history.length,1);
  assert.equal(finishReview(r,start+5*day+1000,true),false);assert.equal(r.successDates.length,1);
});
test('需要帮助后次日再测，保留等级、原锚点和成功历史',()=>{
  const r=fresh();finishReview(r,start+day,true);const stage=r.stage;
  finishReview(r,start+3*day,false);assert.equal(r.stage,stage);assert.equal(Date.parse(r.dueAt),start+4*day);assert.equal(r.successDates.length,1);
  finishReview(r,start+4*day,true);assert.equal(Date.parse(r.dueAt),start+7*day);assert.equal(r.firstLearnedDay,'2026-09-13');
});
test('未完成核心课的错题修复不虚构首次学习日期',()=>{
  const r=prepareReview({stage:0,dueAt:new Date(start).toISOString()},start);
  finishReview(r,start,true);assert.equal(r.firstLearnedDay,undefined);
  prepareReview(r,start+day,new Date(start+day).toISOString());assert.equal(r.firstLearnedDay,'2026-09-14');
});
