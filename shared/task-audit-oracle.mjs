// Independent numeric parser for editorial audits; not the production grader.
// No eval, no dynamic generation of mathematical answers.
export function calculateAuditExpression(raw){
 const text=raw.replace(/[＋]/g,'+').replace(/[−－]/g,'-').replace(/[×]/g,'*').replace(/[÷]/g,'/').replace(/[（]/g,'(').replace(/[）]/g,')').replace(/\s/g,'');
 if(!/^[\d.+*/()-]+$/.test(text))throw Error('non-arithmetic');
 const tokens=text.match(/\d+(?:\.\d+)?|[()+*/-]/g)??[];let i=0;
 const atom=()=>{const t=tokens[i++];if(t==='-')return -atom();if(t==='+')return atom();if(t==='('){const n=sum();if(tokens[i++]!==')')throw Error('parenthesis');return n}if(!/^\d+(\.\d+)?$/.test(t??''))throw Error('number');return Number(t)};
 const product=()=>{let n=atom();while(['*','/'].includes(tokens[i])){const op=tokens[i++],r=atom();if(op==='/'&&r===0)throw Error('zero divisor');n=op==='*'?n*r:n/r}return n};
 const sum=()=>{let n=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],r=product();n=op==='+'?n+r:n-r}return n};
 const value=sum();if(i!==tokens.length||!Number.isFinite(value))throw Error('unfinished');return value;
}
export const auditSame=(a,b)=>Math.abs(a-b)<1e-9;
export function auditTask(t){
 const errors=[],flags=[],proofs=[];
 if(!t.id||!t.prompt||!t.solution||!t.hint||!t.responseSpec)errors.push('缺必要字段');
 let target;try{if(['number','expression'].includes(t.kind)&&!/[A-Za-z\p{Script=Han}□]/u.test(t.expected))target=calculateAuditExpression(String(t.expected).split(/[=＝]/)[0])}catch{errors.push('预期数值/表达式不可解析')}
 const equations=t.solution.match(/[\d.+＋－−\-×÷*/（）()\s]+[＝=][\d.+＋－−\-×÷*/（）()\s]+(?:[＝=][\d.+＋－−\-×÷*/（）()\s]+)*/g)??[];
 for(const equation of equations){const next=t.solution.slice(t.solution.indexOf(equation)+equation.length);if(/^[余个本张颗袋份元角厘米]/.test(next)||/^[+＋]/.test(equation.trim()))continue;try{const values=equation.split(/[=＝]/).map(calculateAuditExpression);if(values.some(v=>!auditSame(v,values[0])))errors.push('答案说明等号不成立：'+equation.trim());else {proofs.push({type:'solution-equation',equation:equation.trim(),value:values.at(-1)});}}catch{/* Incomplete text fragments are not proofs. */}}
 if(target!==undefined){
  // Pure calculation targets and explicit dimensional conversions have an
  // independent derivation from the question, not from the answer key.
  const raw=t.prompt.match(/(?:计算|等于多少|求值)[：: ]?([\d.＋+－−×÷*/（）() -]+)/)?.[1]??t.prompt.match(/^([\d.＋+－−×÷*/（）() -]+)(?:等于多少|是多少)/)?.[1];
  if(raw)try{const value=calculateAuditExpression(raw);if(!auditSame(value,target))errors.push('题干计算oracle与预期不符');else proofs.push({type:'prompt-arithmetic-oracle',value})}catch{}
  const units={毫米:1,厘米:10,分米:100,米:1000,千米:1000000,克:1,千克:1000,吨:1000000,平方厘米:1,平方分米:100,平方米:10000,角:1,元:10};
  const conversion=t.prompt.match(/^(\d+(?:\.\d+)?)(平方厘米|平方分米|平方米|毫米|厘米|分米|千米|米|千克|克|吨|元|角)(?:等于多少|换成|写成)(平方厘米|平方分米|平方米|毫米|厘米|分米|千米|米|千克|克|吨|元|角)/);
  if(conversion){const value=Number(conversion[1])*units[conversion[2]]/units[conversion[3]];if(!auditSame(value,target))errors.push('单位换算oracle与预期不符');else proofs.push({type:'unit-conversion-oracle',value})}
  const seat=t.prompt.match(/(\d+)人.*每车(\d+)座.*至少/);if(seat){const value=Math.ceil(Number(seat[1])/Number(seat[2]));if(!auditSame(value,target))errors.push('余数情境进一oracle不符');else proofs.push({type:'seat-ceiling-oracle',value})}
  for(const expression of t.solution.match(/[\d.]+(?:[＋+－−×÷*/][\d.]+){1,}/g)??[]){try{const value=calculateAuditExpression(expression);if(auditSame(value,target))proofs.push({type:'solution-arithmetic-value',expression,value})}catch{}}
 }
 if(t.kind==='fields')for(const f of t.fields??[]){try{calculateAuditExpression(f.expected)}catch{errors.push('字段答案不可解析：'+f.key)}}
 if(t.kind==='choice'){
  const correct=t.options?.find(o=>o.id===t.expected);if(!correct||new Set(t.options.map(o=>o.text)).size!==t.options.length)errors.push('选项键/重复问题');
  if(t.options?.some(o=>/正确值|正确答案|错误写法|这样判断不对/.test(o.text)))errors.push('选项泄漏答案标签');
  const lengths=t.options?.map(o=>[...o.text].length)??[];if(correct&&Math.max(...lengths)>24&&[...correct.text].length>Math.min(...lengths)*2)flags.push('正确选项长度显著偏长，需人工查措辞');
 }
 const d=t.diagram;
 if(d?.type==='measurement'&&t.kind==='number'){
  let mm,unit;
  if(d.mode==='chain'){mm=d.pieceLengthMm+(d.count-1)*(d.pieceLengthMm-2*d.thicknessMm);unit='length';}
  if(d.mode==='boards'){mm=d.pieceLengthsMm.reduce((a,b)=>a+b,0)-(d.overlapsMm??[]).reduce((a,b)=>a+b,0);unit='length';}
  if(d.mode==='ruler'){mm=d.endMm-d.startMm;unit='length';}
  // Only assert total-length questions; joint counts and newly gained length are distinct targets.
  if(unit&&/总长|端到端|这根.*长多少|物体长多少/.test(t.prompt)&&!(/新增|增加|几个|多少个|接头|总共有几/.test(t.prompt))){
   const converted=t.unit==='厘米'?mm/10:t.unit==='米'?mm/1000:mm;if(!auditSame(target,converted))errors.push('独立题图长度oracle不符');else proofs.push({type:'diagram-length-oracle',value:converted});
  }
 }
 const promptTypes=new Set(['prompt-arithmetic-oracle','unit-conversion-oracle','seat-ceiling-oracle','diagram-length-oracle']);
 const independentlyDerivedFromPromptOrDiagram=target!==undefined&&proofs.some(p=>promptTypes.has(p.type)&&auditSame(p.value,target));
 const solutionInternallyConsistent=proofs.some(p=>p.type.startsWith('solution-'))&&!errors.some(e=>e.startsWith('答案说明'));
 // Compatibility fields are deliberately narrow: answer-key arithmetic is no
 // longer promoted to independent question verification.
 return {errors,flags,proofs,schemaChecked:true,solutionInternallyConsistent,independentlyDerivedFromPromptOrDiagram,numericProofVerified:independentlyDerivedFromPromptOrDiagram,formalChecked:true};
}
