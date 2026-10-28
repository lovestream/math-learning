import {createHash} from 'node:crypto';
import {selfQuestion,SELF_FAMILIES} from './detective-self-questions.mjs';
import {equalNumber} from '../shared/detective-mass-spring.mjs';
import {CHECK_POLICY_VERSION,evaluateCheckEvidence,legacyCheckEvidence} from './detective-check-evidence.mjs';
const insist=(ok)=>{if(!ok)throw Error('自主检查证据与题目版本不一致，未写入或恢复。');};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function validateSelfIntegrity(s){
 if(!s)return;
 const variants=new Set();
 for(const a of Object.values(s.attempts)){
  insist(!variants.has(a.questionVariantId));variants.add(a.questionVariantId);
  insist(SELF_FAMILIES.some(f=>f.id===a.errorFamilyId));const q=selfQuestion(a.errorFamilyId,a.index);
  insist(a.unknownRole===q.unknownRole&&a.sourceKind==='self-answer'&&s.seen[a.errorFamilyId]?.includes(a.index));
  if(a.phase==='first')insist(!a.firstAnswer&&!a.result&&!a.feedbackReleasedAt);
  else{
   insist(a.firstHash===hash({firstAnswer:a.firstAnswer,firstReasoning:a.firstReasoning}));
   insist(Date.parse(a.firstAnswer.at)>=Date.parse(a.startedAt));
   if(a.phase==='check')insist(!a.result&&!a.feedbackReleasedAt);
   else{
    insist(Date.parse(a.feedbackReleasedAt)>=Date.parse(a.firstAnswer.at)&&a.result.at===a.feedbackReleasedAt);
    const firstCorrect=a.firstAnswer.status==='answered'&&equalNumber(a.firstAnswer.value,q.answer),finalCorrect=equalNumber(a.preFeedbackRevision.value,q.answer);
    const proof=evaluateCheckEvidence(q,a.preFeedbackRevision.value,a.selfCheckActions.value,a.selfCheckActions.expression);
    const checkValid=a.result.checkPolicyVersion===CHECK_POLICY_VERSION?proof.verified:legacyCheckEvidence(q,a,a.preFeedbackRevision.value,a.selfCheckActions.value,a.selfCheckActions.expression);
    const independent=finalCorrect&&checkValid&&!a.hintExposure.length&&a.selfCheckActions.status==='complete'&&a.firstAnswer.status==='answered';
    const category=a.hintExposure.length?'assisted':a.firstAnswer.status!=='answered'?'first-unscored':firstCorrect?(finalCorrect?'first-correct':'changed-wrong'):(finalCorrect?(checkValid&&a.selfCheckActions.status==='complete'?'self-corrected':'answer-correct-check-unproven'):'not-corrected');
    insist(a.result.firstCorrect===firstCorrect&&a.result.finalCorrect===finalCorrect&&a.result.checkValid===checkValid&&a.result.independent===independent&&a.result.category===category&&a.selfCheckActions.pattern===q.checkPattern);
    insist(a.hintExposure.every(e=>e.at<=a.feedbackReleasedAt));
    if(a.result.checkPolicyVersion===CHECK_POLICY_VERSION)insist(JSON.stringify(a.result.checkEvidence)===JSON.stringify(proof));
    for(const r of a.parentReviews){
     insist(r.at>=a.feedbackReleasedAt);
     if(r.verdict==='check-confirmed')insist(finalCorrect&&a.firstAnswer.status==='answered'&&a.selfCheckActions.status==='complete'&&!a.hintExposure.length&&!!(a.selfCheckActions.expression?.trim()||a.selfCheckActions.explanation?.trim()));
    }
   }
  }
 }
}
