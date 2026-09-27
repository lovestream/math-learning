import type {Data,Lesson,Progress} from './types';
import type {PilotLesson,PilotSession,SetName} from './studio/types';

type Meta={id:string;title:string;subtitle:string;world:string;kind:'foundation'|'thinking';track:'foundation'|'enhancement'|'olympiad';minutes:number;skills:string[];completed:boolean;questionCount:number;recommended:boolean};
export type LearningEntry=Meta&({source:'article';lesson:PilotLesson}|{source:'legacy';lesson:Lesson});
export type OpenLearning=(entry:LearningEntry,mode?:'learn'|'review',task?:{set:SetName;id:string})=>void;
const names:Record<string,string>={F01:'抽象与多种表示',F02:'数形结合',F03:'单位量与整体',F04:'关系建模',F05:'分解与组合',F07:'等价转化',F08:'整体与等量替换',F11:'逆向与还原',F14:'一一对应',F15:'不变量与守恒',F27:'论证与检验'};
const starts=['numbers.quantity.intro','numbers.addition.meaning','numbers.subtraction.meaning'];
const sessions=(p:Progress)=>Object.values(p.studio?.sessions??{}) as PilotSession[];
export function learningEntries(data:Data,grade?:number):LearningEntry[]{
  const hasCompleteGrade3=(data.articleCourses??[]).some(lesson=>lesson.lessonId==='G3-L07-B01');
  const articles=[...(data.articleCourses??[])].sort((a,b)=>{
    const order=(id:string)=>starts.includes(id)?starts.indexOf(id):-1;
    return (order(a.lessonId)<0?99:order(a.lessonId))-(order(b.lessonId)<0?99:order(b.lessonId));
  }).filter(l=>grade===undefined||l.grade.includes(grade)).map((lesson):LearningEntry=>({
    source:'article',lesson,id:lesson.lessonId,title:lesson.title,subtitle:lesson.subtitle,
    world:lesson.lessonId.includes('.fractions.')?'fractions':({numbers:'numbers',algebra:'relations',geometry:'geometry',number_theory:'patterns',counting:'logic',logic:'logic'} as Record<string,string>)[lesson.strand]??lesson.strand,
    kind:lesson.track==='olympiad'||lesson.track==='enhancement'?'thinking':'foundation',track:lesson.track as Meta['track'],minutes:lesson.estimatedActiveMinutes,
    skills:lesson.thinkingSkills.map(id=>names[id]).filter(Boolean),questionCount:Object.values(lesson.taskSets).flat().length,
    completed:sessions(data.progress).some(s=>s.lessonId===lesson.lessonId&&s.setName==='core'&&Boolean(s.completedAt)),recommended:true
  }));
  const legacy=data.courses.filter(l=>(!hasCompleteGrade3||(l.grade??3)!==3)&&(grade===undefined||(l.grade??3)===grade)).map((lesson):LearningEntry=>({
    source:'legacy',lesson,id:lesson.id,title:lesson.title,subtitle:lesson.subtitle,world:lesson.world,kind:lesson.kind,track:lesson.kind==='thinking'?'olympiad':'foundation',minutes:lesson.minutes,skills:lesson.thinkingSkills,questionCount:lesson.questions.length,
    completed:Boolean(data.progress.lessons[lesson.id]?.completedAt),recommended:lesson.prerequisites.every(id=>Boolean(data.progress.lessons[id]?.completedAt))
  }));
  return [...articles,...legacy];
}
export function learningReviews(data:Data){
  return learningEntries(data).flatMap(entry=>{
    const review=(entry.source==='article'?data.progress.studio?.review?.[entry.id]:data.progress.reviews[entry.id]) as {dueAt:string;stage:number;firstLearnedDay?:string;successDates?:string[]}|undefined;
    return review&&typeof review.dueAt==='string'?[{entry,review}]:[];
  }).sort((a,b)=>Date.parse(a.review.dueAt)-Date.parse(b.review.dueAt));
}
export function unfinishedLearning(data:Data){
  const recent=sessions(data.progress).filter(s=>!s.completedAt).sort((a,b)=>Date.parse(b.savedAt)-Date.parse(a.savedAt))[0];
  if(!recent)return null;
  const entry=learningEntries(data).find(e=>e.id===recent.lessonId),task=recent.tasks[recent.index];
  return entry&&task?{entry,set:recent.setName,taskId:task.id,savedAt:recent.savedAt}:null;
}
export function articleAttempts(progress:Progress){
  const state=progress.studio;
  if(!state)return [];
  return (state.events as {id:string;signature:string;result:{status:string;at?:string;assisted?:boolean}}[]).flatMap(event=>{
    if(!['correct','incorrect'].includes(event.result?.status))return [];
    try{
      const input=JSON.parse(event.signature);
      if(input.action!=='submit')return [];
      const session=state.sessions[input.sessionId] as PilotSession|undefined;
      const task=session?.tasks.find(t=>t.id===input.taskId);
      return session&&task?[{id:event.id,lessonId:session.lessonId,taskId:task.id,objectiveId:task.objectiveId,prompt:task.prompt,set:session.setName,at:event.result.at??session.savedAt,correct:event.result.status==='correct',usedHint:Boolean(event.result.assisted)}]:[];
    }catch{return []}
  });
}
export function articleMistakes(data:Data){
  type Attempt=ReturnType<typeof articleAttempts>[number];
  const groups=new Map<string,{entry:LearningEntry;objective:string;attempts:Attempt[]}>();
  for(const a of articleAttempts(data.progress)){
    const entry=learningEntries(data).find(l=>l.id===a.lessonId);if(entry?.source!=='article')continue;
    const id=`${entry.id}:${a.objectiveId}`,g=groups.get(id)??{entry,objective:entry.lesson.objectives.find(o=>o.id===a.objectiveId)?.action??'回想这节课的方法',attempts:[]};
    g.attempts.push(a);groups.set(id,g);
  }
  return [...groups.entries()].flatMap(([id,g])=>{
    const wrong=g.attempts.filter(a=>!a.correct);if(!wrong.length)return [];
    const latest=new Map<string,Attempt>();for(const a of g.attempts)latest.set(a.taskId,a);
    const unresolved=[...latest.values()].filter(a=>!a.correct);
    return [{id,...g,wrong:wrong.length,total:g.attempts.length,resolved:!unresolved.length,task:unresolved.at(-1)??wrong.at(-1)!}];
  }).sort((a,b)=>Number(a.resolved)-Number(b.resolved)||b.wrong-a.wrong);
}
