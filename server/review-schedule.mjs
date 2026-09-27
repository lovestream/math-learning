const DAY=86400000;
export const learningDay=now=>new Date(now+8*3600000).toISOString().slice(0,10);
export function validReviewSchedule(r){
  const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
  if(r.scheduleVersion!==undefined&&r.scheduleVersion!==2)return false;
  if(r.firstLearnedAt!==undefined&&(!date(r.firstLearnedAt)||r.firstLearnedDay!==learningDay(Date.parse(r.firstLearnedAt))))return false;
  if(r.history!==undefined&&(!Array.isArray(r.history)||r.history.length>10000||!r.history.every(h=>h&&date(h.at)&&h.day===learningDay(Date.parse(h.at))&&typeof h.independent==='boolean'&&date(h.dueAt))))return false;
  return true;
}
export function prepareReview(review,now,learnedAt){
  review.scheduleVersion=2;
  review.createdAt??=new Date(now).toISOString();
  review.history??=[];
  review.successDates??=[];
  if(!review.firstLearnedAt&&learnedAt&&Number.isFinite(Date.parse(learnedAt))){
    review.firstLearnedAt=learnedAt;
    review.firstLearnedDay=learningDay(Date.parse(learnedAt));
  }
  return review;
}
export function finishReview(review,now,independent,days=[1,3,7,21],learnedAt){
  prepareReview(review,now,learnedAt);
  const today=learningDay(now),at=new Date(now).toISOString();
  // Several retries on one family date never become several retention observations.
  if(review.history.some(h=>h.day===today))return false;
  review.history.push({day:today,at,independent,dueAt:review.dueAt});
  review.lastReviewedAt=at;
  if(!independent){review.dueAt=new Date(now+DAY).toISOString();return true}
  if(!review.successDates.includes(today))review.successDates.push(today);
  if(review.firstLearnedAt){
    const start=Date.parse(review.firstLearnedAt);
    const next=days.findIndex(d=>learningDay(start+d*DAY)>today);
    review.stage=next<0?days.length-1:next;
    review.dueAt=new Date(next<0?now+28*DAY:start+days[next]*DAY).toISOString();
  }else{
    // A wrong-answer repair may precede the first completed core lesson. Do not invent that date.
    review.stage=Math.min(3,review.stage+1);
    review.dueAt=new Date(now+days[review.stage]*DAY).toISOString();
  }
  return true;
}
