import test from 'node:test';
import assert from 'node:assert/strict';
import {textbookModels,initialTextbookState,measureTextbook,validateTextbookState,gridCells,gridPerimeter,leapYear} from '../shared/textbook-models.mjs';
import {validateWidgetState} from '../shared/widget-state.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
test('35个教材教具的初态合法，存档按课程与模型校验，不接收越界或跨课状态',()=>{
 assert.equal(Object.keys(textbookModels).length,35);
 for(const [id,model] of Object.entries(textbookModels)){
  const state=initialTextbookState(model);assert.doesNotThrow(()=>measureTextbook(model,state));
  const tagged={...state,stateKind:'textbook',textbookVersion:1,sceneId:id+'-MODEL1',modelStateVersion:model.version,actions:[]};
  assert.doesNotThrow(()=>validateWidgetState(tagged,id));assert.throws(()=>validateWidgetState({...tagged,modelStateVersion:'other'},id));
 }
});
test('乘法进位与按位分配保持材料总数，未平均不能宣布完成',()=>{
 const mult=textbookModels['G3-U04-B02'],state=initialTextbookState(mult);
 assert.equal(measureTextbook(mult,state).total,48);assert.equal(measureTextbook(mult,{...state,bank:[0,4,8]}).total,48);
 assert.throws(()=>validateTextbookState(mult,{...state,bank:[0,4,9]}));
 for(const id of ['G3-L02-B02','G3-L02-B04']){
  const model=textbookModels[id],s=initialTextbookState(model),per=model.total/4,bank=[0,0,0],alloc=Array.from({length:4},()=>[Math.floor(per/100),Math.floor(per/10)%10,per%10]).flat();
  assert(measureTextbook(model,{...s,bank,alloc}).equal);
  const unequal=[...alloc];unequal[2]++;unequal[5]--;assert.equal(measureTextbook(model,{...s,bank,alloc:unequal}).equal,false);
 }
});
test('边长与整体转动不改变角，旋转单边改变分类',()=>{
 const model=textbookModels['G3-U05-B02'],s=initialTextbookState(model);
 for(let len=55;len<=170;len+=5)for(const r of [0,90,180,270])assert.equal(measureTextbook(model,{...s,sideLength:len,rotation:r}).degrees,45);
 assert.equal(measureTextbook(model,{...s,angle:90}).kind,'直角');assert.equal(measureTextbook(model,{...s,angle:120}).kind,'钝角');
});
test('2至10等份均用精确公共刻度；改变折痕和重分组不改变蓝色长度',()=>{
 const model=textbookModels['G3-U06-E01'],s=initialTextbookState(model);
 for(let n=2;n<=10;n++){const cuts=Array.from({length:n+1},(_,i)=>i*2520/n),m=measureTextbook(model,{...s,parts:n,cuts});assert(m.equal);assert.equal(m.length,840)}
 assert.equal(measureTextbook(model,{...s,cuts:[0,840,1680,2520]}).length,840);
 assert.equal(measureTextbook(model,{...s,cuts:[0,600,1260,1890,2520]}).equal,false);
 assert.throws(()=>validateTextbookState(model,{...s,cuts:[0,100,100,2520]}));
});
test('拼接内部公共边扣两次；剪块保持材料面积，重叠不可假装面积守恒',()=>{
 const joining=textbookModels['G3-L03-E01'],s=initialTextbookState(joining);
 assert.equal(measureTextbook(joining,s).perimeter,24);assert.equal(measureTextbook(joining,{...s,offset:0}).perimeter,18);
 const cut=textbookModels['G3-L04-B03'],c=initialTextbookState(cut),old=measureTextbook(cut,c),separate=measureTextbook(cut,{...c,left:8,top:0}),overlap=measureTextbook(cut,{...c,left:0,top:0});
 assert.equal(old.area,40);assert.equal(old.perimeter,26);assert.equal(separate.area,40);assert.notEqual(separate.perimeter,26);assert(overlap.overlap>0);
 assert.equal(gridCells(cut,c).length,40);assert.equal(gridPerimeter([[0,0],[1,0]]),6);
});
test('10和20只属于一个整数分钟分组，名单共有者只记一个身份',()=>{
 const bins=textbookModels['G3-L05-B02'],s=initialTextbookState(bins),correct={...s,alloc:[1,1,2,2,2,2,3,3]};
 assert.deepEqual(measureTextbook(bins,correct).counts,[2,4,2]);assert.deepEqual(measureTextbook(bins,{...correct,alloc:[1,1,1,2,2,2,2,3]}).incorrect,[2,6]);
 const sets=textbookModels['G3-L07-B01'],ss=initialTextbookState(sets),m=measureTextbook(sets,{...ss,alloc:[1,1,1,1,1,2,2,2,3,3,3,3]});assert.equal(m.total,12);assert.deepEqual(m.counts,[5,3,4]);assert.deepEqual(m.incorrect,[]);
});
test('月历采用公历世纪规则；跨整点走针与小数换数位使用同一数量状态',()=>{
 assert(!leapYear(1900));assert(leapYear(2000));assert(leapYear(2024));
 const cal=textbookModels['G3-LP01-B01'],s=initialTextbookState(cal);assert.equal(measureTextbook(cal,{...s,year:2023}).days,28);assert.equal(measureTextbook(cal,s).days,29);
 const clock=textbookModels['G3-LP01-B02'];assert.equal(measureTextbook(clock,{minutes:965}).elapsed,45);
 const decimal=textbookModels['G3-L06-B01'];assert.equal(measureTextbook(decimal,{alloc:[1,3,0]}).cm,130);assert.equal(measureTextbook(decimal,{alloc:[1,0,3]}).cm,103);
});
test('新教具探索可随旧格式学习备份导出导入，不能伪造积分',()=>{
 const p=freshProgress(),id='G3-U06-E01',model=textbookModels[id];p.studio.reading[id]={revision:1,blockId:'try',widgets:{try:{...initialTextbookState(model),stateKind:'textbook',textbookVersion:1,sceneId:id+'-MODEL1',modelStateVersion:model.version}},savedAt:new Date().toISOString()};
 const restored=validateEnvelope(exportEnvelope(p),[]);assert.deepEqual(restored.studio.reading[id].widgets.try.filled,[0,840]);assert.equal(restored.wallet.coins,0);
});
