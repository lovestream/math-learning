import {parseNumber,add,multiply,divide,rational,formatFraction} from './pilot-math.mjs';
import {insist} from './detective-model.mjs';

export const MASS_SPRING_TEMPLATES=['batch-average-mass-v1','mass-average-inverse-v1','spring-total-length-v1','spring-reverse-v1'];
const exact=(p,keys)=>p&&Object.getPrototypeOf(p)===Object.prototype&&Object.keys(p).every(k=>keys.includes(k));
const integer=(x,zero=false)=>Number.isSafeInteger(x)&&x>=(zero?0:1)&&x<=1000;
const decimal=x=>typeof x==='number'&&Number.isFinite(x)&&x>0&&x<=10000&&/^\d+(\.\d{1,3})?$/.test(String(x));
const str=q=>{if(q.d===1n)return String(q.n);for(let k=1n;k<=1000000n;k*=10n)if(k%q.d===0n){const digits=String(k).length-1,v=q.n*(k/q.d);return `${v/k}.${String(v%k).padStart(digits,'0')}`.replace(/0+$/,'').replace(/\.$/,'');}return formatFraction(q);};
const calc=(op,a,b)=>str(op(parseNumber(a),parseNumber(b)));
const mul=(a,b)=>calc(multiply,a,b),div=(a,b)=>calc(divide,a,b),sum=(a,b)=>calc(add,a,b);
const subtract=(a,b)=>sum(a,`-${b}`);
const number=(question,answer,unit)=>({kind:'number',question,answer:String(answer),unit,options:[]});
// Parameter constraints and exact numbers are independent of editorial wording.
export function massSpringFacts(template,p){
 insist(MASS_SPRING_TEMPLATES.includes(template)&&['correct','wrong'].includes(p?.mode),'称量/弹簧模板不支持这些参数。');
 const wrong=p.mode==='wrong';let answer,verification,unit,verifyUnit,prompt,steps,firstWrongStep,check,relation,family,unknownRole,values;
 if(template==='batch-average-mass-v1'){
  insist(exact(p,['mode','item','count','totalGrams',...(wrong?['wrongDivisor']:[])])&&integer(p.count)&&p.count>=2&&decimal(p.totalGrams)&&['花生米','豆子','坚果仁','玻璃珠'].includes(p.item),'称量颗数、质量或物品不合法。');
  insist(!wrong||integer(p.wrongDivisor)&&p.wrongDivisor!==p.count,'错误除数必须不同于颗数。');
  answer=div(p.totalGrams,p.count);verification=String(p.totalGrams);unit=verifyUnit='克';family='MASS_AVERAGE';unknownRole='每颗平均质量';
  prompt=`在这道模拟称量题中，${p.count}颗${p.item}共重${p.totalGrams}克。每颗平均重多少克？`;
  steps=[`${p.count}颗共${p.totalGrams}克。`,`${p.totalGrams}÷${wrong?p.wrongDivisor:p.count}＝${wrong?div(p.totalGrams,p.wrongDivisor):answer}（克）。`];firstWrongStep=wrong?1:null;
  check=`将你算出的每颗质量乘${p.count}，写出乘法和结果，对照总质量${p.totalGrams}克。`;relation='全部质量平均分给实际称量的颗数。';values=[`${p.count}颗${p.item}`,`总质量${p.totalGrams}克`];
 }else if(template==='mass-average-inverse-v1'){
  insist(['total','count'].includes(p.ask)&&exact(p,['mode','ask','item','averageGrams',p.ask==='total'?'count':'totalGrams'])&&decimal(p.averageGrams)&&['花生米','豆子','坚果仁','玻璃珠'].includes(p.item),'逆向称量参数不合法。');
  const total=p.ask==='total';insist(total?integer(p.count):decimal(p.totalGrams));
  answer=total?mul(p.count,p.averageGrams):div(p.totalGrams,p.averageGrams);insist(total||parseNumber(answer).d===1n&&integer(Number(answer)),'颗数必须是正整数，不能四舍五入。');
  verification=total?String(p.averageGrams):String(p.totalGrams);unit=total?'克':'颗';verifyUnit='克';family='MASS_AVERAGE';unknownRole=total?'总质量':'颗数';
  prompt=total?`${p.count}颗${p.item}每颗平均重${p.averageGrams}克，一共重多少克？`:`一些${p.item}共重${p.totalGrams}克，每颗平均重${p.averageGrams}克，一共有多少颗？`;
  steps=[total?`有${p.count}颗，每颗平均${p.averageGrams}克。`:`总质量${p.totalGrams}克，每颗平均${p.averageGrams}克。`,total?`${p.count}${wrong?'＋':'×'}${p.averageGrams}＝${wrong?sum(p.count,p.averageGrams):answer}（克）。`:`${p.totalGrams}${wrong?'×':'÷'}${p.averageGrams}＝${wrong?mul(p.totalGrams,p.averageGrams):answer}（颗）。`];
  insist(!wrong||!equalNumber(total?sum(p.count,p.averageGrams):mul(p.totalGrams,p.averageGrams),answer),'错误做法不能碰巧得到正确结果。');firstWrongStep=wrong?1:null;
  check=total?`用你求的总质量除以${p.count}颗，写出计算，并与每颗${p.averageGrams}克对照。`:`用你求的颗数乘每颗${p.averageGrams}克，写出计算，并与总质量${p.totalGrams}克对照。`;
  relation='总质量＝颗数×每颗平均质量。';values=total?[`${p.count}颗`,`每颗平均${p.averageGrams}克`]:[`总质量${p.totalGrams}克`,`每颗平均${p.averageGrams}克`];
 }else if(template==='spring-total-length-v1'){
  insist(exact(p,['mode','originalCm','mmPerKg','loadKg'])&&integer(p.originalCm)&&integer(p.mmPerKg)&&integer(p.loadKg,true),'弹簧参数须为有限非负整数。');
  const initial=mul(p.originalCm,10),increase=mul(p.mmPerKg,p.loadKg);answer=sum(initial,increase);verification=String(p.loadKg);unit='毫米';verifyUnit='千克';family='INITIAL_CHANGE';unknownRole='总长';
  prompt=`一根弹簧原长${p.originalCm}厘米，每挂1千克就伸长${p.mmPerKg}毫米。挂${p.loadKg}千克时，弹簧总长多少毫米？`;
  steps=[`原长${p.originalCm}厘米＝${initial}毫米。`,`伸长${p.loadKg}×${p.mmPerKg}＝${increase}（毫米）。`,`总长${wrong?increase:`${initial}＋${increase}＝${answer}`}毫米。`];firstWrongStep=wrong?2:null;
  check=`把你求的总长减去原长（先统一成毫米），再除以每千克伸长${p.mmPerKg}毫米，写出计算，与${p.loadKg}千克对照。`;relation='总长包含原长和后来伸长的两部分。';values=[`原长${p.originalCm}厘米`,`每千克伸长${p.mmPerKg}毫米`,`挂重${p.loadKg}千克`];
 }else{
  insist(['load','initial'].includes(p.ask)&&exact(p,['mode','ask','mmPerKg','finalMm',p.ask==='load'?'originalCm':'loadKg'])&&integer(p.mmPerKg)&&Number.isSafeInteger(p.finalMm)&&p.finalMm>0&&p.finalMm<=100000,'逆向弹簧参数不合法。');
  const load=p.ask==='load';insist(load?integer(p.originalCm):integer(p.loadKg,true));
  answer=load?div(subtract(p.finalMm,mul(p.originalCm,10)),p.mmPerKg):subtract(p.finalMm,mul(p.loadKg,p.mmPerKg));
  insist(parseNumber(answer).n>=0n&&parseNumber(answer).d===1n&&Number(answer)<=10000,'逆向答案须非负且精确，不将不整除的重量取整。');
  verification=String(p.finalMm);unit=load?'千克':'毫米';verifyUnit='毫米';family='INITIAL_CHANGE';unknownRole=load?'挂重':'原长';
  prompt=load?`弹簧原长${p.originalCm}厘米，每挂1千克伸长${p.mmPerKg}毫米。现在总长${p.finalMm}毫米，挂了多少千克？`:`每挂1千克，弹簧伸长${p.mmPerKg}毫米。挂${p.loadKg}千克后总长${p.finalMm}毫米。原长多少毫米？`;
  const mistake=load?div(p.finalMm,p.mmPerKg):sum(p.finalMm,mul(p.loadKg,p.mmPerKg));insist(!wrong||!equalNumber(mistake,answer),'模拟错误不能与正确值相同。');
  steps=[load?`总长${p.finalMm}毫米，原长${p.originalCm}厘米。`:`总长${p.finalMm}毫米，伸长${p.loadKg}×${p.mmPerKg}毫米。`,load?`挂重${wrong?`${p.finalMm}÷${p.mmPerKg}＝${mistake}`:`(${p.finalMm}−${mul(p.originalCm,10)})÷${p.mmPerKg}＝${answer}`}（千克）。`:`原长${p.finalMm}${wrong?'＋':'−'}${mul(p.loadKg,p.mmPerKg)}＝${wrong?mistake:answer}（毫米）。`];firstWrongStep=wrong?1:null;
  check=load?`将你求的挂重乘${p.mmPerKg}毫米，再加原长（先换成毫米），写出计算，与总长${p.finalMm}毫米对照。`:`将你求的原长加${p.loadKg}×${p.mmPerKg}毫米，写出计算，与总长${p.finalMm}毫米对照。`;relation='用求出的未知量按原条件重建总长。';values=load?[`原长${p.originalCm}厘米`,`每千克伸长${p.mmPerKg}毫米`,`总长${p.finalMm}毫米`]:[`挂重${p.loadKg}千克`,`每千克伸长${p.mmPerKg}毫米`,`总长${p.finalMm}毫米`];
 }
 return {answer,verification,unit,verifyUnit,prompt,steps,firstWrongStep,check,relation,family,unknownRole,values};
}
export function equalNumber(a,b){try{const x=parseNumber(a),y=parseNumber(b);return x.n*y.d===y.n*x.d;}catch{return false;}}
export function deriveMassSpringCase(template,p){
 const f=massSpringFacts(template,p),wrong=p.mode==='wrong';
 return {title:f.family==='MASS_AVERAGE'?'称量小侦探 · 匿名模拟':'弹簧小侦探 · 匿名模拟',prompt:f.prompt+' 下面是匿名模拟做法，不是原作业记录。',steps:f.steps,verdict:wrong?'wrong':'correct',errorStep:f.firstWrongStep,reasons:[wrong?f.relation+' 这份做法没有保持这个关系。':f.relation+' 这份做法符合原条件。','只看最后的数字，不必核对所求对象。','数字相同就可以忽略单位。'],reason:0,repair:number(`请写出${f.unknownRole}。`,f.answer,f.unit),verify:number(f.check,f.verification,f.verifyUnit),hints:[`先圈出所求的${f.unknownRole}和已知条件。`,f.relation,`结果为${f.answer}${f.unit}。${f.check}`],solution:`${f.relation} 正确结果：${f.answer}${f.unit}。另路反查得到${f.verification}${f.verifyUnit}，符合原条件。`,family:f.family,sourceNotes:'',visual:{kind:'manual',values:f.values}};
}
