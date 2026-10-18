import {useEffect,useId,useRef,useState,type PointerEvent} from 'react';
import {ArrowLeft,ArrowRight,Link2,RotateCcw,Undo2,ZoomIn} from 'lucide-react';
import {twoRingView} from '../../../shared/two-ring-view.mjs';
import {Ring} from './Primitives';
import './two-ring.css';

const SCALE=10,ORIGIN=100,RING_Y=178,RING_H=160;
const x=(mm:number)=>ORIGIN+mm*SCALE;
const fmt=(n:number)=>Number(n.toFixed(1)).toString();

function Measure({from,to,y,label,tone='ink',guidesTo,className=''}:{from:number;to:number;y:number;label:string;tone?:string;guidesTo?:number;className?:string}){
 return <g className={`two-measure two-${tone} ${className}`} data-from-mm={from} data-to-mm={to}>
  {guidesTo!==undefined&&<path className="two-guide" d={`M${x(from)} ${y-5}V${guidesTo}M${x(to)} ${y-5}V${guidesTo}`}/>}
  <path className="two-size-line" d={`M${x(from)} ${y-5}v10m0-5H${x(to)}m0-5v10`}/>
  <text x={(x(from)+x(to))/2} y={y-12} textAnchor="middle">{label}</text>
 </g>;
}

function JointInset({view,id}:{view:ReturnType<typeof twoRingView>;id:string}){
 // Same horizontal geometry at 2× scale; crop the remote arms, never distort an end.
 const zoom=20,local=(mm:number)=>80+(mm-view.joint.left)*zoom;
 const left=local(view.joint.left),right=local(view.joint.right),middle=local(view.joint.nextMetal[1]);
 return <g className="two-joint-inset" aria-label="接头原位放大：环②左端30到35，环①右端35到40，各厚5毫米">
  <path className="two-lens-leader" d={`M${x((view.joint.left+view.joint.right)/2)} ${RING_Y}V158H820V30H830`}/>
  <rect x="830" y="20" width="252" height="510" rx="14" className="two-lens-paper"/>
  <svg x="836" y="36" width="240" height="480" viewBox="0 0 360 720" role="img" aria-label="上下分开看同一接头的两个金属端部">
   <defs><clipPath id={id+'-blue'}><rect x="12" y="90" width="336" height="200"/></clipPath><clipPath id={id+'-amber'}><rect x="12" y="410" width="336" height="190"/></clipPath></defs>
   <text x="180" y="23" textAnchor="middle" className="two-lens-title">同一接头，放大看</text>
   <text x="16" y="65" className="two-blue">环①的右端</text>
   <g clipPath={`url(#${id}-blue)`}><Ring x={right-view.lengthMm*zoom} y={40} width={view.lengthMm*zoom} height={RING_H*2} thickness={view.thicknessMm*zoom} index={0}/></g>
   <text x="16" y="385" className="two-amber">环②的左端</text>
   <g clipPath={`url(#${id}-amber)`}><Ring x={left} y={360} width={view.lengthMm*zoom} height={RING_H*2} thickness={view.thicknessMm*zoom} index={1}/></g>
   <rect data-joint-region="true" x={left} y="90" width={right-left} height="510" className="two-lens-frame"/>
   <path d={`M${middle} 90V600`} className="two-lens-middle"/>
   <g data-metal="previous" data-start-mm={view.joint.previousMetal[0]} data-end-mm={view.joint.previousMetal[1]} className="two-lens-measure two-blue"><path d={`M${middle} 305v10m0-5H${right}m0-5v10`}/><text x={(middle+right)/2} y="343" textAnchor="middle">5毫米</text></g>
   <g data-metal="next" data-start-mm={view.joint.nextMetal[0]} data-end-mm={view.joint.nextMetal[1]} className="two-lens-measure two-amber"><path d={`M${left} 615v10m0-5H${middle}m0-5v10`}/><text x={(left+middle)/2} y="653" textAnchor="middle">5毫米</text></g>
   <text x="180" y="700" textAnchor="middle" className="two-lens-total">5＋5＝10毫米</text>
  </svg>
 </g>;
}

/** Isolated stage-0 review prototype: deliberately has no learning-store API. */
export default function TwoRingWorkbench(){
 const fromLesson=new URLSearchParams(location.search).get('from')==='lesson';
 const [joined,setJoined]=useState(false),[mode,setMode]=useState<'growth'|'compare'>('growth'),[offset,setOffset]=useState(0),[arrival,setArrival]=useState(0),[lens,setLens]=useState(true),[history,setHistory]=useState<number[]>([]);
 const frame=useRef(0),drag=useRef<{x:number;offset:number}|null>(null),svgRef=useRef<SVGSVGElement>(null),offsetRef=useRef(offset);offsetRef.current=offset;
 const uid=useId().replace(/:/g,''),view=twoRingView(mode==='compare'?offset:0),ready=joined&&arrival===0,unfolded=ready&&mode==='compare'&&offset>0;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const stop=()=>{cancelAnimationFrame(frame.current);frame.current=0;};
 useEffect(()=>()=>stop(),[]);
 const animate=(from:number,to:number,write:(n:number)=>void,duration=480)=>{
  stop();if(reduced()){write(to);return;}const start=performance.now();
  const tick=(now:number)=>{const p=Math.min(1,(now-start)/duration);write(p===1?to:from+(to-from)*(1-(1-p)**3));if(p<1)frame.current=requestAnimationFrame(tick);};frame.current=requestAnimationFrame(tick);
 };
 const add=()=>{if(joined)return;setJoined(true);writeOffset(0);setMode('growth');const travel=view.extra.lengthMm/2;setArrival(reduced()?0:travel);animate(travel,0,setArrival);};
 const writeOffset=(n:number)=>{offsetRef.current=n;setOffset(n);};
 const remember=()=>{const previous=offsetRef.current;setHistory(h=>[...h.slice(-19),previous]);};
 const move=(to:number)=>{if(!ready)return;remember();animate(offsetRef.current,twoRingView(to).offsetMm,writeOffset);};
 const changeMode=(next:'growth'|'compare')=>{stop();drag.current=null;setArrival(0);writeOffset(0);setMode(next);setHistory([]);};
 const reset=()=>{stop();drag.current=null;setJoined(false);writeOffset(0);setArrival(0);setMode('growth');setHistory([]);};
 const svgX=(e:PointerEvent<SVGGElement>)=>{const svg=svgRef.current,ctm=svg?.getScreenCTM();if(!svg||!ctm)return e.clientX;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(ctm.inverse()).x;};
 const down=(e:PointerEvent<SVGGElement>)=>{if(mode!=='compare'||!ready||e.button!==0)return;e.preventDefault();stop();remember();drag.current={x:svgX(e),offset:offsetRef.current};e.currentTarget.setPointerCapture(e.pointerId);};
 const pointerMove=(e:PointerEvent<SVGGElement>)=>{if(!drag.current)return;writeOffset(twoRingView(drag.current.offset+(svgX(e)-drag.current.x)/SCALE).offsetMm);};
 const up=()=>{if(!drag.current)return;drag.current=null;const d=offsetRef.current;writeOffset(d<1?0:d>view.overlapMm-1?view.overlapMm:d);};
 const ring2Left=ready?view.second.left:view.originalSecond.left+arrival,ring2Right=ring2Left+view.lengthMm;
 const realRing=(i:number,left:number)=> <Ring x={x(left)} y={RING_Y} width={view.lengthMm*SCALE} height={RING_H} thickness={view.thicknessMm*SCALE} index={i}/>;
 const tickValues=[view.first.left,view.first.right,...(ready?[view.originalSecond.left,view.originalSecond.right,view.second.left,view.second.right]:[])].filter((n,i,ns)=>ns.indexOf(n)===i).sort((a,b)=>a-b);
 return <main className="two-ring-preview" data-approval-status="awaiting-parent-visual-approval">
  <header className="two-page-heading"><div><p>链环 · 两环视觉样板</p><h1>第二个环接上以后，多出来哪一段？</h1></div><span>待家长验收 · 不计分</span></header>
  <section className="two-workbench" aria-label="双环同图实验">
   <div className="two-toolbar"><div role="group" aria-label="观察方式"><button aria-pressed={mode==='growth'} onClick={()=>changeMode('growth')}>逐个新增</button><button aria-pressed={mode==='compare'} disabled={!ready} onClick={()=>changeMode('compare')}>拉开比较</button></div><p>{mode==='growth'?'看同一对环：完整外长、接头与新增量。':'这是把长度展开来比较，不是把真正的铁环拉脱。'}</p><button onClick={reset} className="two-reset"><RotateCcw size={17}/>重摆</button></div>
   <svg ref={svgRef} className="two-main-figure" viewBox="0 0 1100 550" role="group" aria-label="同一毫米坐标下的双环与长度尺" data-mode={mode} data-offset-mm={fmt(view.offsetMm)} data-coupled-total-mm={view.coupledTotalMm} data-comparison-total-mm={fmt(view.comparisonTotalMm)}>
    <defs><clipPath id={uid+'-upper'}><rect x="0" y="0" width="1100" height={RING_Y+RING_H/2}/></clipPath></defs>
    <Measure from={view.first.left} to={view.first.right} y={76} label="环①完整40毫米" tone="blue" guidesTo={RING_Y+RING_H/2} className="two-first-length"/>
    {joined&&<Measure from={ring2Left} to={ring2Right} y={125} label="环②完整也是40毫米" tone="amber" guidesTo={RING_Y+RING_H/2} className="two-second-length"/>}
    {ready&&!unfolded&&<rect className="two-shared-region" x={x(view.joint.left)} y={RING_Y-8} width={view.overlapMm*SCALE} height={RING_H+16} data-from-mm={view.joint.left} data-to-mm={view.joint.right}/>}
    <g data-ring="first" data-left-mm={view.first.left} data-right-mm={view.first.right}>{realRing(0,view.first.left)}</g>
    {unfolded&&<g className="two-original-ghost" aria-hidden="true">{realRing(1,view.originalSecond.left)}</g>}
    {joined&&<g className={`two-second-ring ${mode==='compare'?'is-draggable':''}`} data-ring="second" data-left-mm={ring2Left} data-right-mm={ring2Right} role={mode==='compare'?'slider':undefined} aria-label={mode==='compare'?'沿长度轴移动环②左端':undefined} aria-valuemin={mode==='compare'?view.originalSecond.left:undefined} aria-valuemax={mode==='compare'?view.first.right:undefined} aria-valuenow={mode==='compare'?view.second.left:undefined} aria-valuetext={mode==='compare'?`环②左端${fmt(view.second.left)}毫米，比较图总长${fmt(view.comparisonTotalMm)}毫米`:undefined} tabIndex={mode==='compare'?0:undefined} onPointerDown={down} onPointerMove={pointerMove} onPointerUp={up} onPointerCancel={()=>{drag.current=null;}} onKeyDown={e=>{if(mode!=='compare')return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();stop();remember();writeOffset(twoRingView(e.key==='Home'?0:e.key==='End'?view.overlapMm:offsetRef.current+(e.key==='ArrowRight'?1:-1)).offsetMm);}}}>
     {unfolded?<g className="two-comparison-outline"><rect x={x(ring2Left)+1} y={RING_Y+1} width={view.lengthMm*SCALE-2} height={RING_H-2} rx={RING_H/2-1}/><rect x={x(ring2Left+view.thicknessMm)} y={RING_Y+view.thicknessMm*SCALE} width={(view.lengthMm-2*view.thicknessMm)*SCALE} height={RING_H-2*view.thicknessMm*SCALE} rx={(RING_H-2*view.thicknessMm*SCALE)/2}/></g>:realRing(1,ring2Left)}
     <rect className="two-drag-hit" x={x(ring2Left)-7} y={RING_Y-7} width={view.lengthMm*SCALE+14} height={RING_H+14} rx="12"/>
    </g>}
    {joined&&!unfolded&&<g clipPath={`url(#${uid}-upper)`} className="two-interlace" aria-hidden="true">{realRing(0,view.first.left)}</g>}
    <text className="two-ring-name two-blue" x={x((view.first.left+view.first.right)/2)} y={RING_Y+RING_H/2+8} textAnchor="middle">环①</text>
    {joined&&<text className="two-ring-name two-amber" x={x((ring2Left+ring2Right)/2)} y={RING_Y+RING_H/2+8} textAnchor="middle">环②{unfolded?' · 长度示意':''}</text>}
    <path className="two-axis" d={`M${x(0)} 375H${x(joined?view.second.right:view.first.right)}`}/>
    {tickValues.map(n=><g key={n} className="two-tick"><path d={`M${x(n)} 371v8`}/><text x={x(n)} y="400" textAnchor="middle">{fmt(n)}</text></g>)}<text className="two-axis-unit" x={x(0)-55} y="380">毫米</text>
    {ready&&mode==='growth'&&<g>
     <rect className="two-counted-length" x={x(view.first.left)} y="361" width={view.lengthMm*SCALE} height="9"/>
     <rect className="two-extra-length" x={x(view.extra.left)} y="361" width={view.extra.lengthMm*SCALE} height="9" data-from-mm={view.extra.left} data-to-mm={view.extra.right}/>
     <path className="two-old-right" d={`M${x(view.first.right)} ${RING_Y+RING_H}V468`}/>
     <Measure from={view.joint.left} to={view.joint.right} y={441} label="共同10毫米" tone="orange"/>
     <Measure from={view.extra.left} to={view.extra.right} y={441} label="净增加30毫米" tone="green" className="two-extra-measure"/>
     <text className="two-small" x={x(view.first.right)} y="477" textAnchor="middle">原来右端</text><text className="two-small" x={x(view.originalSecond.right)} y="477" textAnchor="end">接好后右端</text>
    </g>}
    {ready&&mode==='compare'&&<g>
     <path className="two-origin-left" d={`M${x(view.originalSecond.left)} ${RING_Y-16}V462`}/>
     <path className="two-current-left" d={`M${x(view.second.left)} ${RING_Y-16}V462`}/>
     {view.offsetMm>0&&<Measure from={view.originalSecond.left} to={view.second.left} y={441} label={`向右${fmt(view.offsetMm)}毫米`} tone="amber" className="two-displacement"/>}
     <text className="two-small" x={x(view.originalSecond.left)} y="483" textAnchor="end">原左端30</text><text className="two-small two-amber" x={x(view.second.left)+12} y="483">现在左端{fmt(view.second.left)}</text>
     {unfolded&&<g className="two-compare-note"><text x="946" y="228">环②左端</text><text x="946" y="264">30 → {fmt(view.second.left)}</text><text x="946" y="317">两端距离</text><text x="946" y="353">70 → {fmt(view.comparisonTotalMm)}</text></g>}
    </g>}
    {ready&&lens&&!unfolded&&<JointInset view={view} id={uid+'-lens'}/>}
    {ready&&<Measure from={view.first.left} to={view.second.right} y={541} label={unfolded?`长度展开比较：${fmt(view.comparisonTotalMm)}毫米`:`相扣时，两端相距${view.coupledTotalMm}毫米`} tone="ink" className="two-total-length"/>}
   </svg>
   <div className="two-action-row">
    {!joined?<button className="two-primary" onClick={add}><Link2 size={19}/>接上第二环</button>:<>
     {mode==='compare'&&<><button className="two-primary" disabled={!ready||offset===view.overlapMm} onClick={()=>move(view.overlapMm)}>拉到刚好相邻<ArrowRight size={18}/></button><button disabled={!ready||offset===0} onClick={()=>move(0)}><ArrowLeft size={18}/>推回相扣</button><button disabled={!history.length} onClick={()=>{stop();writeOffset(history.at(-1)??0);setHistory(h=>h.slice(0,-1));}}><Undo2 size={17}/>撤销</button></>}
     {mode==='growth'&&<button onClick={()=>setLens(!lens)}><ZoomIn size={18}/>{lens?'收起接头放大':'看接头的两个5毫米'}</button>}
     <button onClick={reset}>撤下第二环</button>
    </>}
    <p className="two-question">{!joined?'先指一指：环①的40毫米，从哪一头量到哪一头？':!ready?'完整的第二环正在接入……':mode==='growth'?'第二环还是40毫米，为什么只多了30毫米？':offset===view.overlapMm?'左端从30到40，移动的10毫米，对应原来哪一段？':'拖动环②：盯住它的左端，看看总长怎样变。'}</p>
   </div>
   {ready&&<details className="two-equation"><summary>把刚才看到的写成算式</summary><p>{mode==='growth'?'40＋(40−5−5)＝70毫米':offset===view.overlapMm?'刚好相邻：40＋40＝80毫米；原来相扣70毫米；80−70＝10毫米。':'相扣时：40＋40−10＝70毫米。'}</p></details>}
  </section>
  <footer className="two-page-footer">{fromLesson?<a href="/?lesson=G3-U03-E02">返回原课程</a>:<span>双环 · 视觉与操作样板</span>}<span>本页只用于看图与操作评审，不写入学习记录。</span></footer>
 </main>;
}
