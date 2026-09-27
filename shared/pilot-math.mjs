// Exact arithmetic and a deliberately limited linear-expression parser. No eval.
const gcd=(a,b)=>b?gcd(b,a%b):(a<0n?-a:a);
export function rational(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('分母不能是0。');const g=gcd(n,d);return {n:n/g*(d<0n?-1n:1n),d:(d<0n?-d:d)/g};}
export const add=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
export const multiply=(a,b)=>rational(a.n*b.n,a.d*b.d);
export const divide=(a,b)=>rational(a.n*b.d,a.d*b.n);
export const formatFraction=a=>a.d===1n?String(a.n):`${a.n}/${a.d}`;
export function parseNumber(raw){
  const text=String(raw).trim().replaceAll('−','-').replaceAll('／','/');
  if(text.length>80||!/^[-+]?\d+(?:\.\d+)?(?:\/[-+]?\d+(?:\.\d+)?)?$/.test(text))throw Error('请填写整数、小数或分数，例如 3/8。');
  const dec=s=>{const [a,b='']=s.split('.');return rational(BigInt(a+b),10n**BigInt(b.length));};
  const [n,d]=text.split('/');return d===undefined?dec(n):divide(dec(n),dec(d));
}
const zero=()=>rational(0);
const constant=q=>({constant:q,terms:{}});
const sum=(a,b)=>{const out={constant:add(a.constant,b.constant),terms:{...a.terms}};for(const [k,v] of Object.entries(b.terms))out.terms[k]=add(out.terms[k]??zero(),v);for(const k of Object.keys(out.terms))if(out.terms[k].n===0n)delete out.terms[k];return out;};
const scale=(a,q)=>({constant:multiply(a.constant,q),terms:Object.fromEntries(Object.entries(a.terms).map(([k,v])=>[k,multiply(v,q)]).filter(([,v])=>v.n!==0n))});
function product(a,b){if(Object.keys(a.terms).length&&Object.keys(b.terms).length)throw Error('这节课只检查一次表达式，暂不支持未知数相乘。');return Object.keys(a.terms).length?scale(a,b.constant):scale(b,a.constant);}
export function parseLinear(raw){
  const text=String(raw).replace(/\s/g,'').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−－]/g,'-').replace(/＋/g,'+').replace(/（/g,'(').replace(/）/g,')');
  if(!text||text.length>160)throw Error('请写一个简短的算式。');
  const tokens=text.match(/\d+(?:\.\d+)?|[a-zA-Z甲乙橘梨]|[+*/()-]/g)??[];
  if(tokens.join('')!==text)throw Error('请使用数字、甲乙或字母，以及加减乘除和括号。');
  let i=0;
  function atom(){const t=tokens[i++];if(t==='+'||t==='-')return scale(atom(),rational(t==='-'?-1:1));if(t==='('){const v=expression();if(tokens[i++]!==')')throw Error('左右括号要配成一对。');return v;}if(/^\d/.test(t??''))return constant(parseNumber(t));if(/^[a-zA-Z甲乙橘梨]$/.test(t??''))return {constant:zero(),terms:{[t]:rational(1)}};throw Error('这个算式还没有写完整。');}
  function term(){let v=atom();while(i<tokens.length){const t=tokens[i];if(t==='*'||t==='/'){i++;const b=atom();if(t==='/'){if(Object.keys(b.terms).length)throw Error('这里只能除以已知的非零数。');v=scale(v,divide(rational(1),b.constant));}else v=product(v,b);}else if(t==='('||/^[a-zA-Z甲乙橘梨]$/.test(t)){v=product(v,atom());}else break;}return v;}
  function expression(){let v=term();while(tokens[i]==='+'||tokens[i]==='-'){const t=tokens[i++];v=sum(v,scale(term(),rational(t==='-'?-1:1)));}return v;}
  const result=expression();if(i!==tokens.length)throw Error('请检查算式的括号和运算符。');return result;
}
const equalRat=(a,b)=>a.n===b.n&&a.d===b.d;
export function equivalent(a,b){const parts=x=>String(x).replaceAll('＝','=').split('=');const aa=parts(a),bb=parts(b);if(aa.length!==bb.length||aa.length>2)throw Error('请保留题目中的等号和左右两边。');return aa.every((x,i)=>{const p=parseLinear(x),q=parseLinear(bb[i]);return equalRat(p.constant,q.constant)&&[...new Set([...Object.keys(p.terms),...Object.keys(q.terms)])].every(k=>equalRat(p.terms[k]??zero(),q.terms[k]??zero()));});}
export function gridMeasure(cells){const set=new Set(cells.map(([x,y])=>`${x},${y}`));let perimeter=0;for(const c of set){const [x,y]=c.split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(!set.has(`${x+dx},${y+dy}`))perimeter++;}return {area:set.size,perimeter};}
export function rectangleCells(rows,cols){return Array.from({length:rows*cols},(_,i)=>[i%cols,Math.floor(i/cols)]);}
const astOps=new Set(['add','subtract','multiply','divide']);
export function validateExpressionAST(node){
  if(!node||typeof node!=='object'||Array.isArray(node))throw Error('算式结构不完整。');
  if(node.type==='number'){
    if(!Number.isSafeInteger(node.value))throw Error('算式中的数必须是安全整数。');
    return node;
  }
  if(node.type!=='operation'||!astOps.has(node.operator))throw Error('算式只能使用加、减、乘、除。');
  validateExpressionAST(node.left);validateExpressionAST(node.right);return node;
}
export function evaluateExpressionAST(node){
  validateExpressionAST(node);if(node.type==='number')return rational(node.value);
  const left=evaluateExpressionAST(node.left),right=evaluateExpressionAST(node.right);
  if(node.operator==='add')return add(left,right);
  if(node.operator==='subtract')return add(left,multiply(right,rational(-1)));
  if(node.operator==='multiply')return multiply(left,right);
  return divide(left,right);
}
export function expressionASTText(node){
  validateExpressionAST(node);if(node.type==='number')return String(node.value);
  const signs={add:'＋',subtract:'－',multiply:'×',divide:'÷'};
  const body=`${expressionASTText(node.left)} ${signs[node.operator]} ${expressionASTText(node.right)}`;
  return node.grouped?`(${body})`:body;
}
export function validateTask(task,answer){
  try {
    if(!answer||typeof answer!=='object'||Array.isArray(answer))return {status:'invalidInput',message:'先写下你的答案。'};
    if(task.kind==='choice'){
      if(!task.options.some(o=>o.id===answer.value))return {status:'invalidInput',message:'请先选一个答案。'};
      return {status:answer.value===task.expected?'correct':'incorrect',message:answer.value===task.expected?'这个判断和题目的关系一致。':'再看一次条件，尤其是哪些量或操作发生了改变。'};
    }
    if(task.kind==='expression')return {status:equivalent(answer.value,task.expected)?'correct':'incorrect',message:equivalent(answer.value,task.expected)?'你写的算式保留了原来的数量关系。看看下面的步骤，再讲讲你把哪一部分换掉了。':'再找一次要替换的那个量，把相等的全部内容一起换进去。括号外的乘法、加减法也要保留。'};
    const fields=task.fields??[{key:'value',expected:task.expected,label:'答案',unit:task.unit}];
    // Units belong to the authored question and are printed beside the input.
    // Old saved unit selections do not affect a numeric answer's correctness.
    for(const f of fields){if(String(answer[f.key]??'').trim()==='')return {status:'invalidInput',message:`请补上${f.label}。`};parseNumber(answer[f.key]);}
    const correct=fields.every(f=>equalRat(parseNumber(answer[f.key]),parseNumber(f.expected)));
    return {status:correct?'correct':'incorrect',message:correct?'计算结果正确。看看下面的过程，和你的方法一样吗？':'计算结果还不对。先找清题目问什么，再检查每一步，也可以点提示。'};
  }catch(e){return {status:'invalidInput',message:e.message};}
}
