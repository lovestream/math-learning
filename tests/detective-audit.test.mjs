import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {createBundle} from '../scripts/create-detective-bundle.mjs';
import {deriveImportedCase,verifyImportedCaseMath} from '../shared/detective-inbox.mjs';
import {auditDeliveredBundle,auditDeliveredCase} from '../scripts/lib/detective-delivery-audit.mjs';
import {visibleArrivals,wrapFigure} from '../shared/detective-presentation.mjs';
import {freshProgress,createStore} from '../server/store.mjs';
import {importVerifiedBundle,ensureInbox} from '../server/detective-inbox-store.mjs';
import {createDetectiveInboxSync} from '../server/detective-inbox-sync.mjs';
import {ensureDetective,parentDetective} from '../server/detective-store.mjs';
import {legacyPendingCase,pendingCase} from '../content/detective/seed-cases.mjs';
export const wireBundle=JSON.parse(fs.readFileSync(new URL('../content/detective/reviewed/DT-20261016-WIRE-A.json',import.meta.url),'utf8'));
test('铁丝18分米：明确模拟首错、两路逆查、换场景16与正确对照26',()=>{
 const audit=auditDeliveredBundle(wireBundle);
 assert.deepEqual(audit.cases.map(x=>[x.repair,x.verify,x.firstWrongStep]),[['18','5',2],['16','6',2],['26','6',null]]);
 assert.deepEqual(audit.composition,{wrong:2,correct:1});
 for(const c of wireBundle.cases){assert(c.simulatedSteps);assert(c.content.prompt.includes('虚构的匿名模拟'));assert(c.content.solution.includes('反查：'));}
 for(const change of [c=>c.content.verify.answer='6',c=>c.content.repair.answer='17',c=>c.content.steps[2]='铁丝长17分米。',c=>c.content.visual.values[0]='绕3圈后多2分米',c=>c.verification.firstWrongStep=0]){
  const c=structuredClone(wireBundle.cases[0]);change(c);assert.equal(verifyImportedCaseMath(c.content,c.verification).status,'rejected');
 }
});
test('绕线参数族：不同圈差、正误与两条件守恒，恶意/歧义参数拒绝',()=>{
 let count=0;
 for(const mode of ['wrong','correct'])for(let a=1;a<=4;a++)for(let gap=1;gap<=3;gap++)for(let circle=3;circle<=8;circle++){
  const s=1,t=gap*circle-1;if(s===t)continue;
  const parameters={mode,lowTurns:a,highTurns:a+gap,surplusDm:s,shortageDm:t,scene:'spool'};
  const b=createBundle({bundleId:'DT-WIRE-PARAMETERS',cases:[{role:mode==='wrong'?'original-error':'correct-control',template:'wrap-surplus-shortage-v1',parameters}]});
  const c=b.cases[0],r=auditDeliveredCase(c);assert.equal(Number(r.repair),a*circle+s);assert.equal((a+gap)*Number(r.verify)-Number(r.repair),t);assert.equal(Number(r.repair)-a*Number(r.verify),s);
  const figure=wrapFigure(c.content.visual);assert(figure);assert(Math.abs(figure.wireWidth/figure.turnWidth-Number(r.repair)/circle)<1e-10);assert.equal(figure.lowTurns,a);assert.equal(figure.highTurns,a+gap);assert(figure.wireWidth>figure.lowTurns*figure.turnWidth&&figure.wireWidth<figure.fullWidth);count++;
 }
 assert(count>100);
 const p=wireBundle.cases[0].verification.parameters;
 for(const changes of [{lowTurns:4,highTurns:3},{highTurns:13},{highTurns:6},{surplusDm:2},{shortageDm:-1},{scene:'https://private'},{lowTurns:1.5},{extra:true}])assert.throws(()=>deriveImportedCase('wrap-surplus-shortage-v1',{...p,...changes}));
});
test('今日与新到按案号和版本去重，不隐藏新版本，也不改写输入及首答',()=>{
 const pair=(id,version)=>({case:{id,version},attempt:{firstVerdict:'wrong'}});
 const today=[pair('a','a:v1'),pair('b','b:v1'),pair('c','c:v1')],inbox=[...today,pair('a','a:v2'),pair('d','d:v1')];
 const before=JSON.stringify({today,inbox});assert.deepEqual(visibleArrivals(today,inbox).map(p=>p.case.version),['a:v2','d:v1']);
 assert.equal(visibleArrivals(today,[...inbox,inbox.at(-1)]).length,2);assert.equal(JSON.stringify({today,inbox}),before);
 assert.equal(visibleArrivals([],inbox).length,5);assert.deepEqual(visibleArrivals(),[]);
});
test('只更正未动过的系统铁丝草稿说明，不改编辑过的草稿或历史版本',()=>{
 for(const mode of ['pristine','edited','published']){
  const p=freshProgress(),d=ensureDetective(p),c=d.cases[pendingCase.id];c.draft=structuredClone(legacyPendingCase.content);
  if(mode==='edited'){c.draft.sourceNotes='家长自己的备注';c.revision=2;}
  if(mode==='published'){c.status='review';c.revision=2;}
  const before=structuredClone(c);ensureDetective(p);
  if(mode==='pristine'){assert.deepEqual(c.draft,pendingCase.content);assert.equal(c.revision,2);assert.equal(c.status,'draft');assert.equal(c.versions.length,0);}
  else assert.deepEqual(c,before);
  const after=structuredClone(p);parentDetective(p);assert.deepEqual(p,after);
 }
});
test('旧oracle待审回执绕过304并重验，已编辑草稿不覆盖，已发布旧证据不改写',async()=>{
 const bytes=JSON.stringify(wireBundle),sha=createHash('sha1').update(`blob ${Buffer.byteLength(bytes)}\0`+bytes).digest('hex'),source={branch:'detective-inbox',path:'content/detective/inbox/'+wireBundle.bundleId+'.json',sha};
 for(const edited of [false,true]){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-oracle-upgrade-')),store=createStore(dir,[]);
  try{
   store.mutate(p=>{ensureInbox(p).autoPublish=false;importVerifiedBundle(p,wireBundle,source);const x=ensureInbox(p);x.autoPublish=true;x.etag='"already-seen"';x.files[source.path].mathOracleVersion='detective-oracle.v1';for(const c of Object.values(p.studio.detective.cases).filter(c=>c.importSource)){c.importSource.mathOracleVersion='detective-oracle.v1';c.pendingImport.mathOracleVersion='detective-oracle.v1';}if(edited)p.studio.detective.cases[wireBundle.cases[0].id].draft.title='家长已编辑';});
   const before=store.export(),calls=[];
   const sync=createDetectiveInboxSync({store,fetcher:async(url,options)=>{calls.push(options.headers);if(url.includes('/contents/'))return Response.json([{name:wireBundle.bundleId+'.json',path:source.path,sha,type:'file',size:Buffer.byteLength(bytes)}],{headers:{etag:'"already-seen"'}});return Response.json({encoding:'base64',content:Buffer.from(bytes).toString('base64')});}});
   try{await sync.sync();assert(!calls[0]['If-None-Match']);const d=store.get().studio.detective;
    if(edited){assert.equal(sync.status().lastError,null);assert.match(d.inbox.files[source.path].reason,/本机已编辑或审核/);assert.equal(d.inbox.files[source.path].status,'needs-review');assert.deepEqual(d.cases,before.progress.studio.detective.cases);await sync.sync({force:true});assert.deepEqual(store.get().studio.detective.cases,before.progress.studio.detective.cases);}
    else{assert.equal(sync.status().lastError,null);assert.equal(d.inbox.files[source.path].status,'auto-published');assert(wireBundle.cases.every(c=>d.cases[c.id].versions.length===1));const saved=store.export();store.import(saved);assert.deepEqual(store.get(),saved.progress);await sync.sync({force:true});assert.deepEqual(store.get().studio.detective.cases,d.cases);}
   }finally{await sync.stop();}
  }finally{store.close();fs.rmSync(dir,{recursive:true,force:true});}
 }
});
