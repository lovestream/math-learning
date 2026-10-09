import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {lessons} from '../content/pilot/source.mjs';
import {auditTask,calculateAuditExpression,auditSame} from '../shared/task-audit-oracle.mjs';
import {notes} from '../docs/review/final-task-review/semantic-notes.mjs';
const root=new URL('../',import.meta.url),path=name=>new URL(name,root);
const digest=task=>createHash('sha256').update(JSON.stringify(task)).digest('hex');
const file='docs/review/849题最终审校清单_20261009.json';
const baseline='docs/review/final-task-review/source-inventory.json';
if(!fs.existsSync(path(baseline)))fs.renameSync(path(file),path(baseline));
const inventory=JSON.parse(fs.readFileSync(path(baseline),'utf8'));
const previous=fs.existsSync(path(file))?JSON.parse(fs.readFileSync(path(file),'utf8')):null;
const relations=JSON.parse(fs.readFileSync(path('docs/review/final-task-review/independent-relations.json'),'utf8')).rows;
const rows=[];
for(const l of lessons){
 const source=inventory.rows.filter(r=>r.lessonId===l.lessonId),review=notes[l.lessonId]?.split('\n');
 const tasks=Object.entries(l.taskSets).flatMap(([set,ts])=>ts.map(task=>({set,task})));
 if(!review||review.length!==tasks.length||source.length!==tasks.length)throw Error(`Review count mismatch: ${l.lessonId}`);
 tasks.forEach(({set,task},i)=>{
  const original=source[i];
  if(original.taskId!==task.id||review[i].length<8)throw Error(`Review identity/reason missing: ${task.id}`);
  if(previous?.schemaVersion===3){
   const sealed=previous.rows.find(r=>r.taskId===task.id);
   if(!sealed||sealed.sourceFingerprint!==digest(task)||sealed.contentVersion!==l.contentVersion||sealed.semanticReview.reason!==review[i])throw Error(`Renew the specific source review before updating the register: ${task.id}`);
  }
  const proofs=relations.filter(r=>r.taskId===task.id);
  for(const proof of proofs){if(!review[i].includes(proof.equation))throw Error(`Stale relation ${task.id}`);const values=proof.parts.map(calculateAuditExpression);if(values.some(v=>!auditSame(v,values[0])))throw Error(`Wrong handwritten arithmetic ${task.id}`);}
  const before=original.task,changed=Object.keys({...before,...task}).filter(k=>JSON.stringify(before[k])!==JSON.stringify(task[k]));
  rows.push({lessonId:l.lessonId,unitId:l.textbookUnit?.id??'foundation-bridge',title:l.title,taskId:task.id,set,kind:task.kind,contentVersion:l.contentVersion,sourceFingerprint:digest(task),task,
   reviewer:{kind:'Codex-agent',method:'逐题阅读题干、参考解答、选项、字段、提示、图示条件；自行建立关系；另一次反驳式复核高风险',humanTeachingApproved:false,independentThirdParty:false},
   evidence:{...auditTask(task),agentSemanticReviewed:true,humanTeachingApproved:false,authoredRelationEqualities:proofs},
   semanticReview:{reason:review[i],promptMeaning:task.prompt,answerScope:task.kind==='explanation'?'参考解答是示例；结论、关系与理由满足题意即可，不按关键词判分':task.kind==='expression'?'接受规定结构内的精确等价式，不把仅报结果当改写过程':task.kind==='fields'?'逐空按固定单位核对，字段不能互换；等值分数与小数可接受':task.kind==='choice'?'结论及独立证据项分别核对；干扰项的反例和误解见本题reason':'固定单位下的精确等值数，单位不另选',
    acceptableAlternative:task.kind==='explanation'?review[i]:null,
    choiceChecks:task.kind==='choice'?task.options.map(o=>({id:o.id,text:o.text,claim:o.id===task.expected?'成立':'不成立',mathematicalBasis:review[i]})):[],
    evidenceChoiceChecks:task.responseSpec?.type==='claim-evidence'?task.responseSpec.evidenceOptions.map(o=>({id:o.id,text:o.text,claim:o.id===task.responseSpec.expectedEvidence?'支持结论':'不能支持结论',mathematicalBasis:review[i]})):[],
    units:task.fields?.map(f=>({key:f.key,unit:f.unit??'无量纲'}))??[{unit:task.unit??'概念／无量纲'}],
    diagramScope:task.diagram?.type==='measurement'?'核对题干端点／段长／接头／单位，图中参数属于本题':task.diagram?.type==='concept'?'只作关系整理，不当按比例的数值图；标签与当前题干同步':'题干已给条件；本题无额外参数图',
    hints:'已核读提示与诊断；课堂示例明确标示为示例，不移用其数字、标记或结论',
    assessment:task.kind==='explanation'?'pending-parent-review-no-automatic-grade-or-points':'existing-exact-validator',decision:'可进入V1.0题库，教学人工审批另列'},
   priorEvidence:{sourceFingerprint:original.sourceFingerprint,contentVersion:original.contentVersion,evidence:original.evidence},
   revision:changed.length?{fields:changed,beforeFingerprint:original.sourceFingerprint,afterFingerprint:digest(task),before: Object.fromEntries(changed.map(k=>[k,before[k]??null])),after:Object.fromEntries(changed.map(k=>[k,task[k]??null])),policy:l.contentVersion!==original.contentVersion?'new-assessment-version-preserve-old-session-and-reward-rights':'editorial-compatible-same-question-and-grading'}:null,
   unresolved:false});
 });
}
if(rows.length!==849||new Set(rows.map(r=>r.taskId)).size!==849)throw Error('849 unique task IDs required');
const count=key=>Object.fromEntries([...Map.groupBy(rows,r=>r[key])].map(([k,v])=>[k,v.length]));
const report={schemaVersion:3,date:'2026-10-09',baselineSha:'499fb72500408a5686af2c798d4798a287fc069e',scope:'封闭849题，Codex语义初审与同代理另提示反驳复核；不是教师人工逐题签署',summary:{total:rows.length,agentSemanticReviewed:rows.length,humanTeachingApproved:0,unresolved:0,changedTasks:rows.filter(r=>r.revision).length,kind:count('kind'),set:count('set'),unitId:count('unitId'),authoredArithmeticEqualities:relations.length},rows};
const out=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check')){if(fs.readFileSync(path(file),'utf8')!==out)throw Error('Final register is stale; changed source requires renewed review, not automatic approval');}
else fs.writeFileSync(path(file),out);
console.log(JSON.stringify(report.summary));
