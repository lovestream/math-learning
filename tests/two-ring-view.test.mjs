import test from 'node:test';
import assert from 'node:assert/strict';
import {twoRingView} from '../shared/two-ring-view.mjs';
import {chainMeasure} from '../shared/length-model.mjs';

test('two-ring comparison shares the chain endpoints and the two real metal ends',()=>{
 const v=twoRingView(),base=chainMeasure(40,5,2);
 assert.deepEqual(v.first,{left:0,right:40});assert.deepEqual(v.second,{left:30,right:70});
 assert.deepEqual(v.joint,{left:30,right:40,nextMetal:[30,35],previousMetal:[35,40]});
 assert.deepEqual(v.extra,{left:40,right:70,lengthMm:30});assert.equal(v.coupledTotalMm,base.totalMm);
});
test('dragging the complete second ring changes only the virtual comparison',()=>{
 for(let tenth=0;tenth<=100;tenth++){
  const d=tenth/10,v=twoRingView(d);
  assert.equal(v.first.right-v.first.left,40);assert.ok(Math.abs(v.second.right-v.second.left-40)<1e-9);
  assert.equal(v.second.left,30+d);assert.equal(v.second.right,70+d);
  assert.ok(Math.abs(v.comparisonTotalMm-v.coupledTotalMm-d)<1e-9);
  assert.equal(v.currentOverlapMm,10-d);assert.equal(v.coupledTotalMm,70);assert.equal(v.extra.lengthMm,30);
 }
});
test('midpoint and adjacent states keep identical external ring dimensions',()=>{
 assert.deepEqual(twoRingView(5).second,{left:35,right:75});
 assert.deepEqual(twoRingView(10).second,{left:40,right:80});
 assert.equal(twoRingView(10).currentOverlapMm,0);
});
test('out-of-range gestures clamp without accumulating drift or changing the answer',()=>{
 assert.equal(twoRingView(-100).offsetMm,0);assert.equal(twoRingView(100).offsetMm,10);
 assert.equal(twoRingView(4.999999).offsetMm,5);
 for(let i=0;i<100;i++){assert.equal(twoRingView(10).comparisonTotalMm,80);assert.deepEqual(twoRingView(),twoRingView(0));}
 for(const v of [NaN,Infinity,-Infinity,'5',null])assert.throws(()=>twoRingView(v),/有限数/);
});
