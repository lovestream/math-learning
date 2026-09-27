import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Footprints,RotateCcw} from 'lucide-react';
import {boundedInteger,intervalMeasure,pointOnRoute,routePath} from '../../../shared/length-model.mjs';
import type {LengthScene} from '../types';
import {LabNotice,Prediction,type LabProps} from './Primitives';

function useTravel(target:number){
  const [position,setPosition]=useState(target),current=useRef(target);
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){current.current=target;setPosition(target);return}
    const from=current.current,start=performance.now();let frame=0;
    const tick=(now:number)=>{const t=Math.min(1,(now-start)/650),smooth=t*t*(3-2*t);current.current=from+(target-from)*smooth;setPosition(current.current);if(t<1)frame=requestAnimationFrame(tick)};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[target]);return position;
}

export function IntervalExperiment({scene,value,update}:{scene:LengthScene}&LabProps){
  const length=(scene.endMm??24000)-(scene.startMm??0),spacing=scene.spacingMm??4000,closed=Boolean(value.closed);
  const {segments,points}=intervalMeasure(length,spacing,closed),walk=boundedInteger(value.walk,0,0,segments);
  const point=(i:number)=>closed?{x:380+121*Math.sin(i/segments*Math.PI*2),y:151-121*Math.cos(i/segments*Math.PI*2)}:{x:65+i*630/segments,y:157};
  const position=point(walk),fresh=(patch:Record<string,unknown>)=>update({...patch,checked:false,showReason:false});
  return <div className="lab-experiment lab-intervals"><div className="lab-play-area">
    <div className="lab-controls"><div className="lab-toggle" aria-label="绳子的形状"><button aria-pressed={!closed} onClick={()=>fresh({closed:false,walk:0})}>一条直绳</button><button aria-pressed={closed} onClick={()=>fresh({closed:true,walk:0})}>把首尾接起来</button></div><span>全长{length/1000}米 · 每段{spacing/1000}米</span></div>
    <div className="lab-stage"><svg viewBox="0 0 760 324" role="img" aria-label={`${closed?'环形':'直线'}绳，已经走过${walk}个间隔`}>
      {closed?<circle cx="380" cy="151" r="121" className="lab-rope"/>:<path d="M65 157H695" className="lab-rope"/>}
      {!closed&&Array.from({length:segments},(_,i)=><g key={i}><text x={65+(i+.5)*630/segments} y="202" textAnchor="middle" className="lab-svg-small">{spacing/1000}米</text><text x={65+(i+.5)*630/segments} y="226" textAnchor="middle" className="lab-svg-small">第{i+1}段</text></g>)}
      {Array.from({length:closed?segments:segments+1},(_,i)=>{const p=point(i),active=i<=walk;return <g key={i} style={{transform:`translate(${p.x}px,${p.y}px)`}} className={`lab-rope-pin ${active?'visited':''}`}><circle r="12"/><text y={closed&&p.y>151?30:-24} textAnchor="middle">{i===0?'起点':`标记${i+1}`}</text></g>})}
      <g className="lab-walker" style={{transform:`translate(${position.x}px,${position.y}px)`}}><circle r="17"/><text y="6" textAnchor="middle">★</text></g>
      {closed&&<g className="ring-centre-label"><text x="380" y="140" textAnchor="middle">走了 {walk} 段</text><text x="380" y="170" textAnchor="middle">{walk===segments?'终点回到了起点':'点击下面的“走一段”'}</text></g>}
      <text x="380" y="314" textAnchor="middle" className="lab-svg-small">{closed?'接成环只改变形状，不改变绳子的总长。':'两端都做标记；先数间隔，再数不同的标记。'}</text>
    </svg></div>
    <div className="lab-walk-controls"><button className="lab-primary" disabled={walk===segments} onClick={()=>fresh({walk:walk+1})}><Footprints size={18}/>{walk===segments?'已经走完':'走一段'}{walk<segments&&`（${spacing/1000}米）`}</button><button disabled={walk===0} onClick={()=>fresh({walk:Math.max(0,walk-1)})}>退一段</button><button onClick={()=>fresh({walk:0})}><RotateCcw size={16}/>重新走</button></div>
    <LabNotice success={walk===segments}>{walk===segments?(closed?`走完${segments}段后回到了同一个起点。最后到达的地方不再算一个新标记，所以只有${points}个不同标记。`:`走完${segments}段，访问了${points}个不同位置。起点也要算一个，所以比段数多1。`):'起点先算一个标记。每走一段，看看来到的是新位置，还是原来去过的位置。'}</LabNotice>
  </div><Prediction value={value} update={update} question={`这${closed?'一圈':'条直绳'}共有几个不同标记？`} unit="个" expected={points} ready={walk===segments} why={closed?'环走完后，最后落到的就是第一个标记。':'起点也有一个标记；6段不表示只有6个点。'}>
    <div className="lab-formula"><small>先求间隔数</small><b>{length/1000} ÷ {spacing/1000} ＝ {segments}段</b><small>{closed?'首尾是同一个点':'两端是不同的点'}</small><b>{closed?`${segments}个不同标记`:`${segments} ＋ 1 ＝ ${points}个标记`}</b><p>换一种形状再试：段数一样，点数也一定一样吗？</p></div>
  </Prediction></div>;
}

export function RouteExperiment({scene,value,update}:{scene:LengthScene}&LabProps){
  const length=(scene.endMm??1000000)-(scene.startMm??0),spacing=[100000,200000].includes(value.spacing)?value.spacing:scene.spacingMm??100000;
  const {segments}=intervalMeasure(length,spacing,false),walk=boundedInteger(value.walk,0,0,segments),fraction=useTravel(walk/segments),traveller=pointOnRoute(fraction);
  const path=routePath.map(p=>`${p.x},${p.y}`).join(' '),fresh=(patch:Record<string,unknown>)=>update({...patch,checked:false,showReason:false});
  return <div className="lab-experiment lab-route"><div className="lab-play-area">
    <div className="lab-controls"><label>每次走多远？<select aria-label="路线每段长度" value={spacing} onChange={e=>fresh({spacing:Number(e.target.value),walk:0,guess:''})}><option value={100000}>100米</option><option value={200000}>200米</option></select></label><span>学校 <ArrowRight size={14}/> 公园 · {length/1000000}千米</span></div>
    <div className="lab-stage route-landscape"><svg viewBox="0 0 760 312" role="img" aria-label={`学校到公园${length/1000000}千米的分段路线，已走${walk*spacing/1000}米`}>
      <g className="route-scenery" aria-hidden="true"><ellipse cx="320" cy="239" rx="90" ry="19"/><path d="M525 225l20-44 20 44zm48-2 15-34 15 34"/><path d="M118 47h85v17h-85zM139 35h40v12h-40z"/><circle cx="664" cy="46" r="18"/></g>
      <polyline points={path} className="lab-road-border"/><polyline points={path} className="lab-road"/>
      <polyline points={path} className="lab-road-travelled" pathLength="1" strokeDasharray={`${fraction} 1`}/>
      {Array.from({length:segments+1},(_,i)=>{const p=pointOnRoute(i/segments);return <g key={i} className={`route-distance-marker ${i<=walk?'visited':''}`}><circle cx={p.x} cy={p.y} r="7"/><text x={p.x} y={p.y+(i%2?-25:36)} textAnchor="middle">{i===0?'学校':i===segments?'公园':`${i*spacing/1000}米`}</text></g>})}
      <g style={{transform:`translate(${traveller.x}px,${traveller.y}px)`}} className="route-traveller"><circle r="15"/><text y="6" textAnchor="middle">K</text></g>
      <text x="380" y="286" textAnchor="middle" className="lab-svg-small">路线图是示意；标记按行走路程分段，不能用屏幕厘米代替实际米数。</text>
    </svg></div>
    <div className="lab-trip-meter"><span>走过 <b>{walk}</b> 段</span><span>每段 <b>{spacing/1000}</b> 米</span><strong>已走 {walk*spacing/1000} 米</strong></div>
    <div className="lab-walk-controls"><button className="lab-primary" disabled={walk===segments} onClick={()=>fresh({walk:walk+1})}><Footprints size={17}/>{walk===segments?'到公园了':`再走${spacing/1000}米`}</button><button disabled={walk===0} onClick={()=>fresh({walk:walk-1})}>退一段</button><button onClick={()=>fresh({walk:0})}><RotateCcw size={16}/>回学校</button></div>
    <LabNotice success={walk===segments}>{walk===segments?`到公园了！用${spacing/1000}米作一份，一共走${segments}份。换一个“每份长度”，再比较全程有没有变。`:'先在生活中量一段100米，记住大概走多远。估计新路线时，就用这样的一段作参照。'}</LabNotice>
  </div><Prediction value={value} update={update} question={`每段${spacing/1000}米，全程要走几段？`} unit="段" expected={segments} ready={walk===segments} why="1千米是1000米。看看每次走的米数，以及还剩多少路。">
    <div className="lab-formula"><small>全程包含几份</small><b>{length/1000} ÷ {spacing/1000} ＝ {segments}</b><p>{segments}个{spacing/1000}米合起来，是{length/1000}米，也就是{length/1000000}千米。</p></div>
    <div className="lab-formula"><small>改用另一把“长标尺”</small><b>10×100米 ＝ 5×200米</b><p>每份变大，份数变少，路线总长保持不变。</p></div>
  </Prediction></div>;
}
