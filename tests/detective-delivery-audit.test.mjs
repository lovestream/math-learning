import test from 'node:test';import assert from 'node:assert/strict';
import {createBundle} from '../scripts/create-detective-bundle.mjs';import {auditDeliveredCase,auditDeliveredBundle} from '../scripts/lib/detective-delivery-audit.mjs';
const entry=(template,parameters)=>createBundle({bundleId:'DT-INDEPENDENT',cases:[{role:parameters.mode==='correct'?'correct-control':'original-error',template,parameters}]}).cases[0];
test('投递审校用另一种算法复算五类模型，含正误、换算与反向检查',()=>{
 const parameters=[['arithmetic-order-v1',{a:63,b:9,c:4,operator:'add-multiply'}],['arithmetic-order-v1',{a:91,b:42,c:7,operator:'subtract-divide'}],['card-thickness-grouping-v1',{cardsPerGroup:4,groupThicknessMm:3,targetMm:24}],['equal-groups-v1',{groups:7,each:6}],['length-conversion-v1',{value:7,from:'千米',to:'米'}],['length-ordering-v1',{items:[{value:6,unit:'米'},{value:75,unit:'分米'},{value:420,unit:'厘米'},{value:9000,unit:'毫米'}]}]];
 const single=createBundle({bundleId:'DT-SINGLE',cases:[{role:'correct-control',template:'equal-groups-v1',parameters:{mode:'correct',groups:3,each:5}}]});assert.equal(auditDeliveredBundle(single).cases.length,1);
 const expected=[['99','9'],['85','42'],['32','24'],['42','7'],['7000','7'],['9000毫米|75分米|6米|420厘米','9000']];
 for(const mode of ['wrong','correct'])for(const [i,[template,p]]of parameters.entries()){const result=auditDeliveredCase(entry(template,{...p,mode}));assert.deepEqual([result.repair,result.verify],expected[i]);}
});
test('新投递的错行、修复答案、逆查答案与题图篡改都会被拦截',()=>{
 for(const change of [c=>c.content.repair.answer='31',c=>c.content.verify.answer='23',c=>c.content.errorStep=0,c=>c.content.visual.values[0]='一组3张']){const c=entry('card-thickness-grouping-v1',{mode:'wrong',cardsPerGroup:4,groupThicknessMm:3,targetMm:24});change(c);assert.throws(()=>auditDeliveredCase(c));}
});
