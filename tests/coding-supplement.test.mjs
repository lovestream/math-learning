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

import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {classCode,stableCode,idParts,postalParts,codingQuiz} from '../shared/coding-model.mjs';
import {validateTask} from '../shared/pilot-math.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {createSession,submitTask} from '../server/pilot-store.mjs';
import {completeSelfCheck} from './fixtures/self-check.mjs';
import {readCurrentTaskReviews} from '../scripts/task-review-registry.mjs';

test('字段位置不跑位：18字符含问号、6位邮编与第17/18位分别定位',()=>{
 assert.deepEqual(idParts.map(p=>p.digits.length),[2,2,2,4,2,2,3,1]);
 assert.equal(idParts.map(p=>p.digits).join(''),'44010620150516003?');
 assert.equal(idParts.map(p=>p.digits).join('')[16],'3');assert.equal(idParts.at(-1).digits,'?');
 assert.deepEqual(postalParts.map(p=>p.digits.length),[2,1,1,2]);
 assert.equal(postalParts.map(p=>p.digits).join(''),'100031');
 assert(new Set(codingQuiz.map(q=>q.correct)).size>1);
 for(const q of codingQuiz){assert(q.options[q.correct]);assert(q.why.length>10);}
});
test('自编字段可独立解码：全校1620个班级标签及跨入学年流水不撞号，边界不能溢出',()=>{
 const codes=new Set();for(let g=1;g<=6;g++)for(let c=1;c<=6;c++)for(let n=1;n<=45;n++){const code=classCode(g,c,n);assert.deepEqual(code.split('-').map(Number),[g,c,n]);assert(!codes.has(code));codes.add(code);}assert.equal(codes.size,1620);
 const stable=new Set();for(let y=2023;y<=2026;y++)for(let n=1;n<=9999;n++){const code=stableCode(y,n);assert(!stable.has(code));stable.add(code);}assert.equal(stable.size,39996);
 for(const args of [[0,2,7],[7,2,7],[3,7,7],[3,2,46],[3.5,2,7]])assert.throws(()=>classCode(...args));
 for(const args of [[2022,1],[2024,0],[2024,10000],[2024,1.5]])assert.throws(()=>stableCode(...args));
});
test('十二题没有继承旧图、旧四位限制；开放解释或随便写数字都不能自动通过',()=>{
 for(const t of all){assert(!t.diagram,t.id);if(t.kind==='explanation'){
  assert.equal(t.responseSpec.rubric.length,3,t.id);
  for(const text of ['123456','我猜就是这样',t.solution])assert.notEqual(validateTask(t,{value:text}).status,'correct',t.id);
 }else if(t.kind==='choice')for(const o of t.options)assert.equal(validateTask(t,{value:o.id}).status,o.id===t.expected?'correct':'incorrect',t.id);
 }
 const countTask=all.find(t=>t.id.endsWith('P09'));assert.doesNotMatch(countTask.prompt,/18/);assert.equal(Number(countTask.expected),idParts.reduce((n,p)=>n+p.digits.length,0));
 assert.equal(validateTask(countTask,{value:'18'}).status,'correct');
 assert.equal(validateTask(all.find(t=>t.id.endsWith('P09')),{value:'17'}).status,'incorrect');
 const p7=all.find(t=>t.id.endsWith('P07'));assert(!p7.expected);assert.doesNotMatch(p7.responseSpec.rubric.join(' '),/必须.*3207|必须.*四位/);
});
test('追加新版本十二题审校，不改旧849题字节和原837条当前证据',()=>{
 const amendment=JSON.parse(fs.readFileSync('docs/review/final-task-review/versioned/coding-20261101.json'));
 const raw=fs.readFileSync('docs/review/849题最终审校清单_20261009.json'),history=JSON.parse(raw),rows=readCurrentTaskReviews();
 assert.equal(createHash('sha256').update(raw).digest('hex'),amendment.historicalRegisterSha256);
 assert.equal(rows.length,849);assert.equal(rows.filter(r=>r.reviewSource).length,12);
 for(const row of rows){if(row.lessonId!=='G3-UP02-B01')assert.deepEqual(row,history.rows.find(r=>r.taskId===row.taskId));else{assert.equal(row.contentVersion,codingVersion);assert(row.priorEvidence.sourceFingerprint);assert(row.semanticReview.reason.length>20);if(row.kind==='choice')assert.equal(new Set(row.semanticReview.choiceChecks.map(x=>x.mathematicalBasis)).size,row.task.options.length);}}
});
test('旧版与早期扩充版会话仍可导出还原；新版不覆写首答、不重复奖励同题',()=>{
 const historical=JSON.parse(fs.readFileSync('docs/review/849题最终审校清单_20261009.json'));
 const draft=JSON.parse(fs.readFileSync('docs/review/final-task-review/versioned/coding-20261101-history.json')).draftVersion1;
 const oldSets=Object.fromEntries(Object.entries(lesson.taskSets).map(([set])=>[set,historical.rows.filter(r=>r.lessonId===lesson.lessonId&&r.set===set).map(r=>r.task)]));
 for(const old of [{...lesson,contentVersion:historical.rows.find(r=>r.lessonId===lesson.lessonId).contentVersion,taskSets:oldSets},{...lesson,...draft}]){
  const p=freshProgress(),oldTask=Object.values(old.taskSets).flat().find(t=>t.expected!==undefined&&all.find(n=>n.id===t.id)?.expected!==undefined);assert(oldTask);
  const set=Object.entries(old.taskSets).find(([,ts])=>ts.some(t=>t.id===oldTask.id))[0],s=createSession(p,{lessonId:lesson.lessonId,setName:set},[old]);
  const send=(session,t,list)=>{const answer={value:t.expected};completeSelfCheck(p,{sessionId:session.id,revision:session.revision,taskId:t.id,answer,eventId:crypto.randomUUID()});return submitTask(p,{sessionId:session.id,revision:session.revision,taskId:t.id,answer,eventId:crypto.randomUUID()},list);};
  assert.equal(send(s,oldTask,[old]).status,'correct');const coins=p.wallet.coins,snapshot=structuredClone(s);
  const next=createSession(p,{lessonId:lesson.lessonId,setName:set},lessons);assert.notEqual(next.id,s.id);assert.equal(next.contentVersion,codingVersion);assert.deepEqual(p.studio.sessions[s.id],snapshot);
  const result=send(next,all.find(t=>t.id===oldTask.id),lessons);assert.equal(result.status,'correct');assert.equal(result.paid,0);assert.equal(p.wallet.coins,coins);
  const restored=validateEnvelope(exportEnvelope(p),[]);assert.deepEqual(restored.studio.sessions[s.id],snapshot);assert.deepEqual(restored.studio.sessions[next.id],next);assert.equal(restored.wallet.coins,coins);
 }
});

import {reviewFormalTask} from '../server/pilot-store.mjs';
import {lessonEvidence} from '../shared/learning-evidence.mjs';
test('其余69课逐字节序列化指纹不变，不用新截图替换它们的旧证据',()=>{
 const history=JSON.parse(fs.readFileSync('docs/review/final-task-review/versioned/coding-20261101-history.json'));
 assert.equal(Object.keys(history.siblingFingerprintById).length,69);
 for(const l of lessons.filter(l=>l.lessonId!==lesson.lessonId))assert.equal(createHash('sha256').update(JSON.stringify(l)).digest('hex'),history.siblingFingerprintById[l.lessonId],l.lessonId);
});
test('旧扩充版核心题即使全部批阅完成，也不能拼入新版练习或独立达标',()=>{
 const draft=JSON.parse(fs.readFileSync('docs/review/final-task-review/versioned/coding-20261101-history.json')).draftVersion1,old={...lesson,...draft};
 const p=freshProgress(),s=createSession(p,{lessonId:lesson.lessonId,setName:'core'},[old]);
 for(const t of s.tasks){const answer={value:t.expected??'仅合成旧版本作答：字段长度、唯一性和识别范围均已说明。'};completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:crypto.randomUUID()});submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:crypto.randomUUID()},[old]);if(t.kind==='explanation')reviewFormalTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,eventId:crypto.randomUUID(),verdict:'correct',comment:'仅合成旧版审核，不替Kevin实际作答。'});}
 assert(s.completedAt);const evidence=lessonEvidence(p,lesson.lessonId,codingVersion);assert(!evidence.practiced);assert(!evidence.independent);assert.deepEqual(validateEnvelope(exportEnvelope(p),[]).studio.sessions[s.id],s);
});
