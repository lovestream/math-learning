import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {freshProgress,createStore} from '../server/store.mjs';
import {createBundle} from '../scripts/create-detective-bundle.mjs';
import {validateInboxBundle,parseInboxBundle,deriveImportedCase,verifyImportedCaseMath,INBOX_PATH} from '../shared/detective-inbox.mjs';
import {fingerprint,validateDetective,orderedReasons} from '../shared/detective-model.mjs';
import {ensureInbox,importVerifiedBundle} from '../server/detective-inbox-store.mjs';
import {createDetectiveInboxSync} from '../server/detective-inbox-sync.mjs';
import {detectiveToday,detectiveAttempt,manageDetective,parentDetective} from '../server/detective-store.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/detective-inbox-v1.json',import.meta.url),'utf8'));
const copy=x=>structuredClone(x),now=Date.parse('2026-10-15T10:00:00Z');
const raw=b=>JSON.stringify(b),blobSha=b=>createHash('sha1').update(`blob ${Buffer.byteLength(raw(b))}\0`+raw(b)).digest('hex');
const source=b=>({branch:'detective-inbox',path:INBOX_PATH+b.bundleId+'.json',sha:blobSha(b)});
const importCase=(p,b=copy(fixture))=>importVerifiedBundle(p,b,source(b),now);
const pack=(template,parameters,role=parameters.mode==='wrong'?'original-error':'correct-control')=>createBundle({bundleId:'DT-PARAMETERS',createdAt:'2026-10-15T10:00:00Z',cases:[{role,template,parameters}]});
test('独立数学oracle：五类模板正反、边界与首错、题图和逆查一致',()=>{
 let count=0;
 for(const mode of ['wrong','correct'])for(let k=2;k<=9;k++){
  const examples=[['card-thickness-grouping-v1',{mode,cardsPerGroup:k,groupThicknessMm:k+1,targetMm:(k+1)*5}],['equal-groups-v1',{mode,groups:k+1,each:k+2}],['length-conversion-v1',{mode,value:k,from:'米',to:'毫米'}],['arithmetic-order-v1',{mode,a:k*10,b:k*4,c:2,operator:'subtract-divide'}],['arithmetic-order-v1',{mode,a:k,b:k+1,c:3,operator:'add-multiply'}],['length-ordering-v1',{mode,items:[{value:k,unit:'米'},{value:k,unit:'厘米'},{value:k+1,unit:'分米'}]}]];
  for(const [template,parameters]of examples){const b=pack(template,parameters),c=b.cases[0];assert.equal(verifyImportedCaseMath(c.content,c.verification).status,'verified');
   for(const field of ['prompt','solution']){const bad=copy(c);bad.content[field]+='错误';assert.equal(verifyImportedCaseMath(bad.content,bad.verification).status,'rejected');}
   const bad=copy(c);bad.content.repair.answer='999999';assert.equal(verifyImportedCaseMath(bad.content,bad.verification).status,'rejected');count++;
  }
 }
 assert.equal(count,96);const c=copy(fixture.cases[0]);c.verification.firstWrongStep=0;assert.equal(verifyImportedCaseMath(c.content,c.verification).status,'rejected');
 assert.equal(fixture.cases[0].content.repair.answer,'30');assert.equal(fixture.cases[1].content.repair.answer,'20');assert.equal(fixture.cases[2].content.repair.answer,'25');
 assert.throws(()=>deriveImportedCase('card-thickness-grouping-v1',{mode:'wrong',cardsPerGroup:3,groupThicknessMm:2,targetMm:5}));
 assert.throws(()=>deriveImportedCase('arithmetic-order-v1',{mode:'wrong',a:9,b:4,c:3,operator:'subtract-divide'}));
 assert.throws(()=>deriveImportedCase('equal-groups-v1',{mode:'wrong',groups:2,each:2}));
});
test('严格契约：额外字段、私人内容、HTML、URL、错误版本、超长、原型键均拒绝',()=>{
 for(const mutate of [b=>b.schemaVersion='future',b=>b.token='x',b=>b.cases[0].id='toString',b=>b.cases[0].content.prompt='Kevin学校的作业',b=>b.cases[0].content.sourceNotes='https://private.example/photo',b=>b.cases[0].content.prompt='<img src=x>',b=>b.cases[0].simulatedSteps=false,b=>b.cases.push(b.cases[0])]){const b=copy(fixture);mutate(b);assert.throws(()=>validateInboxBundle(b));}
 assert.throws(()=>parseInboxBundle('{'));assert.throws(()=>parseInboxBundle(' '.repeat(193*1024)));assert.equal(parseInboxBundle(raw(fixture)).bundleId,fixture.bundleId);
});
test('三案事务导入、可信审核来源、首次即练、今日2错1对与旧记录保持稳定',()=>{
 const p=freshProgress();manageDetective(p,{action:'enable-seeds',eventId:'enable',checks:[true,true,true]},now);const before=detectiveToday(p,now),snapshot=JSON.stringify(p.studio.detective.plans);
 importCase(p);assert.equal(JSON.stringify(p.studio.detective.plans),snapshot);const today=detectiveToday(p,now);assert.deepEqual(today.cases,before.cases);assert.equal(today.newCases.length,3);
 const c=today.newCases[0].case;assert(!('verdict'in c)&&!('solution'in c)&&!('sourceNotes'in c));const a=detectiveAttempt(p,{action:'start',caseId:c.id,version:c.version,attemptId:'inbox-now',eventId:'start-now'},now);assert.equal(a.attempt.phase,'judge');
 for(const entry of fixture.cases){const v=p.studio.detective.cases[entry.id].versions[0];assert.equal(v.approvalSource,'deterministic-import');assert.equal(v.provenance.mathOracleVersion,'detective-oracle.v1');assert.equal(v.provenance.caseHash,fingerprint(p.studio.detective.cases[entry.id].draft));}
 const badge=copy(p.wallet);for(let i=0;i<30;i++)assert.equal(importCase(p).status,'duplicate');assert.equal(Object.keys(p.studio.detective.attempts).length,1);assert.deepEqual(p.wallet,badge);assert.equal(p.studio.detective.badges.length,0);const duplicate=copy(fixture);duplicate.bundleId='DT-SECOND-SEND';duplicate.cases.forEach((x,i)=>x.id='SECOND-'+i);assert.equal(importCase(p,duplicate).status,'duplicate');assert.equal(Object.keys(p.studio.detective.cases).length,18);validateDetective(p.studio.detective);
});
test('不知道的模板整包待审；假approved/机器已验证字符串无效；明确数学错包零发布',()=>{
 const p=freshProgress(),b=copy(fixture);b.cases[1].verification={template:'open-geometry-v1',parameters:{}};assert.equal(importCase(p,b).status,'needs-review');assert.equal(detectiveToday(p,now).newCases.length,0);assert(Object.values(p.studio.detective.cases).filter(c=>c.importSource).every(c=>c.versions.length===0));
 const q=freshProgress(),bad=copy(fixture);bad.cases[2].content.verify.answer='999';assert.equal(importCase(q,bad).status,'rejected');assert(!Object.values(q.studio.detective.cases).some(c=>c.importSource));
 for(const c of b.cases){const record=p.studio.detective.cases[c.id];manageDetective(p,{action:'publish',caseId:c.id,expectedRevision:record.revision,eventId:'parent-'+c.id,checks:[true,true,true]},now);assert.equal(record.versions[0].approvalSource,'parent');}assert.equal(p.studio.detective.inbox.files[source(b).path].status,'parent-published');
 const extra=copy(fixture);extra.cases[0].verification.checkedBy='server-deterministic-oracle';assert.throws(()=>importCase(freshProgress(),extra));
});
test('同ID、修订号、来源冲突不覆盖；新版本不变更进行中的首判与旧案',()=>{
 const p=freshProgress();importCase(p);const c=detectiveToday(p,now).newCases[0].case;let r=detectiveAttempt(p,{action:'start',caseId:c.id,version:c.version,attemptId:'a',eventId:'s'},now);detectiveAttempt(p,{action:'judge',value:'wrong',attemptId:'a',eventId:'j',expectedRevision:r.attempt.revision},now);
 const reordered=JSON.parse(JSON.stringify(fixture),(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).reverse()):v);assert.equal(importCase(p,reordered).status,'duplicate');
 const old=copy(p.studio.detective.cases[c.id].versions[0]),b=copy(fixture);b.cases[0].content.title='改名';assert.throws(()=>importCase(p,b),{status:409});assert.deepEqual(p.studio.detective.cases[c.id].versions[0],old);
 const b2=copy(fixture);b2.bundleRevision=2;const entry=b2.cases.find(x=>x.id===c.id);entry.verification.parameters.targetMm+=entry.verification.parameters.groupThicknessMm;entry.content=deriveImportedCase(entry.verification.template,entry.verification.parameters);assert.equal(importCase(p,b2).status,'auto-published');assert.equal(p.studio.detective.attempts.a.version,old.id);assert.deepEqual(p.studio.detective.cases[c.id].versions[0],old);
 const stranger=copy(fixture);stranger.bundleId='DT-OTHER';assert.throws(()=>importCase(p,stranger),{status:409});
 const badSource=source(fixture);badSource.branch='main';assert.throws(()=>importVerifiedBundle(freshProgress(),fixture,badSource));
});
test('自动发布暂停、撤回、本机手动修改、满容量均不被远端覆盖',()=>{
 const p=freshProgress();ensureInbox(p).autoPublish=false;assert.equal(importCase(p).status,'needs-review');
 const q=freshProgress();importCase(q);const c=q.studio.detective.cases[fixture.cases[0].id];manageDetective(q,{action:'withdraw',caseId:c.id,expectedRevision:c.revision,eventId:'withdraw'},now);const b=copy(fixture);b.bundleRevision=2;b.createdAt='2026-10-15T11:00:00Z';assert.equal(importCase(q,b).status,'needs-review');assert.equal(c.status,'withdrawn');
 const t=freshProgress();importCase(t);t.studio.detective.cases[fixture.cases[0].id].draft.title='本机编辑';const saved=copy(t);assert.throws(()=>importCase(t,b),{status:409});assert.deepEqual(t,saved);
 const full=freshProgress();ensureInbox(full);const sample=copy(fixture.cases[0].content);for(let i=0;i<184;i++)manageDetective(full,{action:'create',caseId:'FULL-'+i,content:sample,eventId:'create-'+i},now);const pre=copy(full);assert.throws(()=>importCase(full),/200/);assert.deepEqual(full,pre);
});
function mockRemote(b=fixture){let requests=[],etag='"v1"',offline=false;const fetcher=async(url,options)=>{requests.push({url,headers:options.headers});assert(url.startsWith('https://api.github.com/repos/lovestream/math-learning/'));if(offline)return new Response('{}',{status:429});if(url.includes('/contents/')){if(options.headers['If-None-Match']===etag)return new Response(null,{status:304});return Response.json([{name:b.bundleId+'.json',path:INBOX_PATH+b.bundleId+'.json',type:'file',sha:blobSha(b),size:Buffer.byteLength(raw(b))}],{headers:{etag}});}return Response.json({encoding:'base64',content:Buffer.from(raw(b)).toString('base64')});};return {fetcher,requests,setOffline:x=>{offline=x},change:x=>{b=x;etag='"v2"'}};}
test('只读GitHub同步：启动接收、ETag增量、断网退避、恢复、运行中不重启收新包',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'detective-sync-')),store=createStore(dir,[]),remote=mockRemote();let tick=now;const sync=createDetectiveInboxSync({store,fetcher:remote.fetcher,clock:()=>tick});
 try{
  const first=await sync.sync();assert.equal(first.files[source(fixture).path].status,'auto-published');assert.equal(remote.requests.length,2);
  tick+=15*60000;await sync.sync();assert.equal(remote.requests.length,3);assert(remote.requests[2].headers['If-None-Match']);
  remote.setOffline(true);tick+=15*60000;const before=copy(store.get().studio.detective.cases);await sync.sync();assert(sync.status().lastError.includes('429'));assert.deepEqual(store.get().studio.detective.cases,before);const n=remote.requests.length;await sync.sync();assert.equal(remote.requests.length,n);
  remote.setOffline(false);tick+=2*60000;const changed=copy(fixture);changed.bundleRevision=2;changed.createdAt='2026-10-15T13:00:00Z';remote.change(changed);await sync.sync();assert.equal(sync.status().lastError,null);assert.equal(sync.status().files[source(fixture).path].bundleRevision,2);
  const exportCopy=store.export();store.import(exportCopy);assert.deepEqual(store.get().studio.detective.inbox,exportCopy.progress.studio.detective.inbox);
 }finally{await sync.stop();store.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('同步拒绝错误blob、目录路径、超大文件；未知未来备份拒绝，旧版无收件字段兼容',async()=>{
 for(const fault of ['sha','path','size','body']){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'detective-bad-sync-')),store=createStore(dir,[]);const remote=mockRemote();const sync=createDetectiveInboxSync({store,fetcher:async(url,options)=>{const r=await remote.fetcher(url,options);if(fault==='body'&&!url.includes('/contents/'))return Response.json({encoding:'base64',content:'ZmFrZQ=='});if(url.includes('/contents/')){const f=await r.json();if(fault==='sha')f[0].sha='x';if(fault==='path')f[0].path='../bad';if(fault==='size')f[0].size=999999;return Response.json(f);}return r;},clock:()=>now});try{await sync.sync();assert(sync.status().lastError);assert(!Object.values(store.get().studio.detective.cases).some(c=>c.importSource));}finally{await sync.stop();store.close();fs.rmSync(dir,{recursive:true,force:true});}}
 const p=freshProgress();parentDetective(p);validateDetective(p.studio.detective);importCase(p);const old=copy(p.studio.detective);delete old.inbox;validateDetective(old);p.studio.detective.inbox.schemaVersion=999;assert.throws(()=>validateDetective(p.studio.detective));
});
test('新到案与每日案共用单版本一次、每日三枚上限；发布版本变更不重复首答',()=>{
 const p=freshProgress();importCase(p);const more=pack('equal-groups-v1',{mode:'wrong',groups:5,each:6});importCase(p,more);const entries=detectiveToday(p,now).newCases;
 for(const [i,entry]of entries.entries()){
  let pair=detectiveAttempt(p,{action:'start',caseId:entry.case.id,version:entry.case.version,attemptId:'close-'+i,eventId:'s-'+i},now);const v=p.studio.detective.cases[entry.case.id].versions.find(v=>v.id===entry.case.version),c=v.content;
  const send=(action,extra={})=>pair=detectiveAttempt(p,{action,attemptId:pair.attempt.id,eventId:crypto.randomUUID(),expectedRevision:pair.attempt.revision,...extra},now);
  send('judge',{value:c.verdict});send('evidence',{step:c.errorStep,reason:orderedReasons(v).findIndex(r=>r.index===c.reason)});send('repair',{value:c.repair.answer});send('verify',{value:c.verify.answer});assert(pair.attempt.status.startsWith('closed-'));
 }
 assert.equal(entries.length,4);assert.equal(p.studio.detective.badges.length,3);assert.equal(p.wallet.coins,0);const versions=Object.values(p.studio.detective.attempts).map(a=>a.version);assert.equal(new Set(versions).size,4);
});
test('GitHub blob限流时仅固定原文件后备；SHA不符拒绝，不执行任意远端URL',async()=>{
 for(const changed of [false,true]){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'detective-raw-fallback-')),store=createStore(dir,[]),remote=mockRemote();let rawCount=0;
 const sync=createDetectiveInboxSync({store,clock:()=>now,fetcher:async(url,options)=>{if(url.startsWith('https://raw.githubusercontent.com/')){assert.equal(url,'https://raw.githubusercontent.com/lovestream/math-learning/detective-inbox/'+source(fixture).path);rawCount++;return new Response(changed?'{}':raw(fixture));}if(url.includes('/git/blobs/'))return new Response('{}',{status:403});return remote.fetcher(url,options);}});
 try{await sync.sync();assert.equal(rawCount,1);if(changed){assert(sync.status().lastError);assert.equal(Object.keys(sync.status().files).length,0);}else assert.equal(Object.values(sync.status().files)[0].status,'auto-published');}finally{await sync.stop();store.close();fs.rmSync(dir,{recursive:true,force:true});}
 }
});
test('混合新旧内容逐案去重，只复用当前同条件版本，避免复用已经改题的旧案',()=>{
 const p=freshProgress();importCase(p);const next=copy(fixture);next.bundleId='DT-PARTIAL';next.cases.forEach((c,i)=>c.id='PARTIAL-'+i);next.cases[0].verification.parameters.targetMm=24;next.cases[0].content=deriveImportedCase(next.cases[0].verification.template,next.cases[0].verification.parameters);
 const result=importCase(p,next);assert.equal(Object.keys(p.studio.detective.cases).length,19);assert.deepEqual(result.caseIds,['PARTIAL-0',fixture.cases[1].id,fixture.cases[2].id]);
 const revision=copy(fixture);revision.bundleRevision=2;revision.cases[1].verification.parameters.targetMm=18;revision.cases[1].content=deriveImportedCase(revision.cases[1].verification.template,revision.cases[1].verification.parameters);importCase(p,revision);
 const oldMath=pack('card-thickness-grouping-v1',{mode:'wrong',cardsPerGroup:4,groupThicknessMm:3,targetMm:15});const old=importCase(p,oldMath);assert.equal(old.caseIds[0],oldMath.cases[0].id);assert.equal(p.studio.detective.cases[old.caseIds[0]].draft.repair.answer,'20');
});
