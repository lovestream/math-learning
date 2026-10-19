import assert from 'node:assert/strict';
import {parseNumber,parseLinear,formatFraction} from '../../shared/pilot-math.mjs';
import {validateInboxBundle,verifyImportedCaseMath} from '../../shared/detective-inbox.mjs';
const unitPower=new Map([['毫米',0n],['厘米',1n],['分米',2n],['米',3n],['千米',6n]]);
const asMm=(value,unit)=>{assert(unitPower.has(unit));return BigInt(value)*10n**unitPower.get(unit);};
const numberIs=(actual,expected)=>{const x=parseNumber(actual),y=parseNumber(String(expected));assert.equal(x.n*y.d,y.n*x.d,'参考答案与独立复算不一致');};
const constant=expression=>{const result=parseLinear(expression);assert.equal(Object.keys(result.terms).length,0);return formatFraction(result.constant);};
// Independent references: exact parser, unit exponents and physical grouping.
// This module never calls the case generator to obtain numerical answers.
export function auditDeliveredCase(entry){
 const {content:c,verification:{template,parameters:p}}=entry;
 assert.equal(verifyImportedCaseMath(c,entry.verification).status,'verified');
 let repair,verify;
 if(template==='arithmetic-order-v1'){
  const expression=p.operator==='add-multiply'?`${p.a}+${p.b}*${p.c}`:`${p.a}-${p.b}/${p.c}`;
  repair=constant(expression);
  verify=constant(p.operator==='add-multiply'?`(${repair}-${p.a})/${p.c}`:`(${p.a}-${repair})*${p.c}`);
 }else if(template==='card-thickness-grouping-v1'){
  let remaining=BigInt(p.targetMm),cards=0n;while(remaining>0n){remaining-=BigInt(p.groupThicknessMm);cards+=BigInt(p.cardsPerGroup);}assert.equal(remaining,0n);
  repair=String(cards);let left=cards,thickness=0n;while(left>0n){left-=BigInt(p.cardsPerGroup);thickness+=BigInt(p.groupThicknessMm);}assert.equal(left,0n);verify=String(thickness);
 }else if(template==='equal-groups-v1'){
  let blocks=0n;for(let bag=0;bag<p.groups;bag++)blocks+=BigInt(p.each);repair=String(blocks);
  let bags=0n;while(blocks>0n){blocks-=BigInt(p.each);bags++;}assert.equal(blocks,0n);verify=String(bags);
 }else if(template==='length-conversion-v1'){
  const mm=asMm(p.value,p.from),newUnit=asMm(1,p.to);assert.equal(mm%newUnit,0n);repair=String(mm/newUnit);verify=String(BigInt(repair)*newUnit/asMm(1,p.from));
 }else if(template==='length-ordering-v1'){
  const quantities=p.items.map(x=>({...x,mm:asMm(x.value,x.unit)})).sort((a,b)=>a.mm===b.mm?0:a.mm>b.mm?-1:1);
  repair=quantities.map(x=>`${x.value}${x.unit}`).join('|');verify=String(quantities[0].mm);
 }else if(template==='wrap-surplus-shortage-v1'){
  // Enumerate whole-decimetre circles and test both conditions; do not reuse
  // the generator's surplus-plus-shortage formula.
  const matches=[];
  for(let circle=1;circle<=200;circle++){
   const length=p.lowTurns*circle+p.surplusDm;
   if(p.highTurns*circle-length===p.shortageDm)matches.push({circle,length});
  }
  assert.equal(matches.length,1);repair=String(matches[0].length);verify=String(matches[0].circle);
 }else throw Error('此发布审校工具尚未覆盖该数学模板。');
 if(c.repair.kind==='ordering')assert.equal(c.repair.answer,repair);else numberIs(c.repair.answer,repair);
 numberIs(c.verify.answer,verify);
 return {id:entry.id,template,verdict:c.verdict,firstWrongStep:c.errorStep,repair,verify,passed:true};
}
export function auditDeliveredBundle(bundle){validateInboxBundle(bundle);return {bundleId:bundle.bundleId,revision:bundle.bundleRevision,composition:{wrong:bundle.cases.filter(c=>c.content.verdict==='wrong').length,correct:bundle.cases.filter(c=>c.content.verdict==='correct').length},cases:bundle.cases.map(auditDeliveredCase),passed:true};}
