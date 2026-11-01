import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../content/pilot/source.mjs';
import {codingVersion,codingFormalOverrides,codingClassroom} from '../content/pilot/coding-supplement.mjs';
import {initialTextbookState,validateTextbookState,measureTextbook} from '../shared/textbook-models.mjs';
const lesson=lessons.find(x=>x.lessonId==='G3-UP02-B01');
const all=Object.values(lesson.taskSets).flat();
test('数字编码仍然是原70课中的一个入口，原12题各自有版本和唯一ID',()=>{
 assert.equal(lessons.length,70);assert.equal(lesson.contentVersion,codingVersion);assert.equal(all.length,12);
 assert.equal(new Set(all.map(t=>t.id)).size,12);
 assert.deepEqual(Object.keys(codingFormalOverrides).sort(),all.map(t=>t.id).sort());
 assert.equal(Object.values(lesson.taskSets).reduce((a,b)=>a+b.length,0),12);
});
test('身份证6＋8＋3＋1、末位X与第17位奇偶的知识描述一致',()=>{
 const s=codingClassroom.symbols.join(' ');assert.match(s,/6位行政区划/);assert.match(s,/8位出生日期/);
 assert.match(s,/3位顺序码/);assert.match(s,/1位校验码/);assert.match(s,/第17位/);
 assert.match(s,/奇数/);assert.match(s,/偶数/);assert.match(s,/可能是X/);
 const q=all.find(x=>x.id.endsWith('-P10'));assert.equal(q.expected,'2');
 assert.match(q.solution,/10/);assert.match(q.solution,/X/);
});
test('邮政编码与校内编号出题，不把真实学籍号当作自编号',()=>{
 for(const k of ['-P05','-P06','-P07','-P08','-P11','-P12'])assert(all.some(t=>t.id.endsWith(k)));
 assert.match(all.find(x=>x.id.endsWith('-P08')).solution,/国家学籍号|全国学籍号/);
 assert.match(all.find(x=>x.id.endsWith('-P11')).solution,/2＋1＋1＋2/);
 assert.match(lesson.childClassroom.discovery.join(' '),/国家学籍系统/);
 assert.match(lesson.childClassroom.story,/邮政编码/);
});
test('原书架三字段操作仍能测量和验证；活动不替代正式测评',()=>{
 const model=lesson.conceptScenes[0].textbookSpec,state=initialTextbookState(model);
 validateTextbookState(model,state);assert.equal(measureTextbook(model,state).code,'02-03-05');
 assert.equal(model.type,'coding');
 assert.equal(lesson.taskSets.core.length,3);
});
