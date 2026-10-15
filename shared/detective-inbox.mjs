import {isDeepStrictEqual} from 'node:util';
import {fingerprint,insist,validId,validateCase} from './detective-model.mjs';
export const ORACLE_VERSION='detective-oracle.v1';
export const INBOX_PATH='content/detective/inbox/';
export const inboxFilename=x=>typeof x==='string'&&/^DT-[A-Za-z0-9_-]{1,90}\.json$/.test(x);
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
export const canonicalize=x=>Array.isArray(x)?x.map(canonicalize):plain(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonicalize(x[k])])):x;
const exact=(x,keys)=>plain(x)&&Object.keys(x).every(k=>keys.includes(k));
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const positive=x=>Number.isSafeInteger(x)&&x>0&&x<=100000;
const number=(question,answer,unit='')=>({kind:'number',question,unit,options:[],answer:String(answer)});
const manual=values=>({kind:'manual',values});
const base=(title,prompt,steps,verdict,errorStep,reasons,repair,verify,hints,solution,family,visual)=>({title,prompt,steps,verdict,errorStep,reasons,reason:0,repair,verify,hints,solution,family,sourceNotes:'',visual});
const equal=isDeepStrictEqual;
export const INBOX_TEMPLATES=['card-thickness-grouping-v1','arithmetic-order-v1','length-conversion-v1','equal-groups-v1','length-ordering-v1'];
// Each supported template owns ALL semantic text, steps, answer, inverse and figure.
// We do not try to prove arbitrary natural-language mathematics from a claimed answer.
export function deriveImportedCase(template,p){
 if(!INBOX_TEMPLATES.includes(template))return null;
 const wrong=p?.mode==='wrong';insist(['wrong','correct'].includes(p?.mode),'模板必须指定wrong或correct。');
 if(template==='card-thickness-grouping-v1'){
  insist(exact(p,['mode','cardsPerGroup','groupThicknessMm','targetMm'])&&[p.cardsPerGroup,p.groupThicknessMm,p.targetMm].every(positive));
  const {cardsPerGroup:n,groupThicknessMm:t,targetMm:m}=p;insist(n>=2&&n<=20&&m%t===0&&m>t&&m/t*n<=100000,'卡片须整组、张数范围有限。');const groups=m/t,total=groups*n;
  return base('卡片厚度调查',`${n}张相同的卡片叠在一起厚${t}毫米。要叠到${m}毫米厚，需要多少张卡片？`,[`${m}÷${t}=${groups}（组）`,wrong?`所以需要${groups}张卡片。`:`${groups}×${n}=${total}（张）`],wrong?'wrong':'correct',wrong?1:null,[wrong?'把组数当成了张数，还要乘每组的张数。':'先求组数，再乘每组张数，结果符合厚度条件。','卡片厚度不能用除法比较。','张数只要等于目标毫米数。'],number('一共需要多少张卡片？',total,'张'),number(`${total}张卡片，每${n}张为一组。一共叠起来厚多少毫米？`,total/n*t,'毫米'),['先圈出“一组有几张”和“一组厚多少”。','目标厚度里面有几组？组数和张数相同吗？',`求出组数后，每一组都要数${n}张；再用厚度逆查。`],`${m}÷${t}=${groups}组，${groups}×${n}=${total}张；逆查${total}÷${n}×${t}=${m}毫米。`,'UNIT_GROUPING',manual([`一组${n}张`,`一组厚${t}毫米`,`目标${m}毫米`]));
 }
 if(template==='arithmetic-order-v1'){
  insist(exact(p,['mode','a','b','c','operator'])&&[p.a,p.b,p.c].every(positive)&&['add-multiply','subtract-divide'].includes(p.operator));const {a,b,c,operator}=p;insist(Math.max(a,b,c)<=1000);let expression,first,result,mistake,inverse,verify;
  if(operator==='add-multiply'){expression=`${a}+${b}×${c}`;first=b*c;result=a+first;mistake=(a+b)*c;inverse=`${result}−${a}=${first}，${first}÷${c}=${b}`;verify=number(`从正确结果里减去${a}，再除以${c}，得到多少？`,b);}
  else {insist(b%c===0&&a>=b/c&&a>b&&(a-b)%c===0&&c>1,'除减模板须非负、整除且两种顺序有不同结果。');expression=`${a}−${b}÷${c}`;first=b/c;result=a-first;mistake=(a-b)/c;inverse=`${a}−${result}=${first}，${first}×${c}=${b}`;verify=number(`用${a}减去正确结果，再乘${c}，得到多少？`,b);}
  insist(result!==mistake&&result<=1000000&&mistake<=1000000,'错误顺序必须产生不同结果。');
  const step=operator==='add-multiply'?`${b}×${c}=${first}`:`${b}÷${c}=${first}`;
  return base('运算顺序调查',`请计算${expression}，并检查小智的运算顺序。`,wrong?[operator==='add-multiply'?`先算${a}+${b}=${a+b}`:`先算${a}−${b}=${a-b}`,`原式=${mistake}`]:[`先算${step}`,`原式=${result}`],wrong?'wrong':'correct',wrong?0:null,[wrong?'没有括号时，要先算乘除，再算加减。':'先算乘除，再算加减，顺序符合规则。','没有括号就必须全部从左到右。','乘除和加减的顺序可以任意交换。'],number('这道算式的正确结果是多少？',result),verify,['先看清算式里有哪些运算符号。','没有括号时，乘除和加减谁先算？','把乘除的结果当成一个数，再处理加减。'],`${expression}=${result}；反向检查：${inverse}。`,'OPERATION_ORDER',manual([`算式：${expression}`,'没有括号']));
 }
 const units={毫米:1,厘米:10,分米:100,米:1000,千米:1000000};
 if(template==='length-conversion-v1'){
  insist(exact(p,['mode','value','from','to'])&&positive(p.value)&&Object.hasOwn(units,p.from)&&Object.hasOwn(units,p.to)&&units[p.from]>units[p.to]);const {value:n,from,to}=p,factor=units[from]/units[to],result=n*factor;insist(Number.isSafeInteger(result)&&result<=100000000);
  return base('长度记录调查',`把${n}${from}换算成${to}，并检查小智的换算。`,[`1${from}=${factor}${to}`,`${n}${from}=${wrong?n:result}${to}`],wrong?'wrong':'correct',wrong?1:null,[wrong?'单位变小，每个原单位都要换成多个新单位。':'每个原单位换成对应的小单位，数量关系一致。','长度单位变化，数字永远不用变。','数字越小，长度就一定越短。'],number(`正确应当是几${to}？`,result,to),number(`${result}${to}相当于几${from}？`,n,from),['先找出两个单位之间的关系。',`1${from}里有几个${to}？`,`每个${from}都换成${factor}个${to}，再反过来检查。`],`${n}×${factor}=${result}，所以${n}${from}=${result}${to}；反查${result}÷${factor}=${n}。`,'UNIT_CONVERSION',manual([`原长度${n}${from}`,`换成${to}`]));
 }
 if(template==='equal-groups-v1'){
  insist(exact(p,['mode','groups','each'])&&[p.groups,p.each].every(positive)&&p.groups>=2&&p.each>=2&&p.groups*p.each!==p.groups+p.each&&p.groups*p.each<=1000000);const {groups:g,each:e}=p,total=g*e;
  return base('分组数量调查',`有${g}袋积木，每袋${e}块。一共有多少块？`,[wrong?`${g}+${e}=${g+e}（块）`:`${g}×${e}=${total}（块）`],wrong?'wrong':'correct',wrong?0:null,[wrong?'每袋相同，要把每袋的数量重复相加。':'袋数乘每袋块数，就是总块数。','袋数和每袋块数直接相加就是总量。','积木数量不能用除法检查。'],number('一共有多少块积木？',total,'块'),number(`把${total}块积木每袋装${e}块，可以装几袋？`,g,'袋'),['每一袋都放着相同数量的积木。','把每袋数量重复相加，重复几次？','用总数除以每袋的块数，看看能否回到原袋数。'],`${g}×${e}=${total}块；反查${total}÷${e}=${g}袋。`,'EQUAL_GROUPS',manual([`${g}袋`,`每袋${e}块`]));
 }
 if(template==='length-ordering-v1'){
  insist(exact(p,['mode','items'])&&Array.isArray(p.items)&&p.items.length>=3&&p.items.length<=5&&p.items.every(x=>exact(x,['value','unit'])&&positive(x.value)&&Object.hasOwn(units,x.unit)));
  const labels=p.items.map(x=>`${x.value}${x.unit}`),values=p.items.map(x=>x.value*units[x.unit]);insist(new Set(values).size===values.length,'排序长度不能相等。');
  const indexes=values.map((_,i)=>i).sort((a,b)=>values[b]-values[a]),order=indexes.map(i=>labels[i]),shown=[...order];if(wrong)[shown[0],shown[1]]=[shown[1],shown[0]];
  const max=values[indexes[0]];return base('长度排列调查',`把这些长度从长到短排列：${labels.join('、')}。`,[shown.join(' > ')],wrong?'wrong':'correct',wrong?0:null,[wrong?'统一单位后，前两个长度的位置颠倒了。':'统一单位比较后，确实按长度从大到小排列。','只按数字大小比较，不用看单位。','写在前面的长度一定更长。'],{kind:'ordering',question:'请按真实长度从长到短排列。',unit:'',options:labels,answer:order.join('|')},number('最长的这一段换成毫米是多少？',max,'毫米'),['先看单位是否相同。','把各长度都换成毫米，再比较。','从毫米数最大的开始排列，注意检查相邻两项。'],`统一成毫米：${labels.map((x,i)=>`${x}=${values[i]}毫米`).join('，')}；从长到短：${order.join(' > ')}。`,'UNIT_ORDERING',{kind:'lengths',values:labels});
 }
 return null;
}
export function verifyImportedCaseMath(content,v){
 try{
  const expected=deriveImportedCase(v.template,v.parameters);if(!expected)return {status:'needs-review',reason:'暂未支持此数学模板，须家长核对。',oracleVersion:ORACLE_VERSION};
  for(const k of Object.keys(expected))insist(equal(content[k],expected[k]),`数学契约不一致：${k}。`);
  if(v.firstWrongStep!==undefined)insist(v.firstWrongStep===expected.errorStep,'首错位置与数学模型不一致。');
  return {status:'verified',reason:'题干、步骤、首错、答案、逆查和条件图来自同一套独立数学参数。',oracleVersion:ORACLE_VERSION};
 }catch(e){return {status:'rejected',reason:e.message,oracleVersion:ORACLE_VERSION};}
}
export function validateInboxBundle(b){
 insist(exact(b,['schemaVersion','bundleId','bundleRevision','createdAt','producer','sourceFingerprint','privacy','policy','cases'])&&b.schemaVersion==='detective-inbox.v1','收件包版本或字段不支持。');
 insist(typeof b.bundleId==='string'&&/^DT-[A-Za-z0-9_-]{1,90}$/.test(b.bundleId)&&Number.isInteger(b.bundleRevision)&&b.bundleRevision>=1&&b.bundleRevision<=1000,'收件包编号或修订号不合法。');
 insist(typeof b.createdAt==='string'&&Number.isFinite(Date.parse(b.createdAt))&&b.producer==='chatgpt-github'&&hash(b.sourceFingerprint)&&b.privacy==='public-anonymized-math-only'&&b.policy==='auto-if-independently-verified','来源或隐私声明不合法。');
 insist(Array.isArray(b.cases)&&b.cases.length>=1&&b.cases.length<=3&&new Set(b.cases.map(c=>c.id)).size===b.cases.length,'每包允许1～3宗且编号不能重复。');
 for(const c of b.cases){
  insist(exact(c,['id','role','simulatedSteps','content','verification'])&&validId(c.id)&&['original-error','transfer-error','correct-control'].includes(c.role)&&c.simulatedSteps===true,'须明确这些是匿名模拟步骤。');validateCase(c.content,true);
  insist((c.role==='correct-control')===(c.content.verdict==='correct'),'案件角色与正确性不一致。');
  insist(exact(c.verification,['template','parameters','firstWrongStep'])&&typeof c.verification.template==='string'&&c.verification.template.length<=80&&plain(c.verification.parameters),'数学核验配置不合法。');
  const serialized=JSON.stringify({content:c.content,verification:c.verification,id:c.id,bundleId:b.bundleId});insist(!/<\/?[a-z]|https?:|data:|javascript:|file:|@|Kevin|凯文|学校|学号|班级|老师|教师|1[3-9]\d{9}/i.test(serialized)&&c.content.sourceNotes==='','公开包只能有匿名数学文本，不接受HTML、链接、私人来源或附件。');
  insist(JSON.stringify(c.verification.parameters).length<=2000,'数学参数过长。');
 }
 return b;
}
export function parseInboxBundle(raw){insist(typeof raw==='string'&&Buffer.byteLength(raw)<=192*1024,'收件文件超过192KB。');let b;try{b=JSON.parse(raw);}catch{insist(false,'收件文件不是有效JSON。');}return validateInboxBundle(b);}
export function validateInboxState(x){
 if(x===undefined)return;const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
 insist(exact(x,['schemaVersion','autoPublish','files','etag','lastCheckedAt','lastSuccessAt','lastError','failures','nextAttemptAt'])&&x.schemaVersion===1&&typeof x.autoPublish==='boolean'&&plain(x.files)&&Object.keys(x.files).length<=400,'收件记录格式或版本不支持。');
 const iso=v=>v===null||typeof v==='string'&&Number.isFinite(Date.parse(v));
 insist([x.lastCheckedAt,x.lastSuccessAt,x.nextAttemptAt].every(iso)&&Number.isInteger(x.failures)&&x.failures>=0&&x.failures<=10000&&(x.etag===null||typeof x.etag==='string'&&x.etag.length<=200)&&(x.lastError===null||typeof x.lastError==='string'&&x.lastError.length<=500),'同步状态不完整。');
 for(const [path,r]of Object.entries(x.files)){
  insist(path.startsWith(INBOX_PATH)&&inboxFilename(path.slice(INBOX_PATH.length))&&r.sourcePath===path&&r.sourceBranch==='detective-inbox'&&/^[a-f0-9]{40}$/.test(r.sourceBlobSha)&&/^[a-f0-9]{64}$/.test(r.bundleHash)&&Number.isInteger(r.bundleRevision)&&r.bundleRevision>=1&&r.bundleRevision<=1000&&path===INBOX_PATH+r.bundleId+'.json'&&iso(r.importedAt)&&r.importedAt!==null&&['auto-published','parent-published','needs-review','rejected'].includes(r.status)&&typeof r.reason==='string'&&r.reason.length<=500&&r.mathOracleVersion===ORACLE_VERSION&&Array.isArray(r.caseIds)&&r.caseIds.length<=3,'收件台账损坏。');
 }
}
export function validateImportProvenance(v,content){
 if(v===undefined)return;
 insist(exact(v,['sourceBranch','sourcePath','sourceBlobSha','bundleId','bundleRevision','bundleHash','caseHash','importedAt','mathOracleVersion','importDisposition','reason','simulatedSteps'])&&v.sourceBranch==='detective-inbox'&&v.sourcePath===INBOX_PATH+v.bundleId+'.json'&&inboxFilename(v.bundleId+'.json')&&/^[a-f0-9]{40}$/.test(v.sourceBlobSha)&&hash(v.bundleHash)&&hash(v.caseHash)&&Number.isInteger(v.bundleRevision)&&v.bundleRevision>=1&&Number.isFinite(Date.parse(v.importedAt))&&v.mathOracleVersion===ORACLE_VERSION&&['auto-published','needs-review'].includes(v.importDisposition)&&typeof v.reason==='string'&&v.reason.length<=500&&v.simulatedSteps===true,'案卷导入来源损坏。');
 if(content)insist(v.caseHash===fingerprint(content),'案卷与导入内容指纹不一致。');
}
