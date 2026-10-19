// Reuse reviewed formal task IDs. No added task, entitlement, or parallel score.
// Two familiar relations, a same-structure calculation, a changed context,
// and a reverse/error/whole explanation. Explanations always need parent review.
export const withdrawnLessons = [
 'G3-U04-B01','G3-U04-B03','G3-U04-B04','G3-U04-B05',
 'G3-L02-B01','G3-L02-B03','G3-L02-B05','G3-L02-B06',
 'G3-U06-B03','G3-U06-B04','G3-U06-B05',
];
export const withdrawnTaskIds = id => withdrawnLessons.includes(id)
 ? ['P01','P02','P07','P05','P08'].map(suffix=>`${id}-${suffix}`) : [];
export function withdrawnTasks(lesson) {
 const all=Object.values(lesson.taskSets).flat();
 return withdrawnTaskIds(lesson.lessonId).map(id=>{
  const task=all.find(t=>t.id===id);
  if(!task) throw Error(`撤教具小测缺少正式题 ${id}`);
  return task;
 });
}
