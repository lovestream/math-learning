import test from 'node:test';
import assert from 'node:assert/strict';
import {chainMeasure} from '../shared/length-model.mjs';
import {validateWidgetState} from '../shared/widget-state.mjs';
import {currentClassroomExperiment} from '../shared/classroom-expression.mjs';
import {lengthMeasurementLessons} from '../content/pilot/length-measurement.mjs';

const lesson=lengthMeasurementLessons.find(l=>l.lessonId==='G3-U03-E02');
test('multi-ring addition and overlap counting agree without shortening a complete ring',()=>{
 for(const [length,thickness] of [[40,5],[50,4],[30,3]])for(let count=1;count<=5;count++){
  const m=chainMeasure(length,thickness,count);
  assert.equal(m.joints.length,count-1);
  assert.equal(m.totalMm,count*length-(count-1)*2*thickness);
  assert.equal(m.totalMm,m.extensions.reduce((sum,e)=>sum+e.addedMm,0));
  for(let i=0;i<count;i++)assert.equal(m.starts[i]+length,i===count-1?m.totalMm:m.joints[i].end);
  if(count>1){const old=chainMeasure(length,thickness,count-1);assert.equal(m.totalMm-old.totalMm,m.addedMm);assert.equal(m.extensions.at(-1).start,old.totalMm);}
 }
});
test('old chain states round-trip unchanged; the 80mm comparison never enters current classroom arithmetic',()=>{
 const old={sceneId:'G3-U03-E02-chain',labVersion:2,stateKind:'legacy',target:5,placed:4,joint:1,inspected:[0,1],mode:'chain-overlap',guess:'160',checked:false,showReason:false};
 const copy=structuredClone(old);assert.deepEqual(validateWidgetState(old,lesson.lessonId,lesson),copy);assert.deepEqual(old,copy);
 const state={...old,placed:2,compared:true,offset:10,zoom:true,show:false};validateWidgetState(state,lesson.lessonId,lesson);
 const expression=currentClassroomExperiment(lesson,state);assert(expression.conditions[0].includes('已扣2个环'));assert(expression.template.includes('(2−1)'));assert(!JSON.stringify(expression).includes('80'));
 assert.equal(chainMeasure(40,5,state.placed).totalMm,70);
});
