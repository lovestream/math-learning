import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {lessonEvidence} from '../shared/learning-evidence.mjs';
import {applyThinking,applyThinkingReview,validateThinking} from '../server/thinking-store.mjs';
import {thinkingCards} from '../content/pilot/thinking-source.mjs';
import {thinkingVariant,publicVariant} from '../content/pilot/thinking-variants.mjs';
import {thinkingHints} from '../content/pilot/thinking-hints.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {withdrawnLessons,withdrawnTasks} from '../shared/withdrawn-checks.mjs';
import {createSession,selfCheckTask,submitTask,reviewFormalTask,validatePilot} from '../server/pilot-store.mjs';
import {createParentAccess} from '../server/parent-access.mjs';
import {resetParentAccess} from '../scripts/recover-parent-access.mjs';
const DAY=86400000,base=Date.parse('2026-10-01T08:00:00Z'),id='G3-U02-TH1';
const lessons=JSON.parse(fs.readFileSync(new URL('../content/pilot/lessons.json',import.meta.url)));
function send(p,action,extra={},at=base,taskId=id){return applyThinking(p,{taskId,revision:p.studio.thinking?.[taskId]?.revision??0,eventId:crypto.randomUUID(),action,...extra},at).record;}
function finish(p,at=base,taskId=id){send(p,'first',{answer:'自己的真实首答与推理。'},at,taskId);send(p,'check',{checks:[true,true,true],reflection:'逐条代回条件，检查范围和重复。'},at+1,taskId);return send(p,'final',{answer:'检查后自己的最终解释。'},at+2,taskId);}
function grade(p,verdict='independent-mastered',at=base+3,taskId=id){return applyThinkingReview(p,{taskId,revision:p.studio.thinking[taskId].revision,eventId:crypto.randomUUID(),verdict,comment:'仅自动化夹具，已核对本轮支架与解释。',reviewer:'测试夹具',causes:[]},at).record;}
function session(set,version,at){return {lessonId:'x',setName:set,contentVersion:version,completedAt:new Date(at).toISOString(),reviewDue:set==='review'?new Date(at).toISOString():null,tasks:[{id:'t'}],results:{t:{status:'correct',assisted:false,selfCorrection:false}},selfChecks:{t:{evidenceCompletedAt:new Date(at).toISOString(),selfCorrection:false}}};}
test('A01：旧核心v1不拼接新版迁移及复习',()=>{const p={studio:{sessions:{c:session('core','v1',base),t:session('transfer','v2',base+1),r:session('review','v2',base+DAY+2)}}};assert.equal(lessonEvidence(p,'x','v2').independent,false);});
test('A02：复习必须在迁移之后至少24小时，核心不能晚于迁移',()=>{
 const p={studio:{sessions:{c:session('core','v2',base),t:session('transfer','v2',base+DAY*2),r:session('review','v2',base+DAY)}}};
 assert.equal(lessonEvidence(p,'x','v2').independent,false);
 p.studio.sessions.r=session('review','v2',base+DAY*3-1);assert.equal(lessonEvidence(p,'x','v2').independent,false);
 p.studio.sessions.r=session('review','v2',base+DAY*3);assert.equal(lessonEvidence(p,'x','v2').independent,true);
 p.studio.sessions.c=session('core','v2',base+DAY*4);assert.equal(lessonEvidence(p,'x','v2').independent,false);
});
test('A03：调到积木匹配后提交不能隐瞒支架；撤销不会清零验证证据',()=>{
 const p=freshProgress(),taskId='G3-U01-TH1';send(p,'tool-open',{},base,taskId);send(p,'tool',{command:'height',index:0,value:2},base+1,taskId);
 finish(p,base+2,taskId);const r=p.studio.thinking[taskId];assert(r.firstScaffold.usedAnswerValidation);assert.equal(r.scaffold.validationAttempts,2);assert.equal(r.scaffold.matchedAttempts,1);
 assert.throws(()=>grade(p,'independent-mastered',base+5,taskId),/自动验证/);
 grade(p,'model-supported',base+5,taskId);assert.equal(r.firstAnswer,'自己的真实首答与推理。');
 const q=freshProgress();send(q,'tool-open',{},base,taskId);send(q,'tool',{command:'height',index:0,value:2},base+1,taskId);send(q,'first',{answer:'先保存这一刻的想法。'},base+2,taskId);send(q,'tool',{command:'undo'},base+3,taskId);
 assert.equal(q.studio.thinking[taskId].firstScaffold.validationAttempts,2);assert.equal(q.studio.thinking[taskId].scaffold.validationAttempts,3);
});
test('A04：四轮通过后看解析不改写历史结论、完成状态和到期安排',()=>{
 const p=freshProgress();finish(p);grade(p);
 for(let i=0;i<4;i++){const at=Date.parse(p.studio.thinking[id].review.dueAt);send(p,'review-start',{},at);finish(p,at+1);grade(p,'independent-mastered',at+4);}
 const r=structuredClone(p.studio.thinking[id]);assert(r.review.completed&&r.review.strongEvidence);
 send(p,'solution',{},base+DAY*50);send(p,'hint',{level:1},base+DAY*50+1);
 const next=p.studio.thinking[id];assert.deepEqual(next.review,r.review);assert.deepEqual(next.reviews,r.reviews);assert.deepEqual(next.attempts,r.attempts);assert.deepEqual(next.help,r.help);assert.equal(next.phase,'reviewed');assert.equal(next.postReviewStudy.length,2);validateThinking(p.studio.thinking);
});
test('A05：新作答前用提示，本轮降低独立性；独立新题拒绝教具自动反馈',()=>{
 const p=freshProgress();finish(p);grade(p);const at=Date.parse(p.studio.thinking[id].review.dueAt);send(p,'review-start',{},at);send(p,'hint',{level:1},at+1);finish(p,at+2);assert(p.studio.thinking[id].firstAssisted);assert.throws(()=>grade(p,'independent-mastered',at+5),/提示/);
 const q=freshProgress(),t='G3-U01-TH1';finish(q,base,t);grade(q,'independent-mastered',base+3,t);send(q,'review-start',{},base+DAY+4,t);assert.throws(()=>send(q,'tool-open',{},base+DAY+5,t),/独立新题/);
});
test('A06：12轮失败仍不循环；全部用完明确回补，不伪造全新题',()=>{
 const p=freshProgress();finish(p);grade(p,'needs-remediation');const seen=new Set();
 for(let i=1;i<=12;i++){const at=Date.parse(p.studio.thinking[id].review.dueAt);const r=send(p,'review-start',{},at);assert(!seen.has(r.variant.id));seen.add(r.variant.id);assert.equal(r.variantIndex,i);finish(p,at+1);grade(p,'needs-remediation',at+4);}
 assert.equal(seen.size,12);const old=structuredClone(p.studio.thinking[id]);assert.throws(()=>send(p,'review-start',{},Date.parse(old.review.dueAt)),/新题已用完/);assert.deepEqual(p.studio.thinking[id],old);
});
test('A08：批阅更正幂等且旧标签页409不能覆盖首答或最新历史',()=>{
 const p=freshProgress();finish(p);grade(p);const old=structuredClone(p.studio.thinking[id]);grade(p,'needs-remediation',base+5);
 assert.throws(()=>applyThinkingReview(p,{taskId:id,revision:old.revision,eventId:crypto.randomUUID(),verdict:'independent-mastered',comment:'旧页错误覆盖',reviewer:'旧页',causes:[]}),e=>e.status===409);
 assert.equal(p.studio.thinking[id].reviews.length,2);assert.equal(p.studio.thinking[id].firstAnswer,old.firstAnswer);
});
test('A07：11节各5道既有题，解释必须人工批阅；没有平行任务与奖励',()=>{
 assert.equal(withdrawnLessons.length,11);
 for(const lessonId of withdrawnLessons){const l=lessons.find(l=>l.lessonId===lessonId),p=freshProgress();const tasks=withdrawnTasks(l);assert.equal(tasks.length,5);assert.equal(new Set(tasks.map(t=>t.id)).size,5);assert(tasks.some(t=>t.kind==='explanation'));const s=createSession(p,{lessonId,setName:'core',assessment:'withdrawn-v1'},lessons,base);assert.deepEqual(s.taskIds,tasks.map(t=>t.id));assert.equal(lessonEvidence(p,lessonId,l.contentVersion).independent,false);validatePilot(p.studio);}
 const p=freshProgress(),lessonId='G3-U04-B01',s=createSession(p,{lessonId,setName:'core',assessment:'withdrawn-v1'},lessons,base),t=s.tasks.find(t=>t.kind==='explanation');
 selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:'这是一份十与四个一，再加相同一份。'},eventId:crypto.randomUUID()},base);
 selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,phase:'evidence',evidence:{checks:['条件','结构','检验'],reflection:'按位值对回两份。',finalConfirmed:true},eventId:crypto.randomUUID()},base+1);
 submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:'这是一份十与四个一，再加相同一份。'},eventId:crypto.randomUUID()},lessons,base+2);assert.equal(s.results[t.id].status,'pendingReview');
 const first=structuredClone(s.selfChecks[t.id].firstAnswer),coins=p.wallet.coins;
 const input={sessionId:s.id,revision:s.revision,taskId:t.id,eventId:crypto.randomUUID(),verdict:'correct',comment:'两份的位值解释完整。'};
 reviewFormalTask(p,input,base+3);reviewFormalTask(p,input,base+4);assert.equal(s.parentReviews[t.id].length,1);assert.deepEqual(s.selfChecks[t.id].firstAnswer,first);assert.equal(p.wallet.coins,coins);validatePilot(p.studio);
});
test('旧、当前及模拟未来导出：旧记录保留，未来格式拒绝，无自动清空',()=>{
 const p=freshProgress();finish(p);grade(p);delete p.studio.thinking[id].recordSchemaVersion;const before=structuredClone(p);assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),before);
 send(p,'reference',{},base+DAY);assert.equal(p.studio.thinking[id].recordSchemaVersion,2);assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
 const future=structuredClone(p);future.studio.thinking[id].recordSchemaVersion=99;assert.throws(()=>validateEnvelope(exportEnvelope(future),[]),/格式暂不支持/);assert.equal(p.studio.thinking[id].review.verdict,'independent-mastered');
});
test('A11：恢复码单次使用，旧PIN与会话失效；只备份家长凭据',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-parent-recovery-'));
 try{const marker=Buffer.from('simulated learning database unchanged');fs.writeFileSync(path.join(dir,'progress.sqlite'),marker);const access=createParentAccess(dir),req={headers:{},socket:{remoteAddress:'local'}};const cookie=access.unlock(req,'123456',true);const parent={...req,headers:{cookie:cookie.split(';')[0]}};const code=access.issueRecovery(parent);assert(!fs.readFileSync(path.join(dir,'parent-access.json'),'utf8').includes(code.replaceAll('-','')));assert.throws(()=>access.recover(req,'wrong','654321'),/恢复码/);const next=access.recover(req,code,'654321');assert.equal(access.status(parent).unlocked,false);assert.throws(()=>access.unlock(req,'123456'),/不正确/);assert.throws(()=>access.recover(req,code,'111111'),/恢复码/);assert.equal(access.status({...req,headers:{cookie:next.split(';')[0]}}).unlocked,true);assert.deepEqual(fs.readFileSync(path.join(dir,'progress.sqlite')),marker);assert(fs.readdirSync(dir).some(n=>n.includes('backup-')));assert.throws(()=>resetParentAccess(dir,false),/明确/);resetParentAccess(dir,true);assert.deepEqual(fs.readFileSync(path.join(dir,'progress.sqlite')),marker);assert.equal(access.status({...req,headers:{cookie:next.split(';')[0]}}).unlocked,false);}finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('17张卡专用双层提示与204组变式的约束、唯一性和公开图一致',()=>{
 const published=thinkingCards.filter(t=>t.publicationStatus==='guided-study');assert.equal(published.length,17);const all=new Set();
 for(const card of published){const hints=thinkingHints(card.id);assert.equal(hints.length,2);assert.notEqual(hints[0].text,hints[1].text);const questions=new Set();
 for(let i=1;i<=12;i++){const v=thinkingVariant(card.id,i),pub=publicVariant(v);assert(!all.has(v.id));all.add(v.id);assert(!questions.has(v.question),`${v.id} repeats a question`);questions.add(v.question);assert(v.answer&&!v.answer.includes('undefined')&&!v.answer.includes('NaN'));assert.equal(v.hints.length,2);assert(!('answer' in pub)&&!('hints' in pub));assert(v.figure.values.every(Number.isFinite));
 if(i<=8&&card.id==='G3-U02-TH1'){const [total,given,div]=v.figure.values;assert.equal((total-given)%div,0);assert(v.answer.startsWith(`(${total}−${given})÷${div}=${(total-given)/div}`));}
 if(i<=8&&card.id==='G3-UP01-TH1'){const [a,x,b,y]=v.figure.values;assert(a>b&&y>x&&(y-x)%10===0);assert.equal(v.answer,`${(y-x)/(a-b)}克。`);}
 if(i<=8&&card.id==='G3-U06-TH1'){const [a,b,p,q]=v.figure.values;assert.equal(a/p,b/q);assert(v.answer.includes(`${a/p}厘米`));}
 if(i<=8&&card.id==='G3-L07-TH1'){const [all,left,right,out]=v.figure.values,both=left+right-(all-out);assert(both>=0&&both<=Math.min(left,right));assert.equal((left-both)+both+(right-both)+out,all);assert(v.answer.startsWith(`都喜欢${both}`));}
 if(i<=8&&card.id==='G3-L02-TH1'){const [bag,rem,lo,hi]=v.figure.values;assert(rem>=0&&rem<bag&&lo>=0&&hi===lo+2);assert(v.answer.startsWith(Array.from({length:3},(_,k)=>(lo+k)*bag+rem).join('、')));}
 if(i<=8&&card.id==='G3-L01-TH1'&&i>4){const [folds,holes]=v.figure.values;assert.equal(v.answer,`${2**folds*holes}个孔。`);}
 }
 }
 assert.equal(all.size,204);
});
test('五题小测刷新恢复原会话；映射题不再重复领分，人工更正不改首答',()=>{
 const p=freshProgress(),lessonId='G3-U06-B03',l=lessons.find(l=>l.lessonId===lessonId),s=createSession(p,{lessonId,setName:'core',assessment:'withdrawn-v1'},lessons,base),t=s.tasks.find(t=>t.kind==='number');
 const solve=(s,t,at)=>{const answer={value:t.expected};selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:crypto.randomUUID()},at);selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,phase:'evidence',evidence:{checks:['条件','结构','检验'],reflection:'确认同一整体，分母不变。',finalConfirmed:true},eventId:crypto.randomUUID()},at+1);return submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:crypto.randomUUID()},lessons,at+2)};
 assert(solve(s,t,base).paid>0);const earned=p.wallet.earned;assert.equal(createSession(p,{lessonId,setName:'core',assessment:'withdrawn-v1'},lessons,base+3).id,s.id);
 const original=createSession(p,{lessonId,setName:t.level},lessons,base+4);assert.equal(solve(original,original.tasks.find(a=>a.id===t.id),base+4).paid,0);assert.equal(p.wallet.earned,earned);
 s.submittedAt=new Date(base+6).toISOString();assert.equal(createSession(p,{lessonId,setName:'core',assessment:'withdrawn-v1'},lessons,base+7).id,s.id);
});
test('68组反向/结构迁移：由已知条件独立还原答案，不向图提供未知目标',()=>{
 for(const card of thinkingCards.filter(c=>c.publicationStatus==='guided-study'))for(let i=9;i<=12;i++){
  const v=thinkingVariant(card.id,i),a=v.figure.values,k=i-8;
  switch(card.id.split('-')[1]){
   case 'U01':assert(v.answer.startsWith(k<3?'不符合':'正面相同'));assert.equal(a[0],k+2);break;
   case 'U02':assert(v.answer.startsWith(`${a[0]-a[1]*a[2]}本`));break;
   case 'U03':assert(v.answer.startsWith(`${(a[0]+a[1])/2}厘米`));break;
   case 'UP01':assert(v.answer.startsWith(`${(a[0]-a[2])*a[3]+a[1]}克`));break;
   case 'U04':assert(v.answer.startsWith(`${a[1]/10}袋`));break;
   case 'UP02':assert(v.answer.startsWith(`${k+3}架${k+7}本`));assert(!a.length);break;
   case 'U05':assert(v.answer.startsWith(a[0]===180?'一定':'不可能'));assert(a[1]>0&&a[1]<45);break;
   case 'U06':assert(v.answer.startsWith(k<3?`${a[0]/2*3}厘米`:'不能保证'));break;
   case 'U07':assert(v.answer.startsWith(`${[a[0]+a[2],a[0]+a[3],a[1]+a[2],a[1]+a[3]].sort((x,y)=>x-y)[2]}元`));break;
   case 'L01':assert.equal(v.answer,`${a[1]/2**a[0]}个孔。`);break;
   case 'L02':assert(v.answer.startsWith(`${(a[0]-a[2])/a[1]}颗`));assert(a[2]<(a[0]-a[2])/a[1]);break;
   case 'L03':assert(v.answer.startsWith(`宽减少${a[2]}厘米，变成${a[1]-a[2]}厘米`));assert(a[1]>a[2]);break;
   case 'L04':assert(v.answer.startsWith(`${a[1]*2/a[0]}厘米`));break;
   case 'L05':assert(v.answer.startsWith(`乙苹果${a[2]-a[3]}人，乙香蕉${a[1]-a[2]+a[3]}人`));assert(a[2]-a[3]<a[1]);break;
   case 'LP01':assert(v.answer.startsWith(`${28+a[0]}天`));assert(a[0]>=1&&a[0]<=3);break;
   case 'L06':assert(v.answer.startsWith(`${((a[0]-a[1])/10).toFixed(1)}元`));break;
   case 'L07':assert.equal(v.answer,`${a[0]+a[1]-a[2]+a[3]}人。`);assert(a[2]<=Math.min(a[0],a[1]));break;
   default:assert.fail(card.id);
  }
 }
 assert.throws(()=>thinkingVariant('G3-U02-TH2',9),/未审核/);
});
test('固定ea9984a的68组公开情境保持逐字段兼容，新增不改写旧作答题意',()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/thinking-variants-ea9984a.json',import.meta.url)));assert.equal(fixture.variants.length,68);
 for(const old of fixture.variants){const id=old.id.replace(/-R\d+$/,'');assert.deepEqual(publicVariant(thinkingVariant(id,old.index)),old);}
});
test('导出fixture：旧版与当前校验后逐字段保留，模拟未来版本明确拒绝',()=>{
 const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/learning-backups-round2.json',import.meta.url)));
 for(const f of fixtures){if(f.name==='future-rejected')assert.throws(()=>validateEnvelope(f.envelope,[]),/格式暂不支持/);else assert.deepEqual(validateEnvelope(f.envelope,[]),f.envelope.progress);}
});
