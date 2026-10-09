import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {lessons} from '../content/pilot/source.mjs';
import {auditTask} from '../shared/task-audit-oracle.mjs';
export function buildFormalTaskAudit(){
 const rows=lessons.flatMap(l=>Object.entries(l.taskSets).flatMap(([set,ts])=>ts.map(t=>({lessonId:l.lessonId,unitId:l.textbookUnit?.id??'foundation-bridge',set,id:t.id,kind:t.kind,...auditTask(t)}))));
 const manual=JSON.parse(fs.readFileSync(new URL('../docs/review/semantic-ledger/formal-task-manual-samples.json',import.meta.url))).rows;
 const tasks=lessons.flatMap(l=>Object.values(l.taskSets).flat());
 for(const row of rows){const checked=manual.find(m=>m.id===row.id),task=tasks.find(t=>t.id===row.id);row.manualChecked=Boolean(checked&&checked.prompt===task.prompt&&checked.solution===task.solution&&JSON.stringify(checked.expected)===JSON.stringify(task.expected)&&JSON.stringify(checked.fields)===JSON.stringify(task.fields)&&JSON.stringify(checked.options)===JSON.stringify(task.options));}
 const summary={total:rows.length,machineCheckedCount:rows.filter(r=>r.formalChecked).length,independentNumericProofCount:rows.filter(r=>r.numericProofVerified).length,humanCheckedCount:rows.filter(r=>r.manualChecked).length,reviewerBoundary:'Codex agent manual source review, not parent trial',unverifiedCount:rows.filter(r=>!r.numericProofVerified&&!r.manualChecked).length,promptOracleCount:rows.filter(r=>r.proofs.some(p=>['prompt-arithmetic-oracle','unit-conversion-oracle','seat-ceiling-oracle','diagram-length-oracle'].includes(p.type))).length,errors:rows.filter(r=>r.errors.length),flags:rows.filter(r=>r.flags.length)};
 return {schemaVersion:1,scope:'结构检查覆盖全部；独立数值证明不等于题意逐题人工审校。解释题由家长批阅，未伪装自动正确。',summary,rows};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
const report=buildFormalTaskAudit();
if(process.argv.includes('--write'))fs.writeFileSync('docs/review/semantic-ledger/formal-task-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));if(report.summary.errors.length)process.exitCode=1;

}
