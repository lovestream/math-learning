import test from 'node:test';
import assert from 'node:assert/strict';
import {boardMeasure,chainMeasure,intervalMeasure,rulerReading,validateLengthScene} from '../shared/length-model.mjs';
import {lengthMeasurementLessons} from '../content/pilot/length-measurement.mjs';

test('链环长度由同一模型生成位置、接头与答案',()=>{
  const m=chainMeasure(40,5,4);
  assert.deepEqual(m.starts,[0,30,60,90]);assert.equal(m.joints.length,3);assert.equal(m.totalMm,130);
  assert.equal(chainMeasure(40,5,2).totalMm,70);assert.equal(chainMeasure(40,5,5).totalMm,160);
});
test('木板拖动时重叠越多，端到端越短且图形起点一致',()=>{
  assert.deepEqual(boardMeasure([300,250],[80]).starts,[0,220]);
  assert.equal(boardMeasure([300,250],[80]).totalMm,470);
  assert.equal(boardMeasure([300,250],[30]).totalMm,520);
  assert.throws(()=>boardMeasure([200,200,200],[150,150]),/三重重叠/);
});
test('断尺、直线与闭环分别保持长度和点段关系',()=>{
  assert.deepEqual(rulerReading(20,53),{startMm:20,endMm:73,lengthMm:53});
  assert.deepEqual(rulerReading(35,53),{startMm:35,endMm:88,lengthMm:53});
  assert.deepEqual(intervalMeasure(24000,4000,false),{segments:6,points:7});
  assert.deepEqual(intervalMeasure(24000,4000,true),{segments:6,points:6});
});
test('五节长度课的场景图与预期答案逐一一致',()=>{
  const scenes=lengthMeasurementLessons.flatMap(l=>l.lengthScenes);
  assert.equal(scenes.length,5);
  assert.deepEqual(scenes.map(validateLengthScene),[53,1000000,470,130,24000]);
});
test('每节长度课都把图形带进迁移或复习题',()=>{
  for(const lesson of lengthMeasurementLessons){
    const diagrams=Object.values(lesson.taskSets).flat().map(t=>t.diagram).filter(d=>d?.type==='measurement');
    assert(diagrams.length>=5,`${lesson.lessonId}至少需要5道可视化练习`);
    assert(Object.values(lesson.taskSets).slice(2).some(tasks=>tasks.some(t=>t.diagram?.type==='measurement')),`${lesson.lessonId}不能只在核心题配图`);
  }
  const routeDiagrams=Object.values(lengthMeasurementLessons.find(l=>l.lessonId==='G3-U03-B02').taskSets).flat().map(t=>t.diagram).filter(d=>d?.mode==='route');
  assert.equal(routeDiagrams.length,5);
  for(const diagram of routeDiagrams){
    if(diagram.sectionLengthsMm){
      assert(diagram.sectionLengthsMm.every(n=>n>0));
      if(diagram.lengthMm!==undefined)assert.equal(diagram.sectionLengthsMm.reduce((sum,n)=>sum+n,0),diagram.lengthMm);
    }else assert(diagram.lengthMm>0,'没有分段时必须给出整条路线长度');
  }
});
