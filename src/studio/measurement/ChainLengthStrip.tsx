import {chainMeasure} from '../../../shared/length-model.mjs';
import {Dimension,Ring} from './Primitives';

export default function ChainLengthStrip({length,thickness,count,subtract}:{length:number;thickness:number;count:number;subtract:boolean}){
  const model=chainMeasure(length,thickness,count),scale=620/(length*5),x0=38;
  return <section className="chain-length-strip" aria-label={subtract?'相加再去重长度图':'逐环增加长度图'}>
    <h4>{subtract?'每个环先算全长，再划去重复的一段':'第一个环算全长，后面只加伸出去的长度'}</h4>
    {!subtract&&count>1&&<div className="chain-strip-canvas chain-current-ring"><svg className="chain-new-ring" key={count} viewBox="0 0 380 225" role="img" aria-label={`本次接入第${count}环，外长${length}毫米。旧链右端左边的${model.overlapMm}毫米已经占过位置，右边才新增加${model.addedMm}毫米。`}>
      <Dimension x1={35} x2={335} y={28} label={`第${count}环的完整外长 ${length}毫米`}/>
      <Ring x={35} y={48} width={300} height={90} thickness={thickness/length*300} index={count-1}/>
      <rect className="chain-shared-zone" x={35} y={42} width={model.overlapMm/length*300} height={104}/>
      <path d={`M${35+model.overlapMm/length*300} 38v167`} className="chain-old-end"/>
      <Dimension x1={35} x2={35+model.overlapMm/length*300} y={177} label={`重叠${model.overlapMm}毫米`}/>
      <Dimension x1={35+model.overlapMm/length*300} x2={335} y={177} label={`只新增加 ${model.addedMm}毫米`}/>
      <text x={35+model.overlapMm/length*300} y="223" textAnchor="middle">↑ 原来那条链的右端</text>
    </svg></div>}
    <div className="chain-strip-canvas chain-strip-totals"><svg viewBox={`0 0 720 ${subtract?162:139}`} role="img" aria-label={subtract?`${count}个外长减去${count-1}段接头重叠`:`第一环${length}毫米，后面${count-1}环各增加${model.addedMm}毫米，目前总长${model.totalMm}毫米`}>
      {model.extensions.map((part,i)=>{
        const start=subtract?i*length:part.start,width=subtract?length:part.addedMm;
        return <g key={i} className="chain-growth-piece" data-start-mm={part.start} data-end-mm={part.end} data-added-mm={part.addedMm}>
          <rect x={x0+start*scale} y="38" width={width*scale} height="38" fill={i===0?'#327c8a':'#b47a27'} stroke="#fffdf3" strokeWidth="2"/>
          {subtract&&i>0&&<g className="chain-strip-cut"><rect x={x0+start*scale} y="38" width={model.overlapMm*scale} height="38"/><path d={`M${x0+start*scale} 76l${model.overlapMm*scale} -38m${-model.overlapMm*scale} 0l${model.overlapMm*scale} 38`}/></g>}
          <text x={x0+(start+width/2)*scale} y="26" textAnchor="middle">第{i+1}环</text>
          <text x={x0+(start+width/2)*scale} y="102" textAnchor="middle">{subtract?`${length}`:i===0?`${length}`:`＋${part.addedMm}`}</text>
        </g>;
      })}
      <text x="677" y="102">毫米</text>
      {subtract&&<text x="38" y="145">划去的是每个后来接入的环重复占用的 {model.overlapMm} 毫米。</text>}
      {!subtract&&count>1&&<Dimension x1={x0+model.extensions[count-1].start*scale} x2={x0+model.totalMm*scale} y={133} label="本次新增加"/>}
    </svg></div>
    <ol className="chain-length-cards" aria-label="各环计入的长度">{model.extensions.map((p,i)=><li key={i}><span>第{i+1}环</span><b>{subtract?(i?`${length}−${model.overlapMm}`:`${length}`):i?`＋${p.addedMm}`:length}</b><small>毫米</small></li>)}</ol>
    <p role="status">{subtract?`${length}×${count} − ${model.overlapMm}×${count-1} ＝ ${model.totalMm}毫米`:count===1?`先放第一个环：${length}毫米。`: `新环只增加 ${length}−${thickness}−${thickness}＝${model.addedMm}毫米；原来${chainMeasure(length,thickness,count-1).totalMm}＋新加${model.addedMm}＝现在${model.totalMm}毫米。`}</p>
    <small>长度条只记录左右方向的距离，不是把铁环剪开。可撤下最后一个环，观察哪一段消失。</small>
  </section>;
}
