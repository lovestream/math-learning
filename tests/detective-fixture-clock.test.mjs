import test from 'node:test';
import assert from 'node:assert/strict';
import {sameDayNoon} from '../scripts/fixtures/detective-clock.mjs';
import {freshProgress} from '../server/store.mjs';
import {manageDetective,detectiveToday} from '../server/detective-store.mjs';

const day = now => new Date(now + 8*3600000).toISOString().slice(0,10);
test('收件浏览器夹具覆盖全天运行时刻：16分钟同步不意外越过UTC+8的午夜',()=>{
  const start=Date.parse('2026-11-08T00:00:00+08:00');
  for(let minute=0;minute<24*60;minute++){
    const now=start+minute*60000,anchor=sameDayNoon(now);
    assert.equal(day(anchor),day(now));
    assert.equal(new Date(anchor).getUTCHours(),4);
    assert.equal(day(anchor+16*60000),day(now));
  }
  const nearMidnight=Date.parse('2026-11-08T23:51:00+08:00');
  assert.notEqual(day(nearMidnight+16*60000),day(nearMidnight));
  assert.throws(()=>sameDayNoon(NaN));assert.throws(()=>sameDayNoon(Infinity));
});
test('同日收件验证只冻结测试起点；真实跨天仍建立下一日计划而不覆盖旧计划',()=>{
  const nearMidnight=Date.parse('2026-11-08T23:51:00+08:00'),anchor=sameDayNoon(nearMidnight);
  const p=freshProgress();manageDetective(p,{action:'enable-seeds',eventId:'clock-fixture-seeds',checks:[true,true,true]},anchor);
  const first=detectiveToday(p,anchor),original=structuredClone(p.studio.detective.plans);
  assert.equal(first.cases.length,3);
  assert.deepEqual(detectiveToday(p,anchor+16*60000).cases.map(x=>x.case.version),first.cases.map(x=>x.case.version));
  assert.deepEqual(p.studio.detective.plans,original);
  detectiveToday(p,nearMidnight+16*60000);
  assert.equal(Object.keys(p.studio.detective.plans).length,2);
  assert.deepEqual(p.studio.detective.plans[day(anchor)],original[day(anchor)]);
});
