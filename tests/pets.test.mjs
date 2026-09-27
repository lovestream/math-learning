import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { freshProgress, applyAttempt, applyRetell, applyPurchase, exportEnvelope, validateEnvelope, createStore } from '../server/store.mjs';
import { normalizePets, applyFeed, applyInteract, applyHome, applyPetReward, petMissions } from '../server/pet-care.mjs';

const courses=JSON.parse(fs.readFileSync(new URL('../content/catalog.json',import.meta.url),'utf8'));
const now=Date.UTC(2026,8,7,3), course=courses[0];
const complete=(p,lesson,when=now)=>{lesson.questions.slice(0,lesson.practiceCount??6).forEach((q,i)=>applyAttempt(p,{id:`answer:${lesson.id}:${when}:${i}`,lessonId:lesson.id,questionId:q.id,answer:q.answer,usedHint:false,mode:'learn'},courses,when+i));applyRetell(p,{id:`retell:${lesson.id}:${when}`,lessonId:lesson.id,text:'我能说清这个工具来自真实问题，也能用数量关系和图形模型解释它。'},courses,when+20)};
const oldProgress=()=>{const p=freshProgress();delete p.pets.care;p.pets.owned=['bubble'];p.pets.active='bubble';p.pets.xp=23;p.inventory={berry:3};delete p.profile.selectedGrade;return p};

test('老存档预览不修改校验数据；欢迎礼物只迁移一次',()=>{
  const raw=oldProgress(),envelope=exportEnvelope(raw),before=JSON.stringify(envelope);
  const preview=validateEnvelope(envelope,courses),again=validateEnvelope(envelope,courses);
  assert.equal(JSON.stringify(envelope),before);assert.equal(preview.pets.active,'dongdong');assert.equal(again.pets.xp,23);
  assert.equal(preview.inventory.berry,5);normalizePets(preview,now);assert.equal(preview.inventory.berry,5);
  assert.equal(preview.pets.care.friends.bubble.growth,23);assert.equal(preview.pets.care.friends.dongdong.growth,0);
});

test('升级真实格式 SQLite 前保存旧备份；关闭重开不会重发食物',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-pet-migrate-'));
  let store;
  try {
    const raw=oldProgress(),db=new DatabaseSync(path.join(dir,'progress.sqlite'));
    db.exec('CREATE TABLE progress (id INTEGER PRIMARY KEY, payload TEXT NOT NULL)');
    db.prepare('INSERT INTO progress VALUES (1,?)').run(JSON.stringify(raw));db.close();
    store=createStore(dir,courses);const current=store.get();
    const backup=store.listBackups().find(x=>x.name.includes('before-pet-upgrade'));assert.ok(backup);
    assert.deepEqual(store.readBackup(backup.name).progress,raw);
    store.close();store=createStore(dir,courses);assert.deepEqual(store.get(),current);
  } finally {store?.close();fs.rmSync(dir,{recursive:true,force:true})}
});

test('分享最爱有额外亲密度；重试不重复吃掉食物或成长',()=>{
  const p=freshProgress(),input={id:'feed:one',item:'icecream'};
  const result=applyFeed(p,input,now),again=applyFeed(p,input,now+1000);
  assert.equal(result.favorite,true);assert.equal(result.bond,5);assert.equal(result.xp,5);assert.equal(again.duplicate,true);
  assert.equal(p.inventory.icecream,1);assert.equal(p.pets.care.friends.dongdong.meals,1);assert.equal(p.pets.xp,5);
  assert.throws(()=>applyFeed(p,{id:'feed:one',item:'berry'},now),/编号/);
});

test('食物用尽的失败操作不改动存档',()=>{
  const p=freshProgress();p.inventory.icecream=0;const before=structuredClone(p);
  assert.throws(()=>applyFeed(p,{id:'feed:empty',item:'icecream'},now),/背包/);assert.deepEqual(p,before);
});

test('摸摸每日全伙伴共用 3 点奖励；北京时间跨日刷新；不扣离线成长',()=>{
  const p=freshProgress();let total=0;
  for(let i=0;i<8;i++)total+=applyInteract(p,{id:`touch:${i}`,action:'touch'},now).bond;
  assert.equal(total,3);assert.equal(p.pets.care.friends.dongdong.growth,0);assert.equal(p.wallet.coins,0);
  const next=Date.UTC(2026,8,7,16);assert.equal(applyInteract(p,{id:'touch:next',action:'touch'},next).bond,1);
  assert.equal(applyInteract(p,{id:'touch:next',action:'touch'},next+1).duplicate,true);
  const growth=p.pets.xp;normalizePets(p,next+86400000*50);assert.equal(p.pets.xp,growth);
});

test('接星星奖励每日一次，不产生学习积分或完成记录',()=>{
  const p=freshProgress();assert.equal(applyInteract(p,{id:'play:1',action:'play'},now).bond,3);
  assert.equal(applyInteract(p,{id:'play:2',action:'play'},now).bond,0);
  assert.equal(p.wallet.coins,0);assert.equal(p.attempts.length,0);assert.equal(p.pets.xp,0);
});

test('实际过关驱动成长、回忆与约定礼物；请求重复不重发',()=>{
  const p=freshProgress();assert.throws(()=>applyPetReward(p,{type:'mission',reward:'discover'},courses,now),/学习约定|学习/);
  complete(p,course);assert.equal(p.pets.care.friends.dongdong.growth,10);
  assert.ok(p.pets.care.memories.some(m=>m.lessonId===course.id));
  const m=petMissions(p,courses,now).find(x=>x.id==='discover');assert.equal(m.done,true);assert.equal(m.claimed,false);
  const berries=p.inventory.berry;applyPetReward(p,{type:'mission',reward:'discover'},courses,now);applyPetReward(p,{type:'mission',reward:'discover'},courses,now);
  assert.equal(p.inventory.berry,berries+2);assert.equal(petMissions(p,courses,now).find(x=>x.id==='discover').claimed,true);
  complete(p,course,now+10000);assert.equal(p.pets.care.friends.dongdong.growth,10);
});

test('到期复习和思维课程有各自礼物，次日不把旧完成当新任务',()=>{
  const p=freshProgress(),thinking=courses.find(c=>c.kind==='thinking');complete(p,thinking);
  assert.equal(petMissions(p,courses,now).find(x=>x.id==='think').done,true);
  p.reviews[course.id]={dueAt:new Date(now-1000).toISOString(),stage:0,lastReviewedAt:null,successDates:[],mistakes:[]};
  const q=course.questions[2];applyAttempt(p,{id:'review:due',lessonId:course.id,questionId:q.id,answer:q.answer,usedHint:false,mode:'review'},courses,now);
  assert.equal(petMissions(p,courses,now).find(x=>x.id==='review').done,true);
  assert.ok(petMissions(p,courses,now+86400000).every(m=>!m.done&&!m.claimed));
});

test('积分邀请真实伙伴：扣款一致，各自成长独立，导入导出完整',()=>{
  const p=freshProgress();for(const c of courses.slice(0,4))complete(p,c);
  applyPurchase(p,{id:'invite:honey',type:'pet',item:'honey'},now);
  assert.equal(p.wallet.coins,40);assert.equal(p.pets.active,'honey');assert.equal(p.pets.care.friends.honey.growth,0);assert.equal(p.pets.care.friends.dongdong.growth,40);
  assert.deepEqual(validateEnvelope(exportEnvelope(p),courses),p);
});

test('成长礼物和场景按阈值解锁；摆放和收起持久保存',()=>{
  const p=freshProgress();assert.throws(()=>applyHome(p,{scene:'sunset'}),/成长/);
  assert.throws(()=>applyHome(p,{item:'flowers',placed:true}),/先获得/);
  for(const c of courses.slice(0,6))complete(p,c);
  applyPetReward(p,{type:'growth',reward:20},courses,now);applyPetReward(p,{type:'growth',reward:20},courses,now);
  assert.equal(p.inventory.flowers,1);
  applyHome(p,{scene:'sunset',item:'flowers',placed:true});assert.ok(p.pets.care.decorations.includes('flowers'));
  applyHome(p,{item:'flowers',placed:false});assert.equal(p.pets.care.decorations.length,0);
  assert.equal(validateEnvelope(exportEnvelope(p),courses).pets.care.scene,'sunset');
});

test('格式合法但内容异常的宠物备份也会被拒绝',()=>{
  for(const damage of [p=>p.pets.care.friends.dongdong.bond=-1,p=>p.pets.care.scene='starlight',p=>p.pets.care.decorations=['flowers'],p=>p.pets.care.friends.dongdong.gifts=[300],p=>p.pets.care.friends.fake={growth:0}]) {
    const p=freshProgress();damage(p);assert.throws(()=>validateEnvelope(exportEnvelope(p),courses),/宠物养成/);
  }
});
