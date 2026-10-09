import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import{lessons}from'../content/pilot/source.mjs';
import{introVisuals,conditionStories}from'../content/pilot/intro-visuals.mjs';
import{operationModels}from'../shared/operation-models.mjs';import{coreModels}from'../shared/core-models.mjs';
import{calculateAuditExpression,auditTask}from'../shared/task-audit-oracle.mjs';
import{buildFormalTaskAudit}from'../scripts/audit-formal-tasks.mjs';
test('九节新条件图与文字从结构化条件共生，70课全部有首屏关系图',()=>{
 assert.equal(Object.keys(conditionStories).length,9);
 for(const l of lessons){assert(l.introVisual||l.mathScenes?.length||l.lengthScenes?.length||l.articleBlocks[0].diagram,l.lessonId);if(conditionStories[l.lessonId])assert.equal(l.childClassroom.story,conditionStories[l.lessonId]);}
 const w=operationModels['G3-U02-E03'];assert.deepEqual(introVisuals['G3-U02-E03'].values,[w.start,w.pay,w.refund]);
 for(const id of ['G3-U04-B05','G3-L02-B05','G3-L02-B06'])assert.deepEqual(introVisuals[id].values,coreModels[id].cases[0]);
 assert.deepEqual(introVisuals['G3-L06-B03'].values,[3,8,2,5,10]);assert.deepEqual(introVisuals['G3-L07-R01'].values,[24,2,12,6,910,950]);
});
test('独立审校oracle遵循运算序、不执行代码；单位、余数、文字符号不误判',()=>{
 assert.equal(calculateAuditExpression('2＋3×4'),14);assert.equal(calculateAuditExpression('(2＋3)×4'),20);assert.equal(calculateAuditExpression('2/6'),1/3);assert.throws(()=>calculateAuditExpression('process.exit()'));
 const base={id:'x',hint:'提示',kind:'number',responseSpec:{type:'number'}};
 assert.deepEqual(auditTask({...base,prompt:'29人坐每车4座的小车，至少要几辆？',expected:'8',solution:'8辆。29÷4=7余1。'}).errors,[]);
 assert(auditTask({...base,prompt:'29人坐每车4座的小车，至少要几辆？',expected:'7',solution:'7辆。'}).errors.length);
 assert(auditTask({...base,prompt:'6厘米等于多少毫米？',expected:'60',solution:'60毫米。'}).numericProofVerified);
 assert(auditTask({...base,prompt:'6厘米等于多少毫米？',expected:'6',solution:'6毫米。'}).errors.length);
 assert.deepEqual(auditTask({...base,kind:'explanation',prompt:'为什么',solution:'4.2=3个一和12个十分之一。'}).errors,[]);
});
test('全849题自动清点、每单元四类手工样本，未证明题保持未验证',()=>{
 const r=buildFormalTaskAudit();assert.equal(r.summary.total,849);assert.equal(r.summary.machineCheckedCount,849);assert.equal(r.summary.errors.length,0);assert(r.summary.humanCheckedCount>=96);assert(r.summary.unverifiedCount>0);
 const samples=JSON.parse(fs.readFileSync(new URL('../docs/review/semantic-ledger/formal-task-manual-samples.json',import.meta.url))).rows;
 for(const group of Map.groupBy(samples,x=>x.unit).values())assert.deepEqual(new Set(group.map(x=>x.set)),new Set(['core','transfer','challenge','review']));
});
