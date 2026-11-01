import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
export const reviewAmendmentPaths=['docs/review/final-task-review/versioned/coding-20261101.json'];
export const reviewDigest=t=>createHash('sha256').update(JSON.stringify(t)).digest('hex');
// The 2026-10-09 register is historical. New versions append signed source reviews.
export function readCurrentTaskReviews(){
 const historical=JSON.parse(fs.readFileSync(new URL('docs/review/849题最终审校清单_20261009.json',root)));
 const rows=new Map(historical.rows.map(r=>[r.taskId,r]));
 for(const path of reviewAmendmentPaths){
  if(!fs.existsSync(new URL(path,root)))continue;
  const amendment=JSON.parse(fs.readFileSync(new URL(path,root)));
  const historicalBytes=fs.readFileSync(new URL('docs/review/849题最终审校清单_20261009.json',root));
  if(createHash('sha256').update(historicalBytes).digest('hex')!==amendment.historicalRegisterSha256)throw Error('Historical register has changed; preserve its original bytes');
  const expectedIds=new Set(Array.from({length:12},(_,i)=>'G3-UP02-B01-P'+String(i+1).padStart(2,'0')));
  if(amendment.lessonId!=='G3-UP02-B01'||amendment.rows.length!==12||new Set(amendment.rows.map(r=>r.taskId)).size!==12||amendment.rows.some(r=>!expectedIds.has(r.taskId)))throw Error('Versioned coding review must contain the same 12 identities');
  for(const row of amendment.rows){
   const old=rows.get(row.taskId);
   if(!old||old.lessonId!==amendment.lessonId||row.lessonId!==amendment.lessonId||row.contentVersion!==amendment.contentVersion||row.sourceFingerprint!==reviewDigest(row.task)||row.priorEvidence.sourceFingerprint!==old.sourceFingerprint||row.priorEvidence.contentVersion!==old.contentVersion)throw Error('Broken review lineage: '+row.taskId);
   rows.set(row.taskId,{...row,reviewSource:path});
  }
 }
 return [...rows.values()];
}
