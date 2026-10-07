import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../content/pilot/source.mjs';
import {introVisuals,validateIntroVisualCoverage,textOnlyIntroLessonIds} from '../content/pilot/intro-visuals.mjs';
import {faces,foldedFaces,hiddenCubes,boxFaces,containerObjects,scaleObjects} from '../shared/hands-on-models.mjs';
import {rhombusPoints} from '../shared/intro-visuals.mjs';
test('每个已开放课程入口经图形或明确文字题审核，短课堂故事和预测都有图',()=>{
 validateIntroVisualCoverage(lessons);assert.equal(lessons.length,70);
 assert.equal(lessons.filter(l=>l.introVisual).length,41);
 for(const l of lessons.filter(l=>l.childClassroom)){
  assert.equal(l.introVisual.type,l.childClassroom.storyVisual.type);
  assert.equal(l.introVisual.type,l.childClassroom.predictionVisual.type);
 }
 assert.equal(textOnlyIntroLessonIds.size,11);
});
test('删除必要图形、新图形课程未声明或分数整体错误时构建必须拒绝',()=>{
 const first=lessons.find(l=>l.lessonId==='G3-U06-B02');
 assert.throws(()=>validateIntroVisualCoverage([{...first,introVisual:undefined}]),/缺少对应图形/);
 assert.throws(()=>validateIntroVisualCoverage([{...first,lessonId:'G3-NEW-GEOMETRY',introVisual:undefined}]),/缺少对应图形/);
 assert.throws(()=>validateIntroVisualCoverage([{...first,introVisual:{...first.introVisual,values:[8,9]}}]),/纸带分组/);
 assert.throws(()=>validateIntroVisualCoverage([{...first,introVisual:{...first.introVisual,type:'unimplemented-geometry'}}]),/图形规格不完整/);
 const short=lessons.find(l=>l.childClassroom);
 assert.throws(()=>validateIntroVisualCoverage([{...short,childClassroom:{...short.childClassroom,predictionVisual:undefined}}]),/前两屏缺图/);
});
test('故事图与实验对象共用身份与数量，不用例题答案反推物体',()=>{
 assert.equal(faces[2].mark,'●');assert.equal(faces[3].mark,'◆');assert.equal(faces[0].mark,'★');
 assert.equal(boxFaces(2.4,1.5,1.2).length,6);
 const net=foldedFaces(0),center=id=>net.find(f=>f.id===id).points.reduce((p,q)=>p.map((n,i)=>n+q[i]/4),[0,0,0]);
 assert.deepEqual(center(2),[-1,0,0]);assert.deepEqual(center(4),[1,0,0]);assert.deepEqual(center(6),[0,2,0]);
 assert.equal(hiddenCubes(1).length,3);assert.equal(hiddenCubes(2).length,4);
 assert.equal(containerObjects[2].mass,380);assert.equal(scaleObjects[2].mass,1000);
 assert.deepEqual(introVisuals['G3-U06-E01'].values,[6,2,0,2]);
 assert.deepEqual(introVisuals['G3-L07-B01'].values,[8,7,3]);
});
test('分类图中菱形四边确实相等，而且相邻边不是直角',()=>{
 const side=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 for(let i=0;i<4;i++)assert.equal(side(rhombusPoints[i],rhombusPoints[(i+1)%4]),100);
 const [a,b,c]=rhombusPoints;assert.notEqual((a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]),0);
});
