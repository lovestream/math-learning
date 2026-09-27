import {useRef,useState,type PointerEvent} from 'react';
import {Plus,RotateCcw,Undo2,ZoomIn} from 'lucide-react';
import {boundedInteger,chainMeasure} from '../../../shared/length-model.mjs';
import type {LengthScene,WidgetState} from '../types';
import {Dimension,LabNotice,Prediction,Ring,type LabProps} from './Primitives';

export default function ChainExperiment({scene,value,update}:{scene:LengthScene}&LabProps){
  const length=scene.pieceLengthsMm?.[0]??40,t=scene.thicknessMm??5,target=boundedInteger(value.target,scene.count??4,2,5);
  const placed=boundedInteger(value.placed,1,1,target),model=chainMeasure(length,t,placed),goal=chainMeasure(length,t,target);
  const all=placed===target,joint=boundedInteger(value.joint,-1,-1,placed-2),scale=620/chainMeasure(length,t,5).totalMm,x0=54,y=86;
  const inspected=Array.isArray(value.inspected)?value.inspected.filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<placed-1):[];
  const stage=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;moved:boolean}|null>(null),[ghost,setGhost]=useState<{x:number;y:number}|null>(null),skipClick=useRef(false);
  const change=(patch:WidgetState)=>update({...patch,checked:false,showReason:false});
  const add=()=>{if(!all)change({placed:placed+1,joint:-1})};
  const drop=(e:PointerEvent<HTMLButtonElement>)=>{if(!drag.current)return;skipClick.current=drag.current.moved;const r=stage.current?.getBoundingClientRect();if(drag.current.moved&&r&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)add();drag.current=null;setGhost(null)};
  const select=(i:number)=>update({joint:i,inspected:[...new Set([...inspected,i])]});
  return <div className="lab-experiment lab-chain">
    <div className="lab-play-area">
      <div className="lab-controls"><label>这次接几个环？<select aria-label="目标链环个数" value={target} onChange={e=>change({target:Number(e.target.value),placed:1,inspected:[],joint:-1,guess:''})}>{[2,3,4,5].map(n=><option value={n} key={n}>{n}个环</option>)}</select></label><button className="lab-icon-action" onClick={()=>change({placed:1,joint:-1,inspected:[],guess:''})}><RotateCcw size={15}/>重新摆</button></div>
      <div className={`lab-stage ${ghost?'is-drop-ready':''}`} ref={stage}>
        <div className="lab-stage-caption"><span>连接区</span><b>已连接 {placed} / {target} 个</b></div>
        <svg viewBox="0 0 760 310" role="group" aria-label="链环连接工作台">
          <Dimension x1={x0} x2={x0+length*scale} y={61} label={`一个环外长 ${length/10}厘米`}/>
          {model.starts.map((start,i)=><g className="ring-enter" key={i}><Ring x={x0+start*scale} y={y+(i%2?18:0)} width={length*scale} height={i%2?64:100} thickness={t*scale} index={i}/><text className="lab-piece-label" x={x0+(start+length/2)*scale} y={212} textAnchor="middle">第{i+1}环</text></g>)}
          {!all&&<g className="ring-destination" aria-hidden="true"><rect x={x0+(model.totalMm-model.overlapMm)*scale} y={y+8} width={length*scale} height="84" rx="42"/><text x={x0+(model.totalMm-model.overlapMm+length/2)*scale} y="133" textAnchor="middle">把下一个环放这里</text></g>}
          {model.joints.map((j,i)=><g role="button" tabIndex={0} key={i} aria-label={`放大第${i+1}处接头`} aria-pressed={joint===i} onClick={()=>select(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i)}}} className={`lab-joint-target ${joint===i?'selected':''} ${inspected.includes(i)?'inspected':''}`}><rect x={x0+j.start*scale-4} y={y-8} width={(j.end-j.start)*scale+8} height="117" rx="8"/><circle cx={x0+(j.start+model.overlapMm/2)*scale} cy="238" r="15"/><text x={x0+(j.start+model.overlapMm/2)*scale} y="243" textAnchor="middle">{i+1}</text></g>)}
          <Dimension x1={x0} x2={x0+model.totalMm*scale} y={292} label={value.showReason?`这${placed}个环的总长 ${model.totalMm}毫米`:'最左外缘到最右外缘：要量这一段'} className="total-dimension"/>
        </svg>
      </div>
      <div className="lab-parts-tray">
        <button
          className="lab-ring-source" disabled={all} aria-label="接上一个链环"
          onClick={()=>{if(skipClick.current){skipClick.current=false;return}add()}}
          onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,moved:false};skipClick.current=false;e.currentTarget.setPointerCapture(e.pointerId)}}
          onPointerMove={e=>{if(drag.current&&Math.hypot(e.clientX-drag.current.x,e.clientY-drag.current.y)>8){drag.current.moved=true;setGhost({x:e.clientX,y:e.clientY})}}}
          onPointerUp={drop}
          onPointerCancel={()=>{drag.current=null;setGhost(null);skipClick.current=true}}
        >
          <svg viewBox="0 0 115 64" aria-hidden="true"><Ring x={7} y={7} width={100} height={48} thickness={12} index={placed}/></svg>
          <span><Plus size={16}/>{all?'全部接好了':'接上一个环'}</span>
        </button>
        <div><b>{all?'下一步：点图中编号，放大接头':'点一下，或把这个环拖到连接区'}</b><p>第一个环先摆好；每添一个环才多一处接头。</p></div>
        <button aria-label="撤下最后一个链环" disabled={placed===1} onClick={()=>change({placed:placed-1,joint:-1,inspected:inspected.filter((i:number)=>i<placed-2)})}><Undo2 size={17}/>撤下</button>
      </div>
      {ghost&&<div className="ring-drag-ghost" style={{left:ghost.x,top:ghost.y}} aria-hidden="true"><svg viewBox="0 0 115 64"><Ring x={7} y={7} width={100} height={48} thickness={12} index={placed}/></svg></div>}
      {joint>=0?<div className="lab-joint-lens"><div><ZoomIn size={21}/><b>放大第 {joint+1} 处接头</b><p>沿着链条的方向看：前一环的右端、后一环的左端，各占{t}毫米。</p></div><svg viewBox="0 0 380 158" role="img" aria-label={`接头重叠由两段${t}毫米组成`}><rect x="35" y="32" width="155" height="38" rx="4" fill="#3b8692"/><rect x="190" y="78" width="155" height="38" rx="4" fill="#c58b36"/><rect x="125" y="18" width="130" height="116" className="joint-lens-zone"/><path d="M190 18V134" className="joint-lens-divider"/><text x="145" y="56" textAnchor="middle" className="lens-label">{t}毫米</text><text x="228" y="104" textAnchor="middle" className="lens-label">{t}毫米</text><Dimension x1={125} x2={255} y={155} label={`${t}＋${t}＝${t*2}毫米`}/></svg></div>:<LabNotice>接上第二个环后，点一下接头的编号，看看两段厚度在哪里。</LabNotice>}
    </div>
    <Prediction value={value} update={update} question={`${target}个环接好后，总长多少毫米？`} unit="毫米" expected={goal.totalMm} ready={all} why={`先数接头，再看每处少增加的是一段厚度，还是两段厚度。`}>
      <div className="lab-formula"><small>办法一 · 从材料总长中去重</small><b>{length}×{target} − {2*t}×{target-1} ＝ {goal.totalMm}</b><p>{target}个环有{target-1}处接头，每处重叠{2*t}毫米。</p></div>
      <div className="lab-formula"><small>办法二 · 看每个新环增加多少</small><b>{length} ＋ {goal.addedMm}×{target-1} ＝ {goal.totalMm}</b><p>第一环完整长{length}毫米，以后每个增加{goal.addedMm}毫米。</p></div>
      <p className="lab-condition">本图规定：链环拉直绷紧，一个接头重叠两段厚度；外长和内孔长要分清。</p>
    </Prediction>
  </div>;
}
