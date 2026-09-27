import {useRef} from 'react';
import {ArrowLeftRight,RotateCcw} from 'lucide-react';
import {boardMeasure,boundedInteger,rulerReading} from '../../../shared/length-model.mjs';
import type {LengthScene} from '../types';
import {cm,Dimension,LabNotice,Prediction,useSvgDrag,type LabProps} from './Primitives';

export function BoardExperiment({scene,value,update}:{scene:LengthScene}&LabProps){
  const [a=300,b=250]=scene.pieceLengthsMm??[],max=Math.min(a,b,120)-Math.min(a,b,120)%10;
  const overlap=boundedInteger(value.overlap,scene.overlapsMm?.[0]??80,0,max),model=boardMeasure([a,b],[overlap]);
  const s=640/(a+b),x0=52,second=x0+model.starts[1]*s,start=useRef(overlap);
  const move=(n:number)=>update({overlap:Math.max(0,Math.min(max,Math.round(n/10)*10)),checked:false,showReason:false});
  const drag=useSvgDrag(dx=>move(start.current-dx/s),()=>{start.current=overlap});
  return <div className="lab-experiment lab-boards"><div className="lab-play-area">
    <div className="lab-controls"><span><ArrowLeftRight size={16}/>拖动乙板，改变搭接长度</span><button onClick={()=>move(0)}>两板首尾相接</button></div>
    <div className="lab-stage"><div className="lab-stage-caption"><span>木工测量台</span><b>木料总长一直是 {(a+b)/10} 厘米</b></div>
      <svg viewBox="0 0 760 306" role="group" aria-label="可拖动的木板搭接模型">
        <Dimension x1={x0} x2={x0+a*s} y={47} label={`甲板 ${cm(a)}`}/>
        <rect x={x0} y={65} width={a*s} height="64" rx="5" className="lab-wood wood-light"/>
        {[0,1,2].map(i=><path key={i} d={`M${x0+12} ${79+i*17}q${a*s/4} -9 ${a*s/2} 0t${a*s/2-24} 0`} className="wood-grain"/>)}
        <text x={x0+15} y="103" className="board-name">甲</text>
        <g {...drag} role="slider" tabIndex={0} aria-label="拖动乙板改变重叠厘米数" aria-valuemin={0} aria-valuemax={max/10} aria-valuenow={overlap/10} aria-valuetext={`重叠${cm(overlap)}`} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();move(e.key==='Home'?0:e.key==='End'?max:overlap+(e.key==='ArrowLeft'?10:-10))}}} className="lab-draggable">
          <rect x={second} y={117} width={b*s} height="64" rx="5" className="lab-wood wood-dark"/>
          {[0,1,2].map(i=><path key={i} d={`M${second+12} ${129+i*17}q${b*s/4} 9 ${b*s/2} 0t${b*s/2-24} 0`} className="wood-grain"/>)}
          <text x={second+b*s-17} y="154" className="board-name" textAnchor="end">乙 · {cm(b)}</text>
          <path d={`M${second+b*s/2-19} 147h38m-31-6-7 6 7 6m24-12 7 6-7 6`} className="board-grip"/>
        </g>
        {overlap>0&&<g className="board-overlap"><rect x={second} y="59" width={overlap*s} height="128"/><Dimension x1={second} x2={second+overlap*s} y={216} label={`重叠 ${cm(overlap)}`}/></g>}
        <Dimension x1={x0} x2={x0+model.totalMm*s} y={280} label={value.showReason?`端到端 ${cm(model.totalMm)}`:'从甲板最左端，量到乙板最右端'} className="total-dimension"/>
      </svg>
    </div>
    <div className="lab-slider"><label htmlFor="board-overlap-range">也可以用滑块调节：重叠 <b>{cm(overlap)}</b></label><input id="board-overlap-range" type="range" min={0} max={max/10} value={overlap/10} onChange={e=>move(Number(e.target.value)*10)}/><div><span>0厘米 · 不重叠</span><span>{max/10}厘米 · 搭得更多</span></div></div>
    <LabNotice>{overlap===0?'两块板不重叠时，可以把长度直接相加。把乙板往左拖，看看发生什么。':<>彩色框里是同一段位置，甲、乙各覆盖了一次。<b>直接相加时，这一段会被算两次。</b>试试再往左移1厘米：整体会变长还是变短？</>}</LabNotice>
  </div><Prediction value={value} update={update} question={`现在重叠${cm(overlap)}，端到端长多少厘米？`} unit="厘米" expected={model.totalMm/10} why="请区分木料总长和拼好后的长度：重叠的一段只保留一次。">
    <div className="lab-formula"><small>先相加，再去掉重复的一次</small><b>{a/10} ＋ {b/10} − {overlap/10} ＝ {model.totalMm/10}</b><p>减掉{overlap/10}厘米；这段还实际存在，不能减两次。</p></div>
    <div className="lab-formula"><small>只算乙板新伸出去的部分</small><b>{a/10} ＋ ({b/10} − {overlap/10}) ＝ {model.totalMm/10}</b><p>两种办法都量图中同一对外端点。</p></div>
  </Prediction></div>;
}

export function RulerExperiment({scene,value,update}:{scene:LengthScene}&LabProps){
  const length=(scene.endMm??73)-(scene.startMm??20),start=boundedInteger(value.startMm,scene.startMm??20,0,45);
  const reading=rulerReading(start,length),s=5.2,objectX=246,rulerX=objectX-start*s,maxTick=100;
  const broken=Boolean(value.broken),zoom=Boolean(value.zoom),atStart=useRef(start);
  const move=(n:number)=>update({startMm:Math.max(0,Math.min(45,Math.round(n))),checked:false,showReason:false});
  const drag=useSvgDrag(dx=>move(atStart.current-dx/s),()=>{atStart.current=start});
  return <div className="lab-experiment lab-ruler"><div className="lab-play-area">
    <div className="lab-controls"><button onClick={()=>move(0)}>把零刻度对齐左端</button><button aria-pressed={broken} onClick={()=>update({broken:!broken})}>{broken?'恢复零刻度':'试试零刻度坏了'}</button></div>
    <div className="lab-stage"><div className="lab-stage-caption"><span>尺子可以拖动</span><b>小棒一直没变长</b></div>
      <svg viewBox="0 0 820 326" role="group" aria-label="拖动直尺，比较两端读数与小棒长度">
        <rect x={objectX} y="69" width={length*s} height="40" rx="5" className="lab-stick"/>
        <text x={objectX+length*s/2} y="94" textAnchor="middle" className="stick-label">同一根小棒</text>
        <path d={`M${objectX} 59v170m${length*s} -170v170`} className="endpoint-guide"/>
        <g {...drag} className="lab-draggable" role="slider" tabIndex={0} aria-label="移动尺子调整小棒左端的毫米读数" aria-valuemin={0} aria-valuemax={45} aria-valuenow={start} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();move(e.key==='Home'?0:e.key==='End'?45:start+(e.key==='ArrowLeft'?1:-1))}}}>
          <rect x={rulerX-12} y="140" width={maxTick*s+24} height="85" rx="7" className="lab-ruler-body"/>
          {Array.from({length:maxTick+1},(_,i)=>broken&&i<10?null:<g key={i}><line x1={rulerX+i*s} x2={rulerX+i*s} y1="140" y2={i%10===0?181:i%5===0?171:157}/>{i%10===0&&<text x={rulerX+i*s} y="206" textAnchor="middle">{i/10}</text>}</g>)}
          <text x={rulerX+maxTick*s-12} y="218" textAnchor="end" className="ruler-unit">厘米</text>
          {broken&&<g aria-hidden="true"><path d={`M${rulerX-5} 147l43 62m0-62-43 62`} className="ruler-scratch"/><text x={rulerX+22} y="260" textAnchor="middle">这一段磨损了</text></g>}
        </g>
        <Dimension x1={objectX} x2={objectX+length*s} y={296} label={value.showReason?`小棒长度一直是 ${length}毫米`:'尺子换了位置，小棒的长度变了吗？'}/>
      </svg>
    </div>
    <div className="lab-reading-pair"><span>左端读数<b>{broken&&start<10?'刻度看不清':cm(reading.startMm)}</b></span><ArrowLeftRight size={23}/><span>右端读数<b>{cm(reading.endMm)}</b></span></div>
    <div className="lab-slider"><label htmlFor="ruler-position-range">调整左端读数 <b>{start}毫米</b></label><input id="ruler-position-range" type="range" min={0} max={45} value={start} onChange={e=>move(Number(e.target.value))}/></div>
    <div className="lab-controls"><button aria-pressed={zoom} onClick={()=>update({zoom:!zoom})}>{zoom?'收起小格放大图':'放大看看：1厘米有几小格？'}</button><button onClick={()=>move(scene.startMm??20)}><RotateCcw size={15}/>回到题目位置</button></div>
    {zoom&&<div className="lab-millimetre-zoom"><p>把1厘米放大：<b>10个同样大的间隔，每格1毫米。</b></p><div>{Array.from({length:10},(_,i)=><span key={i}>{i+1}</span>)}</div></div>}
    <LabNotice>{broken&&start<10?'左端刻度看不清。把尺子往左拖，让小棒从清楚的2厘米处量起。':'从2厘米量起，终点前面的2厘米不属于小棒。移到别的刻度试试，两端读数会一起改变。'}</LabNotice>
  </div><Prediction value={value} update={update} question="这根小棒长多少毫米？" unit="毫米" expected={length} ready={!broken||start>=10} why="右端的读数里面，还包含了小棒左边那一段。要用右端读数减左端读数。">
    <div className="lab-formula"><small>右端读数 − 左端读数</small><b>{reading.endMm} − {reading.startMm} ＝ {length}</b><p>读数换成毫米再相减。物体长短没变，两个读数的差也不变。</p></div>
    <p className="lab-condition">屏幕上的尺子是放大示意，不能直接拿来测桌上的真实物品。</p>
  </Prediction></div>;
}
