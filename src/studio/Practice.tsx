import {navigationEvent,type NavigationEvent} from "./navigationGuard";
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ChevronRight,Lightbulb,Star} from 'lucide-react';
import type {Progress} from '../types';
import type {PilotLesson,PilotSession,SelfCheckEvidence,SetName,Task,TaskResult} from './types';
import {studioApi} from './api';
import MeasurementTaskDiagram from './measurement/TaskDiagram';
import ConceptTaskDiagram from './concept/ConceptVisual';
const groups:{id:SetName;name:string;description:string}[]=[
  {id:'warmup',name:'先试两题',description:'回想刚才图里的意思。'},
  {id:'core',name:'动手练一练',description:'用刚学会的方法，自己做一次。'},
  {id:'transfer',name:'换个故事',description:'东西变了，看看同一个办法还能不能用。'},
  {id:'challenge',name:'再难一点',description:'多想一步，可以慢慢试。'},
  {id:'review',name:'过几天再想',description:'隔一段时间，不看答案再回想。现在也可以先练练。'}
];
type Answer=Record<string,string>;
const selfCheckItems=()=>['我读清了题目问什么','我检查了计算或理由','我核对了最后的答案'];
export function TaskInput({task,value,onChange,disabled}:{task:Task;value:Answer;onChange:(v:Answer)=>void;disabled:boolean}){
  if(task.kind==='explanation')return <label className="explanation-answer">我的结论和过程<textarea disabled={disabled} maxLength={200} value={value.value??''} onChange={e=>onChange({...value,value:e.target.value})} placeholder="写出算式或关键关系，再说明为什么。可以和爸爸妈妈一起核对。"/><small>文字解释会保存为“待家长核对”，不会自动判对或发放答对积分。</small></label>;
  if(task.kind==='choice')return <div className="claim-evidence-input"><fieldset className="task-options"><legend>{task.responseSpec?.type==='claim-evidence'?'第一步：选择你的结论':'选择答案'}</legend>{task.options?.map((o,i)=><button type="button" disabled={disabled} key={o.id} aria-pressed={value.value===o.id} className={value.value===o.id?'selected':''} onClick={()=>onChange({...value,value:o.id})}><i>{String.fromCharCode(65+i)}</i>{o.text}</button>)}</fieldset>{task.responseSpec?.type==='claim-evidence'&&<fieldset className="task-options evidence-options"><legend>第二步：哪条证据能推出这个结论？</legend>{task.responseSpec.evidenceOptions.map((o,i)=><button type="button" disabled={disabled} key={o.id} aria-pressed={value.evidence===o.id} className={value.evidence===o.id?'selected':''} onClick={()=>onChange({...value,evidence:o.id})}><i>{i+1}</i>{o.text}</button>)}</fieldset>}</div>;
  const fields=task.fields??[{key:'value',label:task.kind==='expression'?'我的算式':'我的答案',unit:task.unit}];
  return <div className="task-fields">{fields.map(f=><label key={f.key}>{f.label}<div><input disabled={disabled} value={value[f.key]??''} onChange={e=>onChange({...value,[f.key]:e.target.value})} placeholder={task.kind==='expression'?'写出替换后的完整算式':'填数字，分数用 / 隔开'}/>{f.unit&&<span className="answer-unit">{f.unit}</span>}</div></label>)}</div>;
}
export default function Practice({lesson,initialSet,initialTaskId,assessment,progress,setProgress,notify,onBack}:{lesson:PilotLesson;initialSet?:SetName;initialTaskId?:string;assessment?:string;progress:Progress;setProgress:(p:Progress)=>void;notify:(m:string)=>void;onBack:()=>void}){
  const [session,renderSession]=useState<PilotSession|null>(null),[answers,renderAnswers]=useState<Record<string,Answer>>({});
  const [feedback,setFeedback]=useState<(TaskResult&{completionPaid?:number})|null>(null),[busy,setBusy]=useState(false),[help,setHelp]=useState(''),[examples,setExamples]=useState(false),[finished,setFinished]=useState(false),[saveState,setSaveState]=useState(''),[conflict,setConflict]=useState(false);
  const [selfCheckMessage,setSelfCheckMessage]=useState('');
  const sessionRef=useRef<PilotSession|null>(null),answersRef=useRef<Record<string,Answer>>({}),queue=useRef(Promise.resolve()),saved=useRef(''),pending=useRef(false);
  const progressRef=useRef(setProgress);progressRef.current=setProgress;
  const setSession=(value:PilotSession|null)=>{sessionRef.current=value;renderSession(value)};
  const setAnswers=(value:Record<string,Answer>)=>{answersRef.current=value;renderAnswers(value)};
  const task=session?.tasks[session.index],answer=task?(answers[task.id]??{}):{},group=groups.find(g=>g.id===session?.setName);
  const payload=()=>{const s=sessionRef.current;if(!s)return null;const first=s.tasks.findIndex(t=>!['correct','pendingReview'].includes(s.results[t.id]?.status));return {sessionId:s.id,index:['correct','pendingReview'].includes(s.results[s.tasks[s.index].id]?.status)&&first>=0?first:s.index,answers:answersRef.current}};
  const dirty=()=>{const p=payload();return Boolean(p&&JSON.stringify(p)!==saved.current)};
  const enqueue=(fn:()=>Promise<void>)=>{const work=queue.current.catch(()=>{}).then(fn);queue.current=work;return work};
  const saveDraft=async()=>{
    const s=sessionRef.current,p=payload();if(!s||!p||!dirty())return;
    const signature=JSON.stringify(p);setSaveState('正在保存…');
    try{const out=await studioApi.draft(s.id,s.revision,p.index,p.answers);saved.current=signature;setSession({...out.result,index:s.index});progressRef.current(out.progress);setSaveState('草稿已保存')}catch(e){const stale=(e as Error&{status?:number}).status===409;setConflict(stale);setSaveState(stale?'尚未保存：另一页面已更新，请先导出草稿再载入最新记录':'尚未保存，请重试');throw e}
  };
  const guard=async(fn:()=>Promise<void>)=>{if(pending.current)return;pending.current=true;setBusy(true);try{await enqueue(fn)}catch(e){notify(e instanceof Error?e.message:'这次没有保存，请再试。')}finally{pending.current=false;setBusy(false)}};
  const start=(set:SetName,taskId?:string)=>guard(async()=>{
    await saveDraft();const out=await studioApi.session(lesson.lessonId,set,assessment);const index=taskId?out.result.tasks.findIndex(t=>t.id===taskId):-1;
    const restored=index>=0?{...out.result,index}:out.result,current=restored.tasks[restored.index];
    progressRef.current(out.progress);setSession(restored);setAnswers(out.result.answers);saved.current=JSON.stringify({sessionId:out.result.id,index:out.result.index,answers:out.result.answers});
    setFeedback(current?restored.results[current.id]??null:null);setSelfCheckMessage(current&&restored.selfChecks?.[current.id]&&!restored.results[current.id]?'首答已保存。检查下面三件事；想改答案可以直接改，再提交。':'');setFinished(Boolean(assessment&&restored.submittedAt&&restored.tasks.every(t=>['correct','pendingReview'].includes(restored.results[t.id]?.status))));setHelp('');setExamples(false);setSaveState('已恢复这组练习');
    const url=new URL(location.href);url.searchParams.set('lesson',lesson.lessonId);url.searchParams.set('set',set);url.searchParams.set('practice','1');history.replaceState(null,'',url);
  });
  const opened=useRef(false);
  useEffect(()=>{if(initialSet&&!opened.current){opened.current=true;void start(initialSet,initialTaskId)}},[]);
  useEffect(()=>{if(!dirty())return;setSaveState('等待保存…');const timer=setTimeout(()=>{void enqueue(saveDraft).catch(()=>{})},650);return()=>clearTimeout(timer)},[answers,session?.index]);
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty()||pending.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>{window.removeEventListener('beforeunload',warn);void enqueue(saveDraft).catch(()=>notify('刚才的草稿还没有保存，请返回练习重试。'))}},[]);
  useEffect(()=>{const navigate=(e:Event)=>{(e as NavigationEvent).detail.waitUntil(enqueue(saveDraft))};window.addEventListener(navigationEvent,navigate);return()=>window.removeEventListener(navigationEvent,navigate)},[]);
  const exportDraft=()=>{const current=payload();if(!current)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({format:'kevin-practice-draft',lessonId:lesson.lessonId,baseRevision:sessionRef.current?.revision,...current},null,2)],{type:'application/json'}));a.href=url;a.download=lesson.lessonId+'-unsaved-draft.json';a.click();URL.revokeObjectURL(url)};
  const reloadLatest=()=>guard(async()=>{const out=await studioApi.data(),latest=out.progress.studio?.sessions[sessionRef.current?.id??''] as PilotSession|undefined;if(!latest)throw Error('找不到该次练习，请保留草稿再重新打开。');setSession(latest);setAnswers(latest.answers);saved.current=JSON.stringify({sessionId:latest.id,index:latest.index,answers:latest.answers});setFeedback(latest.results[latest.tasks[latest.index].id]??null);setConflict(false);setSaveState('已载入其他页面的最新记录');progressRef.current(out.progress)});
  const beginSelfCheck=()=>guard(async()=>{
    const s=sessionRef.current,t=s?.tasks[s.index];if(!s||!t)return;
    const currentAnswers=answersRef.current;const out=await studioApi.selfCheck(s.id,s.revision,t.id,currentAnswers[t.id]??{},`${lesson.contentVersion}:${t.id}`,'self-check:'+crypto.randomUUID());
    progressRef.current(out.progress);
    if(out.result.status==='invalidInput'){setFeedback({status:'invalidInput',message:out.result.message,paid:0,at:new Date().toISOString(),assisted:Boolean(s.help[t.id])});return}
    const record={firstAnswer:currentAnswers[t.id]??{},checkedAt:new Date().toISOString(),helpLevel:s.help[t.id]??null,modelStateVersion:`${lesson.contentVersion}:${t.id}`,selfCorrection:null};
    setSession({...s,revision:out.result.revision,answers:currentAnswers,selfChecks:{...(s.selfChecks??{}),[t.id]:record}});setFeedback(null);setSelfCheckMessage(out.result.message);setSaveState('首答已保存，正在自查');
  });
  const submit=()=>guard(async()=>{
    const s=sessionRef.current,t=s?.tasks[s.index];if(!s||!t)return;
    const currentAnswers=answersRef.current,current=currentAnswers[t.id]??{},items=selfCheckItems();
    const evidence:SelfCheckEvidence={format:'checklist-v1',checks:items.filter((_,i)=>current[`check${i}`]==='done'),reflection:'',finalConfirmed:items.every((_,i)=>current[`check${i}`]==='done')};
    if(evidence.checks.length!==3){setFeedback({status:'invalidInput',message:'请检查这三件事，完成后勾选；需要改答案可以直接改。',paid:0,at:new Date().toISOString(),assisted:Boolean(s.help[t.id])});return}
    const checked=await studioApi.selfCheckEvidence(s.id,s.revision,t.id,evidence,'evidence:'+crypto.randomUUID());progressRef.current(checked.progress);
    const withEvidence={...s,revision:checked.result.revision,selfChecks:{...s.selfChecks,[t.id]:{...s.selfChecks[t.id],evidence,evidenceCompletedAt:new Date().toISOString()}}};setSession(withEvidence);
    const out=await studioApi.attempt(s.id,withEvidence.revision,t.id,current,'attempt:'+crypto.randomUUID());
    progressRef.current(out.progress);const result={...out.result,at:new Date().toISOString(),assisted:Boolean(s.help[t.id])};setFeedback(result);
    setSession({...withEvidence,revision:result.revision,answers:currentAnswers,results:result.status==='invalidInput'?s.results:{...s.results,[t.id]:result}});
    setSaveState(result.status==='invalidInput'?'请先把答案写完整':'最终答案已保存');setSelfCheckMessage('');
    await saveDraft();
  });
  const showHelp=(kind:'hint'|'article')=>guard(async()=>{
    const s=sessionRef.current,t=s?.tasks[s.index];if(!s||!t)return;
    const out=await studioApi.help(s.id,s.revision,t.id,kind,'help:'+crypto.randomUUID());progressRef.current(out.progress);setSession({...s,revision:out.result.revision,help:{...s.help,[t.id]:kind}});
    if(kind==='article')setExamples(true);else setHelp(out.result.text);
  });
  const next=()=>{const s=sessionRef.current;if(!s)return;const index=s.tasks.findIndex((t,i)=>i>s.index&&!['correct','pendingReview'].includes(s.results[t.id]?.status));const earlier=s.tasks.findIndex(t=>!['correct','pendingReview'].includes(s.results[t.id]?.status));if(index<0&&earlier<0){setFinished(true);setFeedback(null);setSelfCheckMessage('');return}setSession({...s,index:index>=0?index:earlier});setFeedback(null);setSelfCheckMessage('');setHelp('');setExamples(false)};
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return <div className="studio-practice child-practice"><div className="studio-breadcrumb"><button disabled={busy} onClick={()=>void guard(async()=>{await saveDraft();onBack();window.scrollTo(0,0)})}><ArrowLeft size={17}/>返回讲解</button><span>{lesson.shortTitle}</span><small role="status">{saveState}</small>{saveState.startsWith('尚未')&&<button disabled={busy} onClick={()=>void guard(saveDraft)}>重试保存</button>}{saveState.startsWith('尚未')&&<button onClick={exportDraft}>导出本页未保存草稿</button>}{conflict&&<button disabled={busy} onClick={()=>void reloadLatest()}>载入最新记录（替换本页草稿）</button>}<button disabled={busy} onClick={()=>void guard(async()=>{await saveDraft();notify('练习草稿已保存。')})}>保存草稿</button></div>
    <header className="practice-heading"><div><h1>{assessment?"收起教具，独立试五题":"现在，自己来试试"}</h1><p>{assessment?"先自己答，再自查。教具已收起；使用提示会留下记录。":"选一组就能开始。答错可以改，也可以看提示，慢慢想清楚。"}</p></div></header>
    {!assessment&&<div className="set-tabs">{groups.map(g=><button disabled={busy} key={g.id} className={session?.setName===g.id?'active':''} onClick={()=>void start(g.id)}>{g.name} <small>{lesson.taskSets[g.id].length}题</small></button>)}</div>}
    {!session?<div className="practice-empty"><Lightbulb/><h2>先从哪一组开始？</h2><p>建议先试两题，熟悉后也可以直接选更难的。</p><button className="studio-primary" disabled={busy} onClick={()=>void start('warmup')}>先试两题 <ChevronRight size={16}/></button></div>:finished?<section className="practice-finished"><Star/><h2>{group?.name}，这一组做完了！</h2><p>你答对了{session.tasks.filter(t=>session.results[t.id]?.status==='correct').length}题。另有{session.tasks.filter(t=>session.results[t.id]?.status==='pendingReview').length}题解释待家长核对。可以选下一组，也可以休息一下。</p>{session.setName==='core'&&Boolean(progress.studio?.review?.[lesson.lessonId])&&<p>明天再回想这节课，复习时间已经记下。</p>}<button onClick={()=>void guard(async()=>{await saveDraft();onBack();window.scrollTo(0,0)})}>回去讲讲我的发现</button></section>:task&&<section className="task-card">
      <header><div><span>{assessment?'撤教具小测':group?.name} · 第{session.index+1}/{session.tasks.length}题</span><p>{group?.description}</p><h2>{task.prompt}</h2></div></header>
      {task.diagram?.type==='measurement'&&'mode' in task.diagram&&<MeasurementTaskDiagram diagram={task.diagram}/>}
      {!assessment&&task.diagram?.type==='concept'&&'family' in task.diagram&&<ConceptTaskDiagram diagram={task.diagram}/>}
      <TaskInput task={task} value={answer} disabled={busy||['correct','pendingReview'].includes(feedback?.status??'')} onChange={a=>{setAnswers({...answersRef.current,[task.id]:a});if(feedback?.status==='invalidInput')setFeedback(null)}}/>
      {help&&<div className="help-panel"><Lightbulb/><p>{help}</p></div>}
      {examples&&<aside className="practice-examples"><h3>回看这节课的例子</h3>{lesson.articleBlocks.filter(b=>b.examples).flatMap(b=>b.examples??[]).map(ex=><div key={ex.title}><h4>{ex.title}</h4>{ex.steps.map(s=><p key={s.math}><b>{s.math}</b><br/>{s.why}</p>)}</div>)}<button onClick={()=>setExamples(false)}>收起例子，继续想这道题</button></aside>}
      {session.selfChecks?.[task.id]&&!['correct','pendingReview'].includes(feedback?.status??'')&&<div className="self-check-panel"><b>先当一次自己的小老师</b><p>{selfCheckMessage||'首答已保存。重新核对下面的三件事，完成一项就勾一项。'}</p><div className="self-check-actions">{selfCheckItems().map((item,i)=><label key={item}><input type="checkbox" checked={answer[`check${i}`]==='done'} disabled={busy} onChange={e=>setAnswers({...answersRef.current,[task.id]:{...answer,[`check${i}`]:e.target.checked?'done':''}})}/><span>{item}</span></label>)}</div><small>可以保留首答，也可以改答；首答、勾选和订正会一起保存。</small></div>}
      <div className="task-actions"><button disabled={busy} className="help-button" onClick={()=>void showHelp('hint')}>给我一点提示</button><button disabled={busy} className="help-button" onClick={()=>void showHelp('article')}>再看课上的例子</button>{!['correct','pendingReview'].includes(feedback?.status??'')&&(session.selfChecks?.[task.id]?<button className="studio-primary" disabled={busy} onClick={()=>void submit()}>提交最终答案</button>:<button className="studio-primary" disabled={busy} onClick={()=>void beginSelfCheck()}>先保存首答，自己检查</button>)}</div>
      {feedback&&<div className={`task-feedback ${feedback.status}`} role="status"><div><b>{feedback.status==='pendingReview'?'解释已保存，待家长核对。':feedback.status==='correct'?'答对了！':feedback.status==='invalidInput'?'先把答案写完整。':'这次还没对，再想一想。'}</b><p>{feedback.message}</p>{feedback.diagnostic&&<p className="mistake-diagnostic"><Lightbulb size={17}/><span><b>只检查这个结构：</b>{feedback.diagnostic}</span></p>}{feedback.solution&&<p>{feedback.solution}</p>}{feedback.paid>0&&<span>＋{feedback.paid}积分</span>}{Boolean(feedback.completionPaid)&&<span>完成今天的核心练习，再得＋{feedback.completionPaid}积分</span>}</div>{['correct','pendingReview'].includes(feedback.status)&&<button disabled={busy} onClick={next}>{session.index<session.tasks.length-1?'继续下一题':'看看这一组'}<ChevronRight size={16}/></button>}</div>}
    </section>}
    <p className="practice-footer">今天互动练习积分：{progress.studio?.daily[day]?.tasks??0}/30。同一题不会重复发分；完成今天的核心练习另得5分。</p>
  </div>;
}
