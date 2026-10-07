import test from 'node:test';
import assert from 'node:assert/strict';
import {foldedFaces,boxFaces} from '../shared/hands-on-models.mjs';
import {composeSolid,tint} from '../shared/solid-rendering.mjs';
import {arrayTurnPoint} from '../shared/operation-models.mjs';

test('折叠与旋转的每一帧都完整入镜，不改变数学对象与面编号',()=>{
 for(let fold=0;fold<=100;fold+=2)for(let a=0;a<360;a+=30)for(const e of [-35,0,25,55,90]){
  const original=foldedFaces(fold),before=JSON.stringify(original),view=composeSolid(original,a,e);
  assert.equal(JSON.stringify(original),before);
  assert.deepEqual(view.faces.map(f=>f.id).sort(),[1,2,3,4,5,6]);
  for(const f of view.faces){assert(Number.isFinite(f.shade)&&f.shade>=.68&&f.shade<=1.001);for(const p of f.points){assert(Number.isFinite(p.x)&&Number.isFinite(p.y));assert(p.x>=64.999&&p.x<=355.001);assert(p.y>=37.499&&p.y<=282.501)}}
  assert(view.faces.every((f,i)=>i===0||f.depth>=view.faces[i-1].depth));
 }
});
test('闭合盒子清晰放大，斜视可见三种面方向和不同明暗，正面照片保留正投影',()=>{
 const closed=composeSolid(foldedFaces(100),35,25),points=closed.faces.flatMap(f=>f.points);
 assert(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))>220);
 assert(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))>225);
 assert(new Set(closed.faces.map(f=>f.shade.toFixed(3))).size>=3);
 const b=composeSolid(boxFaces(2.4,1.5,1.2),0,0),front=b.faces.find(f=>f.id===3);
 assert.equal(front.points[0].x,front.points[3].x);assert.equal(front.points[0].y,front.points[1].y);
});
test('投影材质色保持合法范围，光照不改变质量、长度或数量模型',()=>{
 for(const factor of [.6,.7,.8,.9,1])assert.match(tint('#df6c4f',factor),/^#[0-9a-f]{6}$/);
 assert.equal(tint('#df6c4f',1),'#df6c4f');
});

test('点阵换计数方向是刚性旋转，每一帧保持珠子间距且不坍缩为一条线',()=>{
 for(const [rows,cols] of [[3,4],[7,8]])for(let frame=0;frame<=100;frame++){
  const a=arrayTurnPoint(0,0,cols,rows,frame/100),b=arrayTurnPoint(1,0,cols,rows,frame/100),c=arrayTurnPoint(0,1,cols,rows,frame/100);
  assert(Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-1)<1e-9);assert(Math.abs(Math.hypot(a.x-c.x,a.y-c.y)-1)<1e-9);
  const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);assert(Math.abs(area-1)<1e-9);
 }
});
