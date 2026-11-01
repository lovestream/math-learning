import {validateInboxState,validateImportProvenance} from './detective-inbox.mjs';
import {createHash} from 'node:crypto';
import {parseNumber as parse} from './pilot-math.mjs';
import {validateSelfTraining} from './detective-self-validation.mjs';
const parseNumber=x=>{try{return parse(x);}catch{return null;}};

export const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function insist(ok,message='侦探案卷格式不完整。',status=400){if(!ok)throw Object.assign(new Error(message),{status});}
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
export const validId=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{1,100}$/.test(x)&&!['__proto__','prototype','constructor'].includes(x)&&!Object.hasOwn(Object.prototype,x);
const text=(x,n=2000)=>typeof x==='string'&&x.length<=n;
const fields=(o,keys)=>plain(o)&&Object.keys(o).every(k=>keys.includes(k));
export const responseKinds=['number','choice','ordering','oral'];
function validResponse(r,publish){
  insist(fields(r,['kind','question','unit','options','answer'])&&responseKinds.includes(r.kind)&&text(r.question,500)&&text(r.unit,20));
  insist(Array.isArray(r.options)&&r.options.length<=10&&r.options.every(x=>text(x,200))&&new Set(r.options).size===r.options.length);
  insist(text(r.answer,1000));
  if(publish){insist(r.question.trim().length>0,'请写清楚改正和验证分别要做什么。');
    if(r.kind==='number')insist(parseNumber(r.answer)!==null,'数值答案请用整数、小数或分数。');
    if(r.kind==='choice')insist(r.options.length>=2&&r.options.includes(r.answer),'请选择有效的参考选项。');
    if(r.kind==='ordering')insist(r.options.length>=2&&r.answer.split('|').length===r.options.length&&r.options.every(x=>r.answer.split('|').includes(x)),'排序参考答案必须恰好包含所有卡片。');
  }
}
export function validateCase(c,publish=false){
  insist(fields(c,['title','prompt','steps','verdict','errorStep','reasons','reason','repair','verify','hints','solution','family','sourceNotes','visual','reasoningStatus','diagnosticCategory','sourceKind']));
  insist(text(c.title,100)&&text(c.prompt,2000)&&text(c.family,80)&&text(c.sourceNotes,2000)&&text(c.solution,3000));
  insist(Array.isArray(c.steps)&&c.steps.length>0&&c.steps.length<=10&&c.steps.every(x=>text(x,500)));
  insist(['wrong','correct','insufficient'].includes(c.verdict)&&((c.verdict!=='wrong'&&c.errorStep===null)||(c.verdict==='wrong'&&Number.isInteger(c.errorStep)&&c.errorStep>=0&&c.errorStep<c.steps.length)));
  if(c.reasoningStatus!==undefined)insist(['valid','invalid','insufficient'].includes(c.reasoningStatus)&&c.reasoningStatus===({correct:'valid',wrong:'invalid',insufficient:'insufficient'})[c.verdict]);
  if(c.diagnosticCategory!==undefined)insist(['question','units','calculation','relation','expression','verification'].includes(c.diagnosticCategory));
  if(c.sourceKind!==undefined)insist(c.sourceKind==='anonymous-simulation');
  insist(Array.isArray(c.reasons)&&c.reasons.length>=2&&c.reasons.length<=5&&c.reasons.every(x=>text(x,300))&&new Set(c.reasons).size===c.reasons.length&&Number.isInteger(c.reason)&&c.reason>=0&&c.reason<c.reasons.length);
  insist(Array.isArray(c.hints)&&c.hints.length===3&&c.hints.every(x=>text(x,500)));
  insist(fields(c.visual,['kind','values'])&&['banana','lengths','cards','road','array','hundreds','expression','manual'].includes(c.visual.kind)&&Array.isArray(c.visual.values)&&c.visual.values.length<=12&&c.visual.values.every(x=>text(x,100)));
  if(c.visual.kind==='array')insist(c.visual.values.length===2&&c.visual.values.every(x=>Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=5));
  if(c.visual.kind==='hundreds')insist(c.visual.values.length===2&&c.visual.values.every(x=>Number.isInteger(Number(x))&&Math.abs(Number(x))<=20));
  if(c.visual.kind==='cards')insist(JSON.stringify(c.visual.values)===JSON.stringify(['3','2','2厘米']),'卡片模型当前只支持3张共2毫米、目标2厘米。');
  if(c.visual.kind==='road')insist(JSON.stringify(c.visual.values)===JSON.stringify(['10','100']),'步道模型当前只支持10段、每段100米。');
  validResponse(c.repair,publish);validResponse(c.verify,publish);
  if(publish)insist([c.title,c.prompt,c.solution,c.family,...c.steps,...c.hints].every(x=>x.trim().length>0),'原题、做法、参考解释和三层线索必须完整。');
  return c;
}
export function matchesResponse(r,value){
  if(r.kind==='oral')return value==='oral';
  if(typeof value!=='string'||value.length>1000)return false;
  if(r.kind==='number'){const a=parseNumber(value),b=parseNumber(r.answer);return !!a&&!!b&&a.n*b.d===b.n*a.d;}
  return value.trim()===r.answer;
}
export const orderedReasons=v=>v.content.reasons.map((text,index)=>({text,index})).sort((a,b)=>fingerprint(v.id+a.text).localeCompare(fingerprint(v.id+b.text)));
export const matchesReason=(v,index)=>orderedReasons(v)[index]?.index===v.content.reason;
const publicResponse=r=>({kind:r.kind,question:r.question,unit:r.unit,options:r.options});
// An explicit allowlist: private drafts, rubric, answer keys and origins never travel to children.
export function publicCase(version,attempt){
  const c=version.content;
  const out={id:version.caseId,version:version.id,title:c.title,prompt:c.prompt,steps:c.steps,visual:c.visual};
  // Always offer the third choice. Its presence must not reveal the verdict,
  // and manually authored insufficient-process cases use the same public API.
  out.supportsInsufficient=true;
  if(attempt?.phase==='evidence')out.reasons=orderedReasons(version).map(r=>r.text);
  if(attempt?.phase==='repair')out.response=publicResponse(c.repair);
  if(attempt?.phase==='verify')out.response=publicResponse(c.verify);
  if(attempt?.phase==='closed')out.solution=c.solution;
  return out;
}
export function validateDetective(d){
  if(d===undefined)return;
  insist(fields(d,['schemaVersion','cases','attempts','plans','badges','receipts','inbox','selfTraining'])&&d.schemaVersion===1,'侦探存档版本不受支持，请更新程序后导入。');
  validateSelfTraining(d.selfTraining);
  validateInboxState(d.inbox);
  insist(Buffer.byteLength(JSON.stringify(d),'utf8')<=3*1024*1024,'侦探案卷超过3MB，请先导出归档，勿加入图片。');
  insist(plain(d.cases)&&Object.keys(d.cases).length<=200&&plain(d.attempts)&&Object.keys(d.attempts).length<=1000&&plain(d.plans)&&Object.keys(d.plans).length<=400);
  for(const [id,c]of Object.entries(d.cases)){
    insist(validId(id)&&c.id===id&&Number.isInteger(c.revision)&&c.revision>0&&['draft','review','published','withdrawn','archived'].includes(c.status));
    validateCase(c.draft);validateImportProvenance(c.importSource);validateImportProvenance(c.pendingImport);insist(Array.isArray(c.versions)&&c.versions.length<=20);
    const ids=new Set();for(const v of c.versions){validateCase(v.content,true);validateImportProvenance(v.provenance,v.content);if(v.approvalSource!==undefined)insist(['parent','deterministic-import','builtin-reviewed'].includes(v.approvalSource));if(v.approvalSource==='deterministic-import')insist(v.provenance?.importDisposition==='auto-published');if(v.approvalSource==='builtin-reviewed')insist(c.trainingSource==='v2-reviewed-sample');insist(validId(v.id)&&v.caseId===id&&!ids.has(v.id)&&v.hash===fingerprint(v.content)&&Number.isFinite(Date.parse(v.publishedAt))&&v.approved===true);ids.add(v.id);}
    insist(c.activeVersion===null||ids.has(c.activeVersion));if(c.status==='published')insist(ids.has(c.activeVersion));
  }
  if(d.inbox)for(const r of Object.values(d.inbox.files))insist(r.caseIds.every(id=>validId(id)&&d.cases[id]),'收件记录引用了不存在的案卷。');
  for(const [id,a]of Object.entries(d.attempts)){
    insist(validId(id)&&a.id===id&&d.cases[a.caseId]?.versions.some(v=>v.id===a.version)&&Number.isInteger(a.revision)&&a.revision>0);
    insist(['judge','evidence','repair','verify','closed'].includes(a.phase)&&['in-progress','closed-independent','closed-assisted','parent-review','needs-revisit'].includes(a.status));
    insist(a.firstVerdict===null||['correct','wrong','insufficient'].includes(a.firstVerdict));
    insist(Array.isArray(a.events)&&a.events.length<=250&&new Set(a.events.map(e=>e.id)).size===a.events.length&&a.events.every(e=>validId(e.id)&&text(e.signature,10000)&&Number.isFinite(Date.parse(e.at))));
    insist(Array.isArray(a.hints)&&a.hints.length<=3&&a.hints.every(x=>Number.isInteger(x)&&x>=0&&x<3)&&Array.isArray(a.reviews)&&a.reviews.length<=50&&text(a.feedback,1000)&&text(a.draft,1000));
    insist(a.firstVerdict===a.events.find(e=>e.action==='judge')?.value||a.firstVerdict===null&&!a.events.some(e=>e.action==='judge'));
    if(a.status.startsWith('closed-'))insist(a.phase==='closed'&&a.evidencePassed&&a.repairPassed&&a.verifyPassed&&Number.isFinite(Date.parse(a.completedAt)));
    if(a.status==='closed-independent')insist(!a.assisted&&a.hints.length===0);
  }
  for(const [day,plan]of Object.entries(d.plans)){insist(/^\d{4}-\d{2}-\d{2}$/.test(day)&&Array.isArray(plan)&&plan.length===3&&new Set(plan.map(x=>x.caseId)).size===3);for(const x of plan)insist(d.cases[x.caseId]?.versions.some(v=>v.id===x.version));insist(plan.filter(x=>d.cases[x.caseId].versions.find(v=>v.id===x.version).content.verdict==='correct').length===1);}
  insist(Array.isArray(d.badges)&&d.badges.length<=1000&&new Set(d.badges.map(b=>b.version)).size===d.badges.length&&d.badges.every(b=>d.attempts[b.attemptId]?.status.startsWith('closed-')&&d.attempts[b.attemptId].version===b.version));
  insist(Array.isArray(d.receipts)&&d.receipts.length<=1500&&new Set(d.receipts.map(r=>r.id)).size===d.receipts.length&&d.receipts.every(r=>validId(r.id)&&text(r.signature,20000)));
}
