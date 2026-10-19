import {chainMeasure} from '../../../shared/length-model.mjs';
import {Dimension,Ring} from './Primitives';
import ChainJointFigure from './ChainJointFigure';

export default function ChainLengthStrip({length,thickness,count,subtract,joint=-1}:{length:number;thickness:number;count:number;subtract:boolean;joint?:number}){
  const model=chainMeasure(length,thickness,count),scale=380/length,x0=20;
  const selectedJoint=joint>=0&&joint<count-1?joint:count-2;
  const color=(index:number)=>index%2?'#b47a27':'#327c8a';
  return <section className={`chain-length-strip ${subtract?'chain-subtract':'chain-add'}`} aria-label={subtract?'相加再去重长度图':'逐环增加长度图'}>
    <h4>{subtract?'先把每个环的完整外长相加，再减去接头重复的长度':'每个环都一样长，接上后只计新伸出去的部分'}</h4>
    <p className="chain-ledger-intro">每条色带对应上方一个完整的环，外长都是{length}毫米。两端的尺寸线标出了这{length}毫米的范围；色带不是铁环的金属条。</p>
    <div className="chain-equal-ledger">
      {model.extensions.map((part,i)=><div className="chain-ledger-row" key={i}>
        <div className="chain-ledger-heading"><svg viewBox="0 0 112 52" aria-hidden="true"><Ring x={6} y={6} width={100} height={38} thickness={thickness/length*100} index={i}/></svg><b>第{i+1}环</b><span>{i===0?'先放好的环':`与第${i}环扣接`}</span></div>
        <svg className="chain-ledger-math" viewBox="0 0 420 134" role="img" aria-label={`第${i+1}环，完整外长${length}毫米；${i===0?`全部计入${length}毫米`:`左边${model.overlapMm}毫米已经与前环重复，右边${model.addedMm}毫米才增加总长`}`}>
          <g className="chain-growth-piece" data-start-mm={part.start} data-end-mm={part.end} data-added-mm={part.addedMm} data-full-length-mm={length}>
            <Dimension x1={x0} x2={x0+length*scale} y={30} label={`第${i+1}环完整外长 ${length}毫米`}/>
            <rect className="chain-full-span" x={x0} y="48" width={length*scale} height="30" fill={color(i)} fillOpacity=".22"/>
            {i>0&&<g className={subtract?'chain-strip-cut':'chain-already-counted'}>
              <rect x={x0} y="48" width={thickness*scale} height="30" fill={color(i)}/>
              <rect x={x0+thickness*scale} y="48" width={thickness*scale} height="30" fill={color(i-1)}/>
              <rect className="chain-repeat-frame" x={x0} y="43" width={model.overlapMm*scale} height="40"/>
              <text className="chain-ledger-end-text" x={x0+thickness*scale/2} y="68" textAnchor="middle">{thickness}毫米</text>
              <text className="chain-ledger-end-text" x={x0+thickness*scale*1.5} y="68" textAnchor="middle">{thickness}毫米</text>
              {subtract&&<path className="chain-deduction-mark" d={`M${x0} 88h${model.overlapMm*scale}`}/>}
            </g>}
            <rect className="chain-complete-outline" x={x0} y="48" width={length*scale} height="30"/>
            {i===0?<Dimension x1={x0} x2={x0+length*scale} y={116} label={`第一环：全部计入 ${length}毫米`}/>:<>
              <Dimension x1={x0} x2={x0+model.overlapMm*scale} y={116} label={`${subtract?'减去':'已算过'}${model.overlapMm}毫米`}/>
              <Dimension x1={x0+model.overlapMm*scale} x2={x0+length*scale} y={116} label={`${subtract?'计入':'新增'}${model.addedMm}毫米`}/>
            </>}
          </g>
        </svg>
      </div>)}
    </div>
    {count>1&&<div className="lab-joint-lens chain-inline-joint">
      <div><b>直接放大第 {selectedJoint+1} 处接头：第{selectedJoint+1}环和第{selectedJoint+2}环</b><p>这和“先猜一猜”用的是同一张图。前环右外缘到框的最右边，后环左外缘到框的最左边；框内两段端部金属各厚{thickness}毫米。</p><p>所以一处接头重叠{thickness}＋{thickness}＝{model.overlapMm}毫米。这段在前一个环的外长里已经算过，后一个环不能再算一次。点上方接头编号，可以换一处核对。</p></div>
      <ChainJointFigure thickness={thickness} index={selectedJoint}/>
    </div>}
    {subtract?<div className="chain-length-calculation" role="status"><p>先相加：{Array(count).fill(length).join('＋')}＝{length*count}毫米</p><p>再减重叠：{length*count}−{model.overlapMm}×{count-1}＝{model.totalMm}毫米</p></div>:<p role="status">逐个接长：{[length,...Array(count-1).fill(model.addedMm)].join('＋')}＝{model.totalMm}毫米</p>}
    <small>{count}个环有{count-1}处接头。扣掉的是长度账里重复算的部分，完整的铁环没有变短，也没有被剪开。</small>
  </section>;
}
