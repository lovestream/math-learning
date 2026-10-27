import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import net from 'node:net';import {spawn} from 'node:child_process';import {once} from 'node:events';
import {createStore} from '../server/store.mjs';
const root=path.resolve(import.meta.dirname,'..');
test('真实临时HTTP：PIN、同源、公开API不泄漏、完整备份保护、存档持久化与恢复',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-detective-http-'));const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));const base=`http://127.0.0.1:${port}`;let server,cookie='',logs='';
 const launch=async()=>{server=spawn(process.execPath,['server/index.mjs','--detective-sync=off',`--port=${port}`,`--data-dir=${dir}`],{cwd:root,stdio:['ignore','pipe','pipe']});server.stdout.on('data',s=>{logs=(logs+s).slice(-2000)});server.stderr.on('data',s=>{logs=(logs+s).slice(-2000)});for(let i=0;i<100;i++){try{const r=await fetch(base+'/api/parent/access');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,40));}throw Error(logs);};
 const stop=async()=>{server.kill('SIGTERM');await once(server,'exit');};
 const req=(url,body,auth=false,origin=base)=>fetch(base+url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:origin,...(auth?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 try{
 await launch();const old=await(await req('/api/export')).json();assert(!old.progress.studio.detective);
 assert.equal((await req('/api/parent/detective/sync')).status,403);assert.equal((await req('/api/parent/detective/sync',{})).status,403);
 assert.equal((await req('/api/parent/detective/cases')).status,403);assert.equal((await req('/api/parent/detective/cases',{action:'enable-seeds',eventId:'denied',checks:[true,true,true]})).status,403);
 const setup=await req('/api/parent/access',{action:'setup',pin:'912345'});assert(setup.ok);cookie=setup.headers.get('set-cookie').split(';')[0];
 assert.equal((await req('/api/parent/detective/sync',{autoPublish:false},true,'https://evil.example')).status,403);const paused=await(await req('/api/parent/detective/sync',{autoPublish:false},true)).json();assert.equal(paused.autoPublish,false);
 let bank=await(await req('/api/parent/detective/cases',undefined,true)).json();assert.equal(bank.cases.length,15);
 assert.equal((await req('/api/export')).status,403);assert.equal((await req('/api/import/preview',old)).status,403);assert.equal((await req('/api/import',old)).status,403);
 assert.equal((await req('/api/parent/detective/cases',{action:'enable-seeds',eventId:'evil',checks:[true,true,true]},true,'https://evil.example')).status,403);
 assert((await req('/api/parent/detective/cases',{action:'enable-seeds',eventId:'enable',checks:[true,true,true]},true)).ok);
 for(const endpoint of ['/api/data','/api/studio']){const x=await(await req(endpoint)).json();assert(!Object.hasOwn(x.progress.studio,'detective'));assert(!JSON.stringify(x.progress).includes('家长讨论素材'));}
 const t=await(await req('/api/detective/today')).json();assert.equal(t.cases.length,3);const c=t.cases[0].case;assert(!Object.hasOwn(c,'verdict'));assert(!Object.hasOwn(c,'solution'));assert(!Object.hasOwn(c,'sourceNotes'));
 let r=await(await req('/api/detective/attempt',{action:'start',attemptId:'http-a',eventId:'http-start',caseId:c.id,version:c.version})).json();const verdict=bank.cases.find(x=>x.id===c.id).draft.verdict;
 r=await(await req('/api/detective/attempt',{action:'judge',attemptId:'http-a',eventId:'http-judge',expectedRevision:r.attempt.revision,value:verdict})).json();assert.equal(r.attempt.firstVerdict,verdict);
 assert.equal((await req('/api/parent/detective/self')).status,403);
 assert.equal((await req('/api/detective/self',{action:'start',attemptId:'evil',eventId:'evil',mode:'practice',errorFamilyId:'MASS_AVERAGE'},false,'https://evil.example')).status,403);
 let self=await(await req('/api/detective/self',{action:'start',attemptId:'self-http',eventId:'self-http-s',mode:'practice',errorFamilyId:'MASS_AVERAGE'})).json();assert.equal(self.phase,'first');assert(!Object.hasOwn(self,'answer')&&!Object.hasOwn(self,'result')&&!self.question.check);
 self=await(await req('/api/detective/self',{action:'first',attemptId:'self-http',eventId:'self-http-f',expectedRevision:self.revision,status:'answered',value:'5',reasoning:''})).json();assert.equal(self.phase,'check');assert(!Object.hasOwn(self,'answer')&&!Object.hasOwn(self,'result'));
 assert.equal((await req('/api/detective/self',{action:'first',attemptId:'self-http',eventId:'self-http-overwrite',expectedRevision:1,status:'answered',value:'0.5',reasoning:''})).status,409);
 for(const endpoint of ['/api/data','/api/studio']){const x=await(await req(endpoint)).json();assert(!x.progress.studio.detective,'L4私有存档未过滤');}
 assert.equal((await req('/api/detective/attempt',{action:'judge',attemptId:'http-a',eventId:'http-stale',expectedRevision:1,value:verdict==='wrong'?'correct':'wrong'})).status,409);
 const envelope=await(await req('/api/parent/export',undefined,true)).json();assert.equal(envelope.progress.studio.detective.attempts['http-a'].firstVerdict,verdict);assert((await req('/api/parent/import/preview',envelope,true)).ok);assert((await req('/api/parent/import',envelope,true)).ok);
 assert.equal(envelope.progress.studio.detective.selfTraining.attempts['self-http'].firstAnswer.value,'5');
 await stop();await launch();assert.equal((await req('/api/parent/detective/cases',undefined,true)).status,403);const restored=await(await req('/api/detective/today')).json();assert.equal(restored.history[0].attempt.firstVerdict,verdict);
 const unlock=await req('/api/parent/access',{action:'unlock',pin:'912345'});cookie=unlock.headers.get('set-cookie').split(';')[0];assert((await req('/api/import',old,true)).ok);assert.equal((await(await req('/api/detective/today')).json()).cases.length,0);assert.deepEqual((await(await req('/api/data')).json()).progress.wallet,old.progress.wallet);
 await stop();server=null;
 const store=createStore(dir,JSON.parse(fs.readFileSync(path.join(root,'content/catalog.json'),'utf8')));assert.equal(store.get().studio.detective,undefined);store.close();
 }finally{if(server){server.kill('SIGTERM');await once(server,'exit').catch(()=>{});}fs.rmSync(dir,{recursive:true,force:true});}
});
