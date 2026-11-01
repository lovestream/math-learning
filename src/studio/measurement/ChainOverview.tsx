import {useLayoutEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
import {chainMeasure} from '../../../shared/length-model.mjs';
import {twoRingView} from '../../../shared/two-ring-view.mjs';
import {Ring} from './Primitives';
import {JointInset} from './TwoRingWorkbench';

const SCALE=5.5,LEFT=80,Y=88,HEIGHT=88;
const x=(mm:number)=>LEFT+mm*SCALE;
const circled=(n:number)=>String.fromCodePoint(0x2460+n);

export default function ChainOverview({length,thickness,count,subtract,entering,joint,onJoint,onClose,showFormula,onFormula}:{length:number;thickness:number;count:number;subtract:boolean;entering:boolean;joint:number;onJoint:(n:number)=>void;onClose:()=>void;showFormula:boolean;onFormula:(show:boolean)=>void}){
 const model=chainMeasure(length,thickness,count),uid=useId().replace(/:/g,''),frame=useRef(0),[arrival,setArrival]=useState(0),focusReturn=useRef<HTMLElement|null>(null);
 useLayoutEffect(()=>{cancelAnimationFrame(frame.current);if(!entering||matchMedia('(prefers-reduced-motion: reduce)').matches){setArrival(0);return;}
  const from=model.addedMm/2,start=performance.now();setArrival(from);
  const tick=(now:number)=>{const p=Math.min(1,(now-start)/450);setArrival(p===1?0:from*(1-p)**3);if(p<1)frame.current=requestAnimationFrame(tick);};frame.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame.current);
 },[count,entering]);
 const ring=(i:number)=> <Ring x={x(model.starts[i]+(i===count-1?arrival:0))} y={Y} width={length*SCALE} height={HEIGHT} thickness={thickness*SCALE} index={i}/>;
 const last=model.extensions.at(-1)!,ready=arrival===0,total=model.totalMm+arrival;
 const open=(i:number)=>{focusReturn.current=document.activeElement as HTMLElement;onJoint(i);};
 const close=()=>{onClose();requestAnimationFrame(()=>focusReturn.current?.focus());};
 const formula=subtract?`${count}×${length}−${count-1}×${model.overlapMm}＝${model.totalMm}毫米`:`${length}${Array.from({length:count-1},()=>`＋${model.addedMm}`).join('')}＝${model.totalMm}毫米`;
 return <div className={`chain-overview ${subtract?'is-overlap':'is-growth'}`} data-count={count} data-total-mm={model.totalMm} data-arriving={!ready}>
  <div className="chain-overview-reading"><b>{count}个环 <span>·</span> {model.joints.length}处接头</b><span>{subtract?`${model.joints.length}处接头，每处共同${model.overlapMm}毫米`:'每添一个环，就多一处接头'}</span></div>
  <svg className="chain-main-figure" viewBox="0 0 1100 360" role="group" aria-label={`${count}个等长环、${model.joints.length}处接头，沿同一方向拉直`}>
   <defs>{model.joints.map((j,i)=><clipPath id={`${uid}-${i}`} key={i}><rect x={x(j.start+(i===count-2?arrival:0))} y={Y-1} width={Math.max(0,model.overlapMm-(i===count-2?arrival:0))*SCALE} height={HEIGHT/2+1}/></clipPath>)}</defs>
   {model.starts.map((start,i)=><g key={i} className={`ring-enter ${i===count-1?'is-new-ring':''}`} data-ring-index={i} data-left-mm={start+(i===count-1?arrival:0)} data-right-mm={start+length+(i===count-1?arrival:0)}>{ring(i)}</g>)}
   {model.joints.map((_,i)=><g clipPath={`url(#${uid}-${i})`} className="chain-interlace" key={i} aria-hidden="true">{ring(i)}</g>)}
   {model.starts.map((start,i)=><text key={i} className="chain-ring-name" x={x(start+length/2+(i===count-1?arrival:0))} y={Y+HEIGHT/2+6} textAnchor="middle">环{circled(i)}</text>)}
   {model.joints.map((j,i)=><g key={i} role="button" tabIndex={0} aria-label={`放大第${i+1}处接头`} aria-pressed={joint===i} className={`chain-joint-mark ${i===count-2?'is-new-joint':''}`} style={{'--joint-index':i} as React.CSSProperties} onClick={()=>open(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i);}}}>
    <title>第{i+1}处接头：点开看两个端部</title><path d={`M${x((j.start+j.end)/2)} ${Y+HEIGHT+4}v22`}/><circle cx={x((j.start+j.end)/2)} cy="220" r="17"/><text x={x((j.start+j.end)/2)} y="226" textAnchor="middle">{i+1}</text>
   </g>)}
   {ready&&!subtract&&<g className="chain-latest-added" data-from-mm={last.start} data-to-mm={last.end}><path className="chain-old-end" d={`M${x(last.start)} ${Y+HEIGHT+2}V328`}/><path d={`M${x(last.start)} 320v10m0-5H${x(last.end)}m0-5v10`}/><text x={x((last.start+last.end)/2)} y="313" textAnchor="middle">＋{model.addedMm}毫米</text></g>}
   <g className="chain-total-ruler" data-from-mm={0} data-to-mm={total}><path d={`M${x(0)} 265v12m0-6H${x(total)}m0-6v12`}/><text className="chain-total-label" x={x(total/2)} y="257" textAnchor="middle">{ready?`总长${model.totalMm}毫米`:'把完整的新环接进来……'}</text><text x={x(0)} y="296" textAnchor="middle">0</text>{ready&&<text x={x(total)} y="296" textAnchor="middle">{model.totalMm}</text>}</g>
  </svg>
  <details className="chain-formula" open={showFormula} onToggle={e=>{if(e.currentTarget.open!==showFormula)onFormula(e.currentTarget.open);}}><summary>把看到的写成算式</summary><p>{ready?formula:'先看完整环接好。'}</p></details>
  {joint>=0&&joint<model.joints.length&&createPortal(<div className="chain-focus-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}><section role="dialog" aria-modal="true" aria-label={`第${joint+1}处接头的局部放大`} className="chain-joint-dialog two-ring-preview" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close();}if(e.key==='Tab'){const nodes=[...e.currentTarget.querySelectorAll<HTMLElement>('button,a[href]')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
   <header><b>第{joint+1}处接头 · 环{circled(joint)}和环{circled(joint+1)}</b><button autoFocus onClick={close} aria-label="关闭接头细节"><X size={18}/></button></header>
   <svg viewBox="820 10 270 530" role="img" aria-label="只放大所选接头的两个金属端部"><JointInset view={twoRingView()} id={uid+'-focus'} index={joint}/></svg>
   <p>这里只看这一处接头。整条{count}环链仍长<strong>{model.totalMm}毫米</strong>。</p><a href="/?preview=chain-two" target="_blank" rel="noreferrer">另开一页，重看双环原理</a>
  </section></div>,document.body)}
 </div>;
}
