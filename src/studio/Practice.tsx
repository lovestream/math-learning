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
const selfCheckItems=(task:Task,lesson:PilotLesson)=>{
  if(task.selfCheckItems?.length===3)return task.selfCheckItems;
  const plans:Record<string,string[]>={
    'G3-U03-B01':['两端读数是否写成了同一种单位？','用的是“右端－左端”，还是把右端读数直接当长度？','算出的长度是否符合图中两个端点之间的距离？'],
    'G3-U03-B02':['题目问的是米还是千米？','每一份有多长，一共有几份？','量的是实际路线，还是把直线距离混进来了？'],
    'G3-U03-E01':['题目问材料总长，还是拼好后的端到端长度？','彩色重叠段在相加时被算了几次？','重叠段仍然存在，是否只减掉了多算的一次？'],
    'G3-U03-E02':['链环外长和金属厚度是否先统一成毫米？','环数是几个，相邻接头是不是少1个？','每处接头是否包含前后两段厚度？'],
    'G3-U03-O01':['除法得到的是点数，还是间隔数？','起点是否应该计数？','终点是一个新位置，还是回到了已经数过的起点？']
  };
  if(plans[lesson.lessonId])return plans[lesson.lessonId];
  const family=lesson.conceptScenes?.[0]?.family;
  const byFamily:Record<string,string[]>={
    spatial:['观察者和物体，究竟是谁移动或转动了？','看见的面能不能代表被遮住的全部信息？','能否换一个方向或折回去验证？'],
    operations:['每个数字的单位和故事含义分别是什么？','第一步是否只处理了应该先算的那一小块？','未计算的数字和符号是否完整保留？'],
    mass:['克、千克或吨是否已经统一？','容器、船或称量工具本身是否需要扣除？','比较前后的称量条件是否完全相同？'],
    placeValue:['每个数字现在位于哪一位，表示几个什么单位？','满十换一时，进位来自哪一列？','答案是否和估算的数量级接近？'],
    coding:['每一段数字分别在记录什么信息？','同一位置是否只对应一个编号？','有没有使用题目不需要或不该公开的信息？'],
    angles:['顶点和其中一条边是否已经对齐？','比较的是张口大小，还是把边长误当成角度？','旋转整幅图后，分类应不应该改变？'],
    fractions:['“1个整体”指的到底是什么？','每一小份是否真的一样大？','分母、分子和实际数量分别在回答什么？'],
    planning:['是否固定一个选择，再按同一顺序列完另一个？','每种搭配是否只出现一次？','问题是“各选一个”还是“任选一个”？'],
    transform:['图形上的每个点是否按同一种动作移动？','平移后方向是否保持，旋转时中心是否固定？','只检查一个点够不够说明整个图形重合？'],
    division:['分的是几个什么单位，分给几份？','商的每一位是否放在正确位置？','余数是否小于除数，并能乘加验回总数？'],
    boundary:['题目让你数内部方格，还是沿外边界走？','拼接后哪些边藏进内部，不再露在外面？','是否从起点走一圈并恰好回到起点？'],
    areaGrid:['单位方格是否同样大、无缝且不重叠？','一行格数和行数分别是什么？','换单位或剪拼后，是否重新核对了覆盖范围？'],
    data:['调查问题、对象和每人可选几项是否说清楚？','边界数据是否只进入一个分组？','各组频数相加能否回到有效记录总数？'],
    time:['题目问的是一个时刻，还是经过的时长？','跨整点、月底或星期时是否分段计算？','数的是间隔天数，还是包含首尾的日期个数？'],
    decimals:['各位数字分别表示元角分或米分米厘米中的哪个单位？','比较或加减时，相同单位是否上下对齐？','能否换成整数小单位再检查一次？'],
    sets:['共同出现的对象在相加时被数了几次？','减去重叠后，共同对象是否仍保留一次？','独有、共同、另一边独有三部分是否都算到了？']
  };
  return family&&byFamily[family]?byFamily[family]:['题目最后问的是什么？','第一步求出的数表示什么？','整条算式做完了吗？'];
};
export function TaskInput({task,value,onChange,disabled}:{task:Task;value:Answer;onChange:(v:Answer)=>void;disabled:boolean}){
  if(task.kind==='explanation')return <label className="explanation-answer">我的结论和过程<textarea disabled={disabled} maxLength={200} value={value.value??''} onChange={e=>onChange({...value,value:e.target.value})} placeholder="写出算式或关键关系，再说明为什么。可以和爸爸妈妈一起核对。"/><small>文字解释会保存为“待家长核对”，不会自动判对或发放答对积分。</small></label>;
  if(task.kind==='choice')return <div className="claim-evidence-input"><fieldset className="task-options"><legend>{task.responseSpec?.type==='claim-evidence'?'第一步：选择你的结论':'选择答案'}</legend>{task.options?.map((o,i)=><button type="button" disabled={disabled} key={o.id} aria-pressed={value.value===o.id} className={value.value===o.id?'selected':''} onClick={()=>onChange({...value,value:o.id})}><i>{String.fromCharCode(65+i)}</i>{o.text}</button>)}</fieldset>{task.responseSpec?.type==='claim-evidence'&&<fieldset className="task-options evidence-options"><legend>第二步：哪条证据能推出这个结论？</legend>{task.responseSpec.evidenceOptions.map((o,i)=><button type="button" disabled={disabled} key={o.id} aria-pressed={value.evidence===o.id} className={value.evidence===o.id?'selected':''} onClick={()=>onChange({...value,evidence:o.id})}><i>{i+1}</i>{o.text}</button>)}</fieldset>}</div>;
  const fields=task.fields??[{key:'value',label:task.kind==='expression'?'我的算式':'我的答案',unit:task.unit}];
  return <div className="task-fields">{fields.map(f=><label key={f.key}>{f.label}<div><input disabled={disabled} value={value[f.key]??''} onChange={e=>onChange({...value,[f.key]:e.target.value})} placeholder={task.kind==='expression'?'写出替换后的完整算式':'填数字，分数用 / 隔开'}/>{f.unit&&<span className="answer-unit">{f.unit}</span>}</div></label>)}</div>;
}
export default function Practice({lesson,initialSet,initialTaskId,progress,setProgress,notify,onBack}:{lesson:PilotLesson;initialSet?:SetName;initialTaskId?:string;progress:Progress;setProgress:(p:Progress)=>void;notify:(m:string)=>void;onBack:()=>void}){
  const [session,renderSession]=useState<PilotSession|null>(null),[answers,renderAnswers]=useState<Record<string,Answer>>({});
  const [feedback,setFeedback]=useState<(TaskResult&{completionPaid?:number})|null>(null),[busy,setBusy]=useState(false),[help,setHelp]=useState(''),[examples,setExamples]=useState(false),[finished,setFinished]=useState(false),[saveState,setSaveState]=useState('');
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
    try{const out=await studioApi.draft(s.id,s.revision,p.index,p.answers);saved.current=signature;setSession({...out.result,index:s.index});progressRef.current(out.progress);setSaveState('草稿已保存')}catch(e){setSaveState('尚未保存，请重试');throw e}
  };
  const guard=async(fn:()=>Promise<void>)=>{if(pending.current)return;pending.current=true;setBusy(true);try{await enqueue(fn)}catch(e){notify(e instanceof Error?e.message:'这次没有保存，请再试。')}finally{pending.current=false;setBusy(false)}};
  const start=(set:SetName,taskId?:string)=>guard(async()=>{
    await saveDraft();const out=await studioApi.session(lesson.lessonId,set);const index=taskId?out.result.tasks.findIndex(t=>t.id===taskId):-1;
    const restored=index>=0?{...out.result,index}:out.result,current=restored.tasks[restored.index];
    progressRef.current(out.progress);setSession(restored);setAnswers(out.result.answers);saved.current=JSON.stringify({sessionId:out.result.id,index:out.result.index,answers:out.result.answers});
    setFeedback(current?restored.results[current.id]??null:null);setSelfCheckMessage(current&&restored.selfChecks?.[current.id]&&!restored.results[current.id]?'首答已经保存。请重新读题，检查单位、第一步和整条算式；想改就改，再提交最终答案。':'');setFinished(false);setHelp('');setExamples(false);setSaveState('已恢复这组练习');
    const url=new URL(location.href);url.searchParams.set('lesson',lesson.lessonId);url.searchParams.set('set',set);url.searchParams.set('practice','1');history.replaceState(null,'',url);
  });
  const opened=useRef(false);
  useEffect(()=>{if(initialSet&&!opened.current){opened.current=true;void start(initialSet,initialTaskId)}},[]);
  useEffect(()=>{if(!dirty())return;setSaveState('等待保存…');const timer=setTimeout(()=>{void enqueue(saveDraft).catch(()=>{})},650);return()=>clearTimeout(timer)},[answers,session?.index]);
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty()||pending.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>{window.removeEventListener('beforeunload',warn);void enqueue(saveDraft).catch(()=>notify('刚才的草稿还没有保存，请返回练习重试。'))}},[]);
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
    const currentAnswers=answersRef.current,current=currentAnswers[t.id]??{},items=selfCheckItems(t,lesson);
    const process=current.checkFirstOperation?.trim()&&current.checkIntermediate?.trim()?`先算${current.checkFirstOperation}，中间结果${current.checkIntermediate}。`:'';
    const selectedEvidence=t.responseSpec?.type==='claim-evidence'?t.responseSpec.evidenceOptions.find(option=>option.id===current.evidence)?.text:'';
    const evidence:SelfCheckEvidence={checks:items.filter((_,i)=>current[`check${i}`]==='done'),reflection:current.checkReflection?.trim()||process||selectedEvidence||(t.kind==='explanation'?current.value:'' )||'',firstOperation:current.checkFirstOperation??'',intermediate:current.checkIntermediate??'',finalConfirmed:current.checkFinal==='done'};
    if(evidence.checks.length!==3||evidence.reflection.trim().length<2||!evidence.finalConfirmed||(lesson.lessonId.startsWith('G3-U02')&&t.kind!=='choice'&&t.kind!=='explanation'&&(!evidence.firstOperation?.trim()||!evidence.intermediate?.trim()))){setFeedback({status:'invalidInput',message:'请完成三项自查，写下关键过程，并确认最终答案。',paid:0,at:new Date().toISOString(),assisted:Boolean(s.help[t.id])});return}
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
  return <div className="studio-practice child-practice"><div className="studio-breadcrumb"><button disabled={busy} onClick={()=>void guard(async()=>{await saveDraft();onBack();window.scrollTo(0,0)})}><ArrowLeft size={17}/>返回讲解</button><span>{lesson.shortTitle}</span><small role="status">{saveState}</small>{saveState.startsWith('尚未')&&<button disabled={busy} onClick={()=>void guard(saveDraft)}>重试保存</button>}<button disabled={busy} onClick={()=>void guard(async()=>{await saveDraft();notify('练习草稿已保存。')})}>保存草稿</button></div>
    <header className="practice-heading"><div><h1>现在，自己来试试</h1><p>选一组就能开始。答错可以改，也可以看提示，慢慢想清楚。</p></div></header>
    <div className="set-tabs">{groups.map(g=><button disabled={busy} key={g.id} className={session?.setName===g.id?'active':''} onClick={()=>void start(g.id)}>{g.name} <small>{lesson.taskSets[g.id].length}题</small></button>)}</div>
    {!session?<div className="practice-empty"><Lightbulb/><h2>先从哪一组开始？</h2><p>建议先试两题，熟悉后也可以直接选更难的。</p><button className="studio-primary" disabled={busy} onClick={()=>void start('warmup')}>先试两题 <ChevronRight size={16}/></button></div>:finished?<section className="practice-finished"><Star/><h2>{group?.name}，这一组做完了！</h2><p>你答对了{session.tasks.filter(t=>session.results[t.id]?.status==='correct').length}题。另有{session.tasks.filter(t=>session.results[t.id]?.status==='pendingReview').length}题解释待家长核对。可以选下一组，也可以休息一下。</p>{session.setName==='core'&&Boolean(progress.studio?.review?.[lesson.lessonId])&&<p>明天再回想这节课，复习时间已经记下。</p>}<button onClick={()=>void guard(async()=>{await saveDraft();onBack();window.scrollTo(0,0)})}>回去讲讲我的发现</button></section>:task&&<section className="task-card">
      <header><div><span>{group?.name} · 第{session.index+1}/{session.tasks.length}题</span><p>{group?.description}</p><h2>{task.prompt}</h2></div></header>
      {task.diagram?.type==='measurement'&&'mode' in task.diagram&&<MeasurementTaskDiagram diagram={task.diagram}/>}
      {task.diagram?.type==='concept'&&'family' in task.diagram&&<ConceptTaskDiagram diagram={task.diagram}/>}
      <TaskInput task={task} value={answer} disabled={busy||['correct','pendingReview'].includes(feedback?.status??'')} onChange={a=>{setAnswers({...answersRef.current,[task.id]:a});if(feedback?.status==='invalidInput')setFeedback(null)}}/>
      {help&&<div className="help-panel"><Lightbulb/><p>{help}</p></div>}
      {examples&&<aside className="practice-examples"><h3>回看这节课的例子</h3>{lesson.articleBlocks.filter(b=>b.examples).flatMap(b=>b.examples??[]).map(ex=><div key={ex.title}><h4>{ex.title}</h4>{ex.steps.map(s=><p key={s.math}><b>{s.math}</b><br/>{s.why}</p>)}</div>)}<button onClick={()=>setExamples(false)}>收起例子，继续想这道题</button></aside>}
      {session.selfChecks?.[task.id]&&!['correct','pendingReview'].includes(feedback?.status??'')&&<div className="self-check-panel"><b>先当一次自己的小老师</b><p>{selfCheckMessage||'首答已保存。重新核对下面的三件事，完成一项就勾一项。'}</p><div className="self-check-actions">{selfCheckItems(task,lesson).map((item,i)=><label key={item}><input type="checkbox" checked={answer[`check${i}`]==='done'} disabled={busy} onChange={e=>setAnswers({...answersRef.current,[task.id]:{...answer,[`check${i}`]:e.target.checked?'done':''}})}/><span>{item}</span></label>)}</div>{lesson.lessonId.startsWith('G3-U02')&&task.kind!=='choice'&&task.kind!=='explanation'&&<div className="task-fields"><label>我先算这一部分<input disabled={busy} maxLength={120} value={answer.checkFirstOperation??''} placeholder="例如：9÷3" onChange={e=>setAnswers({...answersRef.current,[task.id]:{...answer,checkFirstOperation:e.target.value}})}/></label><label>这一步得到的中间结果<input disabled={busy} maxLength={120} value={answer.checkIntermediate??''} placeholder="例如：3，还需要继续减2" onChange={e=>setAnswers({...answersRef.current,[task.id]:{...answer,checkIntermediate:e.target.value}})}/></label></div>}<label className="check-reflection">重新检查时，我核对了什么？{(lesson.lessonId.startsWith('G3-U02')||task.kind==='explanation'||task.responseSpec?.type==='claim-evidence')&&'（已有关键过程时，可不再重复写）'}<input disabled={busy} maxLength={200} value={answer.checkReflection??''} placeholder="写一句关键关系，或写下改动的位置" onChange={e=>setAnswers({...answersRef.current,[task.id]:{...answer,checkReflection:e.target.value}})}/></label><label className="self-check-confirm"><input type="checkbox" disabled={busy} checked={answer.checkFinal==='done'} onChange={e=>setAnswers({...answersRef.current,[task.id]:{...answer,checkFinal:e.target.checked?'done':''}})}/>我检查了最后一步和最终答案</label><small>可以保留首答，也可以改答；这些检查过程会一起保存。</small></div>}
      <div className="task-actions"><button disabled={busy} className="help-button" onClick={()=>void showHelp('hint')}>给我一点提示</button><button disabled={busy} className="help-button" onClick={()=>void showHelp('article')}>再看课上的例子</button>{!['correct','pendingReview'].includes(feedback?.status??'')&&(session.selfChecks?.[task.id]?<button className="studio-primary" disabled={busy} onClick={()=>void submit()}>提交最终答案</button>:<button className="studio-primary" disabled={busy} onClick={()=>void beginSelfCheck()}>先保存首答，自己检查</button>)}</div>
      {feedback&&<div className={`task-feedback ${feedback.status}`} role="status"><div><b>{feedback.status==='pendingReview'?'解释已保存，待家长核对。':feedback.status==='correct'?'答对了！':feedback.status==='invalidInput'?'先把答案写完整。':'这次还没对，再想一想。'}</b><p>{feedback.message}</p>{feedback.diagnostic&&<p className="mistake-diagnostic"><Lightbulb size={17}/><span><b>只检查这个结构：</b>{feedback.diagnostic}</span></p>}{feedback.solution&&<p>{feedback.solution}</p>}{feedback.paid>0&&<span>＋{feedback.paid}积分</span>}{Boolean(feedback.completionPaid)&&<span>完成今天的核心练习，再得＋{feedback.completionPaid}积分</span>}</div>{['correct','pendingReview'].includes(feedback.status)&&<button disabled={busy} onClick={next}>{session.index<session.tasks.length-1?'继续下一题':'看看这一组'}<ChevronRight size={16}/></button>}</div>}
    </section>}
    <p className="practice-footer">今天互动练习积分：{progress.studio?.daily[day]?.tasks??0}/30。同一题不会重复发分；完成今天的核心练习另得5分。</p>
  </div>;
}
