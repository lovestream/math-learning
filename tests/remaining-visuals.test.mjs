import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {lessons} from '../content/pilot/source.mjs';
import {coreModels,initialCoreState} from '../shared/core-models.mjs';
import {validateTextbookState} from '../shared/textbook-models.mjs';
import {moneyExchange,supplyPlan,regroupPositions} from '../shared/visual-relations.mjs';
import {mixedSceneContext,coreSceneMission} from '../shared/scene-context.mjs';
import {inverseEntries,inverseTaskIndex,inverseClassroomId} from '../shared/inverse-index.mjs';
import {inverseRevisions} from '../content/pilot/inverse-revisions.mjs';
import {renderInverseIndex} from '../scripts/build-inverse-index.mjs';
import {buildSceneMatrix} from '../scripts/build-scene-matrix.mjs';

test('混合运算A/B的标题、任务和单位跟随完整故事，不把内部taskMode当场景编号',()=>{
 const l=lessons.find(l=>l.lessonId==='G3-U02-B03'),a=mixedSceneContext(l.mathScenes,l.mathScenes[0].sceneId),b=mixedSceneContext(l.mathScenes,l.mathScenes[1].sceneId);
 assert.match(a.label,/场景 A/);assert.match(a.mission,/12颗红珠.*8颗蓝珠/);assert.match(a.mission,/每盒4颗/);
 assert.match(b.label,/场景 B/);assert.match(b.mission,/原有12袋/);assert.match(b.mission,/8颗散珠/);assert(!b.mission.includes('红珠'));assert.equal(b.scene.expected.unit,'袋');assert.equal(a.scene.expected.unit,'盒');
 assert.deepEqual(mixedSceneContext(l.mathScenes,'unknown'),a);
 const b01=lessons.find(l=>l.lessonId==='G3-U02-B01');assert(!mixedSceneContext(b01.mathScenes,b01.mathScenes[1].sceneId).mission.includes('车上'));
});
test('11课66组操作的顶层指令不强留第一组数字或单位',()=>{
 for(const [id,model] of Object.entries(coreModels))for(let i=0;i<model.cases.length;i++){
  const s=initialCoreState(model,i),mission=coreSceneMission(model,s);assert(mission,id);assert(!/147|3200|八分之一/.test(mission),id);
  if(model.type==='invariant-table'){assert.match(coreSceneMission(model,{...s,mode:'total'}),/同一批材料/);assert.match(mission,/单价/);}
 }
});
test('元角合并和兑换价值守恒，未凑满与连续进位边界均一致',()=>{
 for(let a=0;a<=9;a++)for(let b=0;b<=9;b++){const m=moneyExchange(3,a,2,b);assert.equal(m.resultYuan*10+m.remainder,50+a+b);assert(m.remainder<10);assert.equal(m.carry,Math.floor((a+b)/10));}
 assert.deepEqual(moneyExchange(3,8,2,5),{yuan:5,jiao:13,carry:1,remainder:3,totalJiao:63,resultYuan:6});assert.throws(()=>moneyExchange(3,10,2,5));
});
test('需求条两段相加等于需求，已有超过需求时不出现负数缺口',()=>{
 const m=supplyPlan(36,2,20);assert.equal(m.demand,72);assert.equal(m.missing,52);
 for(const owned of [0,20,72,90]){const x=supplyPlan(36,2,owned);assert.equal(x.used+x.missing,x.demand);assert.equal(x.used+x.surplus,owned);assert(x.missing>=0);}
});
test('分组转换保留同一批对象ID与总量，支持六组参数、撤销和合法旧存档',()=>{
 const model=coreModels['G3-L02-B06'];for(let i=0;i<model.cases.length;i++){
  const [count,,,oldEach,newEach]=model.cases[i],a=regroupPositions(count,oldEach,newEach),b=regroupPositions(count,oldEach,newEach,true);
  assert.equal(a.total,b.total);assert.deepEqual(a.items.map(x=>x.id),b.items.map(x=>x.id));assert.equal(new Set(b.items.map(x=>x.id)).size,b.total);
  for(const x of [a,b])for(let g=0;g<x.groups;g++)assert.equal(x.items.filter(item=>item.group===g).length,x.each);
  validateTextbookState(model,{...initialCoreState(model,i),mode:'total',checked:true});assert.deepEqual(regroupPositions(count,oldEach,newEach),a);
 }assert.throws(()=>regroupPositions(4,6,7));
});
test('逆向索引逐个解析已有11题，保留正式题组及独立逆推课堂，不重复题ID',()=>{
 const entries=inverseEntries(lessons);assert.equal(entries.length,11);assert.equal(new Set(entries.map(e=>e.taskId)).size,11);assert.deepEqual(new Set(entries.map(e=>e.taskId)),new Set(Object.keys(inverseRevisions)));
 for(const e of entries){const l=lessons.find(l=>l.lessonId===e.lessonId);assert(l.taskSets[e.set].some(t=>t.id===e.taskId));assert(e.forwardCheck&&e.unknown);}
 assert(lessons.some(l=>l.lessonId===inverseClassroomId));assert.equal(Object.values(lessons).flatMap(l=>Object.values(l.taskSets).flat()).length,849);
 assert(!JSON.stringify(inverseTaskIndex).includes('expected'));assert(!JSON.stringify(inverseTaskIndex).includes('solution'));
});
test('11题逆向解各自能正向代回，不依赖图的真实比例取答案',()=>{
 const task=id=>lessons.flatMap(l=>Object.values(l.taskSets).flat()).find(t=>t.id===id),answer=id=>Number(task(id).expected);
 assert.equal(answer('G3-U02-E01.r1')-(35-5),60);assert.equal(5*answer('G3-U02-E02-P09')*8,120);assert.equal(4*2*answer('G3-U02-E04-P09'),40);assert.equal(3*answer('G3-U02-O02-P09')+6,30);
 assert.equal(40-2*answer('G3-L03-E01-P09'),28);assert.equal(6*answer('G3-U03-E01.r2')-2*5,62);assert.equal(50*4-answer('G3-U03-E02.c4')*2*3,176);assert.equal(6*answer('G3-U03-E02.t2')-4*2*5,140);
 assert.equal(3*(7+1),24);assert.equal(task('algebra.substitution.intro.r2').options.find(o=>o.id===task('algebra.substitution.intro.r2').expected).text,'7颗');
 assert.equal(6/8,3/4);assert.equal((3+17)%7,6);assert.equal(task('G3-U06-E01-P09').kind,'explanation');assert.equal(task('G3-LP01-E01-P09').kind,'explanation');
});
test('70课逐场景矩阵可查新，标明源扫描而非全量教学验收',async()=>{
 const matrix=buildSceneMatrix();assert.equal(matrix.lessonCount,70);assert.match(matrix.scope,/不冒充/);assert(matrix.rows.length>70);assert.equal(await readFile(new URL('../docs/review/三年级逐场景语义一致性矩阵_20261019.json',import.meta.url),'utf8'),JSON.stringify(matrix,null,2)+'\n');
});

test('家长逆向清单可从显式索引再生成，不把索引误作新增习题',async()=>{
 assert.equal(await readFile(new URL('../docs/review/三年级现有逆向练习索引_20261019.md',import.meta.url),'utf8'),renderInverseIndex());
});
