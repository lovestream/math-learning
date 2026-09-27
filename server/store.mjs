import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PETS as PET_CATALOG, ITEMS as ITEM_CATALOG, normalizePets, ensureFriend, learningMemory, validateCare } from './pet-care.mjs';
import {prepareReview,finishReview,validReviewSchedule} from './review-schedule.mjs';
import { validatePilot } from './pilot-store.mjs';

export const CATALOG_VERSION = '2026.09.primary.v4';
const DAY = 86400000;
const PETS = Object.fromEntries(Object.entries(PET_CATALOG).map(([k,v])=>[k,v.price]));
const ITEMS = Object.fromEntries(Object.entries(ITEM_CATALOG).map(([k,v])=>[k,v.price]));
export const freshProgress = () => normalizePets({schemaVersion:1,profile:{name:'Kevin',grade:3,selectedGrade:3,textbook:'人教版'},settings:{sound:true,dailyMinutes:30,reviewDays:[1,3,7,21]},attempts:[],lessons:{},reviews:{},wallet:{coins:0,earned:0,spent:0,ledger:[]},pets:{owned:['bubble'],active:'bubble',xp:0,feedCount:0,accessory:null},inventory:{},studio:{version:1,reading:{},sessions:{},notes:[],events:[],entitlements:{},daily:{},review:{}}});
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function exportEnvelope(progress) {return {format:'kevin-math-lab',version:1,exportedAt:new Date().toISOString(),catalogVersion:CATALOG_VERSION,progress,checksum:hash(progress)};}
const ensure = (ok,message='备份内容不完整或格式不正确。') => {if(!ok) throw new Error(message);};
const integer=(n,max=1e9)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const str=(v,n=1000)=>typeof v==='string'&&v.length<=n;
const date=v=>str(v,40)&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&Number.isFinite(Date.parse(v));
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=v=>str(v,120)&&/^[a-zA-Z0-9:_-]+$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
const unique=a=>new Set(a).size===a.length;
export function validateEnvelope(input,courses) {
  ensure(obj(input)&&input.format==='kevin-math-lab','请选择 Kevin Math Lab 导出的学习备份文件。');
  ensure(input.version===1,'此备份版本暂不支持，请使用匹配版本的程序。');
  const raw=input.progress;
  ensure(obj(raw)&&raw.schemaVersion===1&&hash(raw)===input.checksum,'备份校验未通过，文件可能被修改或损坏。');
  const p=structuredClone(raw);
  ensure(obj(p.profile)&&str(p.profile.name,40)&&p.profile.name.trim().length>0&&integer(p.profile.grade,12)&&str(p.profile.textbook,80));
  if(p.profile.selectedGrade===undefined)p.profile.selectedGrade=p.profile.grade;
  ensure(integer(p.profile.selectedGrade,6)&&p.profile.selectedGrade>=1);
  ensure(obj(p.settings)&&typeof p.settings.sound==='boolean'&&[30,45,60].includes(p.settings.dailyMinutes));
  ensure(Array.isArray(p.settings.reviewDays)&&p.settings.reviewDays.length===4&&p.settings.reviewDays.every((d,i,a)=>integer(d,365)&&d>0&&(i===0||d>a[i-1])));
  ensure(Array.isArray(p.attempts)&&p.attempts.length<=100000&&unique(p.attempts.map(a=>a.id)));
  for(const a of p.attempts) ensure(obj(a)&&id(a.id)&&id(a.lessonId)&&id(a.questionId)&&str(a.prompt,3000)&&typeof a.correct==='boolean'&&typeof a.usedHint==='boolean'&&Number.isFinite(a.answer)&&Number.isFinite(a.expected)&&['learn','review'].includes(a.mode)&&date(a.at)&&str(a.misconception,1000)&&str(a.explanation,3000)&&a.correct===(a.answer===a.expected));
  const courseIds=new Set(courses.map(c=>c.id));
  ensure(obj(p.lessons)&&Object.keys(p.lessons).length<=10000);
  const retellIds=[];
  for(const [key,l] of Object.entries(p.lessons)) {ensure(id(key)&&courseIds.has(key),'备份中包含本程序尚未支持的课程，请先更新程序。');ensure(obj(l)&&Array.isArray(l.solved)&&unique(l.solved)&&l.solved.every(q=>courses.find(c=>c.id===key).questions.some(x=>x.id===q))&&(l.completedAt===null||date(l.completedAt)));if(l.retells!==undefined){ensure(Array.isArray(l.retells)&&l.retells.length<=100);for(const r of l.retells){ensure(obj(r)&&id(r.id)&&str(r.text,1200)&&r.text.trim().length>=10&&date(r.at));retellIds.push(r.id);}}}
  ensure(unique(retellIds),'复述记录编号重复，请重新导出。');
  ensure(obj(p.reviews)&&Object.keys(p.reviews).length<=10000);
  for(const r of Object.values(p.reviews))ensure(obj(r)&&validReviewSchedule(r),'复习日期记录不完整，请使用原始备份。');
  for(const [key,r] of Object.entries(p.reviews)) ensure(courseIds.has(key)&&obj(r)&&date(r.dueAt)&&integer(r.stage,1000)&&(r.lastReviewedAt===null||date(r.lastReviewedAt))&&Array.isArray(r.successDates)&&r.successDates.every(d=>str(d,10)&&/^\d{4}-\d{2}-\d{2}$/.test(d))&&unique(r.successDates)&&Array.isArray(r.mistakes)&&r.mistakes.every(q=>id(q)));
  ensure(obj(p.wallet)&&integer(p.wallet.coins)&&integer(p.wallet.earned)&&integer(p.wallet.spent)&&Array.isArray(p.wallet.ledger)&&p.wallet.ledger.length<=100000&&unique(p.wallet.ledger.map(x=>x.id)));
  let earned=0,spent=0;
  for(const entry of p.wallet.ledger){ensure(obj(entry)&&id(entry.id)&&Number.isSafeInteger(entry.amount)&&Math.abs(entry.amount)<=100000&&str(entry.label,120)&&date(entry.at)); if(entry.amount>0)earned+=entry.amount;else spent-=entry.amount;}
  ensure(earned===p.wallet.earned&&spent===p.wallet.spent&&earned-spent===p.wallet.coins,'积分流水与余额不一致，已取消导入。');
  ensure(obj(p.pets)&&Array.isArray(p.pets.owned)&&p.pets.owned.includes('bubble')&&unique(p.pets.owned)&&p.pets.owned.every(x=>Object.hasOwn(PETS,x))&&p.pets.owned.includes(p.pets.active)&&integer(p.pets.xp)&&integer(p.pets.feedCount)&&[null,'scarf'].includes(p.pets.accessory));
  ensure(obj(p.inventory)&&Object.entries(p.inventory).every(([k,v])=>Object.hasOwn(ITEMS,k)&&integer(v)));
  validateCare(p);
  validatePilot(p.studio);
  return normalizePets(p);
}
const localDay=(now)=>new Date(now+8*3600000).toISOString().slice(0,10);
function credit(p,id,amount,label,now) {
  if(p.wallet.ledger.some(x=>x.id===id))return 0;
  ensure(p.wallet.coins+amount>=0,'积分还不够，完成一些学习任务再来吧。');
  p.wallet.ledger.push({id,amount,label,at:new Date(now).toISOString()});
  p.wallet.coins+=amount;if(amount>0)p.wallet.earned+=amount;else p.wallet.spent-=amount;
  return amount;
}
export function applyAttempt(p,input,courses,now=Date.now()) {
  ensure(obj(input)&&id(input.id)&&str(input.lessonId)&&str(input.questionId)&&typeof input.answer==='number'&&Number.isFinite(input.answer)&&typeof input.usedHint==='boolean'&&['learn','review'].includes(input.mode),'作答数据不正确，请重新提交。');
  const prior=p.attempts.find(a=>a.id===input.id);if(prior){ensure(prior.lessonId===input.lessonId&&prior.questionId===input.questionId&&prior.answer===input.answer,'请求编号冲突，请重新作答。');return {correct:prior.correct,earned:0,duplicate:true,explanation:prior.explanation};}
  const lesson=courses.find(c=>c.id===input.lessonId);const q=lesson?.questions.find(q=>q.id===input.questionId);ensure(q,'这道题已更新，请重新打开关卡。');
  const correct=input.answer===q.answer; const at=new Date(now).toISOString();
  p.attempts.push({id:input.id,lessonId:lesson.id,questionId:q.id,prompt:q.prompt,answer:input.answer,expected:q.answer,correct,usedHint:input.usedHint,mode:input.mode,at,misconception:q.misconception,explanation:q.explanation});
  const current=p.lessons[lesson.id]??={solved:[],completedAt:null};current.lastQuestionId=q.id;
  let earned=0,completed=false;
  const existing=p.reviews[lesson.id];
  if(!correct) {
    const r=p.reviews[lesson.id]??={dueAt:new Date(now+DAY*p.settings.reviewDays[0]).toISOString(),stage:0,lastReviewedAt:null,successDates:[],mistakes:[]};
    if(!r.mistakes.includes(q.id))r.mistakes.push(q.id);
    prepareReview(r,now,current.completedAt);r.dueAt=new Date(now+DAY).toISOString();
  } else if(input.mode==='learn') {
    if(!current.solved.includes(q.id))current.solved.push(q.id);
    if(lesson.questions.slice(0,lesson.practiceCount??6).some(x=>x.id===q.id))earned+=credit(p,`question:${lesson.id}:${q.id}`,5,'完成一道分层练习',now);
  } else if(existing&&Date.parse(existing.dueAt)<=now) {
    const rewardId=`review:${lesson.id}:${existing.dueAt.replace(/[^0-9]/g,'')}`;
    const lastDay=existing.lastReviewedAt?localDay(Date.parse(existing.lastReviewedAt)):null;
    if(lastDay!==localDay(now)){
      earned+=credit(p,rewardId,10,'完成到期复习',now);learningMemory(p,lesson,'review',now);
      finishReview(existing,now,!input.usedHint,p.settings.reviewDays,current.completedAt);
    }
  }
  return {correct,earned,completed,explanation:q.explanation,answer:correct?q.answer:undefined};
}
export function applyRetell(p,input,courses,now=Date.now()) {
  ensure(obj(input)&&id(input.id)&&id(input.lessonId)&&str(input.text,1200)&&input.text.trim().length>=10,'请至少用一句完整的话，说说它为什么出现、抓住了什么关系。');
  const lesson=courses.find(c=>c.id===input.lessonId);ensure(lesson,'这节课已更新，请重新打开关卡。');
  const current=p.lessons[lesson.id]??={solved:[],completedAt:null};current.retells??=[];
  const prior=current.retells.find(r=>r.id===input.id);if(prior)return {earned:0,completed:Boolean(current.completedAt),duplicate:true};
  const required=lesson.questions.slice(0,lesson.practiceCount??6);
  ensure(required.every(q=>current.solved.includes(q.id)),'先完成这一关的分层练习，再把发现讲回来。');
  const at=new Date(now).toISOString();current.retells.push({id:input.id,text:input.text.trim(),at});
  let earned=0,completed=false;
  if(!current.completedAt){current.completedAt=at;completed=true;earned+=credit(p,`lesson:${lesson.id}`,20,'完成复述与新关卡',now);learningMemory(p,lesson,'learn',now);}
  if(!p.reviews[lesson.id])p.reviews[lesson.id]={dueAt:new Date(now+DAY*p.settings.reviewDays[0]).toISOString(),stage:0,lastReviewedAt:null,successDates:[],mistakes:[]};
  prepareReview(p.reviews[lesson.id],now,current.completedAt);
  return {earned,completed};
}
export function applyPurchase(p,input,now=Date.now()) {
  ensure(obj(input)&&id(input.id)&&['pet','item'].includes(input.type)&&id(input.item),'购买请求不正确。');
  if(p.wallet.ledger.some(x=>x.id===`purchase:${input.id}`))return {duplicate:true};
  if(input.type==='pet') {ensure(Object.hasOwn(PETS,input.item),'没有找到这只蛋仔。');ensure(!p.pets.owned.includes(input.item),'已经拥有这只蛋仔。');credit(p,`purchase:${input.id}`,-PETS[input.item],'领养蛋仔',now);p.pets.owned.push(input.item);p.pets.active=input.item;ensureFriend(p,now);}
  else {ensure(Object.hasOwn(ITEMS,input.item),'没有找到这件物品。');if(ITEM_CATALOG[input.item].kind!=='food')ensure(!p.inventory[input.item],'已经拥有这件装饰。');credit(p,`purchase:${input.id}`,-ITEMS[input.item],'购买家园物品',now);p.inventory[input.item]=(p.inventory[input.item]??0)+1;}
  return {ok:true};
}
export function createStore(directory,courses) {
  fs.mkdirSync(directory,{recursive:true});const backups=path.join(directory,'backups');fs.mkdirSync(backups,{recursive:true});
  const db=new DatabaseSync(path.join(directory,'progress.sqlite'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL);');
  db.prepare('INSERT OR IGNORE INTO progress(id,payload) VALUES(1,?)').run(JSON.stringify(freshProgress()));
  const get=()=>{const p=JSON.parse(db.prepare('SELECT payload FROM progress WHERE id=1').get().payload);if(p.profile&&!Number.isInteger(p.profile.selectedGrade))p.profile.selectedGrade=p.profile.grade||3;return normalizePets(p);};
  const backup=(reason='manual')=>{const file=`kevin-${new Date().toISOString().replace(/[:.]/g,'-')}-${reason}.json`;const dest=path.join(backups,file);const body=JSON.stringify(exportEnvelope(get()),null,2);fs.writeFileSync(dest+'.tmp',body);fs.renameSync(dest+'.tmp',dest);const files=fs.readdirSync(backups).filter(f=>f.endsWith('.json')).sort().reverse();for(const old of files.slice(30))fs.unlinkSync(path.join(backups,old));return file;};
  const original=JSON.parse(db.prepare('SELECT payload FROM progress WHERE id=1').get().payload);
  if(!original.pets.care){
    const filename=`kevin-${new Date().toISOString().replace(/[:.]/g,'-')}-before-pet-upgrade.json`;
    fs.writeFileSync(path.join(backups,filename),JSON.stringify(exportEnvelope(original),null,2));
    db.prepare('UPDATE progress SET payload=? WHERE id=1').run(JSON.stringify(get()));
  }
  let backedDay='';
  const mutate=fn=>{const today=localDay(Date.now());if(backedDay!==today){backup('daily');backedDay=today;}db.exec('BEGIN IMMEDIATE');try{const p=get();const result=fn(p);db.prepare('UPDATE progress SET payload=? WHERE id=1').run(JSON.stringify(p));db.exec('COMMIT');return {result,progress:p};}catch(e){db.exec('ROLLBACK');throw e;}};
  return {get,mutate,backup,export:()=>exportEnvelope(get()),validate:e=>validateEnvelope(e,courses),import:e=>{const p=validateEnvelope(e,courses);const filename=backup('before-import');db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE progress SET payload=? WHERE id=1').run(JSON.stringify(p));db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}return {progress:get(),backup:filename};},listBackups:()=>fs.readdirSync(backups).filter(f=>f.endsWith('.json')).sort().reverse().map(name=>({name,bytes:fs.statSync(path.join(backups,name)).size})),readBackup:name=>{ensure(/^kevin-[a-zA-Z0-9T-]+\.json$/.test(name),'备份文件名不正确。');return JSON.parse(fs.readFileSync(path.join(backups,name),'utf8'));},close:()=>db.close()};
}
