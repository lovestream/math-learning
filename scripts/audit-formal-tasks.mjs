import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {lessons} from '../content/pilot/source.mjs';
import {auditTask} from '../shared/task-audit-oracle.mjs';
export const taskFingerprint=task=>createHash('sha256').update(JSON.stringify(task)).digest('hex');
export function semanticReviewMatches(record,task,contentVersion){
 return Boolean(record&&record.taskId===task.id&&record.contentVersion===contentVersion&&record.sourceFingerprint===taskFingerprint(task)
  &&record.evidence.agentSemanticReviewed===true&&record.semanticReview?.reason?.length>=8&&record.unresolved===false);
}
export function buildFormalTaskAudit(){
 const final=JSON.parse(fs.readFileSync(new URL('../docs/review/849题最终审校清单_20261009.json',import.meta.url)));
 const reviewed=new Map(final.rows.map(r=>[r.taskId,r]));
 const samples=JSON.parse(fs.readFileSync(new URL('../docs/review/semantic-ledger/formal-task-manual-samples.json',import.meta.url))).rows;
 const rows=lessons.flatMap(l=>Object.entries(l.taskSets).flatMap(([set,ts])=>ts.map(task=>{
  const review=reviewed.get(task.id),valid=semanticReviewMatches(review,task,l.contentVersion);
  const historical=samples.find(r=>r.id===task.id);
  return {lessonId:l.lessonId,unitId:l.textbookUnit?.id??'foundation-bridge',contentVersion:l.contentVersion,set,id:task.id,kind:task.kind,sourceFingerprint:taskFingerprint(task),...auditTask(task),
   agentSemanticReviewed:valid,humanTeachingApproved:false,historicalAgentSample:Boolean(historical),
   semanticEvidence:valid?{source:'docs/review/849题最终审校清单_20261009.json',reviewer:review.reviewer,reason:review.semanticReview.reason,authoredRelationEqualities:review.evidence.authoredRelationEqualities}:null,
   staleSemanticEvidence:Boolean(review&&!valid)};
 })));
 const summary={total:rows.length,schemaChecked:rows.filter(r=>r.schemaChecked).length,machineCheckedCount:rows.filter(r=>r.formalChecked).length,
  solutionInternallyConsistent:rows.filter(r=>r.solutionInternallyConsistent).length,
  independentlyDerivedFromPromptOrDiagram:rows.filter(r=>r.independentlyDerivedFromPromptOrDiagram).length,
  independentNumericProofCount:rows.filter(r=>r.numericProofVerified).length,
  agentSemanticReviewed:rows.filter(r=>r.agentSemanticReviewed).length,humanTeachingApproved:0,humanCheckedCount:0,
  historicalAgentSamples:samples.length,reviewerBoundary:'Codex agent source semantic review; no teacher or parent sign-off; answer arithmetic does not establish question meaning',
  unverifiedCount:rows.filter(r=>!r.agentSemanticReviewed).length,staleSemanticEvidence:rows.filter(r=>r.staleSemanticEvidence).length,
  errors:rows.filter(r=>r.errors.length),flags:rows.filter(r=>r.flags.length)};
 return {schemaVersion:3,scope:'结构、答案内部自洽、题干oracle、代理语义审校和人类教学审批分别记录。内容或版本变化使代理记录自动失效。',summary,rows};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const report=buildFormalTaskAudit();
 if(process.argv.includes('--write'))fs.writeFileSync('docs/review/semantic-ledger/formal-task-audit.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report.summary));
 if(report.summary.errors.length||report.summary.unverifiedCount)process.exitCode=1;
}
