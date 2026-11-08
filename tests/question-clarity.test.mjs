import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {lessons} from '../content/pilot/source.mjs';
import {validateTask} from '../shared/pilot-math.mjs';import {auditTask} from '../shared/task-audit-oracle.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {createSession,submitTask} from '../server/pilot-store.mjs';import {completeSelfCheck} from './fixtures/self-check.mjs';
const task=id=>lessons.flatMap(l=>Object.values(l.taskSets).flat()).find(t=>t.id===id);
const ledger=JSON.parse(fs.readFileSync(new URL('../docs/review/题意歧义审校台账_20261017.json',import.meta.url)));

test('20厘米纸条重叠4厘米：明确问两端距离，36正确、40错误，图与题干同条件',()=>{
 const t=task('G3-U03-E01.w2');assert.match(t.prompt,/沿同一直线/);assert.match(t.prompt,/从最左端到最右端的距离/);assert.doesNotMatch(t.prompt,/材料总长/);
 assert.equal(validateTask(t,{value:'36'}).status,'correct');assert.equal(validateTask(t,{value:'40'}).status,'incorrect');
 assert.deepEqual(t.diagram.pieceLengthsMm,[200,200]);assert.deepEqual(t.diagram.overlapsMm,[40]);
 assert(auditTask(t).numericProofVerified);assert.deepEqual(auditTask(t).errors,[]);
});
test('所有搭接图独立按毫米位置求并集，避免原材料长度之和混充拼后距离',()=>{
 for(const t of lessons.flatMap(l=>Object.values(l.taskSets).flat()).filter(t=>t.diagram?.type==='measurement'&&t.diagram.mode==='boards'&&!t.diagram.unknown&&t.kind==='number')){
  const {pieceLengthsMm:pieces,overlapsMm:overlaps}=t.diagram,covered=new Set();let start=0;
  for(let i=0;i<pieces.length;i++){for(let x=start;x<start+pieces[i];x++)covered.add(x);if(i<pieces.length-1)start+=pieces[i]-overlaps[i];}
  const expected=t.unit==='厘米'?covered.size/10:t.unit==='米'?covered.size/1000:covered.size;
  assert.equal(Number(t.expected),expected,t.id);assert.equal(auditTask(t).errors.length,0,t.id);
 }
});
test('链环题独立给条件，钟面问整圈，贴边周长与搭接长度的去重次数分清',()=>{
 const chains=lessons.find(l=>l.lessonId==='G3-U03-E02');for(const t of Object.values(chains.taskSets).flat())assert.doesNotMatch(t.prompt,/这样的|同一模型|答案130/);
 for(const id of ['c1','c3','c5','t1','h1','r1']){const t=task('G3-U03-E02.'+id);assert.match(t.prompt,/不(?:首尾闭合|闭合)/);assert.match(t.prompt,/两段|两个/);}
 const clock=task('G3-U03-O01.t2');assert.match(clock.prompt,/这一整圈/);assert.equal(validateTask(clock,{value:'12'}).status,'correct');assert.equal(validateTask(clock,{value:'1'}).status,'incorrect');
 assert.match(task('G3-L03-E01-P12').prompt,/外周长/);assert.match(task('G3-L03-E01-P12').prompt,/共同边长度的两倍/);
 assert.match(task('G3-L07-R01-P06').prompt,/是否有一家/);assert.match(task('G3-L07-R01-P06').solution,/都是24元/);
});
test('新评估版本保留旧首答/判定，不重复奖励；旧页面不再按有歧义的40继续评分',()=>{
 const current=lessons.find(l=>l.lessonId==='G3-U03-E01'),row=ledger.renewedRows.find(r=>r.taskId==='G3-U03-E01.w2');
 assert.notEqual(current.contentVersion,row.beforeVersion);
 for(const oldValue of ['36','40']){
  const old=structuredClone(current);old.contentVersion=row.beforeVersion;old.editorialRevision='legacy-ambiguous';const t=Object.values(old.taskSets).flat().find(t=>t.id===row.taskId);t.prompt=row.beforePrompt;t.expected='40';delete t.diagram;
  const p=freshProgress(),before=createSession(p,{lessonId:old.lessonId,setName:'warmup'},[old]);
  const send=(s,value,event,ls)=>{completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value},eventId:'check-'+event});return submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value},eventId:event},ls);};
  send(before,oldValue,'legacy-'+oldValue,[old]);const snapshot=structuredClone(before),coins=p.wallet.coins;
  const after=createSession(p,{lessonId:current.lessonId,setName:'warmup'},lessons);assert.notEqual(after.id,before.id);
  assert.throws(()=>submitTask(p,{sessionId:before.id,revision:before.revision,taskId:t.id,answer:{value:'36'},eventId:'stale-page-'+oldValue},lessons),e=>e.code==='CONTENT_UPDATED'&&e.message.includes('已经更正'));
  assert.deepEqual(before,snapshot);const result=send(after,'36','corrected-'+oldValue,lessons);assert.equal(result.status,'correct');
  if(oldValue==='40'){assert.equal(result.paid,0);assert.equal(p.wallet.coins,coins);}
  assert.deepEqual(before,snapshot);assert.equal(after.selfChecks[t.id].firstAnswer.value,'36');assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
 }
});
test('本轮29题补清题意、仅1题改答案；849个任务和原有三项自查保持',()=>{
 assert.equal(lessons.flatMap(l=>Object.values(l.taskSets).flat()).length,849);assert.equal(ledger.scope.selectedForSemanticReview,115);
 const changes=ledger.renewedRows.filter(r=>r.kind==='reviewed-content-correction');assert.equal(changes.length,29);
 assert.deepEqual(changes.filter(r=>r.beforeAnswer!==r.afterAnswer).map(r=>[r.taskId,r.beforeAnswer,r.afterAnswer]),[['G3-U03-E01.w2','40','36']]);
});
