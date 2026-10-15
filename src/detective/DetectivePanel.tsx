import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronDown,ChevronUp,FileSearch,Lightbulb,Medal,Search,ShieldCheck} from 'lucide-react';
import {navigationEvent,type NavigationEvent} from '../studio/navigationGuard';
import {detectiveApi,eventId,type Pair,type TodayData,type ResponseSpec} from './api';
import DetectiveFigure from './DetectiveFigure';
import './detective.css';
const phases=['judge','evidence','repair','verify'];
const stageNames=['先判断','找证据','写结果','换方法验证'];
export default function DetectivePanel({onParent}:{onParent:()=>void}){
 const [data,setData]=useState<TodayData|null>(null),[pair,setPair]=useState<Pair|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[value,setValue]=useState(''),[step,setStep]=useState<number|null>(null),[reason,setReason]=useState<number|null>(null);
 const state=useRef({pair,value});state.current={pair,value};
 const pending=useRef<Record<string,unknown>|null>(null),running=useRef(false),lock=useRef(false),saved=useRef(''),order=useRef(Promise.resolve());
 const load=async()=>{const d=await detectiveApi.today();setData(d);return d;};
 useEffect(()=>{load().catch(e=>setError(e.message));const timer=setInterval(()=>{if(!state.current.pair)load().catch(()=>{});},30000);return()=>clearInterval(timer);},[]);
 const accept=(next:Pair)=>{state.current={pair:next,value:next.attempt?.draft??''};setPair(next);setValue(next.attempt?.draft??'');saved.current=next.attempt?.draft??'';setStep(null);setReason(null);};
 const saveDraft=async()=>{
  const {pair:p,value:v}=state.current;const a=p?.attempt;if(!a||!['repair','verify'].includes(a.phase)||a.status!=='in-progress'||saved.current===v)return;
  if(lock.current)throw Error('还有操作没有保存。');
  const body=pending.current??{action:'draft',attemptId:a.id,expectedRevision:a.revision,eventId:eventId(),value:v};pending.current=body;lock.current=true;
  try{const next=await detectiveApi.act(body);pending.current=null;saved.current=String(body.value);state.current={pair:next,value:state.current.value};setPair(next);if(state.current.value===body.value)setValue(next.attempt?.draft??'');setError('');}
  catch(e){setError(e instanceof Error?e.message:'草稿没有保存，请重试。');throw e;}finally{lock.current=false;}
 };
 const saveRef=useRef(saveDraft);saveRef.current=saveDraft;
 useEffect(()=>{const before=(e:Event)=>{(e as NavigationEvent).detail.waitUntil(order.current.then(()=>saveRef.current()).then(()=>{if(pending.current)throw Error('操作未保存。')}));};const unload=(e:BeforeUnloadEvent)=>{if(pending.current||state.current.value!==saved.current){e.preventDefault();e.returnValue='';}};window.addEventListener(navigationEvent,before);window.addEventListener('beforeunload',unload);return()=>{window.removeEventListener(navigationEvent,before);window.removeEventListener('beforeunload',unload)}},[]);
 useEffect(()=>{if(!pair?.attempt||value===saved.current)return;const timer=setTimeout(()=>{order.current=order.current.catch(()=>{}).then(()=>saveRef.current()).catch(()=>{});},700);return()=>clearTimeout(timer);},[value,pair?.attempt?.id,pair?.attempt?.revision]);
 const act=async(action:string,extra:Record<string,unknown>={})=>{
  if(running.current)return;running.current=true;setBusy(true);setError('');
  try{await order.current;await saveRef.current();const a=state.current.pair?.attempt;if(!a)throw Error('请先打开案卷。');const body=pending.current??{action,...extra,attemptId:a.id,expectedRevision:a.revision,eventId:eventId()};pending.current=body;lock.current=true;const next=await detectiveApi.act(body);pending.current=null;accept(next);await load();}
  catch(e){setError(e instanceof Error?e.message:'没有保存，请重试。');}finally{running.current=false;lock.current=false;setBusy(false);}
 };
 const open=async(p:Pair)=>{setBusy(true);try{await saveRef.current();if(p.attempt)accept(p);else accept(await detectiveApi.act({action:'start',attemptId:eventId(),eventId:eventId(),caseId:p.case.id,version:p.case.version}));setError('');}catch(e){setError(e instanceof Error?e.message:'无法打开案卷。');}finally{setBusy(false)}};
 const back=async()=>{try{await saveRef.current();if(pending.current)throw Error('上次操作尚未保存，请先重试。');setPair(null);setValue('');saved.current='';await load();}catch(e){setError(e instanceof Error?e.message:'请先保存。')}};
 const a=pair?.attempt,c=pair?.case,closed=a?.phase==='closed',waiting=a?.status==='parent-review'||a?.status==='needs-revisit';
 return <div className="page detective-page">
 <header className="det-header"><div><span className="det-eyebrow"><Search size={16}/> 数学小侦探 · 看清楚，再下结论</span><h2>{c?c.title:'今天的三宗案卷'}</h2><p>{c?'有的做法有问题，有的完全正确。每个判断，都要找到证据。':'先判断，再找证据；改正之后，换一条路线检查。约5～8分钟。'}</p></div><div className="det-badge"><Medal/><b>{data?.badges??0}</b><span>探案勋章</span></div></header>
 {error&&<div className="det-error" role="alert"><p>{error} 输入仍在本页。</p><button disabled={busy} onClick={async()=>{if(pending.current){if(pending.current.action==='draft'){try{await saveRef.current()}catch{}}else await act(String(pending.current.action));}else{try{const d=await load();if(a){const latest=d.history.find(x=>x.attempt?.id===a.id);if(latest){const draft=state.current.value;accept(latest);setValue(draft);}}setError('')}catch(e){setError(e instanceof Error?e.message:'请检查本地服务。')}}}}>重试保存 / 重新载入</button>{pending.current&&<button onClick={async()=>{const draft=value;try{const d=await load();const latest=d.history.find(x=>x.attempt?.id===a?.id);pending.current=null;if(latest){accept(latest);setValue(draft);}setError('已载入服务器记录，输入仍保留。请核对后再提交。');}catch{}}}>冲突后载入最新记录</button>}<button onClick={()=>{const blob=new Blob([value],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),el=document.createElement('a');el.href=url;el.download='侦探未保存草稿.txt';el.click();URL.revokeObjectURL(url)}}>下载本页草稿</button></div>}
 {!pair?<>
 {!data?<p role="status">正在打开案卷柜…</p>:!data.cases.length?<section className="det-welcome"><FileSearch size={48}/><h3>{data.newCases?.length?'先调查下面的新案件':'等待新案卷送达'}</h3><p>{data.newCases?.length?'今天的三案组合还没有凑齐，下面收到的训练已经可以立即打开。':'请家长把错题发给 ChatGPT。网站收到并核验后，就能在这里打开；家长中心也有14宗备用示例。'}</p><button className="primary-button" onClick={onParent}>打开家长中心</button></section>:<div className="det-case-grid">{data.cases.map((p,i)=><button disabled={busy} key={p.case.version} className="det-case-ticket" onClick={()=>open(p)}><span>今日案卷 {String(i+1).padStart(2,'0')}</span><FileSearch/><h3>{p.case.title}</h3><p className="det-ticket-question">{p.case.prompt}</p><p>{p.attempt?.status.startsWith('closed-')?'已结案 · 可回看证据':p.attempt?'调查已保存 · 接着核对':'尚未作判断'}</p><b>{p.attempt?.status.startsWith('closed-')?'查看结案':'打开案卷'} <ArrowRight size={16}/></b></button>)}</div>}
 {!!data?.newCases?.length&&<section className="det-arrivals" aria-label="新收到的训练"><header><div><span className="det-label">刚送到案卷柜</span><h3>新收到的训练</h3><p>现在就能练。今天的三宗案卷保持原样，每天最多获得3枚勋章。</p></div><FileSearch size={28}/></header><div className="det-case-grid">{data.newCases.map(p=><button disabled={busy} className="det-case-ticket" key={p.case.version} onClick={()=>open(p)}><span>新到训练 · 匿名模拟</span><FileSearch/><h3>{p.case.title}</h3><p>{p.case.prompt}</p><b>{p.attempt?.status.startsWith('closed-')?'回看证据':p.attempt?'继续调查':'立即调查'} <ArrowRight size={16}/></b></button>)}</div></section>}
 {!!data?.history.length&&<details className="det-history"><summary>调查记录 · 首判和订正都保留</summary>{data.history.map(p=><button key={p.attempt!.id} disabled={busy} onClick={()=>open(p)}><span>{p.title}<small className="det-history-prompt">{p.case.prompt}</small><small>首判：{p.attempt?.firstVerdict===null?'尚未判断':p.attempt?.firstVerdict==='wrong'?'有问题':'没问题'}</small></span><b>{p.attempt?.status==='closed-independent'?'未用提示完成':p.attempt?.status==='closed-assisted'?'订正 / 线索支持完成':p.attempt?.status==='parent-review'?'待家长核对':p.attempt?.status==='needs-revisit'?'家长建议回补':'调查中'}</b></button>)}</details>}
 </>:c&&a?<>
 <div className="det-toolbar"><button onClick={back} disabled={busy}><ArrowLeft size={16}/> 暂停，回案卷柜</button><span aria-live="polite">{busy?'正在保存…':pending.current?'尚未保存':value!==saved.current?'正在保存草稿…':'记录已保存在本机'}</span></div>
 <ol className="det-stages">{stageNames.map((name,i)=><li key={name} className={closed||phases.indexOf(a.phase)>i?'done':a.phase===phases[i]?'current':''}><i>{closed||phases.indexOf(a.phase)>i?<Check size={14}/>:i+1}</i>{name}</li>)}</ol>
 <div className="det-investigation"><article className="det-case-sheet"><span className="det-label">案卷题目 · 匿名模拟</span><h3>{c.prompt}</h3><DetectiveFigure visual={c.visual}/><div className="det-work"><h4>小智的做法 <small>逐行核对，不假定每份都有错</small></h4>{c.steps.map((text,i)=>a.phase==='evidence'&&a.decision==='wrong'?<button key={i} aria-pressed={step===i} onClick={()=>setStep(i)} className={step===i?'selected':''}><i>{i+1}</i><span>{text}</span><Search size={16}/></button>:<div key={i}><i>{i+1}</i><span>{text}</span></div>)}</div></article>
 <section className="det-current-step" aria-label="当前调查步骤" key={a.phase}>
 <span className="det-label">{closed?'调查完成':waiting?'等待家长核对':`第${phases.indexOf(a.phase)+1}步 / 4`}</span>
 {a.firstVerdict&&<p className="det-first">已封存的首判：<b>{a.firstVerdict==='wrong'?'有问题':'没问题'}</b>{a.assisted?' · 有订正或线索支持':''}</p>}
 {a.phase==='judge'&&<><h3>这份做法有问题吗？</h3><p>先看题目要求，再对照每一行。</p><div className="det-decisions"><button disabled={busy} onClick={()=>act('judge',{value:'wrong'})}><Search/>有问题</button><button disabled={busy} onClick={()=>act('judge',{value:'correct'})}><ShieldCheck/>没问题</button></div></>}
 {a.phase==='evidence'&&<><h3>{a.decision==='wrong'?'第一处问题在哪里？':'你用什么依据判断正确？'}</h3><p>{a.decision==='wrong'?'先点左侧第一处有问题的行，再选核对依据。':'没有错误的行不用圈。选一条真正能核对条件的依据。'}</p><fieldset className="det-options"><legend>核对依据</legend>{c.reasons?.map((r,i)=><label key={r}><input type="radio" name="reason" checked={reason===i} onChange={()=>setReason(i)}/><span>{r}</span></label>)}</fieldset><button className="primary-button" disabled={busy||reason===null||(a.decision==='wrong'&&step===null)} onClick={()=>act('evidence',{step,reason})}>保存证据 <ArrowRight size={17}/></button></>}
 {(a.phase==='repair'||a.phase==='verify')&&!waiting&&c.response&&<><h3>{a.phase==='repair'?(a.decision==='correct'?'写出核对后的结果':'由你把结果改正确'):'再换一条路线检查'}</h3><ResponseInput spec={c.response} value={value} onChange={setValue}/><button className="primary-button" disabled={busy||!value} onClick={()=>act(a.phase,{value})}>{a.phase==='repair'?'保存结果，去验证':'保存验证，结案'} <ArrowRight size={17}/></button></>}
 {waiting&&<><h3>{a.status==='needs-revisit'?'这份解释还需要再核对':'解释已保存，请家长听一听'}</h3><p>开放答案由家长核对，不会因为口述确认就自动判对。</p>{a.status==='needs-revisit'&&<button className="primary-button" disabled={busy} onClick={()=>act('remediate')}>重新核对，保留原记录</button>}<button onClick={onParent}>请家长查看证据</button></>}
 {closed&&<><div className="det-closed-stamp"><Medal size={38}/><b>核 对 完 成</b><span>{a.status==='closed-assisted'?'订正 / 线索支持完成':'本次未用提示完成'}</span></div><h3>为什么这样判断？</h3><p className="det-solution">{c.solution}</p><p>勋章不兑换积分，不改变原课程掌握记录。</p><button className="primary-button" onClick={back}>返回今日案卷</button></>}
 {!!a.feedback&&<p className="det-feedback" role="status">{a.feedback}</p>}{a.publicFeedback.at(-1)?.comment&&<p className="det-feedback">家长反馈：{a.publicFeedback.at(-1)?.comment}</p>}
 {!closed&&!waiting&&<button className="det-hint" disabled={busy||a.hintsViewed>=3} onClick={()=>act('hint')}><Lightbulb size={17}/> 给一点线索（{a.hintsViewed}/3）</button>}
 </section></div></>:null}
 </div>;
}
function ResponseInput({spec:s,value,onChange}:{spec:ResponseSpec;value:string;onChange:(v:string)=>void}){
 const [drag,setDrag]=useState<number|null>(null);
 const items=value&&s.kind==='ordering'?value.split('|'):s.options;
 const move=(from:number,to:number)=>{if(to<0||to>=items.length)return;const next=[...items];next.splice(to,0,next.splice(from,1)[0]);onChange(next.join('|'));};
 return <div className="det-response"><p>{s.question}</p>{s.kind==='number'?<label className="det-number"><span>你的答案</span><input aria-label="你的答案" inputMode="decimal" maxLength={80} value={value} onChange={e=>onChange(e.target.value)}/><b>{s.unit}</b></label>:
 s.kind==='choice'?<fieldset className="det-options"><legend>选择一个结果</legend>{s.options.map(x=><label key={x}><input type="radio" name="repair-choice" checked={value===x} onChange={()=>onChange(x)}/><span>{x}</span></label>)}</fieldset>:
 s.kind==='ordering'?<><ol className="det-sort" aria-label="从长到短排序">{items.map((x,i)=><li key={x} draggable onDragStart={()=>setDrag(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(drag!==null)move(drag,i);setDrag(null);}}><span>{i+1}</span><b>{x}</b><button aria-label={`${x}上移`} disabled={i===0} onClick={()=>move(i,i-1)}><ChevronUp size={16}/></button><button aria-label={`${x}下移`} disabled={i===items.length-1} onClick={()=>move(i,i+1)}><ChevronDown size={16}/></button></li>)}</ol>{!value&&<button onClick={()=>onChange(items.join('|'))}>保留当前排列</button>}</>:
 <label className="det-oral"><input type="checkbox" checked={value==='oral'} onChange={e=>onChange(e.target.checked?'oral':'')}/>我已把理由说给家长听，等待家长核对。</label>}</div>;
}
