// SERVER ONLY. Bounded exact arithmetic; no eval, executable input or answer-key export.
import {add,multiply,divide,parseNumber,rational} from '../shared/pilot-math.mjs';
import {equalNumber} from '../shared/detective-mass-spring.mjs';

export const CHECK_POLICY_VERSION='detective-check.v2';
const zero=()=>rational(0),one=()=>rational(1);
const neg=a=>multiply(a,rational(-1));
const same=(a,b)=>a.n===b.n&&a.d===b.d;
const normalize=s=>s.replace(/\s/g,'').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−－]/g,'-').replace(/＋/g,'+').replace(/（/g,'(').replace(/）/g,')').replaceAll('□','x');

function parse(raw){
 if(typeof raw!=='string'||!raw.trim()||raw.length>160)throw Error('empty');
 const text=normalize(raw),tokens=text.match(/\d+(?:\.\d+)?|x|[+*/()-]/g)??[];
 if(tokens.join('')!==text||tokens.length>80)throw Error('syntax');
 let i=0,nodes=0;
 const node=(op,left,right)=>{if(++nodes>64)throw Error('size');return {op,left,right};};
 function atom(depth){
  if(depth>20)throw Error('depth');const t=tokens[i++];
  if(t==='+'||t==='-')return node(t==='+'?'plus':'neg',atom(depth+1));
  if(t==='('){const a=expression(depth+1);if(tokens[i++]!==')')throw Error('brackets');return a;}
  if(t==='x')return node('answer');
  if(/^\d/.test(t??'')&&t.length<=30)return {...node('number'),value:parseNumber(t)};
  throw Error('token');
 }
 function term(depth){let a=atom(depth);while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++];a=node(op,a,atom(depth));}return a;}
 function expression(depth){let a=term(depth);while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++];a=node(op,a,term(depth));}return a;}
 const tree=expression(0);if(i!==tokens.length)throw Error('tail');return tree;
}
function evaluate(t,answer){
 if(t.op==='number')return t.value;if(t.op==='answer')return answer;
 const a=evaluate(t.left,answer);if(t.op==='plus')return a;if(t.op==='neg')return neg(a);
 const b=evaluate(t.right,answer);
 return t.op==='+'?add(a,b):t.op==='-'?add(a,neg(b)):t.op==='*'?multiply(a,b):divide(a,b);
}
function pAdd(a,b){const c=Array.from({length:Math.max(a.length,b.length)},(_,i)=>add(a[i]??zero(),b[i]??zero()));while(c.length>1&&!c.at(-1).n)c.pop();return c;}
function pMul(a,b){
 if(a.length+b.length>7)throw Error('degree');const c=Array.from({length:a.length+b.length-1},zero);
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)c[i+j]=add(c[i+j],multiply(a[i],b[j]));
 while(c.length>1&&!c.at(-1).n)c.pop();return c;
}
const cst=q=>({n:[q],d:[one()]});
function symbolic(t){
 if(t.op==='number')return cst(t.value);if(t.op==='answer')return {n:[zero(),one()],d:[one()]};
 const a=symbolic(t.left);if(t.op==='plus')return a;if(t.op==='neg')return {n:a.n.map(neg),d:a.d};
 const b=symbolic(t.right);
 if(t.op==='*')return {n:pMul(a.n,b.n),d:pMul(a.d,b.d)};
 if(t.op==='/'){if(b.n.every(x=>!x.n))throw Error('zero');return {n:pMul(a.n,b.d),d:pMul(a.d,b.n)};}
 return {n:pAdd(pMul(a.n,b.d),pMul(b.n,a.d).map(x=>t.op==='-'?neg(x):x)),d:pMul(a.d,b.d)};
}
function equalFunction(a,b){return pAdd(pMul(a.n,b.d),pMul(b.n,a.d).map(neg)).every(x=>!x.n);}
const usesAnswer=t=>t.op==='answer'||!!(t.left&&usesAnswer(t.left))||!!(t.right&&usesAnswer(t.right));
const hasCalculation=t=>['+','-','*','/'].includes(t.op)||!!(t.left&&hasCalculation(t.left))||!!(t.right&&hasCalculation(t.right));
function answerBindings(tree,answer){
 if(usesAnswer(tree))return {all:tree,singles:[],explicit:true};
 const matches=[];
 function visit(t,path){
  // A bare result is not an operation on the child's answer.
  if(path.length&&same(evaluate(t,answer),answer))matches.push(path);
  if(t.left)visit(t.left,[...path,'left']);if(t.right)visit(t.right,[...path,'right']);
 }
 visit(tree,[]);
 const at=(t,path)=>path.length?{...t,[path[0]]:at(t[path[0]],path.slice(1))}:{op:'answer'};
 const singles=matches.map(path=>at(tree,path));
 // Also support distributing a repeated answer: 0.5×20 + 0.5×5.
 const minimal=matches.filter(p=>!matches.some(q=>q.length>p.length&&p.every((s,i)=>s===q[i])));
 let all=tree;for(const p of minimal)all=at(all,p);
 if(!minimal.length)return null;
 return {all,singles,explicit:false};
}
const containsKnownAnswer=(t,a)=>!usesAnswer(t)&&same(evaluate(t,a),a)||!!(t.left&&containsKnownAnswer(t.left,a))||!!(t.right&&containsKnownAnswer(t.right,a));

export function evaluateCheckEvidence(q,answer,value,expression){
 const pending=reason=>({verified:false,status:'pending-parent',reason,policyVersion:CHECK_POLICY_VERSION});
 if(typeof expression!=='string'||!expression.trim())return pending('未留下检验式；答案是否改对与是否有独立检验证据分开记录。');
 try{
  const a=parseNumber(answer),v=parseNumber(value),tree=parse(expression);
  if(!hasCalculation(tree))return pending('只填一个数值不能证明做过反查，请保留实际运算或交家长核对。');
  if(!same(evaluate(tree,a),v))return pending('算式与填入的检验结果尚不一致，请家长核对原记录。');
  const bindings=answerBindings(tree,a);
  if(!bindings)return pending('算式中本次答案没有参与有效的检验关系，先保留原记录供家长核对。');
  for(const [i,relation] of (q.checkRelations??[{pattern:q.checkPattern,target:q.checkTarget}]).entries()){
   if(!equalNumber(value,relation.target))continue;
   const expectedTree=parse(relation.pattern),expected=symbolic(expectedTree);
   // Repeated copies normally all denote the answer. A single binding is also
   // legitimate when an authored known condition happens to have the same value
   // (e.g. 26 grams / 26 beans); equality of values must not erase their roles.
   const candidates=bindings.explicit||!containsKnownAnswer(expectedTree,a)?[bindings.all]:[bindings.all,...bindings.singles];
   for(const candidate of candidates)if(equalFunction(symbolic(candidate),expected))return {verified:true,status:'verified',reason:'检验式使用了本次答案，运算和原条件的反向关系一致。',policyVersion:CHECK_POLICY_VERSION,relationIndex:i};
  }
  return pending('这条方法暂未通过自动关系核验，已保存原式，可由家长核对；不表示数学方法一定错误。');
 }catch{return pending('这条写法暂不能自动核验，已保留原记录，可请家长核对其他合理方法。');}
}

// Read-only validation of previously sealed v1 snapshots. Never grants current eligibility.
export function legacyCheckEvidence(q,a,answer,value,expression){
 try{
  if(!equalNumber(q.checkValue(answer),value)||!equalNumber(value,q.checkTarget))return false;
  if(a.mode!=='review')return true;
  return normalize(expression??'')===normalize(q.checkPattern.replaceAll('□',answer));
 }catch{return false;}
}
