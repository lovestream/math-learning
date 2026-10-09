import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {lessons} from '../content/pilot/source.mjs';
import {validateTask,parseLinear,formatFraction} from '../shared/pilot-math.mjs';
import {auditTask} from '../shared/task-audit-oracle.mjs';
import {semanticReviewMatches,buildFormalTaskAudit} from '../scripts/audit-formal-tasks.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {createSession,submitTask,validatePilot} from '../server/pilot-store.mjs';
import {completeSelfCheck} from './fixtures/self-check.mjs';
const register=JSON.parse(fs.readFileSync(new URL('../docs/review/849题最终审校清单_20261009.json',import.meta.url)));
const inventory=JSON.parse(fs.readFileSync(new URL('../docs/review/final-task-review/source-inventory.json',import.meta.url)));
const tasks=lessons.flatMap(l=>Object.values(l.taskSets).flat()),task=id=>tasks.find(t=>t.id===id);

test('强弱证据分开：参考解答算得对，不证明题意的答案对',()=>{
 const result=auditTask({id:'weak',kind:'number',prompt:'三盒各六支笔，一共有几支？',expected:'20',hint:'先数每盒',solution:'4×5=20。',responseSpec:{type:'number'}});
 assert(result.schemaChecked);assert(result.solutionInternallyConsistent);
 assert(!result.independentlyDerivedFromPromptOrDiagram);assert(!result.numericProofVerified);
});
test('849条具体理由、335种解释的替代表达和选择干扰项逐题可追溯',()=>{
 const report=buildFormalTaskAudit();assert.equal(report.summary.agentSemanticReviewed,849);assert.equal(report.summary.humanTeachingApproved,0);
 assert.equal(register.rows.length,849);
 for(const row of register.rows){
  const l=lessons.find(x=>x.lessonId===row.lessonId),t=task(row.taskId);
  assert(semanticReviewMatches(row,t,l.contentVersion),row.taskId);
  assert.equal(row.reviewer.independentThirdParty,false);
  if(t.kind==='explanation')assert.equal(validateTask(t,{value:row.semanticReview.acceptableAlternative}).status,'pendingReview',t.id);
  if(t.kind==='choice')assert.equal(row.semanticReview.choiceChecks.length,t.options.length,t.id);
 }
 const row=register.rows.find(r=>r.taskId==='G3-UP01-B02-P12'),t=task(row.taskId);
 for(const key of ['hint','prompt','solution','expected'])assert(!semanticReviewMatches(row,{...t,[key]:`${t[key]}changed`},row.contentVersion),key);
 assert(!semanticReviewMatches(row,t,'future-content-version'));
});
test('手写题意关系由独立Python Fraction实现复算，不读取标准答案',()=>{
 const log=execFileSync('python3',['scripts/verify-final-task-relations.py'],{encoding:'utf8'});
 assert.match(log,/499 authored equalities/);assert.match(log,/passed/);
});
test('改写题接受不同正确写法，但数字结果和未展开式不能冒充过程',()=>{
 const cases=[
  ['G3-U02-B04.c2','50＋6－18＝38','38'],
  ['G3-U02-E01.c2','20＋3－8','20-(8-3)'],
  ['G3-U02-E01.c4','70-28+8=50','50'],
  ['G3-U02-E01.r2','90+5-35=60','90-35-5=50'],
  ['G3-U02-E03-P01','80-(15+25)','80-25-15'],
  ['G3-U02-E03-P02','80-(25-15)','80-(25+15)'],
  ['G3-U02-E02-P07','96/(4*6)=4','96/(6/4)=64'],
  ['G3-U02-E05-P01','4*3+2*3=18','3*(4+2)=18'],
  ['algebra.substitution.intro.c1','乙+7=10','乙+5=10'],
  ['algebra.substitution.intro.c3','3甲=甲+14','3甲=甲+9'],
  ['algebra.substitution.intro.c4','3乙+6=18','3乙+2=18'],
  ['algebra.substitution.intro.t2','2乙+9=19','2乙+5=19'],
 ];
 for(const [id,right,wrong] of cases){assert.equal(validateTask(task(id),{value:right}).status,'correct',`${id} ${right}`);assert.notEqual(validateTask(task(id),{value:wrong}).status,'correct',`${id} ${wrong}`);}
});
test('替换测量的三项长度平行，体积相同和只称一块不能证明质量',()=>{
 const t=task('G3-UP01-B02-P12'),lengths=t.options.map(o=>[...o.text].length);
 assert(Math.max(...lengths)-Math.min(...lengths)<=2);
 for(const value of ['c1','c2'])assert.equal(validateTask(t,{value,evidence:'e0'}).status,'incorrect');
 assert.equal(validateTask(t,{value:'c0',evidence:'e0'}).status,'correct');
 assert.equal(validateTask(t,{value:'c0',evidence:'e1'}).status,'incorrect');
});
test('分数边界、双字段与倒推错误路径不混同',()=>{
 assert.equal(validateTask(task('G3-U06-B03-P05'),{value:'1/2'}).status,'correct');
 assert.equal(validateTask(task('numbers.fractions.meaning.h1'),{part:'2/6',length:'4/6'}).status,'correct');
 assert.equal(validateTask(task('numbers.fractions.meaning.h1'),{part:'2/3',length:'1/3'}).status,'incorrect');
 assert.equal(validateTask(task('G3-U02-O01-P08'),{number:'10',correct:'16'}).status,'invalidInput'); // Field names are explicit, not inferred.
 const reverse=task('G3-U02-O01-P08'),answer=Object.fromEntries(reverse.fields.map((f,i)=>[f.key,i===0?'10':'16']));
 assert.equal(validateTask(reverse,answer).status,'correct');
 answer[reverse.fields[1].key]='34';assert.equal(validateTask(reverse,answer).status,'incorrect');
 assert.equal(formatFraction(parseLinear('7+4*4').constant),'23');assert.equal(formatFraction(parseLinear('(7+4)*4').constant),'44');
 assert.doesNotMatch(task('G3-U06-E01-P11').solution,/前提是3个小段相邻/);
});

test('评分升级不覆盖旧首答或重发相同题的积分，旧存档可完整恢复',()=>{
 const current=lessons.find(l=>l.lessonId==='G3-U02-B04'),oldRows=inventory.rows.filter(r=>r.lessonId===current.lessonId);
 const old={...current,contentVersion:oldRows[0].contentVersion,editorialRevision:'before-final-review',taskSets:Object.fromEntries(Object.entries(current.taskSets).map(([set])=>[set,oldRows.filter(r=>r.set===set).map(r=>r.task)]))};
 const p=freshProgress(),before=createSession(p,{lessonId:old.lessonId,setName:'core'},[old]),id='G3-U02-B04.c2';
 const send=(s,answer,event)=>{completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:id,answer,eventId:`self-${event}`});return submitTask(p,{sessionId:s.id,revision:s.revision,taskId:id,answer,eventId:event},[old,current]);};
 const a=send(before,{value:'38'},'old-answer');assert.equal(a.status,'correct');const coins=p.wallet.coins;
 const snapshot=structuredClone(before),after=createSession(p,{lessonId:current.lessonId,setName:'core'},lessons);
 assert.notEqual(after.id,before.id);assert.deepEqual(before,snapshot);assert.equal(validateTask(after.tasks.find(t=>t.id===id),{value:'38'}).status,'invalidInput');
 const b=send(after,{value:'50-18+6=38'},'new-answer');assert.equal(b.status,'correct');assert.equal(b.paid,0);assert.equal(p.wallet.coins,coins);
 validatePilot(p.studio);const restored=validateEnvelope(exportEnvelope(p),[]);assert.deepEqual(restored.studio.sessions[before.id],before);assert.equal(restored.wallet.coins,coins);
});
test('身份编号转家长核对，提交和三项自查不会自动发积分',()=>{
 const p=freshProgress(),s=createSession(p,{lessonId:'G3-UP02-B01',setName:'core'},lessons),t=task('G3-UP02-B01-P07'),answer={value:'3207，3年级2班07号'};
 assert.equal(t.kind,'explanation');completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:'code-self'});
 const result=submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:'code-submit'},lessons);
 assert.equal(result.status,'pendingReview');assert.equal(result.paid,0);assert.equal(p.wallet.coins,0);assert(!s.completedAt);
});
