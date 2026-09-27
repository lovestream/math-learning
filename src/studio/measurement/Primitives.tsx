import {useId,useRef,type PointerEvent,type ReactNode} from 'react';
import {Check,Lightbulb,Sparkles} from 'lucide-react';
import type {WidgetState} from '../types';

export const cm=(mm:number)=>mm%10===0?`${mm/10}厘米`:`${Math.floor(mm/10)}厘米${mm%10}毫米`;
export type LabProps={value:WidgetState;update:(patch:WidgetState)=>void};

export function Dimension({x1,x2,y,label,className=''}:{x1:number;x2:number;y:number;label:string;className?:string}){
  return <g className={`lab-dimension ${className}`} aria-hidden="true"><path d={`M${x1} ${y-6}v12m0-6H${x2}m0-6v12`}/><text x={(x1+x2)/2} y={y-11} textAnchor="middle">{label}</text></g>;
}

export function Ring({x,y,width,height,thickness,index}:{x:number;y:number;width:number;height:number;thickness:number;index:number}){
  const id=useId().replace(/:/g,'');
  return <g className={`lab-ring ring-color-${index%2}`}>
    <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={index%2?'#ffe0a1':'#b9e8e8'}/><stop offset=".48" stopColor={index%2?'#d19a49':'#539da8'}/><stop offset="1" stopColor={index%2?'#9a662b':'#246373'}/></linearGradient></defs>
    <rect x={x+thickness/2} y={y+thickness/2} width={width-thickness} height={height-thickness} rx={(height-thickness)/2} fill="none" stroke={`url(#${id})`} strokeWidth={thickness}/>
    <rect x={x+thickness*.55} y={y+thickness*.55} width={width-thickness*1.1} height={height-thickness*1.1} rx={(height-thickness*1.1)/2} fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.5"/>
  </g>;
}

export function LabNotice({children,success=false}:{children:ReactNode;success?:boolean}){
  return <div className={`lab-notice ${success?'is-success':''}`} role="status">{success?<Check size={19}/>:<Lightbulb size={19}/>}<div>{children}</div></div>;
}

export function Prediction({value,update,question,unit,expected,ready=true,why,children}:{question:string;unit:string;expected:number;ready?:boolean;why:string;children:ReactNode}&LabProps){
  const inputId=useId(),guess=typeof value.guess==='string'?value.guess:'',checked=Boolean(value.checked),numeric=/^\d+(\.\d+)?$/.test(guess.trim());
  const correct=numeric&&Number(guess)===expected;
  return <aside className={`lab-notebook ${checked&&correct?'has-discovery':''}`}>
    <div className="lab-notebook-title"><span>我的发现单</span><small>先想 → 动手 → 核对</small></div>
    <label htmlFor={inputId}>{question}</label>
    <div className="lab-guess"><input id={inputId} inputMode="decimal" autoComplete="off" maxLength={7} value={guess} placeholder="先预测" onChange={e=>update({guess:e.target.value,checked:false})}/><span>{unit}</span></div>
    <button className="lab-primary" disabled={!ready||!numeric} onClick={()=>update({checked:true,showReason:true})}>和我的预测核对</button>
    {!ready&&<p className="lab-note">先完成左边的动手任务，再回来核对。</p>}
    {checked&&<div className={`lab-guess-feedback ${correct?'correct':''}`} role="status">{correct?<><Sparkles size={23}/><b>预测和实验对上了！</b><span>再讲讲下面每个数表示什么。</span></>:<><b>发现一个值得再想的地方</b><span>{why}</span><span>可以改预测，也可以先看图中的算法。</span></>}</div>}
    {checked&&<details className="lab-reason" open={Boolean(value.showReason)} onToggle={e=>{const open=e.currentTarget.open;if(open!==Boolean(value.showReason))update({showReason:open})}}><summary>看看图里的数量关系</summary>{children}</details>}
    <p className="lab-note">这里可以反复试。独立练习会用新的题目。</p>
  </aside>;
}

// Use the SVG's real coordinate system, so dragging remains exact at every viewport size.
export function useSvgDrag(onMove:(dx:number)=>void,onStart?:()=>void){
  const gesture=useRef<{id:number;x:number}|null>(null),move=useRef(onMove),start=useRef(onStart);move.current=onMove;start.current=onStart;
  const svgX=(e:PointerEvent<SVGGElement>)=>{const svg=e.currentTarget.ownerSVGElement,ctm=svg?.getScreenCTM();if(!svg||!ctm)return e.clientX;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(ctm.inverse()).x};
  return {
    onPointerDown:(e:PointerEvent<SVGGElement>)=>{if(e.button!==0)return;e.preventDefault();gesture.current={id:e.pointerId,x:svgX(e)};start.current?.();e.currentTarget.setPointerCapture(e.pointerId)},
    onPointerMove:(e:PointerEvent<SVGGElement>)=>{if(gesture.current?.id===e.pointerId)move.current(svgX(e)-gesture.current.x)},
    onPointerUp:(e:PointerEvent<SVGGElement>)=>{if(gesture.current?.id===e.pointerId)gesture.current=null},
    onPointerCancel:()=>{gesture.current=null}
  };
}
