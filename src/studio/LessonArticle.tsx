import {withdrawnLessons} from "../../shared/withdrawn-checks.mjs";
import {navigationEvent,type NavigationEvent} from './navigationGuard';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,BookOpenCheck,ChevronRight,Lightbulb} from 'lucide-react';
import type {Progress} from '../types';
import type {ArticleBlock,PilotLesson,ReadingRecord,WidgetState} from './types';
import {studioApi} from './api';
import TeachingWidget,{TeachingDiagram} from './TeachingDiagrams';
import ChildClassroom from './ChildClassroom';
import {ConceptPreview} from './concept/ConceptVisual';
import StoryPicture from './StoryPicture';
import {introVisuals} from '../../content/pilot/intro-visuals.mjs';

type Props={lesson:PilotLesson;progress:Progress;setProgress:(p:Progress)=>void;notify:(m:string)=>void;onBack:()=>void;onPractice:(blind?:boolean)=>void};

export function Checkpoint({block,value,onChange}:{block:ArticleBlock;value:WidgetState;onChange:(s:WidgetState)=>void}){
  if(block.responseSpec?.type==='self-explanation')return <div className="try-yourself"><p className="checkpoint-purpose">先自己回答，再和参考过程比一比。这次对照用于学习，结果不计入掌握。</p><p className="checkpoint-question">{block.prompt}</p><label className="explanation-answer">我的想法<textarea maxLength={240} value={typeof value.explanation==='string'?value.explanation:''} onChange={e=>onChange({...value,explanation:e.target.value,compared:false})}/></label><button className="studio-primary" disabled={typeof value.explanation!=='string'||value.explanation.trim().length<2} onClick={()=>onChange({...value,compared:true})}>写好了，对照参考过程</button>{value.compared&&<div className="checkpoint-feedback"><b>找找相同的关系，再看看有什么不同</b><p>{block.referenceAnswer}</p><a href={`#lesson-${block.revisit??'try'}`}>回到上面的模型核对</a></div>}</div>;
  const selected=typeof value.choice==='number'?value.choice:null;
  const option=selected===null?undefined:block.options?.[selected];
  return <div className="try-yourself">
    <p className="checkpoint-purpose">读完题目，选一个答案。选完就能看到为什么，可以再试。</p>
    <p className="checkpoint-question">{block.prompt}</p>
    {block.diagram&&<TeachingDiagram kind={block.diagram} reveal={Boolean(option?.correct)}/>}
    <div className="checkpoint-options">{block.options?.map((o,i)=><button key={o.text} aria-pressed={selected===i} className={selected===i?'chosen':''} onClick={()=>onChange({choice:i})}><i aria-hidden="true">{String.fromCharCode(65+i)}</i><span>{o.text}</span></button>)}</div>
    {option&&<div className={`checkpoint-feedback ${option.correct?'right':'again'}`} aria-live="polite"><b>{option.correct?'这个判断符合题目条件，接着看看理由。':'先看图，再想一想。'}</b><p>{option.reason}</p><div><button onClick={()=>onChange({})}>重新选一次</button><a href={`#lesson-${block.revisit??'try'}`}>回到上面的图再看</a></div></div>}
  </div>;
}

function Reflection({lesson,progress,setProgress,notify}:Pick<Props,'lesson'|'progress'|'setProgress'|'notify'>){
  const [text,setText]=useState(''),[busy,setBusy]=useState(false);
  const notes=(progress.studio?.notes??[]) as {id:string;lessonId:string;text:string}[];
  const mine=notes.filter(n=>n.lessonId===lesson.lessonId);
  const save=async()=>{setBusy(true);try{const out=await studioApi.note(lesson.lessonId,`note:${crypto.randomUUID()}`,text);setProgress(out.progress);setText('');notify('你的解释记下来了。')}catch(e){notify(e instanceof Error?e.message:'保存没有完成。')}finally{setBusy(false)}};
  return <section className="reflection-box" id="lesson-retell"><h2>讲给爸爸妈妈听</h2><p>{(lesson as PilotLesson&{retellPrompt?:string}).retellPrompt}</p><p className="muted">可以直接说出来，也可以写下一句话。这里不会自动判对错。</p><label>我发现……<textarea value={text} maxLength={1200} onChange={e=>setText(e.target.value)} placeholder="用你自己的话讲，指着上面的图说也可以。"/></label><button disabled={busy||!text.trim()} onClick={save}>记下我的解释</button>{mine.slice(-2).map(n=><blockquote key={n.id}><span>我留下的话</span>{n.text}</blockquote>)}</section>;
}

export default function LessonArticle({lesson,progress,setProgress,notify,onBack,onPractice}:Props){
  const initial=progress.studio?.reading[lesson.lessonId] as ReadingRecord|undefined;
  const [widgets,setWidgets]=useState<Record<string,WidgetState>>(initial?.widgets??{});
  const [saveState,setSaveState]=useState(''),[dirty,setDirty]=useState(false),[conflict,setConflict]=useState(false);
  const revision=useRef(initial?.revision??0),queue=useRef(Promise.resolve()),latest=useRef({blockId:initial?.blockId??'start',widgets}),savedPayload=useRef(JSON.stringify(initial?.widgets??{}));
  const statusRef=useRef(setProgress);statusRef.current=setProgress;
  const save=()=>{
    queue.current=queue.current.catch(()=>{}).then(async()=>{
      const current=latest.current;if(savedPayload.current===JSON.stringify(current.widgets))return;
      setSaveState('正在保存…');
      try{const out=await studioApi.reading(lesson.lessonId,revision.current,current.blockId,current.widgets);revision.current=out.result.revision;savedPayload.current=JSON.stringify(current.widgets);statusRef.current(out.progress);setSaveState('操作已保存');setDirty(savedPayload.current!==JSON.stringify(latest.current.widgets));}
      catch(e){const stale=(e as Error&{status?:number}).status===409;setConflict(stale);setSaveState(stale?'暂未保存：另一页面已更新，请先保留本页草稿再载入最新操作。':'暂未保存，请点“重试保存”');throw e;}
    });return queue.current;
  };
  useEffect(()=>{if(!dirty)return;const timer=setTimeout(()=>{void save().catch(()=>{})},650);return()=>clearTimeout(timer)},[widgets,dirty]);
  useEffect(()=>()=>{void save().catch(()=>notify('刚才的操作未能保存，请回到课程重试。'))},[]);
  const change=(blockId:string,value:WidgetState)=>{const next={...latest.current.widgets,[blockId]:value};latest.current={blockId,widgets:next};setWidgets(next);setDirty(true);setSaveState('等待保存…')};
  const leave=async(action:()=>void)=>{try{await save();action();window.scrollTo(0,0)}catch(e){notify(e instanceof Error?e.message:'请先保存操作，再离开。')}};
  const reloadLatest=async()=>{try{await queue.current.catch(()=>{});const out=await studioApi.data(),r=out.progress.studio?.reading[lesson.lessonId] as ReadingRecord|undefined;revision.current=r?.revision??0;latest.current={blockId:r?.blockId??'start',widgets:r?.widgets??{}};savedPayload.current=JSON.stringify(latest.current.widgets);setWidgets(latest.current.widgets);setDirty(false);setConflict(false);setSaveState('已载入其他页面的最新操作');setProgress(out.progress)}catch(e){notify(e instanceof Error?e.message:'载入失败')}};
  const downloadDraft=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({format:'kevin-widget-draft',lessonId:lesson.lessonId,baseRevision:revision.current,...latest.current},null,2)],{type:'application/json'}));a.href=url;a.download=lesson.lessonId+'-unsaved-draft.json';a.click();URL.revokeObjectURL(url)};
  useEffect(()=>{const guard=(event:Event)=>(event as NavigationEvent).detail.waitUntil(save());const unload=(event:BeforeUnloadEvent)=>{if(savedPayload.current!==JSON.stringify(latest.current.widgets)){event.preventDefault();event.returnValue=''}};window.addEventListener(navigationEvent,guard);window.addEventListener('beforeunload',unload);return()=>{window.removeEventListener(navigationEvent,guard);window.removeEventListener('beforeunload',unload)}},[]);
  const first=lesson.articleBlocks[0];
  const measurement=lesson.widget==='lengthWorkbench';
  const concept=lesson.widget==='conceptLab';
  const staticCard=concept&&lesson.conceptScenes?.every(scene=>!scene.handsOnSpec&&!scene.modelSpec&&!scene.textbookSpec);
  const childMode=!!lesson.childClassroom&&!widgets.classroom?.parentMode;
  const trackName=lesson.track==='foundation'?'课本主线':lesson.track==='enhancement'?'本章提升':'思维挑战';
  return <div className={`studio-lesson child-lesson lesson-${lesson.widget}`}>
    {withdrawnLessons.includes(lesson.lessonId)&&<aside className="withdrawn-bridge"><div><b>操作完，再离开教具试五题</b><p>把教具收起来，只看题目。先留下自己的想法，再自查；解释题交给家长核对。</p></div><button className="studio-primary" onClick={()=>void leave(()=>onPractice(true))}>收起教具，独立做五题</button></aside>}<div className="studio-breadcrumb"><button onClick={()=>void leave(onBack)}><ArrowLeft size={17}/>返回学习地图</button><span>{lesson.shortTitle}</span><small role="status">{saveState}{saveState.startsWith('暂未')&&<><button onClick={()=>void save().catch(()=>{})}>重试保存</button><button onClick={downloadDraft}>导出本页未保存操作</button>{conflict&&<button onClick={()=>void reloadLatest()}>载入其他页面的最新操作（替换本页操作）</button>}</>}</small><button onClick={()=>void leave(()=>onPractice())}>直接做练习 <ChevronRight size={16}/></button></div>
    <article className="lesson-article">
      <header className="article-hero"><p className="eyebrow">{measurement?`三年级 · 测量 · ${trackName}`:concept?`三年级 · ${trackName} · 数学模型实验室`:`${lesson.shortTitle} · 一起弄明白`}</p><h1>{lesson.title}</h1><p className="article-question">{!childMode&&lesson.question}</p></header>
      {lesson.childClassroom&&<div className="lesson-mode-toggle" role="group" aria-label="课堂阅读方式"><button aria-pressed={childMode} onClick={()=>change('classroom',{...widgets.classroom,parentMode:false})}>Kevin 短课堂</button><button aria-pressed={!childMode} onClick={()=>change('classroom',{...widgets.classroom,parentMode:true})}>家长完整教案</button></div>}
      {childMode?<ChildClassroom lesson={lesson} widgets={widgets} change={change} onPractice={()=>void leave(()=>onPractice())}/>:<>
      <section className="story-opening" id={`lesson-${first.blockId}`}><div><h2>{first.title}</h2>{first.paragraphs?.map(p=><p key={p}>{p}</p>)}{first.text&&<p>{first.text}</p>}</div>{first.diagram&&<TeachingDiagram kind={first.diagram}/>}<StoryPicture lesson={lesson}/>{concept&&!lesson.introVisual&&!introVisuals[lesson.lessonId]&&lesson.conceptScenes?.[0]&&<ConceptPreview scene={lesson.conceptScenes[0]}/>}</section>
      <nav className="lesson-jumps" aria-label="跳到本课内容"><a href="#lesson-try">{staticCard?'画图想一想':'动手试试'}</a><a href="#lesson-meaning">{measurement?'弄懂为什么':'认识数学名字'}</a><a href="#lesson-check">轮到你来试</a><a href="#lesson-retell">讲给家人听</a></nav>
      {lesson.articleBlocks.slice(1).map(block=><section id={`lesson-${block.blockId}`} key={block.blockId} className={`article-block block-${block.type}`}><div className="block-content">
        <h2>{block.title}</h2>{block.text&&<p className="block-text">{block.text}</p>}{block.paragraphs?.map(p=><p key={p} className="block-text">{p}</p>)}
        {block.diagram&&block.type!=='checkpoint'&&<TeachingDiagram kind={block.diagram}/>}
        {block.widget&&<TeachingWidget kind={block.widget} value={widgets[block.blockId]??{}} scenes={lesson.mathScenes} lengthScenes={lesson.lengthScenes} conceptScenes={lesson.conceptScenes} onChange={s=>change(block.blockId,s)}/>}
        {block.examples&&<div className="example-grid">{block.examples.map(ex=><div className="example-card" key={ex.title}><h3>{ex.title}</h3>{ex.steps.map((step,i)=><p key={i}><strong>{step.math}</strong><span>{step.why}</span></p>)}</div>)}</div>}
        {block.cases&&<div className="case-grid">{block.cases.map(c=><div className={`case-card ${c.valid?'valid':'invalid'}`} key={c.label}><b>{c.valid?'✓ ':'△ '}{c.label}</b><strong>{c.math}</strong><p>{c.explanation}</p></div>)}</div>}
        {block.type==='checkpoint'&&<Checkpoint block={block} value={widgets[block.blockId]??{}} onChange={s=>change(block.blockId,s)}/>}
        {block.methods?.map(m=><details className="method-detail" key={m.id}><summary><Lightbulb size={18}/>这个办法有个名字：{m.name}</summary><p>{m.action}</p><p>注意：{m.condition}</p><p>{m.counterexample}</p></details>)}
        {block.type==='practice'&&<button className="studio-primary" onClick={()=>void leave(()=>onPractice())}><BookOpenCheck size={18}/>去做这节课的练习 <ChevronRight size={16}/></button>}
      </div></section>)}
      <Reflection lesson={lesson} progress={progress} setProgress={setProgress} notify={notify}/></>}
    </article>
  </div>;
}
