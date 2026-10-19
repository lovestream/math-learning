import {useState} from 'react';
import {Plus,RotateCcw,Undo2} from 'lucide-react';
import {boundedInteger,chainMeasure} from '../../../shared/length-model.mjs';
import type {LengthScene,WidgetState} from '../types';
import type {LabProps} from './Primitives';
import TwoRingWorkbench,{type TwoRingPatch} from './TwoRingWorkbench';
import ChainOverview from './ChainOverview';
import './chain-classroom.css';

export default function ChainExperiment({scene,value,update}:{scene:LengthScene}&LabProps){
 const length=scene.pieceLengthsMm?.[0]??40,t=scene.thicknessMm??5,target=boundedInteger(value.target,scene.count??4,2,5),placed=boundedInteger(value.placed,1,1,target);
 const model=chainMeasure(length,t,placed),goal=chainMeasure(length,t,target),subtract=value.mode==='chain-overlap',joint=boundedInteger(value.joint,-1,-1,placed-2),all=placed===target;
 const [entering,setEntering]=useState(0),[resetKey,setResetKey]=useState(0);
 const change=(patch:WidgetState)=>update({...patch,checked:false,showReason:false});
 const place=(n:number)=>{setEntering(n>placed?n:0);change({placed:n,joint:-1,compared:false,offset:0,show:false});};
 const restart=(next=target)=>{setEntering(0);setResetKey(n=>n+1);change({target:next,mode:'chain-growth',placed:1,joint:-1,inspected:[],compared:false,offset:0,show:false,guess:''});};
 const select=(n:number)=>{const old=Array.isArray(value.inspected)?value.inspected:[];update({joint:n,inspected:[...new Set([...old,n])]});};
 const twoChange=(patch:TwoRingPatch)=>change({...(patch.joined!==undefined?{placed:patch.joined?2:1,joint:-1}:{}),...(patch.mode!==undefined?{compared:patch.mode==='compare'}:{}),...(patch.offset!==undefined?{offset:patch.offset}:{}),...(patch.lens!==undefined?{zoom:patch.lens}:{})});
 const next=<button className="two-primary" aria-label="接上一个链环" disabled={all} onClick={()=>place(placed+1)}><Plus size={17}/>{all?'环已接齐':`接上第${placed+1}环`}</button>;
 const numeric=typeof value.guess==='string'&&/^\d+(\.\d+)?$/.test(value.guess.trim()),correct=Number(value.guess)===goal.totalMm;
 return <div className="chain-teaching lab-chain" data-count={placed} data-total-mm={model.totalMm} data-target={target}>
  <div className="chain-teaching-heading"><h3>{placed<=2?'先看清一个接头':'一条链，两种数法'}</h3><div><label>这次接<select aria-label="目标链环个数" value={target} onChange={e=>restart(Number(e.target.value))}>{[2,3,4,5].map(n=><option key={n} value={n}>{n}个环</option>)}</select></label><button onClick={()=>restart()}><RotateCcw size={16}/>重新摆</button></div></div>
  {placed<=2?<TwoRingWorkbench key={`${target}-${resetKey}`} embedded={{joined:placed===2,mode:value.compared?'compare':'growth',offset:typeof value.offset==='number'?value.offset:0,lens:value.zoom!==false,onChange:twoChange,nextControl:!all?next:undefined}}/>:<>
   <div className="chain-mode-toolbar" role="group" aria-label="两种长度算法"><button aria-pressed={!subtract} onClick={()=>update({mode:'chain-growth',joint:-1,show:false})}>逐个新增</button><button aria-pressed={subtract} onClick={()=>update({mode:'chain-overlap',joint:-1,show:false})}>先加后减</button><span>点接头编号，才展开两个5毫米。</span></div>
   <ChainOverview length={length} thickness={t} count={placed} subtract={subtract} entering={entering===placed} joint={joint} onJoint={select} onClose={()=>update({joint:-1})} showFormula={Boolean(value.show)} onFormula={show=>update({show})}/>
   <div className="chain-overview-actions">{next}<button aria-label="撤下最后一个链环" onClick={()=>place(placed-1)}><Undo2 size={17}/>撤下最后一个环</button><p>{subtract?'数一数：环数和接头数为什么相差1？':'新环没有变短；说说它有哪一段已经算过了。'}</p></div>
  </>}
  <details className="chain-prediction"><summary>留一个预测，再和实验核对（可选）</summary><label>{target}个环接好后，总长多少毫米？<span className="lab-guess"><input aria-label="预测链环总长" inputMode="decimal" maxLength={7} value={value.guess??''} onChange={e=>change({guess:e.target.value})}/><span>毫米</span></span></label><button className="lab-primary" disabled={!all||!numeric} onClick={()=>update({checked:true})}>和我的预测核对</button>{value.checked&&<p role="status" className="chain-prediction-feedback"><b>{correct?'预测和实验对上了！':'发现一个值得再想的地方'}</b><span>{correct?'指着同一条链，说说总长是怎么得到的。':'先数接头，再看新环实际增加了哪一段。可以改预测。'}</span></p>}<small>这里只记录探索，不发独立掌握积分。</small></details>
 </div>;
}
