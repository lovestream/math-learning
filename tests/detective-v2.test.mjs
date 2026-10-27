import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {freshProgress,createStore,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {SELF_FAMILIES,selfQuestion,publicSelfQuestion,familyExamples} from '../server/detective-self-questions.mjs';
import {applySelfTraining,selfTrainingData,manageSelfTraining,selfLocalDay} from '../server/detective-self-store.mjs';
import {enableProcessCases,detectiveAttempt} from '../server/detective-store.mjs';
import {orderedReasons,validateDetective,fingerprint} from '../shared/detective-model.mjs';
import {deriveImportedCase,verifyImportedCaseMath,ORACLE_VERSION} from '../shared/detective-inbox.mjs';
import {importVerifiedBundle} from '../server/detective-inbox-store.mjs';
import {auditDeliveredBundle,auditDeliveredCase} from '../scripts/lib/detective-delivery-audit.mjs';
import {parseLinear,formatFraction,parseNumber} from '../shared/pilot-math.mjs';
const now=Date.parse('2026-10-27T04:00:00Z'),DAY=86400000,copy=x=>structuredClone(x);
function run(p,{f='MASS_AVERAGE',mode='practice',at=now,first='wrong',final='right',help=false,status='answered',check='right',complete='complete'}={}){
 let a=applySelfTraining(p,{action:'start',mode,errorFamilyId:f,attemptId:'self-'+crypto.randomUUID(),eventId:crypto.randomUUID()},at);
 const q=selfQuestion(f,Number(a.question.id.split(':').at(-1))),send=(action,extra={})=>a=applySelfTraining(p,{action,attemptId:a.id,eventId:crypto.randomUUID(),expectedRevision:a.revision,...extra},at);
 send('first',{value:status==='blank'?'':first==='right'?q.answer:'99999',status,reasoning:'匿名测试思路，不代表真实学习。'});const sealed=copy(p.studio.detective.selfTraining.attempts[a.id].firstAnswer);
 if(help)send('hint');
 send('final',{value:final==='right'?q.answer:'88888',checkValue:check==='right'?q.checkTarget:'9999',checkExpression:q.checkPattern.replaceAll('□',q.answer),checkStatus:complete,explanation:'测试：反向代回原条件。'});
 assert.deepEqual(p.studio.detective.selfTraining.attempts[a.id].firstAnswer,sealed);return {a,q};
}
test('V2 数学：8族×256个参数精确成立；正向/逆向都可代回，公开题不携带答案',()=>{
 const constant=s=>formatFraction(parseLinear(s).constant);let count=0;
 for(const f of SELF_FAMILIES)for(let i=0;i<256;i++){
  const q=selfQuestion(f.id,i),p=q.parameters;let expected;
  if(f.id==='MASS_AVERAGE')expected=constant(q.template==='batch-average-mass-v1'?`${p.totalGrams}/${p.count}`:p.ask==='total'?`${p.count}*${p.averageGrams}`:`${p.totalGrams}/${p.averageGrams}`);
  else if(f.id==='INITIAL_CHANGE')expected=constant(q.template==='spring-total-length-v1'?`${p.originalCm}*10+${p.mmPerKg}*${p.loadKg}`:p.ask==='load'?`(${p.finalMm}-${p.originalCm}*10)/${p.mmPerKg}`:`${p.finalMm}-${p.loadKg}*${p.mmPerKg}`);
  else if(f.id==='UNIT_GROUPING')expected=constant(i%2?`${p.targetMm}/${p.groupThicknessMm}*${p.groupThicknessMm}`:`${p.targetMm}/${p.groupThicknessMm}*${p.cardsPerGroup}`);
  else if(f.id==='OPERATION_ORDER')expected=constant(i%2?String(p.a):`${p.a}+${p.b}*${p.c}`);
  else if(f.id==='UNIT_CONVERSION')expected=constant(i%2?String(p.value):`${p.value}*100`);
  else if(f.id==='EQUAL_GROUPS')expected=constant(i%2?String(p.groups):`${p.groups}*${p.each}`);
  else if(f.id==='UNIT_ORDERING')expected=constant(i%2?String(p.items[1].value):`${p.items[0].value}*100-${p.items[1].value}`);
  else expected=constant(i%2?String(p.shortageDm):`${p.lowTurns}*((${p.surplusDm}+${p.shortageDm})/(${p.highTurns}-${p.lowTurns}))+${p.surplusDm}`);
  assert.equal(q.answer,expected,`${f.id}:${i}`);assert.equal(q.checkValue(q.answer),q.checkTarget);assert(!Object.hasOwn(publicSelfQuestion(q),'answer'));assert(!Object.hasOwn(publicSelfQuestion(q),'check'));assert(!publicSelfQuestion(q,'check','review').check);count++;
 }
 assert.equal(count,2048);assert.equal(publicSelfQuestion(selfQuestion('MASS_AVERAGE',0),'check').check.target,'12.5');assert.equal(publicSelfQuestion(selfQuestion('MASS_AVERAGE',0),'check').check.unit,'克');for(const f of SELF_FAMILIES){const examples=familyExamples(f.id);assert.equal(examples.length,2);assert.equal(examples[0].content.verdict,'wrong');assert.equal(examples[1].content.verdict,'correct');}
});
test('V2 四包12案：原始固定Git blob、全字段审校、独立oracle及四步结案',()=>{
 const p=freshProgress(),before=copy(p.wallet);let count=0;
 for(const file of fs.readdirSync('content/detective/reviewed').filter(f=>f.startsWith('DT-20261026'))){
  const bytes=fs.readFileSync('content/detective/reviewed/'+file),b=JSON.parse(bytes),sha=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  // Local reviewed files are exact copies of the anonymous source, never rewritten.
  assert.equal(JSON.parse(fs.readFileSync('content/detective/reviewed/v2-source-manifest.json')).files[file],sha);
  assert(auditDeliveredBundle(b).passed);assert.equal(importVerifiedBundle(p,b,{branch:'detective-inbox',path:'content/detective/inbox/'+file,sha},now).status,'auto-published');
  for(const e of b.cases){let pair=detectiveAttempt(p,{action:'start',attemptId:e.id,eventId:crypto.randomUUID(),caseId:e.id,version:p.studio.detective.cases[e.id].activeVersion},now);const v=p.studio.detective.cases[e.id].versions[0];
   const send=(action,extra)=>pair=detectiveAttempt(p,{action,attemptId:e.id,eventId:crypto.randomUUID(),expectedRevision:pair.attempt.revision,...extra},now);
   send('judge',{value:e.content.verdict});send('evidence',{step:e.content.errorStep,reason:orderedReasons(v).findIndex(x=>x.index===e.content.reason)});send('repair',{value:e.content.repair.answer});send('verify',{value:e.content.verify.answer});assert.equal(pair.attempt.phase,'closed');count++;
   for(const key of ['title','prompt','steps','repair','verify','solution','visual','errorStep']){const c=copy(e.content);if(typeof c[key]==='string')c[key]+='篡改';else if(key==='errorStep')c[key]=9;else if(Array.isArray(c[key]))c[key]=['篡改'];else c[key]={...c[key],answer:'999'};assert.equal(verifyImportedCaseMath(c,e.verification).status,'rejected',key);}
  }
 }
 assert.equal(count,12);assert.deepEqual(p.wallet,before);assert.equal(p.studio.detective.badges.length,3);
});
test('V2 新模板泛化：非整数定点、零载重、逆向边界和恶意参数均验证',()=>{
 const examples=[['batch-average-mass-v1',{mode:'wrong',item:'豆子',count:3,totalGrams:0.3,wrongDivisor:2}],['mass-average-inverse-v1',{mode:'correct',ask:'count',item:'花生米',totalGrams:0.3,averageGrams:0.1}],['mass-average-inverse-v1',{mode:'wrong',ask:'total',item:'玻璃珠',count:15,averageGrams:0.2}],['spring-total-length-v1',{mode:'correct',originalCm:6,mmPerKg:5,loadKg:0}],['spring-reverse-v1',{mode:'correct',ask:'load',originalCm:6,mmPerKg:5,finalMm:60}],['spring-reverse-v1',{mode:'wrong',ask:'initial',loadKg:4,mmPerKg:5,finalMm:20}]];
 for(const [template,parameters]of examples){const content=deriveImportedCase(template,parameters);assert(auditDeliveredCase({id:'synthetic',content,verification:{template,parameters}}).passed);for(const bad of [{...parameters,extra:1},{...parameters,mode:'whatever'}])assert.throws(()=>deriveImportedCase(template,bad));}
 for(const [t,p]of [['mass-average-inverse-v1',{mode:'correct',ask:'count',item:'豆子',totalGrams:1,averageGrams:0.3}],['spring-reverse-v1',{mode:'correct',ask:'load',originalCm:6,mmPerKg:5,finalMm:62}],['spring-reverse-v1',{mode:'correct',ask:'initial',loadKg:5,mmPerKg:5,finalMm:20}],['batch-average-mass-v1',{mode:'wrong',item:'豆子',count:10,totalGrams:6,wrongDivisor:10}]])assert.throws(()=>deriveImportedCase(t,p));
});
test('V2 L1/L2：结果对但推理错、未知中间过程、正确无需改，三态首判与首证据冻结',()=>{
 const p=freshProgress();const d=enableProcessCases(p,now);assert.equal(d.newCases.length,3);
 for(const entry of d.newCases){const v=p.studio.detective.cases[entry.case.id].versions[0],c=v.content;let pair=detectiveAttempt(p,{action:'start',caseId:entry.case.id,version:v.id,attemptId:entry.case.id,eventId:crypto.randomUUID()},now);const send=(action,extra)=>pair=detectiveAttempt(p,{action,attemptId:entry.case.id,expectedRevision:pair.attempt.revision,eventId:crypto.randomUUID(),...extra},now);
 send('judge',{value:c.verdict});send('evidence',{step:c.errorStep,reason:orderedReasons(v).findIndex(x=>x.index===c.reason),category:c.diagnosticCategory});send('repair',{value:c.repair.answer});send('verify',{value:c.verify.answer});assert.equal(pair.attempt.phase,'closed');assert.equal(pair.attempt.firstVerdict,c.verdict);assert(p.studio.detective.attempts[entry.case.id].firstEvidence.correct);
 }validateDetective(p.studio.detective);assert.equal(selfTrainingData(p,now).stats.diagnosis.denominator,3);
});
test('V2 L4：无反馈首答→自查；各类自主纠错和辅助不能混淆',()=>{
 const p=freshProgress();const snapshots=copy({wallet:p.wallet,pets:p.pets,lessons:p.lessons});
 assert.equal(run(p).a.result.category,'self-corrected');assert.equal(run(p,{first:'right'}).a.result.category,'first-correct');assert.equal(run(p,{first:'right',final:'wrong'}).a.result.category,'changed-wrong');assert.equal(run(p,{final:'wrong'}).a.result.category,'not-corrected');assert.equal(run(p,{help:true}).a.result.category,'assisted');assert.equal(run(p,{status:'blank'}).a.result.category,'first-unscored');assert(!run(p,{complete:'uncertain'}).a.result.independent);
 assert.deepEqual({wallet:p.wallet,pets:p.pets,lessons:p.lessons},snapshots);assert.equal(p.studio.detective.badges.length,0);const stats=selfTrainingData(p,now).stats;assert.deepEqual(stats.effectiveCorrection,{numerator:1,denominator:4,rate:0.25});assert.equal(stats.changedWrong.numerator,1);
});
test('V2 首答不可变、反馈门控、幂等重放与旧页409原子拒绝',()=>{
 const p=freshProgress();let a=applySelfTraining(p,{action:'start',mode:'practice',errorFamilyId:'INITIAL_CHANGE',attemptId:'a',eventId:'s'},now);
 assert(!('result'in a)&&!('answer'in a)&&!('check'in a.question));
 const initial=copy(p);assert.throws(()=>applySelfTraining(p,{action:'first',attemptId:'a',eventId:'not-blank',expectedRevision:a.revision,status:'blank',value:'20',reasoning:''},now));assert.deepEqual(p,initial);
 const first={action:'first',attemptId:'a',expectedRevision:a.revision,eventId:'f',value:'20',status:'answered',reasoning:''};a=applySelfTraining(p,first,now);assert(!('answer'in a)&&!('result'in a));const frozen=copy(p);
 assert.deepEqual(applySelfTraining(p,first,now),a);assert.throws(()=>applySelfTraining(p,{...first,eventId:'stale',value:'80'},now),{status:409});assert.deepEqual(p,frozen);
 assert.throws(()=>applySelfTraining(p,{action:'first',attemptId:'a',expectedRevision:a.revision,eventId:'again',value:'80',status:'answered',reasoning:''},now),{status:409});assert.deepEqual(p,frozen);
 assert.throws(()=>applySelfTraining(p,{action:'final',attemptId:'a',expectedRevision:a.revision,eventId:'final',value:'80',checkValue:'',checkStatus:'complete',explanation:''},now));assert.deepEqual(p,frozen);
 const raw=JSON.stringify(selfTrainingData(p,now).attempts);assert(!raw.includes('checkValid')&&!raw.includes('firstCorrect')&&!raw.includes('总长包含')&&!raw.includes('"answer":'));
});
test('V2 到期1/3/7/14：新参数、未知量变化、无预填反查、当天不重复推进',()=>{
 const p=freshProgress();run(p,{first:'right'});run(p,{first:'right',mode:'transfer'});
 let at=now;
 for(const day of [1,3,7,14]){at=now+day*DAY;const r=run(p,{first:'right',mode:'review',at});assert(r.a.result.independent);assert(!r.a.question.check);const snapshot=copy(p);assert.throws(()=>run(p,{first:'right',mode:'review',at}));assert.deepEqual(p,snapshot);}
 const d=selfTrainingData(p,at);assert.equal(d.families[0].schedule.stage,4);assert.equal(d.families[0].schedule.dueDay,null);assert.match(d.families[0].evidence,/有迁移证据/);assert(d.stats.delayed.every(x=>x.numerator===1&&x.denominator===1));
 const before=copy(p.studio.detective.selfTraining);assert.throws(()=>applySelfTraining(p,{action:'hint',attemptId:Object.keys(before.attempts).at(-1),expectedRevision:Object.values(before.attempts).at(-1).revision,eventId:'late'},at));assert.deepEqual(p.studio.detective.selfTraining,before);
});
test('V2 多次失败不循环熟题；辅助复测不推进；暂停、顺延、跨午夜和时间异常',()=>{
 const p=freshProgress();run(p,{first:'right'});for(let n=1;n<=7;n++)run(p,{mode:'review',at:now+n*DAY,final:'wrong'});
 const s=p.studio.detective.selfTraining;assert.equal(new Set(Object.values(s.attempts).map(a=>a.questionVariantId)).size,8);assert.equal(s.schedules.MASS_AVERAGE.stage,0);
 let r=s.schedules.MASS_AVERAGE;manageSelfTraining(p,{action:'schedule',errorFamilyId:'MASS_AVERAGE',expectedRevision:r.revision,eventId:'pause',paused:true,dueDay:'2026-11-05'},now+7*DAY);assert.throws(()=>run(p,{mode:'review',at:now+9*DAY}));
 r=p.studio.detective.selfTraining.schedules.MASS_AVERAGE;manageSelfTraining(p,{action:'schedule',errorFamilyId:'MASS_AVERAGE',expectedRevision:r.revision,eventId:'resume',paused:false,dueDay:'2026-11-05'},now+7*DAY);
 assert.equal(selfLocalDay(Date.parse('2026-10-27T15:59:59Z')),'2026-10-27');assert.equal(selfLocalDay(Date.parse('2026-10-27T16:00:00Z')),'2026-10-28');
 const snapshot=copy(p);assert.throws(()=>run(p,{at:now}));assert.deepEqual(p,snapshot);assert.throws(()=>run(p,{at:now+400*DAY}));assert.deepEqual(p,snapshot);
});
test('V2 旧needs-review重验至v3且原case版本与历史不改写',()=>{
 const p=freshProgress(),b=JSON.parse(fs.readFileSync('content/detective/reviewed/DT-20261026-SPR-FORWARD-A.json')),source={branch:'detective-inbox',path:'content/detective/inbox/'+b.bundleId+'.json',sha:'a'.repeat(40)};
 // Equivalent old-v2 state: all unknown-template proposals were waiting for review.
 importVerifiedBundle(p,b,source,now);const d=p.studio.detective;for(const c of Object.values(d.cases).filter(c=>c.importSource)){c.versions=[];c.activeVersion=null;c.status='review';c.importSource.mathOracleVersion='detective-oracle.v2';c.pendingImport=copy(c.importSource);}
 const file=d.inbox.files[source.path];file.status='needs-review';file.mathOracleVersion='detective-oracle.v2';validateDetective(d);assert.equal(importVerifiedBundle(p,b,source,now).status,'auto-published');assert.equal(p.studio.detective.inbox.files[source.path].mathOracleVersion,ORACLE_VERSION);
});
test('V2 备份、旧版缺命名空间、未来版拒绝、篡改首答和伪造正确状态均拒绝',()=>{
 const p=freshProgress();validateEnvelope(exportEnvelope(p),[]);run(p,{first:'right'});const envelope=exportEnvelope(p);assert.deepEqual(validateEnvelope(envelope,[]),p);
 for(const mutate of [s=>s.schemaVersion=2,s=>Object.values(s.attempts)[0].firstAnswer.value='999',s=>Object.values(s.attempts)[0].result.independent=false,s=>Object.values(s.attempts)[0].result.firstCorrect=false,s=>Object.values(s.attempts)[0].selfCheckActions.value='999']){const bad=copy(p);mutate(bad.studio.detective.selfTraining);assert.throws(()=>validateEnvelope(exportEnvelope(bad),[]));}
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-v2-storage-'));try{const store=createStore(dir,[]);store.import(envelope);const before=store.export();assert.throws(()=>store.mutate(q=>{q.studio.detective.selfTraining.schemaVersion=99;throw Error('模拟磁盘事务失败')}));assert.deepEqual(store.export().progress,before.progress);store.close();const reopened=createStore(dir,[]);assert.deepEqual(reopened.get(),p);reopened.import(exportEnvelope(freshProgress()));assert(!reopened.get().studio.detective);reopened.close();}finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('V2 家长批阅和更正只追加；冲突不覆盖孩子首答、反馈和既成历史',()=>{
 const p=freshProgress(),{a}=run(p,{first:'right'}),base=copy(p.studio.detective.selfTraining.attempts[a.id]);
 manageSelfTraining(p,{action:'review',attemptId:a.id,expectedRevision:a.revision,eventId:'r1',verdict:'explanation-confirmed',comment:'模拟：关系成立'},now);
 const before=copy(p);assert.throws(()=>manageSelfTraining(p,{action:'review',attemptId:a.id,expectedRevision:a.revision,eventId:'stale',verdict:'needs-practice',comment:'旧页'},now),{status:409});assert.deepEqual(p,before);
 const current=p.studio.detective.selfTraining.attempts[a.id];manageSelfTraining(p,{action:'review',attemptId:a.id,expectedRevision:current.revision,eventId:'r2',verdict:'needs-practice',comment:'模拟更正'},now);
 const changed=p.studio.detective.selfTraining.attempts[a.id];assert.equal(changed.parentReviews.length,2);assert.deepEqual(changed.firstAnswer,base.firstAnswer);assert.deepEqual(changed.result,base.result);assert.equal(changed.feedbackReleasedAt,base.feedbackReleasedAt);
});
test('V2 延迟复测不透露反查公式，抄一个已知数字不能冒充检验',()=>{
 const p=freshProgress();run(p,{first:'right'});let a=applySelfTraining(p,{action:'start',mode:'review',errorFamilyId:'MASS_AVERAGE',attemptId:'r',eventId:'rs'},now+DAY);const q=selfQuestion('MASS_AVERAGE',Number(a.question.id.split(':').at(-1)));
 a=applySelfTraining(p,{action:'first',attemptId:a.id,eventId:'rf',expectedRevision:a.revision,value:q.answer,status:'answered',reasoning:''},now+DAY);assert(!a.question.check);
 a=applySelfTraining(p,{action:'final',attemptId:a.id,eventId:'rfinal',expectedRevision:a.revision,value:q.answer,checkValue:q.checkTarget,checkExpression:q.checkTarget,checkStatus:'complete',explanation:'只抄了数值'},now+DAY);assert(!a.result.checkValid);assert(!a.result.independent);assert.equal(p.studio.detective.selfTraining.schedules.MASS_AVERAGE.stage,0);
});
test('V2 家长管理幂等、复评不能改写既成反馈；调整日期边界严格',()=>{
 const p=freshProgress(),{a}=run(p,{first:'right'}),s=p.studio.detective.selfTraining.schedules.MASS_AVERAGE;
 const schedule={action:'schedule',errorFamilyId:'MASS_AVERAGE',expectedRevision:s.revision,eventId:'schedule',paused:true,dueDay:'2026-11-01'};manageSelfTraining(p,schedule,now);const saved=copy(p);manageSelfTraining(p,schedule,now);assert.deepEqual(p,saved);
 const review={action:'review',attemptId:a.id,expectedRevision:a.revision,eventId:'review',verdict:'explanation-confirmed',comment:'模拟核对'};manageSelfTraining(p,review,now);const reviewed=copy(p);manageSelfTraining(p,review,now);assert.deepEqual(p,reviewed);
 for(const dueDay of ['2026-02-30','2026-10-26','2027-12-31']){const snapshot=copy(p);assert.throws(()=>manageSelfTraining(p,{...schedule,eventId:crypto.randomUUID(),expectedRevision:p.studio.detective.selfTraining.schedules.MASS_AVERAGE.revision,dueDay},now));assert.deepEqual(p,snapshot);}
});
test('V2 有界容量：240个参数用完就停止；1000次上限与2MiB错误不丢已有证据',t=>{
 const p=freshProgress();run(p,{first:'right'});const s=p.studio.detective.selfTraining;s.seen.MASS_AVERAGE=Array.from({length:240},(_,i)=>i);const saved=copy(p);assert.throws(()=>run(p),/新参数已用完/);assert.deepEqual(p,saved);
 const full=freshProgress();run(full,{first:'right'});const st=full.studio.detective.selfTraining,sample=copy(Object.values(st.attempts)[0]);st.attempts={};st.seen={};
 for(let n=0;n<1000;n++){
  const f=SELF_FAMILIES[Math.floor(n/128)].id,index=n%128,q=selfQuestion(f,index),id='capacity-'+n,at=sample.firstAnswer.at,a={...copy(sample),id,errorFamilyId:f,index,questionVariantId:q.id,unknownRole:q.unknownRole,firstAnswer:{value:q.answer,status:'answered',at},firstReasoning:'',preFeedbackRevision:{value:q.answer,at},selfCheckActions:{kind:'reverse-substitution',pattern:q.checkPattern,value:q.checkTarget,expression:null,status:'complete',explanation:'',at},events:[]};
  a.firstHash=createHash('sha256').update(JSON.stringify({firstAnswer:a.firstAnswer,firstReasoning:a.firstReasoning})).digest('hex');st.attempts[id]=a;(st.seen[f]??=[]).push(index);
 }
 const bytes=Buffer.byteLength(JSON.stringify(st));t.diagnostic(`1000条紧凑模拟证据：${bytes}字节；模块上限2097152字节，整侦探库3145728字节。`);
 validateEnvelope(exportEnvelope(full),[]);const before=copy(full);assert.throws(()=>run(full,{f:'WRAP_RELATION'}),/1000/);assert.deepEqual(full,before);
 const corrupt=copy(full);Object.values(corrupt.studio.detective.selfTraining.attempts)[0].draft='x'.repeat(2*1024*1024);assert.throws(()=>validateEnvelope(exportEnvelope(corrupt),[]));assert.deepEqual(full,before);
});
test('V2 磁盘备份失败不提交任何首答；恢复后可安全重试',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-v2-disk-')),store=createStore(dir,[]),before=store.export().progress,write=fs.writeFileSync;
 try{fs.writeFileSync=(file,...args)=>{if(String(file).startsWith(dir))throw Object.assign(Error('模拟ENOSPC'),{code:'ENOSPC'});return write(file,...args)};
  assert.throws(()=>store.mutate(p=>applySelfTraining(p,{action:'start',mode:'practice',errorFamilyId:'MASS_AVERAGE',attemptId:'disk-a',eventId:'disk-s'},now)),/ENOSPC/);assert.deepEqual(store.get(),before);
 }finally{fs.writeFileSync=write;}
 try{assert(store.mutate(p=>applySelfTraining(p,{action:'start',mode:'practice',errorFamilyId:'MASS_AVERAGE',attemptId:'disk-a',eventId:'disk-s'},now)).result);assert(store.backup('v2-test'));}finally{store.close();fs.rmSync(dir,{recursive:true,force:true});}
});
