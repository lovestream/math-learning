import {useState} from 'react';
import {ArrowLeft,ChevronRight,Star} from 'lucide-react';
import {api} from './api';
import type {Lesson,Progress} from './types';
import LegacyLessonArticle,{cleanPrompt} from './studio/LegacyLessonArticle';
import './studio/studio.css';
import './studio/teaching.css';

type Props={quest:{lesson:Lesson;mode:'learn'|'review'};progress:Progress;onClose:()=>void;onProgress:(p:Progress)=>void;notify:(m:string)=>void};
const groups=[{id:'warmup',name:'先试两题'},{id:'core',name:'动手练一练'},{id:'transfer',name:'换个故事'},{id:'challenge',name:'再难一点'},{id:'review',name:'过几天再想'}] as const;
type Group=typeof groups[number]['id'];
const uid=(prefix:string)=>prefix+':'+crypto.randomUUID();

// Original IDs and grading remain intact when a course uses the unified classroom.
export default function QuestExperience({quest,progress,onClose,onProgress,notify}:Props){
  const {lesson}=quest,mainQuestions=lesson.questions.slice(0,lesson.practiceCount??6);
  const reviewQuestions=lesson.questions.slice(lesson.practiceCount??6);
  const [phase,setPhase]=useState<'story'|'practice'|'complete'>(quest.mode==='review'?'practice':'story');
  const [group,setGroup]=useState<Group>(quest.mode==='review'?'review':'warmup');
  const questionsFor=(id:Group)=>id==='review'?(reviewQuestions.length?reviewQuestions:lesson.questions.slice(-2)):lesson.questions.filter(q=>(q.level??'core')===id);
  const bank=questionsFor(group);
  const [qIndex,setQIndex]=useState(0),[answer,setAnswer]=useState('');
  const [hintIndex,setHintIndex]=useState(-1),[usedHint,setUsedHint]=useState(false),[explained,setExplained]=useState<string[]>([]);
  const [feedback,setFeedback]=useState<{correct:boolean;text:string;earned:number}|null>(null);
  const [busy,setBusy]=useState(false),[earned,setEarned]=useState(0),[finished,setFinished]=useState(false);
  const [retell,setRetell]=useState(progress.lessons[lesson.id]?.retells?.at(-1)?.text??''),[retellError,setRetellError]=useState('');
  const q=bank[qIndex]??bank[0],ready=mainQuestions.every(q=>progress.lessons[lesson.id]?.solved.includes(q.id));
  const showStory=()=>{setPhase('story');window.scrollTo(0,0)};
  const showPractice=()=>{setPhase('practice');window.scrollTo(0,0)};
  const resetQuestion=(index:number)=>{setQIndex(index);setAnswer('');setFeedback(null);setHintIndex(-1);setUsedHint(false)};
  const start=(id:Group)=>{setGroup(id);resetQuestion(0);setFinished(false)};
  const explain=(id:string)=>setExplained(v=>v.includes(id)?v:[...v,id]);
  async function submit(){
    if(!q)return;
    const numeric=Number(answer);
    if(answer.trim()===''||!Number.isFinite(numeric)){notify(q.choices?'先选择一个答案。':'先写下你的答案。');return}
    setBusy(true);
    try{const out=await api.attempt({id:uid('attempt'),lessonId:lesson.id,questionId:q.id,answer:numeric,usedHint:usedHint||explained.includes(q.id),mode:group==='review'?'review':'learn'});onProgress(out.progress);setEarned(v=>v+out.earned);setFeedback({correct:out.correct,text:out.correct?out.explanation:(q.hints[0]??'再对照题目里的数量，想一想。'),earned:out.earned});if(!out.correct)explain(q.id)}catch(e){notify(e instanceof Error?e.message:'答案没有保存，请再试。')}finally{setBusy(false)}
  }
  async function saveRetell(){
    if(retell.trim().length<10){setRetellError('再说完整一点：你遇到了什么问题？用什么办法想清楚的？至少写 10 个字。');return}
    setBusy(true);setRetellError('');
    try{const out=await api.retell({id:uid('retell'),lessonId:lesson.id,text:retell.trim()});onProgress(out.progress);setEarned(v=>v+out.earned);setPhase('complete');window.scrollTo(0,0)}catch(e){setRetellError(e instanceof Error?e.message:'解释没有保存，请再试。')}finally{setBusy(false)}
  }
  const reflection=<section className="reflection-box" id="lesson-retell"><h2>讲给爸爸妈妈听</h2><p>{lesson.retellPrompt??('用自己的话说说：'+lesson.takeaway)}</p><p className="muted">可以先说出来，再记下一句话。系统会保存你的解释，不会自动判断你讲得对不对。</p><label>我发现……<textarea value={retell} maxLength={1200} onChange={e=>setRetell(e.target.value)} placeholder="我遇到了……我试着……因为……"/></label>{retellError&&<p role="alert">{retellError}</p>}{ready?<button disabled={busy} onClick={()=>void saveRetell()}>记下我的解释</button>:<><p className="muted">完成“先试两题”“动手练一练”“换个故事”后，就能把解释和这节课的记录一起保存。</p><button onClick={showPractice}>去做练习</button></>}{progress.lessons[lesson.id]?.retells?.slice(-2).map(r=><blockquote key={r.id}><span>我留下的话</span>{r.text}</blockquote>)}</section>;
  return <>
    <div hidden={phase!=='story'}><LegacyLessonArticle lesson={lesson} progress={progress} onBack={onClose} onPractice={showPractice} reflection={reflection} onExplain={explain}/></div>
    {phase==='practice'&&<div className="studio-practice child-practice legacy-practice"><div className="studio-breadcrumb"><button disabled={busy} onClick={showStory}><ArrowLeft size={17}/>返回讲解</button><span>{lesson.title}</span></div><header className="practice-heading"><div><h1>现在，自己来试试</h1><p>选一组就能开始。答错可以改，也可以看提示，慢慢想清楚。</p></div></header><div className="set-tabs">{groups.map(g=><button disabled={busy||!questionsFor(g.id).length} key={g.id} className={group===g.id?'active':''} onClick={()=>start(g.id)}>{g.name} <small>{questionsFor(g.id).length}题</small></button>)}</div>
      {finished?<section className="practice-finished"><Star/><h2>{groups.find(g=>g.id===group)?.name}，这一组做完了！</h2><p>可以从上面选下一组，或回到讲解，讲讲自己的发现。</p><button onClick={showStory}>回去讲讲我的发现</button></section>:q&&<section className="task-card"><header><div><span>{groups.find(g=>g.id===group)?.name} · 第 {qIndex+1}/{bank.length} 题</span><h2>{cleanPrompt(q.prompt)}</h2></div></header>
        {q.choices?<div className="task-options">{q.choices.map((option,i)=><button key={option} disabled={busy||feedback?.correct} aria-pressed={answer===String(i+1)} className={answer===String(i+1)?'selected':''} onClick={()=>{setAnswer(String(i+1));setFeedback(null)}}><i>{String.fromCharCode(65+i)}</i>{option}</button>)}</div>:<div className="task-fields"><label>我的答案<div><input value={answer} disabled={busy||feedback?.correct} inputMode="decimal" onChange={e=>{setAnswer(e.target.value);setFeedback(null)}} onKeyDown={e=>{if(e.key==='Enter'&&!feedback?.correct&&!busy)void submit()}} placeholder="写下你的答案"/>{q.unit&&<span className="answer-unit">{q.unit}</span>}</div></label></div>}
        {hintIndex>=0&&<div className="help-panel"><p>{q.hints[hintIndex]}</p></div>}
        <div className="task-actions"><button className="help-button" disabled={busy||hintIndex>=q.hints.length-1} onClick={()=>{setHintIndex(v=>v+1);setUsedHint(true)}}>给我一点提示</button><button className="help-button" disabled={busy} onClick={()=>{setUsedHint(true);showStory()}}>再看课上的例子</button>{!feedback?.correct&&<button className="studio-primary" disabled={busy} onClick={()=>void submit()}>检查我的答案</button>}</div>
        {feedback&&<div className={'task-feedback '+(feedback.correct?'correct':'incorrect')} role="status"><div><b>{feedback.correct?'答对了！':'这次还没对，再想一想。'}</b><p>{feedback.text}</p>{feedback.earned>0&&<span>＋{feedback.earned} 积分</span>}</div>{feedback.correct&&<button disabled={busy} onClick={()=>{if(qIndex+1<bank.length)resetQuestion(qIndex+1);else setFinished(true)}}>{qIndex+1<bank.length?'继续下一题':'看看这一组'}<ChevronRight size={16}/></button>}</div>}
      </section>}<p className="practice-footer">先想清楚再计算。同一道题不会重复发积分；复习未到期时，也可以先练练。</p>
    </div>}
    {phase==='complete'&&<div className="studio-practice child-practice"><section className="practice-finished"><Star/><h2>完成「{lesson.title}」</h2><p>练习和你的解释已经保存。这次获得 {earned} 积分。</p><blockquote>{retell}</blockquote><button onClick={onClose}>返回学习地图</button><button onClick={showStory}>再读一遍讲解</button></section></div>}
  </>;
}
