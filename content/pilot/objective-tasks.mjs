// Each group refers to the corresponding observable objective in the lesson.
// Explicit task links prevent question order from silently changing the evidence.
export const objectiveTasks={
  'numbers.fractions.meaning': ['w1 w2 c1 c4 t1 r1','c3 t2 h1','c2 c5 r2'],
  'geometry.area.perimeter': ['w1 c1 c2 c4 c5 t2 r1','w2 c3 t1','h1 r2'],
  'algebra.substitution.intro': ['w1 c1 c2 c3 t1 r1','w2 c4 c5 t2 r2','h1'],
  'algebra.balance.intro': ['w2 c3 h1','w1 c1 c2 c4 c5 t1 r1 r2','t2'],
  'numbers.quantity.intro': ['w1 w2 c5 c6 t1 t3 h1 h2','c1 t2 r1','c2 c3 c4 r2'],
  'numbers.addition.meaning': ['w1 w2 c1 c2 t1 t2 t3 r1','c3 c4','c5 c6 h1 h2 r2'],
  'numbers.subtraction.meaning': ['w1 w2 c6 t1 r1','c1 c2 c3 t2 t3','c4 c5 h1 h2 r2']
  ,'G3-U03-B01':['w1 w2 c1 c2 c5 t2 r1','c3 c4 t1 h1 r2']
  ,'G3-U03-B02':['w1 c1 c2 c4 t1 t2 h1 r1','w2 c3 c5 r2']
  ,'G3-U03-E01':['w1 w2 c1 c2 c3 c5 t1 t2 r1 r2','c4 h1']
  ,'G3-U03-E02':['w1 w2 c1 c2 c3 c4 r1 r2','c5 t1 t2 h1']
  ,'G3-U03-O01':['w1 w2 c1 c3 c5 t1 h1 r1','c2 c4 t2 r2']
};
export function taskObjective(lesson,task){
  const groups=objectiveTasks[lesson.lessonId];
  if(!groups&&lesson.objectives.length===1)return lesson.objectives[0].id;
  const matches=groups?.flatMap((ids,i)=>ids.split(' ').includes(task.id)?[i]:[])??[];
  if(matches.length!==1||!lesson.objectives[matches[0]])throw new Error(`任务需要明确且唯一的主目标：${lesson.lessonId}.${task.id}`);
  return lesson.objectives[matches[0]].id;
}
