import test from 'node:test';
import assert from 'node:assert/strict';
import {thinkingCards,publicThinkingCard} from '../content/pilot/thinking-source.mjs';
import {applyThinking,validateThinking} from '../server/thinking-store.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {lessons} from '../content/pilot/source.mjs';
import {grade3UnitMetadata} from '../content/pilot/grade3-complete.mjs';
const id='G3-U02-TH1';
const action=(p,a,extra={})=>applyThinking(p,{taskId:id,revision:p.studio?.thinking?.[id]?.revision??0,eventId:crypto.randomUUID(),action:a,...extra});
test('60张旧卡全部归属教材章；17章均有操作核心与一张可选迁移；43张明确暂缓',()=>{
 assert.equal(thinkingCards.length,60);assert.equal(new Set(thinkingCards.map(t=>t.id)).size,60);assert.equal(thinkingCards.filter(t=>t.releaseBucket==='deferred').length,43);
 for(const unit of grade3UnitMetadata){const rows=lessons.filter(l=>l.parentUnitId===unit.id);assert(rows.some(l=>l.track==='foundation'&&l.interactionStatus!=='static-visual'),unit.id);assert.equal(thinkingCards.filter(t=>t.originUnit===unit.id&&t.recommended).length,1)}
 for(const t of thinkingCards){assert(t.thinkingDomain);assert(lessons.some(l=>l.lessonId===t.parentLessonId));const publicCard=publicThinkingCard(t);for(const k of ['answer','reason','solutionSteps','hints','editorReview'])assert.equal(k in publicCard,false);if(t.releaseBucket==='deferred')assert.equal(publicCard.question,undefined)}
 assert.equal(thinkingCards.find(t=>t.id==='G3-U04-S03').classification,'数学思想桥梁');assert.equal(thinkingCards.find(t=>t.id==='G3-U04-S03').thinkingDomain,'enumeration.extremum');
});
test('迁移保留真实首答、自查与最终解释，不把提示或提交当作答对和积分',()=>{
 const p=freshProgress();action(p,'first',{answer:'我猜不需要括号，结果是32。'});
 action(p,'hint',{level:1});assert.throws(()=>action(p,'final',{answer:'8'}),/先完成自查/);
 action(p,'check',{checks:[true,true,true],reflection:'括号里减法必须先做，改变了原来的顺序。'});
 const out=action(p,'final',{answer:'(36-12)÷3=8。先送走12张，再平均分给3人。'});assert.equal(out.status,'pendingReview');assert.equal(out.paid,0);const r=out.record;assert.match(r.firstAnswer,/32/);assert.equal(r.firstAssisted,false);assert.equal(r.help.length,1);assert.match(r.finalAnswer,/8/);assert.equal(p.wallet.coins,0);assert.equal(p.studio.review[id],undefined);
 assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);assert.throws(()=>action(p,'first',{answer:'覆盖以前'}),/保存后会保留/);
});
test('帮助在首答前后分别记录；参考解答必须首答后按需取，不预先泄漏',()=>{
 const p=freshProgress();assert.throws(()=>action(p,'solution'),/先保存/);action(p,'hint',{level:2});action(p,'reference');const r=action(p,'first',{answer:'我觉得先送掉12张，再分三份。'}).record;assert.equal(r.firstAssisted,true);assert.equal(r.help.length,2);const out=action(p,'solution');assert.match(out.record.help.at(-1).text,/36/);assert.equal(out.paid,0);
});
test('思维卡拒绝过期页面、重复编号异义、无效备份，旧无思维卡备份兼容',()=>{
 const p=freshProgress(),input={taskId:id,eventId:'thinking:repeat',revision:0,action:'first',answer:'先减后除。'};const a=applyThinking(p,input),b=applyThinking(p,input);assert.deepEqual(a,b);assert.equal(p.studio.events.length,1);
 assert.throws(()=>applyThinking(p,{...input,answer:'换答案'}),/相同保存编号/);assert.throws(()=>applyThinking(p,{...input,eventId:'thinking:stale',action:'hint',level:1}),/重新载入/);
 const records=structuredClone(p.studio.thinking);records[id].phase='pendingReview';assert.throws(()=>validateThinking(records),/自查证据/);assert.doesNotThrow(()=>validateEnvelope(exportEnvelope(freshProgress()),[]));assert.throws(()=>applyThinking(p,{taskId:'G3-U01-TH2',eventId:'thinking:deferred',revision:0,action:'first',answer:'4'}),/尚未开放/);
});
