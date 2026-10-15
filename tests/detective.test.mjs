import test from 'node:test';
import assert from 'node:assert/strict';
import {seedCases,pendingCase} from '../content/detective/seed-cases.mjs';
import {validateCase,validateDetective,validId,matchesResponse,publicCase,orderedReasons} from '../shared/detective-model.mjs';
import {ensureDetective,manageDetective,detectiveToday,detectiveAttempt,gradeDetective,parentDetective} from '../server/detective-store.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
const NOW=Date.parse('2026-10-15T02:00:00Z');let serial=0;const id=()=>`test-${++serial}`;
const setup=()=>{const p=freshProgress();manageDetective(p,{action:'enable-seeds',eventId:id(),checks:[true,true,true]},NOW);return p;};
function begin(p,caseId){const d=ensureDetective(p),c=d.cases[caseId],ref={caseId,version:c.activeVersion};d.plans['2026-10-15']=[ref,...Object.values(d.cases).filter(c=>c.status==='published'&&c.id!==caseId&&c.draft.verdict===(d.cases[caseId].draft.verdict==='correct'?'wrong':'correct')).slice(0,1).map(c=>({caseId:c.id,version:c.activeVersion}))];
 // The temporary fixed plan always contains two wrong cases and one correct case.
 const w=Object.values(d.cases).find(c=>c.status==='published'&&c.draft.verdict==='wrong'&&!d.plans['2026-10-15'].some(r=>r.caseId===c.id));d.plans['2026-10-15'].push({caseId:w.id,version:w.activeVersion});
 return detectiveAttempt(p,{action:'start',attemptId:id(),eventId:id(),caseId,version:c.activeVersion},NOW);
}
function send(p,a,action,extra={}){return detectiveAttempt(p,{action,eventId:id(),attemptId:a.attempt.id,expectedRevision:a.attempt.revision,...extra},NOW);}
function finish(p,r){const d=p.studio.detective,v=d.cases[r.case.id].versions.find(v=>v.id===r.case.version),c=v.content;r=send(p,r,'judge',{value:c.verdict});r=send(p,r,'evidence',{step:c.errorStep,reason:orderedReasons(v).findIndex(x=>x.index===c.reason)});r=send(p,r,'repair',{value:c.repair.kind==='oral'?'oral':c.repair.answer});return send(p,r,'verify',{value:c.verify.kind==='oral'?'oral':c.verify.answer});}
test('14宗完整模拟案：10错4对；铁丝缺题留草稿，未审核不可发布',()=>{
 assert(!validId('toString'));assert(!validId('__proto__'));assert(!validId('constructor'));assert.equal(seedCases.length,14);assert.equal(seedCases.filter(s=>s.content.verdict==='correct').length,4);for(const s of seedCases)validateCase(s.content,true);validateCase(pendingCase.content);assert.throws(()=>validateCase(pendingCase.content,true));
 const p=freshProgress();assert.equal(detectiveToday(p,NOW).cases.length,0);assert.equal(p.studio.detective,undefined);parentDetective(p);assert.equal(detectiveToday(p,NOW).cases.length,0);
 assert.throws(()=>manageDetective(p,{action:'enable-seeds',eventId:id(),checks:[true,false,true]},NOW));
});
test('首批数学oracle：长度顺序、30张、千米、混合运算、位值；香蕉没有唯一厘米值',()=>{
 const c=n=>seedCases.find(s=>s.id===`DET-G3-${String(n).padStart(3,'0')}`).content;
 const mm=[{label:'73毫米',v:73},{label:'3米8分米',v:3*1000+8*100},{label:'54分米',v:54*100},{label:'9千米200米',v:9*1e6+200*1000}];
 assert.equal(c(2).repair.answer,mm.sort((a,b)=>b.v-a.v).map(x=>x.label).join('|'));
 assert.equal(Number(c(3).repair.answer),(2*10/2)*3);assert.equal(c(3).errorStep,2);assert.equal(c(3).steps[1],'20÷2=10（组）');
 for(const [n,answer]of [[4,1000],[5,9/3-2],[6,9*9+5],[7,7*8+18],[8,500+600],[9,1100-300],[10,3*3],[11,1000],[12,(12+8)/4],[14,30]])assert.equal(Number(c(n).repair.answer),answer);
 assert.equal(c(1).repair.kind,'choice');assert.equal(c(1).repair.answer,'十几厘米左右');assert(!/20厘米|只能/.test(c(1).repair.answer));
 assert(matchesResponse(c(5).repair,'2/2'));assert(!matchesResponse(c(5).repair,'1+0'));assert(!matchesResponse(c(5).repair,'__proto__'));assert(!matchesResponse(c(5).repair,'1/0'));
});
test('每天2错1对、跨类别、顺序可复现且正确案位置变化，不重复生成计划',()=>{
 const p=setup(),positions=new Set();for(let i=0;i<15;i++){const now=NOW+i*86400000,t=detectiveToday(p,now);assert.equal(t.cases.length,3);const cases=t.cases.map(x=>p.studio.detective.cases[x.case.id].draft);assert.equal(cases.filter(c=>c.verdict==='wrong').length,2);assert(new Set(cases.map(c=>c.family)).size>=2);positions.add(cases.findIndex(c=>c.verdict==='correct'));assert.deepEqual(detectiveToday(p,now),t);}assert(positions.size>1);validateDetective(p.studio.detective);
});
test('全部14案真实走完四步，正确案不选不存在的错行；与原进度和钱包隔离',()=>{
 const p=setup(),before={wallet:structuredClone(p.wallet),pets:structuredClone(p.pets),sessions:structuredClone(p.studio.sessions),review:structuredClone(p.studio.review)};
 for(const c of seedCases){const r=finish(p,begin(p,c.id));assert.equal(r.attempt.status,'closed-independent');assert(r.case.solution);assert.equal(r.attempt.firstVerdict,c.content.verdict);validateDetective(p.studio.detective);}
 assert.equal(p.studio.detective.badges.length,3);assert.deepEqual(p.wallet,before.wallet);assert.deepEqual(p.pets,before.pets);assert.deepEqual(p.studio.sessions,before.sessions);assert.deepEqual(p.studio.review,before.review);
});
test('误报、漏报分别反馈，首判冻结，订正不冒充独立；提示均留痕',()=>{
 for(const name of ['DET-G3-003','DET-G3-011']){
 const p=setup();let r=begin(p,name),c=p.studio.detective.cases[name].draft;const first=c.verdict==='wrong'?'correct':'wrong';r=send(p,r,'judge',{value:first});assert.match(r.attempt.feedback,c.verdict==='wrong'?/漏掉/:/误报/);r=finish(p,r);assert.equal(r.attempt.firstVerdict,first);assert.equal(r.attempt.status,'closed-assisted');}
 const p=setup();let r=begin(p,'DET-G3-003');r=send(p,r,'hint');r=finish(p,r);assert.equal(r.attempt.hintsViewed,1);assert.equal(r.attempt.status,'closed-assisted');
});
test('卡厚案必须定位第三行；不能只凭30这个最终答案跳过证据',()=>{
 const p=setup();let r=begin(p,'DET-G3-003');assert.throws(()=>send(p,r,'repair',{value:'30'}),/当前/);r=send(p,r,'judge',{value:'wrong'});const v=p.studio.detective.cases['DET-G3-003'].versions[0],reason=orderedReasons(v).findIndex(x=>x.index===0);
 r=send(p,r,'evidence',{step:1,reason});assert.equal(r.attempt.phase,'evidence');assert(r.attempt.assisted);r=send(p,r,'evidence',{step:2,reason});assert.equal(r.attempt.phase,'repair');r=send(p,r,'repair',{value:'10'});assert.equal(r.attempt.phase,'repair');r=send(p,r,'repair',{value:'30'});assert.equal(r.attempt.phase,'verify');
});
test('服务端分阶段白名单投影：题面、证据、输入规格没有私有答案或来源',()=>{
 const p=setup();for(const c of Object.values(p.studio.detective.cases).filter(c=>c.status==='published')){const v=c.versions[0];const pub=publicCase(v);assert.deepEqual(Object.keys(pub).sort(),['id','version','title','prompt','steps','visual'].sort());for(const phase of ['evidence','repair','verify']){const s=JSON.stringify(publicCase(v,{phase}));for(const key of ['"answer":','firstWrongStep','sourceNotes','"reason":','"verdict":','"hints":','"solution":'])assert(!s.includes(key),key);}}
});
test('回执重复100次只保留一次勋章，旧页409不覆盖首判和新版本',()=>{
 const p=setup();let r=begin(p,'DET-G3-003');r=send(p,r,'judge',{value:'wrong'});const stale={action:'judge',eventId:id(),attemptId:r.attempt.id,expectedRevision:1,value:'correct'};assert.throws(()=>detectiveAttempt(p,stale,NOW),e=>e.status===409);
 const v=p.studio.detective.cases['DET-G3-003'].versions[0];r=send(p,r,'evidence',{step:2,reason:orderedReasons(v).findIndex(x=>x.index===0)});r=send(p,r,'repair',{value:'30'});
 const b={action:'verify',eventId:id(),attemptId:r.attempt.id,expectedRevision:r.attempt.revision,value:'20'};r=detectiveAttempt(p,b,NOW);for(let i=0;i<100;i++)assert.deepEqual(detectiveAttempt(p,b,NOW),r);assert.equal(p.studio.detective.badges.length,1);assert.throws(()=>detectiveAttempt(p,{...b,value:'40'},NOW),e=>e.status===409);
});
test('发布新版本和撤回归档不改旧题及旧解；家长编辑也有幂等和409保护',()=>{
 const p=setup();let r=finish(p,begin(p,'DET-G3-003'));const old=structuredClone(r),d=p.studio.detective,c=d.cases['DET-G3-003'],content=structuredClone(c.draft);content.title='新的说明标题';
 const save={action:'save',eventId:id(),caseId:c.id,expectedRevision:c.revision,content};manageDetective(p,save,NOW);manageDetective(p,save,NOW);assert.throws(()=>manageDetective(p,{...save,eventId:id()},NOW),e=>e.status===409);
 manageDetective(p,{action:'publish',eventId:id(),caseId:c.id,expectedRevision:c.revision,checks:[true,true,true]},NOW);assert.equal(c.versions.length,2);assert.equal(c.versions[0].content.title,old.case.title);
 manageDetective(p,{action:'withdraw',eventId:id(),caseId:c.id,expectedRevision:c.revision},NOW);manageDetective(p,{action:'archive',eventId:id(),caseId:c.id,expectedRevision:c.revision},NOW);assert.deepEqual(detectiveToday(p,NOW).history.find(x=>x.attempt.id===r.attempt.id).case,old.case);
});
test('手工开放解释必须家长核对，批阅更正保留历史、首判、版本，不能靠勾选发勋章',()=>{
 const p=setup(),content=structuredClone(seedCases[2].content);content.repair={kind:'oral',question:'把你的理由说给家长听。',unit:'',options:[],answer:''};content.verify={kind:'oral',question:'换一种办法核对，说给家长听。',unit:'',options:[],answer:''};content.prompt='Kevin的题目；原始联系方式：13912345678';content.sourceNotes='PRIVATE: Kevin原作业';
 manageDetective(p,{action:'create',eventId:id(),caseId:'DET-MANUAL-1',content},NOW);const c=p.studio.detective.cases['DET-MANUAL-1'];manageDetective(p,{action:'publish',eventId:id(),caseId:c.id,expectedRevision:c.revision,checks:[true,true,true]},NOW);let r=finish(p,begin(p,c.id));assert.equal(r.attempt.status,'parent-review');assert(!r.case.solution);assert.equal(p.studio.detective.badges.length,0);assert(!r.case.prompt.includes('Kevin'));assert(!r.case.prompt.includes('13912345678'));assert(c.draft.sourceNotes.includes('PRIVATE'));
 const b={eventId:id(),attemptId:r.attempt.id,expectedRevision:r.attempt.revision,verdict:'accepted',comment:'亲自听过解释，条件与验证成立。'};gradeDetective(p,b,NOW);gradeDetective(p,b,NOW);let a=p.studio.detective.attempts[r.attempt.id];assert.equal(a.reviews.length,1);assert.equal(p.studio.detective.badges.length,1);assert.throws(()=>gradeDetective(p,{...b,eventId:id()},NOW),e=>e.status===409);
 gradeDetective(p,{...b,eventId:id(),expectedRevision:a.revision,verdict:'revisit',comment:'再核对组数。'},NOW);assert.equal(a.reviews.length,2);assert.equal(a.firstVerdict,'wrong');assert.equal(p.studio.detective.badges.length,0);assert.equal(a.status,'needs-revisit');assert.notEqual(a.phase,'closed');assert(a.reviews[1].snapshot.completedAt);
 let retry={attempt:{id:a.id,revision:a.revision}};retry=send(p,retry,'remediate');assert.equal(retry.attempt.phase,'evidence');assert.equal(retry.attempt.firstVerdict,'wrong');assert(retry.attempt.assisted);assert(a.events.some(e=>e.action==='repair'&&e.value==='oral'));
});
test('新旧备份兼容、哈希和版本引用受校验；字段污染、超限拒绝',()=>{
 const old=freshProgress();assert.equal(validateEnvelope(exportEnvelope(old),[]).studio.detective,undefined);const legacy=freshProgress();delete legacy.studio;const imported=validateEnvelope(exportEnvelope(legacy),[]);assert.equal(detectiveToday(imported,NOW).cases.length,0);assert.equal(parentDetective(imported).cases.length,15);
 const p=setup();finish(p,begin(p,'DET-G3-003'));assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
 let broken=structuredClone(p);broken.studio.detective.cases['DET-G3-003'].versions[0].content.repair.answer='10';assert.throws(()=>validateEnvelope(exportEnvelope(broken),[]));
 broken=structuredClone(p);Object.values(broken.studio.detective.attempts)[0].version='missing';assert.throws(()=>validateEnvelope(exportEnvelope(broken),[]));
 broken=structuredClone(p);broken.studio.detective.schemaVersion=99;assert.throws(()=>validateEnvelope(exportEnvelope(broken),[]),/版本/);
 const c=structuredClone(seedCases[0].content);c.hiddenAnswer='bad';assert.throws(()=>validateCase(c,true));c.prompt='x'.repeat(4000);assert.throws(()=>validateCase(c,true));
});

test('案卷增长至200宗仍能生成小型儿童投影；超量和3MiB字节预算明确拒绝',t=>{
 const p=setup(),d=p.studio.detective,template=structuredClone(d.cases['DET-G3-003']);template.status='draft';template.versions=[];template.activeVersion=null;
 for(let i=15;i<200;i++){const caseId=`DET-GROW-${i}`;d.cases[caseId]={...structuredClone(template),id:caseId};}
 const started=performance.now();validateDetective(d);const bytes=Buffer.byteLength(JSON.stringify(detectiveToday(p,NOW)));assert(bytes<50000);assert.equal(Object.keys(d.cases).length,200);assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);t.diagnostic(`200宗临时案卷；儿童初始投影${bytes}字节；本机校验与投影${Math.round(performance.now()-started)}ms，仅作环境记录。`);
 d.cases['DET-OVER']={...structuredClone(template),id:'DET-OVER'};assert.throws(()=>validateDetective(d));delete d.cases['DET-OVER'];
 for(const c of Object.values(d.cases)){c.draft.prompt='条'.repeat(2000);c.draft.sourceNotes='备'.repeat(2000);c.draft.steps=Array(10).fill('步'.repeat(500));}
 assert.throws(()=>validateDetective(d),/3MB/);
});
