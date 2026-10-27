// SERVER ONLY. Never import this file, the oracle, or its answer data in React.
import {deriveImportedCase} from '../shared/detective-inbox.mjs';
import {massSpringFacts} from '../shared/detective-mass-spring.mjs';
import {parseNumber,multiply,divide,add,formatFraction} from '../shared/pilot-math.mjs';

export const SELF_ENGINE_VERSION='detective-self.v1';
export const SELF_FAMILIES=[
 {id:'MASS_AVERAGE',title:'称量与平均',focus:'总量、每份、份数'},
 {id:'INITIAL_CHANGE',title:'弹簧原长与伸长',focus:'原有的和增加的'},
 {id:'UNIT_GROUPING',title:'卡片与整组',focus:'组数和张数'},
 {id:'OPERATION_ORDER',title:'运算顺序',focus:'先乘除，再加减'},
 {id:'UNIT_CONVERSION',title:'长度单位',focus:'数量和单位一起看'},
 {id:'EQUAL_GROUPS',title:'相同的几份',focus:'每份、份数和总数'},
 {id:'UNIT_ORDERING',title:'不同单位比长短',focus:'统一单位后再比较'},
 {id:'WRAP_RELATION',title:'绕线多与少',focus:'两种条件一起核对'},
];
const rationalValue=x=>formatFraction(parseNumber(x));
const calc=(op,a,b)=>formatFraction(op(parseNumber(a),parseNumber(b)));
const mul=(a,b)=>calc(multiply,a,b),div=(a,b)=>calc(divide,a,b),sum=(a,b)=>calc(add,a,b);
export function selfQuestion(family,index){
 if(!SELF_FAMILIES.some(x=>x.id===family)||!Number.isInteger(index)||index<0||index>=256)throw Error('该题族暂无未见过的审定参数，请家长安排回补。');
 const k=index+1,role=index%4;
 let template,p,answer,question,unit,checkTarget,checkPattern,checkValue,unknownRole,visual;
 if(family==='MASS_AVERAGE'){
  const count=k+24,average=(role+1)/2,total=count*average;
  template=role%2?'mass-average-inverse-v1':'batch-average-mass-v1';
  p=template==='batch-average-mass-v1'?{mode:'correct',item:'豆子',count,totalGrams:total}:role===1?{mode:'correct',ask:'count',item:'豆子',totalGrams:total,averageGrams:average}:{mode:'correct',ask:'total',item:'玻璃珠',count,averageGrams:average};
 }else if(family==='INITIAL_CHANGE'){
  const originalCm=k+9,mmPerKg=role+2,loadKg=role+3,finalMm=originalCm*10+mmPerKg*loadKg;
  template=role%2?'spring-reverse-v1':'spring-total-length-v1';p=role===1?{mode:'correct',ask:'load',originalCm,mmPerKg,finalMm}:role===3?{mode:'correct',ask:'initial',mmPerKg,loadKg,finalMm}:{mode:'correct',originalCm,mmPerKg,loadKg};
 }else if(family==='UNIT_GROUPING'){
  const n=3+role,thickness=2+role,groups=k+3,total=groups*n;
  template='card-thickness-grouping-v1';p={mode:'correct',cardsPerGroup:n,groupThicknessMm:thickness,targetMm:groups*thickness};
  if(role%2){question=`${total}张相同卡片，每${n}张厚${thickness}毫米，叠起来一共厚多少毫米？`;answer=String(groups*thickness);unit='毫米';unknownRole='总厚度';checkPattern=`□ ÷ ${thickness} × ${n}`;checkTarget=String(total);checkValue=a=>mul(div(a,thickness),n);}
 }else if(family==='OPERATION_ORDER'){
  const a=k+10,b=role+3,c=role+2;
  template='arithmetic-order-v1';p={mode:'correct',a,b,c,operator:'add-multiply'};
  if(role%2){question=`算式 □＋${b}×${c} 的结果是${a+b*c}。□里是多少？`;answer=String(a);unit='';unknownRole='加数';checkPattern=`□ ＋ ${b} × ${c}`;checkTarget=String(a+b*c);checkValue=x=>sum(x,b*c);}
 }else if(family==='UNIT_CONVERSION'){
  template='length-conversion-v1';p={mode:'correct',value:k+2,from:'米',to:'厘米'};
  if(role%2){question=`${(k+2)*100}厘米等于多少米？`;answer=String(k+2);unit='米';unknownRole='大单位的数量';checkPattern='□ × 100';checkTarget=String((k+2)*100);checkValue=x=>mul(x,100);}
 }else if(family==='EQUAL_GROUPS'){
  const groups=k+3,each=role+4,total=groups*each;template='equal-groups-v1';p={mode:'correct',groups,each};
  if(role%2){question=`${total}块积木，每袋装${each}块，可以装几袋？`;answer=String(groups);unit='袋';unknownRole='份数';checkPattern=`□ × ${each}`;checkTarget=String(total);checkValue=x=>mul(x,each);}
 }else if(family==='UNIT_ORDERING'){
  const metres=k+2,cm=(k+1)*100+20+(index%7)*5;
  template='length-ordering-v1';p={mode:'correct',items:[{value:metres,unit:'米'},{value:cm,unit:'厘米'},{value:k+1,unit:'分米'}]};
  question=role%2?`一条绳长${metres}米，剪去${cm}厘米后还剩多少厘米？`:`一条绳长${metres}米，另一条长${cm}厘米。较长的比另一条长多少厘米？`;
  answer=String(metres*100-cm);unit='厘米';unknownRole=role%2?'剩下的长度':'长度差';checkPattern=`□ ＋ ${cm}`;checkTarget=String(metres*100);checkValue=x=>sum(x,cm);
 }else{
  const lowTurns=2+Math.floor(index/40),highTurns=lowTurns+2,surplusDm=index%40+2,shortageDm=surplusDm+2;
  template='wrap-surplus-shortage-v1';p={mode:'correct',lowTurns,highTurns,surplusDm,shortageDm,scene:'spool'};
  if(role%2){const circle=(surplusDm+shortageDm)/2,length=lowTurns*circle+surplusDm;question=`每圈长${circle}分米，一根绳绕线轴${lowTurns}圈后多${surplusDm}分米。若绕${highTurns}圈，还差多少分米？`;answer=String(shortageDm);unit='分米';unknownRole='还差的长度';checkPattern=`${highTurns} × ${circle} − □`;checkTarget=String(length);checkValue=x=>sum(highTurns*circle,`-${x}`);}
 }
 const c=deriveImportedCase(template,p);
 if(!question){
  question=c.prompt.replace(/下面.*$/,'').replace(/，并检查.*。/,'。').replace(/，并检查.*$/,'。').replace(/，并检查小智的运算顺序。/,'。');
  answer=c.repair.answer;unit=c.repair.unit;unknownRole='所求结果';
  if(['MASS_AVERAGE','INITIAL_CHANGE'].includes(family)){
   const f=massSpringFacts(template,p);question=f.prompt;unknownRole=f.unknownRole;
   if(template==='batch-average-mass-v1'){checkPattern=`□ × ${p.count}`;checkTarget=String(p.totalGrams);checkValue=x=>mul(x,p.count);}
   else if(template==='mass-average-inverse-v1'&&p.ask==='total'){checkPattern=`□ ÷ ${p.count}`;checkTarget=String(p.averageGrams);checkValue=x=>div(x,p.count);}
   else if(template==='mass-average-inverse-v1'){checkPattern=`□ × ${p.averageGrams}`;checkTarget=String(p.totalGrams);checkValue=x=>mul(x,p.averageGrams);}
   else if(template==='spring-total-length-v1'){checkPattern=`(□ − ${p.originalCm*10}) ÷ ${p.mmPerKg}`;checkTarget=String(p.loadKg);checkValue=x=>div(sum(x,-p.originalCm*10),p.mmPerKg);}
   else if(p.ask==='load'){checkPattern=`${p.originalCm*10} ＋ □ × ${p.mmPerKg}`;checkTarget=String(p.finalMm);checkValue=x=>sum(p.originalCm*10,mul(x,p.mmPerKg));}
   else{checkPattern=`□ ＋ ${p.loadKg} × ${p.mmPerKg}`;checkTarget=String(p.finalMm);checkValue=x=>sum(x,p.loadKg*p.mmPerKg);}
  }else if(family==='UNIT_GROUPING'){checkPattern=`□ ÷ ${p.cardsPerGroup} × ${p.groupThicknessMm}`;checkTarget=String(p.targetMm);checkValue=x=>mul(div(x,p.cardsPerGroup),p.groupThicknessMm);}
  else if(family==='OPERATION_ORDER'){question=`计算 ${p.a}＋${p.b}×${p.c}。`;checkPattern=`(□ − ${p.a}) ÷ ${p.c}`;checkTarget=String(p.b);checkValue=x=>div(sum(x,-p.a),p.c);}
  else if(family==='UNIT_CONVERSION'){checkPattern='□ ÷ 100';checkTarget=String(p.value);checkValue=x=>div(x,100);}
  else if(family==='EQUAL_GROUPS'){checkPattern=`□ ÷ ${p.each}`;checkTarget=String(p.groups);checkValue=x=>div(x,p.each);}
  else if(family==='WRAP_RELATION'){checkPattern=`(${p.highTurns} × ((${p.surplusDm} ＋ ${p.shortageDm}) ÷ ${p.highTurns-p.lowTurns})) − □`;checkTarget=String(p.shortageDm);checkValue=x=>sum(p.highTurns*((p.surplusDm+p.shortageDm)/(p.highTurns-p.lowTurns)),`-${x}`);}
 }
 visual=c.visual;
 return {id:`${SELF_ENGINE_VERSION}:${family}:${index}`,family,index,template,parameters:p,sourceKind:'self-answer',unknownRole,question,unit,answer:rationalValue(answer),checkTarget:rationalValue(checkTarget),checkPattern,checkValue,visual,
  hint:'圈出所求的量，再把已知量的单位写在旁边。提示已经记录；可以继续学习，这次不算无提示复测。',
  explanation:`本题所求是${unknownRole}，结果为${answer}${unit}。将答案代入“${checkPattern}”，应回到已知条件${checkTarget}。检查时既要算出反查结果，也要确认它与原题条件相同。`};
}
export function publicSelfQuestion(q,phase='first',mode='practice'){
 const out={id:q.id,errorFamilyId:q.family,questionVariantId:q.id,unknownRole:q.unknownRole,prompt:q.question,unit:q.unit,sourceKind:q.sourceKind};
 // No answer, examples, model, hidden correctness, or solution before feedback.
 if(phase!=='first'&&mode!=='review')out.check={pattern:q.checkPattern,target:q.checkTarget,instruction:'□代表你自查后的答案。亲自算出左边的值，和右边的已知条件比较。'};
 return out;
}
export function familyExamples(family){
 const q=selfQuestion(family,240),correct=deriveImportedCase(q.template,q.parameters),p={...q.parameters,mode:'wrong'};
 if(q.template==='batch-average-mass-v1')p.wrongDivisor=2;
 return [{id:`DET-V2-${family}-ERROR`,content:deriveImportedCase(q.template,p)},{id:`DET-V2-${family}-CONTROL`,content:correct}];
}
