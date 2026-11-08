import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {chainMeasure,chainInverse,chainJointGeometry} from '../shared/length-model.mjs';
import {lessons} from '../content/pilot/source.mjs';import {inverseRevisions,inverseLessonIds,inverseVersion} from '../content/pilot/inverse-revisions.mjs';
import {validateTask} from '../shared/pilot-math.mjs';import {auditTask} from '../shared/task-audit-oracle.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {createSession,submitTask} from '../server/pilot-store.mjs';import {completeSelfCheck} from './fixtures/self-check.mjs';
const old=JSON.parse(fs.readFileSync(new URL('./fixtures/inverse-before-20261018.json',import.meta.url)));
const task=id=>lessons.flatMap(l=>Object.values(l.taskSets).flat()).find(t=>t.id===id);

test('接头两端正确延伸到共同范围边缘；两段金属相碰，不画成错位的孤立色块',()=>{
 for(const t of [1,4,5,6,7.5]){const g=chainJointGeometry(t);assert.equal(g.previousEnd,g.right);assert.equal(g.nextStart,g.left);assert.equal(g.previousMetal[0],g.nextMetal[1]);assert.equal(g.previousMetal[1]-g.previousMetal[0],t);assert.equal(g.nextMetal[1]-g.nextMetal[0],t);assert.equal(g.right-g.left,2*t);}
});
test('两种算法、每次实际新增范围、环的外缘与三种逆算在多参数下始终一致',()=>{
 for(const l of [30,40,50,60])for(const t of [2,4,5,6])for(let n=1;n<=20;n++){
  const m=chainMeasure(l,t,n);assert.equal(m.totalMm,n*l-(n-1)*2*t);
  assert.equal(m.extensions.reduce((sum,p)=>sum+p.addedMm,0),m.totalMm);
  m.extensions.forEach((p,i)=>{assert.equal(p.end-p.start,p.addedMm);assert.equal(p.end,m.starts[i]+l);if(i)assert.equal(p.start,m.extensions[i-1].end);});
  assert.equal(chainInverse({lengthMm:l,thicknessMm:t,totalMm:m.totalMm}).count,n);
  assert.equal(chainInverse({count:n,thicknessMm:t,totalMm:m.totalMm}).lengthMm,l);
  if(n>1)assert.equal(chainInverse({count:n,lengthMm:l,totalMm:m.totalMm}).thicknessMm,t);
 }
 assert.throws(()=>chainInverse({count:1,lengthMm:40,totalMm:40}),/一个环/);
 assert.throws(()=>chainInverse({count:4,lengthMm:40,totalMm:170}),/正数/);
 assert.throws(()=>chainInverse({lengthMm:40,thicknessMm:5,totalMm:131}),/条件无效/);
 assert.throws(()=>chainInverse({totalMm:130}),/一个待求量/);
});
test('反求厚度与单环外长：把结果代回独立的原关系；图不携带未知尺寸答案',()=>{
 const a=task('G3-U03-E02.c4'),b=task('G3-U03-E02.t2');
 assert.equal(validateTask(a,{value:'4'}).status,'correct');assert.equal(validateTask(a,{value:'10'}).status,'incorrect');
 assert.equal(validateTask(b,{value:'30'}).status,'correct');assert.equal(validateTask(b,{value:'140/6'}).status,'incorrect');
 assert.equal(4*50-3*2*Number(a.expected),176);assert.equal(6*Number(b.expected)-5*2*4,140);
 assert(!Object.hasOwn(a.diagram,'thicknessMm'));assert(!Object.hasOwn(b.diagram,'pieceLengthMm'));
 assert.deepEqual(auditTask(a).errors,[]);assert.deepEqual(auditTask(b).errors,[]);assert(auditTask(a).independentlyDerivedFromPromptOrDiagram);
 const corrupted=structuredClone(a);corrupted.expected='10';assert(auditTask(corrupted).errors.includes('逆向题图条件与待求量不符'));
});
test('14节提升/奥数课都有明确逆向任务；11道更新保持849个任务和原ID',()=>{
 assert.equal(Object.keys(inverseRevisions).length,11);assert.equal(inverseLessonIds.size,10);
 assert.equal(lessons.flatMap(l=>Object.values(l.taskSets).flat()).length,849);
 for(const row of old.rows){assert(task(row.task.id));assert.equal(lessons.find(l=>l.lessonId===row.lessonId).contentVersion,inverseVersion);assert.deepEqual(auditTask(task(row.task.id)).errors,[],row.task.id);}
 const coverage=JSON.parse(fs.readFileSync(new URL('../docs/review/逆向训练覆盖_20261018.json',import.meta.url)));
 const advanced=lessons.filter(l=>['enhancement','olympiad'].includes(l.track));assert.equal(advanced.length,14);assert.deepEqual(coverage.rows.map(r=>r.lessonId).sort(),advanced.map(l=>l.lessonId).sort());
 for(const row of coverage.rows){assert(row.inverseTaskIds.length);for(const id of row.inverseTaskIds)assert(task(id),id);assert(row.forwardRelation&&row.reverseRelation&&row.scope);}
});
test('新题不在旧版本页面评分；旧首答、审核和奖励权利可导出恢复且不被改写',()=>{
 for(const row of old.rows){
  const current=lessons.find(l=>l.lessonId===row.lessonId),legacy=structuredClone(current);legacy.contentVersion=row.contentVersion;
  legacy.taskSets[row.set]=legacy.taskSets[row.set].map(t=>t.id===row.task.id?row.task:t);
  const p=freshProgress(),before=createSession(p,{lessonId:row.lessonId,setName:row.set},[legacy]);
  const answer=row.task.kind==='fields'?Object.fromEntries(row.task.fields.map(f=>[f.key,f.expected])):{value:row.task.expected??row.task.solution};
  completeSelfCheck(p,{sessionId:before.id,revision:before.revision,taskId:row.task.id,answer,eventId:'old-check'});
  submitTask(p,{sessionId:before.id,revision:before.revision,taskId:row.task.id,answer,eventId:'old-submit'},[legacy]);
  const snapshot=structuredClone(before);const after=createSession(p,{lessonId:row.lessonId,setName:row.set},lessons);assert.notEqual(after.id,before.id);
  assert.throws(()=>submitTask(p,{sessionId:before.id,revision:before.revision,taskId:row.task.id,answer,eventId:'stale'},lessons),e=>e.code==='CONTENT_UPDATED');assert.deepEqual(before,snapshot);
  const t=task(row.task.id),fresh={value:t.expected??t.solution};completeSelfCheck(p,{sessionId:after.id,revision:after.revision,taskId:t.id,answer:fresh,eventId:'new-check'});
  const result=submitTask(p,{sessionId:after.id,revision:after.revision,taskId:t.id,answer:fresh,eventId:'new-submit'},lessons);assert(['correct','pendingReview'].includes(result.status));
  if(row.task.kind!=='explanation'&&t.kind!=='explanation')assert.equal(result.paid,0,t.id+'重复奖励');
  assert.deepEqual(before,snapshot);assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
 }
});
