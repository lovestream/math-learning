// Content versions are deliberately strict. Editorial-only changes retain the same version.
// Mathematical/assessment changes require new evidence: core <= transfer < review,
// with the delayed review at least 24h after that transfer, not merely after a core.
export function lessonEvidence(progress,lessonId,contentVersion){
  const state=progress.studio??{},sessions=Object.values(state.sessions??{}).filter(s=>s.lessonId===lessonId);
  const submitted=s=>s.tasks?.every(t=>s.results?.[t.id]?.status==='correct');
  const independent=s=>!s.hadIncorrect&&submitted(s)&&s.tasks.every(t=>{const r=s.results[t.id],c=s.selfChecks?.[t.id];return !r.assisted&&!s.help?.[t.id]&&c?.evidenceCompletedAt&&!c.selfCorrection&&r.selfCorrection===false});
  const current=sessions.filter(s=>contentVersion&&s.contentVersion===contentVersion);
  const cores=current.filter(s=>s.setName==='core'&&s.completedAt&&submitted(s));
  const transfers=current.filter(s=>s.setName==='transfer'&&s.completedAt&&independent(s));
  const reviews=current.filter(s=>s.setName==='review'&&s.completedAt&&s.reviewDue&&Date.parse(s.reviewDue)<=Date.parse(s.completedAt)&&independent(s)&&transfers.some(t=>Date.parse(s.completedAt)-Date.parse(t.completedAt)>=86400000&&cores.some(c=>Date.parse(c.completedAt)<=Date.parse(t.completedAt))));
  const results=sessions.flatMap(s=>Object.values(s.results??{}));
  const explored=Boolean(state.reading?.[lessonId])||sessions.some(s=>Object.keys(s.answers??{}).length>0);
  const practiced=cores.length>0,retained=reviews.length>0,mastered=practiced&&transfers.length>0&&retained;
  return {status:mastered?'independent':practiced?'practiced':explored?'explored':'new',explored,practiced,independent:mastered,transfer:transfers.length,retained:reviews.length,selfCorrections:results.filter(r=>r.status==='correct'&&r.selfCorrection).length,pending:results.filter(r=>r.status==='pendingReview').length};
}
