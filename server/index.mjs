import {parentFormalTasks, reviewFormalTask} from "./pilot-store.mjs";
import {thinkingCards,publicThinkingCard} from '../content/pilot/thinking-source.mjs';
import {applyThinking,applyThinkingReview,parentThinkingCards} from './thinking-store.mjs';
import {createParentAccess,assertLocalWrite} from './parent-access.mjs';
import http from 'node:http';
import { applyFeed, applyInteract, applyHome, applyPetReward, petMissions, ensureFriend } from './pet-care.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createStore, applyAttempt, applyRetell, applyPurchase, CATALOG_VERSION } from './store.mjs';
import { publicLesson, publicSession, saveReading, createSession, saveSession, revealHelp, selfCheckTask, submitTask, saveNote } from './pilot-store.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const courses = JSON.parse(fs.readFileSync(path.join(root, 'content/catalog.json'), 'utf8'));
const pilotLessons=JSON.parse(fs.readFileSync(path.join(root,'content/pilot/lessons.json'),'utf8'));
const pilotDesign=JSON.parse(fs.readFileSync(path.join(root,'content/pilot/design-index.json'),'utf8'));
const isDev = process.argv.includes('--dev');
const shouldOpen = process.argv.includes('--open');
const portArg = process.argv.find(v => v.startsWith('--port='));
const port = portArg ? Number(portArg.slice(7)) : 4177;
const dataArg = process.argv.find(v => v.startsWith('--data-dir='));
const dataDir=dataArg ? path.resolve(dataArg.slice(11)) : path.join(root,'data');
const store = createStore(dataDir, courses);
const parentAccess=createParentAccess(dataDir);
let vite;
if (isDev) {
  const { createServer } = await import('vite');
  vite = await createServer({root, server:{middlewareMode:true}, appType:'spa'});
}

const clientProgress=p=>{const copy=structuredClone(p);if(copy.studio?.events)copy.studio.events=copy.studio.events.filter(e=>!e.signature?.includes('parent-thinking-review')&&!e.signature?.includes('\"kind\":\"thinking\"'));if(copy.studio?.sessions)for(const [id,s] of Object.entries(copy.studio.sessions))copy.studio.sessions[id]=publicSession(s);return copy;};
const json = (res, status, body, headers={}) => {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});
  const safe=body&&typeof body==='object'&&body.progress?{...body,progress:clientProgress(body.progress)}:body;
  res.end(JSON.stringify(safe));
};
const fail = (res, error, status=400) => json(res,error.status??status,{error:error instanceof Error?error.message:'操作没有完成。',code:error.code??'INVALID_INPUT'});
const readJson = req => new Promise((resolve,reject)=>{
  const chunks=[];let size=0;
  req.on('data',chunk=>{size+=chunk.length;if(size>8*1024*1024){reject(new Error('文件超过 8MB，请选择正确的学习备份。'));req.destroy();}else chunks.push(chunk);});
  req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}'));}catch{reject(new Error('内容不是有效的 JSON 文件。'));}});req.on('error',reject);
});
const snapshot = () => ({progress:clientProgress(store.get()),courses,articleCourses:pilotLessons.map(publicLesson),thinkingCards:thinkingCards.map(publicThinkingCard),serverTime:new Date().toISOString(),catalogVersion:CATALOG_VERSION});
const importSummary = p => ({name:p.profile.name,grade:p.profile.grade,attempts:p.attempts.length+(p.studio?.events??[]).filter(e=>['correct','incorrect'].includes(e.result?.status)).length,completed:new Set([...Object.entries(p.lessons).filter(([,l])=>l.completedAt).map(([id])=>id),...Object.values(p.studio?.sessions??{}).filter(s=>s.setName==='core'&&s.completedAt).map(s=>s.lessonId)]).size,coins:p.wallet.coins,pets:p.pets.owned.length,reviews:new Set([...Object.keys(p.reviews),...Object.keys(p.studio?.review??{})]).size});
const contentTypes = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.mp4':'video/mp4','.webp':'image/webp','.jpg':'image/jpeg','.gif':'image/gif','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};

async function api(req,res,url){
  try{
    if(url.pathname==='/api/parent/access'){
      if(req.method==='GET')return json(res,200,parentAccess.status(req));
      if(req.method==='POST'){const b=await readJson(req);if(b.action==='recovery-code')return json(res,200,{recoveryCode:parentAccess.issueRecovery(req)});const cookie=b.action==='lock'?parentAccess.lock(req):b.action==='recover'?parentAccess.recover(req,b.code,b.pin):parentAccess.unlock(req,b.pin,b.action==='setup');return json(res,200,parentAccess.status({...req,headers:{...req.headers,cookie:cookie.split(';')[0]}}),{'Set-Cookie':cookie});}
    }
    if(url.pathname.startsWith('/api/parent/')){parentAccess.requireParent(req);if(req.method==='GET'&&url.pathname==='/api/parent/formal')return json(res,200,{tasks:parentFormalTasks(store.get())});if(req.method==='POST'&&url.pathname==='/api/parent/formal/review'){const body=await readJson(req);const out=store.mutate(p=>reviewFormalTask(p,body));return json(res,200,{result:out.result,progress:out.progress});}if(req.method==='GET'&&url.pathname==='/api/parent/thinking')return json(res,200,{cards:parentThinkingCards(store.get())});if(req.method==='POST'&&url.pathname==='/api/parent/thinking/review'){const body=await readJson(req);const out=store.mutate(p=>applyThinkingReview(p,body));return json(res,200,{result:out.result,progress:out.progress});}}
    if(req.method==='GET'&&url.pathname==='/api/studio')return json(res,200,{progress:clientProgress(store.get()),lessons:pilotLessons.map(publicLesson),design:pilotDesign});
    const pilotActions={
      '/api/studio/thinking':(p,b)=>applyThinking(p,b),
      '/api/studio/reading':(p,b)=>saveReading(p,b,pilotLessons),
      '/api/studio/sessions':(p,b)=>createSession(p,b,pilotLessons),
      '/api/studio/draft':(p,b)=>saveSession(p,b),
      '/api/studio/help':(p,b)=>revealHelp(p,b),
      '/api/studio/self-check':(p,b)=>selfCheckTask(p,b),
      '/api/studio/attempt':(p,b)=>submitTask(p,b,pilotLessons),
      '/api/studio/note':(p,b)=>saveNote(p,b,pilotLessons)
    };
    if(req.method==='POST'&&Object.hasOwn(pilotActions,url.pathname)){const body=await readJson(req);const out=store.mutate(p=>pilotActions[url.pathname](p,body));const result=['/api/studio/sessions','/api/studio/draft'].includes(url.pathname)?publicSession(out.result):out.result;return json(res,200,{result,progress:clientProgress(out.progress)});}
    if(req.method==='GET'&&url.pathname==='/api/data')return json(res,200,snapshot());
    if(req.method==='POST'&&url.pathname==='/api/attempt'){const body=await readJson(req);const out=store.mutate(p=>applyAttempt(p,body,courses));return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='POST'&&url.pathname==='/api/retell'){const body=await readJson(req);const out=store.mutate(p=>applyRetell(p,body,courses));return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='POST'&&url.pathname==='/api/purchase'){const body=await readJson(req);const out=store.mutate(p=>applyPurchase(p,body));return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='POST'&&url.pathname==='/api/pet'){const body=await readJson(req);const out=store.mutate(p=>{if(!p.pets.owned.includes(body.pet))throw new Error('还没有领养这只蛋仔。');p.pets.active=body.pet;ensureFriend(p);return {ok:true};});return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='POST'&&url.pathname==='/api/feed'){const body=await readJson(req);const out=store.mutate(p=>applyFeed(p,body));return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='POST'&&url.pathname==='/api/pet/interact'){const body=await readJson(req);const out=store.mutate(p=>applyInteract(p,body));return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='GET'&&url.pathname==='/api/pet/missions')return json(res,200,{missions:petMissions(store.get(),courses,Date.now(),pilotLessons),serverTime:new Date().toISOString()});
    if(req.method==='POST'&&url.pathname==='/api/pet/reward'){const body=await readJson(req);const out=store.mutate(p=>applyPetReward(p,body,courses,Date.now(),pilotLessons));return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='POST'&&url.pathname==='/api/pet/home'){const body=await readJson(req);const out=store.mutate(p=>applyHome(p,body));return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='POST'&&url.pathname==='/api/accessory'){const body=await readJson(req);const out=store.mutate(p=>{if(body.item!==null&&(!['scarf'].includes(body.item)||!p.inventory[body.item]))throw new Error('还没有这件装扮。');p.pets.accessory=body.item;return {ok:true};});return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='POST'&&url.pathname==='/api/settings'){const body=await readJson(req);const out=store.mutate(p=>{if(body.dailyMinutes!==undefined){if(![30,45,60].includes(body.dailyMinutes))throw new Error('学习时长只能选择 30、45 或 60 分钟。');p.settings.dailyMinutes=body.dailyMinutes;}if(body.sound!==undefined)p.settings.sound=Boolean(body.sound);if(body.grade!==undefined){if(!Number.isInteger(body.grade)||body.grade<1||body.grade>6)throw new Error('请选择1到6年级。');p.profile.selectedGrade=body.grade;p.profile.grade=body.grade;}return {ok:true};});return json(res,200,{...out.result,progress:out.progress});}
    if(req.method==='GET'&&url.pathname==='/api/export'){const body=JSON.stringify(store.export(),null,2);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="kevin-progress-${new Date().toISOString().slice(0,10)}.json"`,'Content-Length':Buffer.byteLength(body)});return res.end(body);}
    if(req.method==='POST'&&url.pathname==='/api/import/preview'){const body=await readJson(req);const p=store.validate(body);return json(res,200,{summary:importSummary(p),catalogVersion:body.catalogVersion??'未知'});}
    if(req.method==='POST'&&url.pathname==='/api/import'){const body=await readJson(req);const out=store.import(body);return json(res,200,{progress:out.progress,backup:out.backup});}
    if(req.method==='GET'&&url.pathname==='/api/backups')return json(res,200,{backups:store.listBackups()});
    const restore=url.pathname.match(/^\/api\/backups\/([^/]+)\/restore$/);
    if(req.method==='POST'&&restore){const envelope=store.readBackup(decodeURIComponent(restore[1]));const out=store.import(envelope);return json(res,200,{progress:out.progress,backup:out.backup});}
    return fail(res,new Error('没有找到这个本地接口。'),404);
  }catch(error){return fail(res,error);}
}
function serveStatic(req,res,url){
  const dist=path.join(root,'dist');let rel=decodeURIComponent(url.pathname).replace(/^\/+/,'');if(!rel||rel.includes('..'))rel='index.html';let file=path.join(dist,rel);if(!file.startsWith(dist))return fail(res,new Error('路径不正确。'),403);if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(dist,'index.html');if(!fs.existsSync(file))return fail(res,new Error('请先运行 npm run build。'),503);res.writeHead(200,{'Content-Type':contentTypes[path.extname(file)]??'application/octet-stream','Cache-Control':file.endsWith('index.html')?'no-cache':rel.startsWith('assets/index-')?'public, max-age=31536000, immutable':'no-cache'});fs.createReadStream(file).pipe(res);
}
const server=http.createServer(async(req,res)=>{
  const host=req.headers.host??'';
  if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host))return fail(res,new Error('这个本地服务只接受本机访问。'),403);
  const url=new URL(req.url??'/',`http://${host}`);
  if(url.pathname.startsWith('/api/')){try{assertLocalWrite(req)}catch(e){return fail(res,e)}return api(req,res,url);}
  if(vite)return vite.middlewares(req,res);
  return serveStatic(req,res,url);
});
server.listen(port,'127.0.0.1',()=>{
  const localUrl=`http://127.0.0.1:${port}`;
  console.log(`Kevin Math Lab 已启动：${localUrl}`);
  if(shouldOpen)spawn('open',[localUrl],{detached:true,stdio:'ignore'}).unref();
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{store.close();if(vite)await vite.close();server.close(()=>process.exit(0));});
