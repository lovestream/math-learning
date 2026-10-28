import {seedCases,pendingCase,legacyPendingCase} from '../content/detective/seed-cases.mjs';
import {processCases} from '../content/detective/process-cases.mjs';
import {familyExamples} from './detective-self-questions.mjs';
import {validateSelfIntegrity} from './detective-self-integrity.mjs';
import {fingerprint,insist,validId,validateCase,publicCase,matchesResponse,matchesReason,orderedReasons,validateDetective} from '../shared/detective-model.mjs';
const iso=now=>new Date(now).toISOString();
const day=now=>new Date(now+8*3600000).toISOString().slice(0,10);
const conflict=()=>insist(false,'另一页已经保存了更新。请重新载入，再继续；你的输入仍保留在本页。',409);
const clone=x=>structuredClone(x);
export const validateStored=p=>{validateDetective(p.studio.detective);validateSelfIntegrity(p.studio.detective?.selfTraining);insist(Buffer.byteLength(JSON.stringify(p.studio),'utf8')<6*1024*1024,'互动课程存档接近容量上限，请先导出备份。');};
export function ensureDetective(p){
  p.studio??={version:1,reading:{},sessions:{},notes:[],events:[],entitlements:{},daily:{},review:{}};
  if(p.studio.detective){
    const c=p.studio.detective.cases[pendingCase.id];
    // Correct only the untouched system draft. Edited/published history is never rewritten.
    if(c?.status==='draft'&&c.revision===1&&!c.versions.length&&c.activeVersion===null&&fingerprint(c.draft)===fingerprint(legacyPendingCase.content)){
      c.draft=clone(pendingCase.content);c.revision++;
    }
    return p.studio.detective;
  }
  const cases=Object.fromEntries([...seedCases,pendingCase].map(({id,content})=>[id,{id,revision:1,status:id===pendingCase.id?'draft':'review',draft:clone(content),versions:[],activeVersion:null}]));
  return p.studio.detective={schemaVersion:1,cases,attempts:{},plans:{},badges:[],receipts:[]};
}
const versionFor=(d,ref)=>d.cases[ref.caseId]?.versions.find(v=>v.id===ref.version);
const versionOf=(d,a)=>versionFor(d,a);
const active=c=>c.versions.find(v=>v.id===c.activeVersion);
const inputEvent=b=>{insist(b&&validId(b.eventId),'缺少有效操作编号。');return fingerprint(b);};
function prior(events,b,signature){const e=events.find(e=>e.id===b.eventId);if(!e)return false;insist(e.signature===signature,'操作编号已经用于其他内容。',409);return true;}
const reference=(d,a)=>({attempt:publicAttempt(a),case:publicCase(versionOf(d,a),a)});
export function publicAttempt(a){
  const {id,caseId,version,revision,phase,status,startedAt,completedAt,firstVerdict,decision,hints,feedback,assisted,draft,evidence,repair,verification,reviews}=a;
  return {id,caseId,version,revision,phase,status,startedAt,completedAt,firstVerdict,decision,hintsViewed:hints.length,feedback,assisted,draft,evidence,repair,verification,publicFeedback:reviews.map(r=>({at:r.at,verdict:r.verdict,comment:r.comment}))};
}
export function parentDetective(p){const d=ensureDetective(p);validateStored(p);return {cases:Object.values(d.cases),attempts:Object.values(d.attempts),badges:d.badges};}
export function enableProcessCases(p,now=Date.now(),errorFamilyId=null){
 const d=ensureDetective(p);
 for(const {id,content}of errorFamilyId?familyExamples(errorFamilyId):processCases)if(!d.cases[id]){
  insist(Object.keys(d.cases).length<200,'案卷容量已满，请先备份。');validateCase(content,true);
  const c={id,revision:1,status:'review',draft:clone(content),versions:[],activeVersion:null,trainingSource:'v2-reviewed-sample'};
  d.cases[id]=c;publish(c,now,'','builtin-reviewed');
 }
 validateStored(p);return detectiveToday(p,now);
}
function anonymize(content,name){
  const copy=clone(content);
  const names=[name,'Kevin','凯文'].filter(x=>typeof x==='string'&&x.length>1);
  const clean=t=>{for(const n of names)t=t.split(n).join('小智');return t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[联系方式已隐去]').replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g,'[联系方式已隐去]');};
  for(const k of ['title','prompt','solution'])copy[k]=clean(copy[k]);
  for(const k of ['steps','hints','reasons'])copy[k]=copy[k].map(clean);
  copy.repair.question=clean(copy.repair.question);copy.verify.question=clean(copy.verify.question);copy.visual.values=copy.visual.values.map(clean);
  for(const r of [copy.repair,copy.verify])if(['choice','ordering'].includes(r.kind)){r.options=r.options.map(clean);r.answer=clean(r.answer);}
  return copy;
}
export function publishImported(c,content,now,provenance){
  validateCase(content,true);insist(c.versions.length<20,'此案已有20个版本，请另建新案。');
  const hash=fingerprint(content);if(active(c)?.hash!==hash){c.versions.push({id:`${c.id}:v${c.versions.length+1}`,caseId:c.id,content:clone(content),hash,publishedAt:iso(now),approved:true,approvalSource:'deterministic-import',provenance});c.activeVersion=c.versions.at(-1).id;}
  c.status='published';c.revision++;
}
function publish(c,now,name,approvalSource='parent'){
  validateCase(c.draft,true);insist(c.versions.length<20,'此案已有20个版本，请另建新案。');
  const content=anonymize(c.draft,name);validateCase(content,true);const hash=fingerprint(content);
  if(active(c)?.hash!==hash){c.versions.push({id:`${c.id}:v${c.versions.length+1}`,caseId:c.id,content,hash,publishedAt:iso(now),approved:true,approvalSource});c.activeVersion=c.versions.at(-1).id;}
  c.status='published';c.revision++;
}
function checked(b){insist(Array.isArray(b.checks)&&b.checks.length===3&&b.checks.every(x=>x===true),'发布前请核对题意与答案、首错或正确依据、匿名与验证方法。');}
export function manageDetective(p,b,now=Date.now()){
  const d=ensureDetective(p),signature=inputEvent(b);if(prior(d.receipts,b,signature))return parentDetective(p);
  insist(d.receipts.length<1500,'编辑记录已达到首版上限，请先导出备份。');
  if(b.action==='enable-seeds'){
    checked(b);for(const seed of seedCases){const c=d.cases[seed.id];if(!c.versions.length)publish(c,now,p.profile.name);}
  }else{
    insist(validId(b.caseId),'案卷编号不合法。');let c=d.cases[b.caseId];
    if(b.action==='create'){
      insist(!c&&Object.keys(d.cases).length<200,'案卷编号重复或超过200宗上限。');validateCase(b.content);
      c={id:b.caseId,revision:1,status:'draft',draft:clone(b.content),versions:[],activeVersion:null};d.cases[b.caseId]=c;
    }else{
      insist(c,'案卷不存在。',404);if(c.revision!==b.expectedRevision)conflict();
      if(b.action==='save'){validateCase(b.content);c.draft=clone(b.content);c.revision++;}
      else if(b.action==='publish'){checked(b);publish(c,now,p.profile.name);delete c.pendingImport;const file=d.inbox?.files[c.importSource?.sourcePath];if(file?.status==='needs-review'&&file.caseIds.every(id=>d.cases[id].status==='published'&&!d.cases[id].pendingImport))file.status='parent-published';}
      else if(['withdraw','archive'].includes(b.action)){c.status=b.action==='withdraw'?'withdrawn':'archived';c.revision++;}
      else insist(false,'不支持这个案卷操作。');
    }
  }
  d.receipts.push({id:b.eventId,signature,at:iso(now)});validateStored(p);return parentDetective(p);
}
function ordered(items,seed){return [...items].sort((a,b)=>fingerprint(seed+a.id).localeCompare(fingerprint(seed+b.id)));}
export function detectiveToday(p,now=Date.now()){
  const d=p.studio?.detective;
  if(!d)return {day:day(now),cases:[],newCases:[],history:[],badges:0};
  const today=day(now);
  if(!d.plans[today]){
    const published=Object.values(d.cases).filter(c=>c.status==='published');
    const rank=items=>ordered(items,today).sort((a,b)=>Object.values(d.attempts).filter(x=>x.caseId===a.id).length-Object.values(d.attempts).filter(x=>x.caseId===b.id).length);
    const wrong=rank(published.filter(c=>active(c).content.verdict==='wrong'));
    const correct=rank(published.filter(c=>active(c).content.verdict==='correct'));
    if(wrong.length>=2&&correct.length){
      insist(Object.keys(d.plans).length<400,'每日计划已达首版上限，请家长先备份。');
      const second=wrong.find(c=>active(c).content.family!==active(wrong[0]).content.family&&c.id!==wrong[0].id)??wrong[1];
      d.plans[today]=ordered([wrong[0],second,correct[0]],today+'shuffle').map(c=>({caseId:c.id,version:c.activeVersion}));
    }
  }
  const cases=(d.plans[today]??[]).filter(ref=>d.cases[ref.caseId].status==='published'||Object.values(d.attempts).some(a=>a.version===ref.version)).map(ref=>{
    const a=Object.values(d.attempts).find(a=>a.version===ref.version);
    return {case:publicCase(versionFor(d,ref),a),attempt:a?publicAttempt(a):null};
  });
  validateStored(p);
  const newCases=Object.values(d.cases).filter(c=>c.status==='published'&&(c.importSource||c.trainingSource)).sort((a,b)=>(b.importSource?.importedAt??active(b)?.publishedAt??'').localeCompare(a.importSource?.importedAt??active(a)?.publishedAt??'')).slice(0,40).map(c=>{const a=Object.values(d.attempts).find(a=>a.version===c.activeVersion);return {case:publicCase(active(c),a),attempt:a?publicAttempt(a):null};});
  return {day:today,cases,newCases,badges:d.badges.length,history:Object.values(d.attempts).sort((a,b)=>b.startedAt.localeCompare(a.startedAt)).slice(0,100).map(a=>({title:versionOf(d,a).content.title,...reference(d,a)}))};
}
export function detectiveAttempt(p,b,now=Date.now()){
  const d=ensureDetective(p),signature=inputEvent(b);
  insist(validId(b.attemptId),'调查记录编号不合法。');let a=d.attempts[b.attemptId];
  if(a&&prior(a.events,b,signature))return reference(d,a);
  if(b.action==='start'){
    insist(!a,'调查记录已经存在。',409);
    const plan=d.plans[day(now)]??[];const c=d.cases[b.caseId];const ref=plan.find(x=>x.caseId===b.caseId&&x.version===b.version)??((c?.importSource||c?.trainingSource)&&c.status==='published'&&c.activeVersion===b.version?{caseId:c.id,version:c.activeVersion}:null);
    insist(ref&&d.cases[ref.caseId].status==='published','这宗案件尚未发布或已撤回，请回到今日案卷。');
    const old=Object.values(d.attempts).find(a=>a.version===b.version);if(old)return reference(d,old);
    insist(Object.keys(d.attempts).length<1000,'调查记录达到首版1000次上限，请家长先导出备份。');
    a={id:b.attemptId,caseId:b.caseId,version:b.version,revision:1,phase:'judge',status:'in-progress',startedAt:iso(now),firstVerdict:null,decision:null,hints:[],assisted:false,feedback:'',draft:'',events:[],reviews:[],withVisualScaffold:true};
    d.attempts[a.id]=a;
  }else{
    insist(a,'找不到上次调查，请重新载入。',404);if(a.revision!==b.expectedRevision)conflict();
    insist(a.events.length<250,'本次调查操作较多，请暂停并请家长协助。');
    const c=versionOf(d,a).content;
    if(b.action==='draft'){
      insist(a.status==='in-progress','本次调查已提交，不能覆盖历史草稿。');insist(typeof b.value==='string'&&b.value.length<=1000,'草稿太长，请用简短文字。');a.draft=b.value;
    }else if(b.action==='remediate'){
      insist(a.status==='needs-revisit','只有需要回补的案卷可以重新核对。');a.status='in-progress';a.phase='evidence';a.assisted=true;a.evidencePassed=false;a.repairPassed=false;a.verifyPassed=false;a.draft='';a.feedback='首判与上次提交都保留。现在重新找证据，再修复和验证。';
    }else if(b.action==='hint'){
      insist(a.phase!=='closed'&&a.status!=='parent-review','本案已提交，请查看结案解释。');
      if(a.hints.length<3)a.hints.push(a.hints.length);a.assisted=true;a.feedback=c.hints[a.hints.length-1];
    }else{
      insist(a.phase!=='closed'&&a.status==='in-progress','本次调查已提交，不能改写历史。');
      if(b.action==='judge'){
        insist(a.phase==='judge'&&['wrong','correct','insufficient'].includes(b.value),'请先判断这份做法有没有问题或过程是否不足。');
        a.firstVerdict??=b.value;a.decision=b.value;
        if(b.value===c.verdict){a.phase='evidence';a.feedback='请用证据支持这个判断。';}
        else{a.assisted=true;a.feedback=b.value==='insufficient'?'请再核对：现有步骤是否已经提供足够依据？不熟悉某种做法，不等于它缺少步骤。第一次判断会保留。':c.verdict==='insufficient'?'最后的数值可以核对，但原中间过程未知，不能据此断言原推理正确或定位错误。第一次判断会保留。':b.value==='wrong'?'这次可能是误报：先核对原条件，这份做法并非一定有错。可以重新判断，第一次选择会保留。':'这次漏掉了一个问题。请逐行核对，重新判断，第一次选择会保留。';}
      }else if(b.action==='evidence'){
        insist(a.phase==='evidence','请按当前调查步骤作答。');
        insist(Number.isInteger(b.reason)&&b.reason>=0&&b.reason<c.reasons.length&&(c.verdict!=='wrong'||Number.isInteger(b.step)&&b.step>=0&&b.step<c.steps.length),'请选择有效的步骤与依据。');
        const ok=(c.verdict!=='wrong'||b.step===c.errorStep)&&matchesReason(versionOf(d,a),b.reason);
        if(b.category!==undefined)insist(['question','units','calculation','relation','expression','verification'].includes(b.category),'请选择观察到的数学问题类型。');
        a.evidence={step:c.verdict!=='wrong'?null:b.step,stepText:c.verdict==='correct'?'没有错误行':c.verdict==='insufficient'?'原中间过程未知，不能定位':c.steps[b.step],reason:b.reason,reasonText:orderedReasons(versionOf(d,a))[b.reason].text,category:b.category??c.diagnosticCategory??null,categoryConfirmed:c.diagnosticCategory?b.category===c.diagnosticCategory:null,at:iso(now)};
        a.firstEvidence??={...clone(a.evidence),correct:ok,caseVerdict:c.verdict};
        if(ok){a.evidencePassed=true;a.phase='repair';a.feedback=c.verdict==='correct'?'这份做法有依据。继续写出你核对的结果。':'定位完成。现在由你改正。';}
        else{a.assisted=true;a.feedback=c.verdict==='correct'?'这个依据还不能证明做法正确，请换一条能核对条件的依据。':'还没有找到第一处可证明的问题。前面正确的步骤不需要改，请逐行核对。';}
      }else if(b.action==='repair'||b.action==='verify'){
        insist(a.phase===b.action,'请按当前调查步骤作答。');
        const r=b.action==='repair'?c.repair:c.verify;
        insist(typeof b.value==='string'&&b.value.length<=1000,'请填入简短答案。');
        const ok=matchesResponse(r,b.value);
        a[b.action==='repair'?'repair':'verification']={value:b.value,at:iso(now),oral:r.kind==='oral'};
        if(ok){
          a[b.action==='repair'?'repairPassed':'verifyPassed']=true;a.draft='';
          if(b.action==='repair'){a.phase='verify';a.feedback='先不急着结案，再换一条路线验证。';}
          else if(c.repair.kind==='oral'||c.verify.kind==='oral'){a.status='parent-review';a.feedback='口述证据已保存。请家长听完解释后核对；现在还没有判为完成。';}
          else close(d,a,now);
        }else{a.assisted=true;a.feedback=b.action==='repair'?'这个结果还不能符合全部条件。请回看题目里的数量和单位，再试一次。':'这条验证还没有回到题目的条件。请按验证问题再核对一次。';}
      }else insist(false,'不支持这个调查操作。');
    }
    a.revision++;
  }
  a.events.push({id:b.eventId,signature,action:b.action,value:['judge','repair','verify'].includes(b.action)?b.value:undefined,...(b.action==='evidence'?{step:b.step,reason:b.reason}:{}),at:iso(now)});
  validateStored(p);return reference(d,a);
}
function close(d,a,now){
  a.phase='closed';a.status=a.assisted?'closed-assisted':'closed-independent';a.completedAt=iso(now);a.feedback=a.assisted?'你借助线索或订正完成了核对。第一次判断和修改都已保存。':'本次未用提示，完成了判断、证据、修复和验证。图示仍属于学习支架，不等于延迟独立掌握。';
  if(!d.badges.some(x=>x.version===a.version)&&d.badges.filter(x=>x.day===day(now)).length<3)d.badges.push({version:a.version,attemptId:a.id,day:day(now),at:iso(now)});
}
export function gradeDetective(p,b,now=Date.now()){
  const d=ensureDetective(p),signature=inputEvent(b),a=d.attempts[b.attemptId];insist(a,'调查记录不存在。');
  if(prior(a.events,b,signature))return parentDetective(p);
  if(a.revision!==b.expectedRevision)conflict();
  insist(['parent-review','needs-revisit','closed-independent','closed-assisted'].includes(a.status),'请等待孩子提交验证。');
  insist(['accepted','revisit'].includes(b.verdict)&&typeof b.comment==='string'&&b.comment.length<=500,'请输入审核结果和简短反馈。');
  insist(a.reviews.length<50&&a.events.length<250,'此案审核次数已达上限。');
  a.reviews.push({at:iso(now),verdict:b.verdict,comment:b.comment,source:'local-parent',snapshot:clone({firstVerdict:a.firstVerdict,evidence:a.evidence,repair:a.repair,verification:a.verification,hints:a.hints,assisted:a.assisted,status:a.status,completedAt:a.completedAt??null})});
  if(b.verdict==='accepted')close(d,a,now);
  else{delete a.completedAt;a.phase='verify';a.status='needs-revisit';a.feedback='家长建议再核对一次：'+b.comment;d.badges=d.badges.filter(x=>x.attemptId!==a.id);}
  a.revision++;a.events.push({id:b.eventId,signature,action:'parent-review',at:iso(now)});validateStored(p);return parentDetective(p);
}
