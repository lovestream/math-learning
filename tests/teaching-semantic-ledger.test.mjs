import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {lessons} from '../content/pilot/source.mjs';
import {buildSemanticLedger,renderSemanticLedger} from '../scripts/build-semantic-ledger.mjs';

test('70课教学语义台账不遗漏教材、桥梁、静态课和撤教具小测入口',()=>{
 const ledger=buildSemanticLedger(),rows=ledger.rows;
 assert.equal(rows.length,70);
 assert.equal(new Set(rows.map(r=>r.lessonId)).size,70);
 assert.equal(rows.filter(r=>r.unitId==='foundation-bridge').length,7);
 assert.equal(new Set(rows.filter(r=>r.unitId!=='foundation-bridge').map(r=>r.unitId)).size,17);
 assert.equal(rows.filter(r=>r.experiment.classification==='static-visual').length,6);
 const checks=rows.filter(r=>r.independentCheck.source==='withdrawn-v1-existing-task-ids');
 assert.equal(checks.length,11);
 for(const row of rows){
  const lesson=lessons.find(l=>l.lessonId===row.lessonId);
  const original=Object.values(lesson.taskSets).flat();
  assert(row.invariant&&row.nextInspection,row.lessonId);
  assert(row.quantities.object&&row.quantities.unit&&row.quantities.known&&row.quantities.unknown&&row.quantities.changes,row.lessonId);
  assert.equal(row.independentCheck.selfCheckItems,3);
  if(checks.includes(row))assert.equal(row.independentCheck.tasks.length,5);
  for(const task of row.independentCheck.tasks){
   const source=original.find(t=>t.id===task.id);
   assert(source,`${row.lessonId}:不存在的独立题ID`);
   assert.equal(task.prompt,source.prompt);
  }
 }
 assert.equal(rows.reduce((sum,r)=>sum+Object.values(r.independentCheck.allTaskCounts).reduce((a,b)=>a+b,0),0),849);
});

test('源核对状态不能假称新的浏览器验收、教学审批或Kevin掌握',()=>{
 const ledger=buildSemanticLedger();
 assert.equal(ledger.requestedAudit.alignment,'audit-fields-and-phase-order-recorded');
 assert.equal(ledger.safeguards.classroomStages.length,6);
 assert.equal(ledger.safeguards.selfCheckItems,3);
 for(const row of ledger.rows){
  assert.equal(row.acceptance.browserSemanticEvidence,row.verification.evidence?'desktop-run-with-sha':'pending-chapter-run');
  if(row.verification.evidence)assert.match(row.verification.evidence.sha,/^[a-f0-9]{40}$/);
  assert.equal(row.verification.learnerMastery,'no-data');
  assert.equal(row.acceptance.parentTeachingApproval,'not-verified');
  assert.equal(row.acceptance.kevinMastery,'not-assessed');
  assert.equal(row.sourceFinding==='initial-source-issue',row.issues.length>0);
 }
});

test('课程或人工批注变化后，已归档机器台账和Markdown必须一起查新',async()=>{
 const ledger=buildSemanticLedger();
 const json=await readFile(new URL('../docs/review/semantic-ledger/teaching-semantic-ledger.json',import.meta.url),'utf8');
 const markdown=await readFile(new URL('../docs/review/三年级70课_六步教学语义台账.md',import.meta.url),'utf8');
 assert.equal(json,`${JSON.stringify(ledger,null,2)}\n`);
 assert.equal(markdown,renderSemanticLedger(ledger));
});
