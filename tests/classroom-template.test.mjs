import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../content/pilot/source.mjs';
import {classroomEntries} from '../content/pilot/classrooms.mjs';
import {assessmentRevisions} from '../content/pilot/formal-task-errata.mjs';
import {createSession,selfCheckTask,submitTask,validatePilot} from '../server/pilot-store.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
const checklist={format:'checklist-v1',checks:['我读清了题目问什么','我检查了计算或理由','我核对了最后的答案'],reflection:'',finalConfirmed:true};
test('70个入口保留六步教案，仅三课经终审批准升级评分版本',()=>{
 assert.equal(lessons.length,70);assert.equal(Object.keys(classroomEntries).length,65);
 const original=new Set(['G3-U01-B01','G3-U01-B02','G3-U01-B03','G3-UP01-B01','G3-UP01-B02']);
 assert.deepEqual([...assessmentRevisions].sort(),['G3-U02-B04','G3-U02-E01','G3-UP02-B01']);
 for(const l of lessons){const c=l.childClassroom;assert(c.story&&c.mission&&c.retell&&c.predictQuestion,l.lessonId);assert(c.predictionOptions.length>=2&&c.predictionOptions.length<=3);assert(c.discovery.length&&c.symbols.length);assert(l.articleBlocks.some(b=>b.widget));assert.equal(l.contentVersion,assessmentRevisions.has(l.lessonId)?'2026-10-09.4':original.has(l.lessonId)?'2026-10-07.2':'2026-10-02.1',l.lessonId);}
});
test('三项勾选可提交混合运算且无需说明或中间步骤；首答、订正和旧存档均保留',()=>{
 const p=freshProgress(),l=lessons.find(l=>l.lessonId==='G3-U02-B03'),s=createSession(p,{lessonId:l.lessonId,setName:'core'},lessons),t=s.tasks[0],at=Date.now();
 const send=(extra)=>selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,eventId:crypto.randomUUID(),...extra},at);
 send({answer:{value:'999'}});assert(!s.results[t.id]);
 assert.throws(()=>send({phase:'evidence',evidence:{...checklist,checks:checklist.checks.slice(0,2)}}),/三项/);
 send({phase:'evidence',evidence:checklist});assert(!s.results[t.id]);
 const result=submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:t.expected},eventId:crypto.randomUUID()},lessons,at+1);
 assert.equal(result.status,'correct');assert.equal(result.selfCorrection,true);assert.equal(result.firstAnswer.value,'999');assert.equal(s.selfChecks[t.id].evidence.reflection,'');
 validatePilot(p.studio);assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
 // Existing records with written process remain accepted, without erasing them.
 const r=s.selfChecks[t.id];r.evidence={checks:checklist.checks,reflection:'先求两色珠子的总数，再平均装盒。',firstOperation:'12+8',intermediate:'20',finalConfirmed:true};validatePilot(p.studio);assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
});
test('自查勾选不使错误答案变正确，不凭空记录文字解释或删除积分权益',()=>{
 const p=freshProgress(),l=lessons.find(l=>l.lessonId==='G3-U04-B03'),s=createSession(p,{lessonId:l.lessonId,setName:'core'},lessons),t=s.tasks.find(t=>t.kind==='number');
 selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:'999'},eventId:crypto.randomUUID()});
 selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,phase:'evidence',evidence:checklist,eventId:crypto.randomUUID()});
 const before=p.wallet.coins,r=submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:'999'},eventId:crypto.randomUUID()},lessons);
 assert.equal(r.status,'incorrect');assert.equal(p.wallet.coins,before);assert.equal(r.selfCheckEvidence.reflection,'');
});
