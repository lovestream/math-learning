import test from 'node:test';
import assert from 'node:assert/strict';
import {handsOnModels,foldedFaces,faceRelation,cubeProjection,boxFaces,projectPoint,scaleMass,balanceState,boatState,stones} from '../shared/hands-on-models.mjs';
import {validateWidgetState} from '../shared/widget-state.mjs';
import {validateTask} from '../shared/pilot-math.mjs';
import {lessons} from '../content/pilot/source.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {saveReading,createSession,submitTask} from '../server/pilot-store.mjs';
import {completeSelfCheck} from './fixtures/self-check.mjs';
import {lessonEvidence} from '../shared/learning-evidence.mjs';

const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`),dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const answerFor=task=>task.kind==='fields'?Object.fromEntries(task.fields.map(f=>[f.key,f.expected])):{value:task.expected,...(task.responseSpec.type==='claim-evidence'?{evidence:task.responseSpec.expectedEvidence}:{})};
test('连续折叠保持六个面的编号、边长、面积及真实连接边',()=>{
 for(let progress=0;progress<=100;progress++){
  const fs=foldedFaces(progress);assert.deepEqual(fs.map(f=>f.id).sort(),[1,2,3,4,5,6]);
  for(const face of fs){for(let i=0;i<4;i++)near(dist(face.points[i],face.points[(i+1)%4]),1);near(dist(face.points[0],face.points[2]),Math.SQRT2)}
  const shared=(a,b)=>a.points.filter(p=>b.points.some(q=>dist(p,q)<1e-8)).length;
  for(const id of [1,2,4,5])assert.equal(shared(fs.find(f=>f.id===3),fs.find(f=>f.id===id)),2);
  assert.equal(shared(fs.find(f=>f.id===5),fs.find(f=>f.id===6)),2);
 }
 assert.throws(()=>foldedFaces(101));assert.throws(()=>foldedFaces(NaN));
});
test('折成盒子后正好8个顶点12条棱，相对面无公共顶点，相邻面共用棱',()=>{
 const fs=foldedFaces(100),key=p=>p.map(v=>v.toFixed(6)).join(','),vertices=new Set(),edges=new Map();
 for(const f of fs)for(let i=0;i<4;i++){vertices.add(key(f.points[i]));const edge=[key(f.points[i]),key(f.points[(i+1)%4])].sort().join('|');edges.set(edge,(edges.get(edge)??0)+1)}
 assert.equal(vertices.size,8);assert.equal(edges.size,12);assert([...edges.values()].every(n=>n===2));
 for(const a of fs)for(const b of fs)if(a.id!==b.id){const shared=a.points.filter(p=>b.points.some(q=>dist(p,q)<1e-8)).length;assert.equal(shared,faceRelation(a.id,b.id)==='opposite'?0:2)}
});
test('观察者转动改变投影，物体三维坐标不变；正投影尺寸符合盒子的宽高深',()=>{
 const fs=boxFaces(2.4,1.5,1.2),before=JSON.stringify(fs);
 for(const [a,e,w,h] of [[0,0,2.4,1.5],[90,0,1.2,1.5],[0,90,2.4,1.2]]){
  const points=fs.flatMap(f=>f.points.map(p=>projectPoint(p,a,e)));
  near(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),w);near(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)),h);
 }
 assert.equal(JSON.stringify(fs),before);
});
test('隐藏积木允许3块和4块具有相同正面、顶面，但侧面证据不同',()=>{
 assert.deepEqual(cubeProjection(1,'front'),cubeProjection(2,'front'));
 assert.deepEqual(cubeProjection(1,'top'),cubeProjection(2,'top'));
 assert.notDeepEqual(cubeProjection(1,'right'),cubeProjection(2,'right'));
 assert.equal(cubeProjection(0,'top').length,1);assert.equal(cubeProjection(2,'front').length,2);
 assert.throws(()=>cubeProjection(3,'front'));
});
test('称重守恒、单位换算、净重、天平角度方向与质量差一致',()=>{
 assert.equal(scaleMass([2]),1000);assert.equal(scaleMass([2])/1000,1);
 assert.equal(scaleMass([0,1],'container'),380);assert.equal(scaleMass([2],'container')-scaleMass([0],'container'),260);
 for(let hundreds=0;hundreds<6;hundreds++)for(let twos=0;twos<4;twos++){
  const b=balanceState([...Array(hundreds).fill(0),...Array(twos).fill(1)]);
  assert.equal(b.balanced,b.leftMass===b.rightMass);assert.equal(b.angle===0,b.balanced);
  if(b.difference>0)assert(b.angle<0);if(b.difference<0)assert(b.angle>0);
 }
 assert.equal(balanceState([1,1]).angle,0);assert.throws(()=>balanceState([3]));
});
test('称象同水线代表总载重相同，新增乘员时不可把石块和象直接等同',()=>{
 const model=handsOnModels['G3-UP01-B02'],original=boatState(model,{elephant:true});
 for(let mask=0;mask<64;mask++)for(const passenger of [false,true]){
  const ids=stones.filter(s=>mask&(1<<s.id)).map(s=>s.id),m=boatState(model,{boatStones:ids,passenger});
  assert.equal(m.sameWaterline,m.sink===original.sink);assert.equal(m.boatMass,original.boatMass);
  assert.equal(m.replacementValid,m.stoneMass===900&&!passenger);
 }
 const replacement=boatState(model,{boatStones:[1,3,4]});assert.equal(replacement.stoneMass,900);assert(replacement.replacementValid);
 const wrong=boatState(model,{boatStones:[2,5],passenger:true});assert(wrong.sameWaterline);assert.equal(wrong.stoneMass,750);assert.equal(wrong.replacementValid,false);
 assert.throws(()=>boatState(model,{boatStones:[1,1]}));
});
test('五课具有明确模型、六屏教材桥接、3道可判定核心题与不同迁移题',()=>{
 for(const id of Object.keys(handsOnModels)){
  const l=lessons.find(l=>l.lessonId===id);assert(l.childClassroom?.mission);assert(l.childClassroom.predictionOptions.length>=2);
  assert.equal(l.conceptScenes[0].modelStatus,'registered');assert.deepEqual(l.conceptScenes[0].handsOnSpec,handsOnModels[id]);
  assert.equal(l.contentVersion,'2026-10-07.2');assert.equal(l.taskSets.core.length,3);
  for(const t of l.taskSets.core){assert.notEqual(t.kind,'explanation');assert.equal(t.selfCheckItems.length,3);assert.equal(validateTask(t,answerFor(t)).status,'correct');assert(!l.taskSets.transfer.some(other=>other.id===t.id||other.prompt===t.prompt))}
  for(const t of [...l.taskSets.transfer,...l.taskSets.review]){assert.notEqual(t.kind,'explanation');assert.equal(t.diagram,undefined);assert.equal(validateTask(t,answerFor(t)).status,'correct')}
 }
});
test('模型状态有限且按课程约束，拒绝越界、错版本、错模型动作与重复物体',()=>{
 const valid=(id,extra={})=>({stateKind:'hands-on',handsOnVersion:2,sceneId:`${id}-MODEL1`,modelStateVersion:handsOnModels[id].version,...extra});
 assert(validateWidgetState(valid('G3-U01-B03',{foldProgress:50,faceId:2,otherFaceId:4}),'G3-U01-B03'));
 for(const patch of [{foldProgress:101},{faceId:0},{cameraElevation:91},{photos:[0]},{modelStateVersion:'fake'},{actions:[{action:'load-stone',before:null,after:null}]}])assert.throws(()=>validateWidgetState(valid('G3-U01-B03',patch),'G3-U01-B03'));
 assert.throws(()=>validateWidgetState(valid('G3-UP01-B02',{boatStones:[1,1]}),'G3-UP01-B02'));
 assert.throws(()=>validateWidgetState(valid('G3-UP01-B01',{massUnit:'ton'}),'G3-UP01-B01'));
 assert.throws(()=>validateWidgetState({chapterScreen:6},'G3-U01-B01'));
 const badHistory=valid('G3-U01-B02',{rearHeight:1,actions:[{action:'add-cube',before:'{"rearHeight":99}',after:'{"rearHeight":1}'}]});
 assert.throws(()=>validateWidgetState(badHistory,'G3-U01-B02'));
 assert(validateWidgetState({...badHistory,actions:[{action:'add-cube',before:'{}',after:'{"rearHeight":2}'}]},'G3-U01-B02'));
});
test('读课、模型和屏幕可导出导入，但点击和操作不会直接产生掌握或积分',()=>{
 const p=freshProgress(),id='G3-U01-B02',model=handsOnModels[id],widgets={classroom:{chapterScreen:2,predicted:true},try:{stateKind:'hands-on',handsOnVersion:2,sceneId:`${id}-MODEL1`,modelStateVersion:model.version,rearHeight:2,cameraAzimuth:90,cameraElevation:0}};
 saveReading(p,{lessonId:id,revision:0,blockId:'classroom',widgets},lessons);
 const restored=validateEnvelope(exportEnvelope(p),[]);assert.deepEqual(restored.studio.reading[id].widgets,widgets);
 const ev=lessonEvidence(restored,id,'2026-10-07.2');assert(ev.explored);assert.equal(ev.independent,false);assert.equal(ev.practiced,false);
});
test('五课可以从自查到核心练习提交，首答、证据保留；核心不冒充独立迁移',()=>{
 for(const id of Object.keys(handsOnModels)){
  const p=freshProgress(),s=createSession(p,{lessonId:id,setName:'core'},lessons);
  for(const task of s.tasks){const answer=answerFor(task);completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer,eventId:`first:${task.id}`});assert.equal(submitTask(p,{sessionId:s.id,revision:s.revision,taskId:task.id,answer,eventId:`v2:${task.id}`},lessons).status,'correct')}
  assert(s.completedAt);const ev=lessonEvidence(p,id,'2026-10-07.2');assert(ev.practiced);assert.equal(ev.independent,false);
 }
});
test('五课的独立迁移与次日到期复习均能闭环，当天做完仍不算延迟掌握',()=>{
 const now=Date.UTC(2026,9,7);
 for(const id of Object.keys(handsOnModels)){
  const p=freshProgress(),lesson=lessons.find(l=>l.lessonId===id);
  const solve=(setName,time)=>{const session=createSession(p,{lessonId:id,setName},lessons,time);for(const task of session.tasks){const answer=answerFor(task);completeSelfCheck(p,{sessionId:session.id,revision:session.revision,taskId:task.id,answer,eventId:`first:${setName}:${task.id}:${time}`},time);assert.equal(submitTask(p,{sessionId:session.id,revision:session.revision,taskId:task.id,answer,eventId:`submit:${setName}:${task.id}:${time}`},lessons,time).status,'correct')}};
  solve('core',now);solve('transfer',now);assert.equal(lessonEvidence(p,id,lesson.contentVersion).independent,false);
  solve('review',now+86400000);assert.equal(lessonEvidence(p,id,lesson.contentVersion).independent,true);
 }
});
