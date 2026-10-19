import {useId,useRef} from 'react';
import type {OperationModel} from '../../../shared/operation-models.mjs';
import {arrayTurnPoint,measureOperationModel} from '../../../shared/operation-models.mjs';
import {useMotionValue} from '../useMotionValue';

export function MoneyVisual({start,pay,refund,phase,wrong=false,netMode=false}:{start:number;pay:number;refund:number;phase:number;wrong?:boolean;netMode?:boolean}){
 const id=useId().replace(/:/g,''),amount=useMotionValue(phase===0||netMode&&phase===1?start:phase===1?start-pay:start-pay+(wrong?-refund:refund),650),s=430/Math.max(1,start);
 return <svg className="operation-object-view" viewBox="0 0 600 250" role="img" aria-label={`原有${start}元，支付${pay}元，退回${refund}元，${phase===0?'还没操作':phase===1?'已付款':'已处理退款'}`}>
  <defs><linearGradient id={id+'money'} x2="0" y2="1"><stop stopColor="#a0d5bc"/><stop offset="1" stopColor="#3c8c77"/></linearGradient></defs>
  <text x="50" y="30">钱袋里的钱 · 每格1元</text><rect x="50" y="55" width={430} height="55" rx="8" fill="#e5ebe5"/>
  <rect data-money-bar="balance" x="50" y="55" width={Math.max(0,amount)*s} height="55" rx="8" fill={`url(#${id}money)`}/>
  {Array.from({length:start+1},(_,i)=><line key={i} x1={50+i*s} x2={50+i*s} y1="88" y2="110" stroke="#ffffff" strokeOpacity=".45"/>)}
  {phase>0&&!netMode&&<><path d={`M${50+(start-pay)*s} 120V145H480V120`} fill="none" stroke="#df6c4f" strokeWidth="2"/><text x={50+(start-pay/2)*s} y="169" textAnchor="middle">付出的{pay}元</text></>}
  {phase>1&&!netMode&&<g className="operation-visual-arrival"><path d={`M${50+(start-pay)*s} 43h${refund*s}`} stroke={wrong?'#df6c4f':'#e9b44d'} strokeWidth="8"/><text x="50" y="210">{wrong?`错误路线又扣${refund}元，钱袋更空了`:`退回${refund}元，钱袋里的钱增加`}</text></g>}
  {netMode&&phase>0&&<g className="operation-visual-arrival"><rect x="50" y="147" width={pay*s} height="25" fill="#df6c4f"/><rect x={50+(pay-refund)*s} y="147" width={refund*s} height="25" fill="#e9b44d"/><text x="50" y="200">付出{pay}元，其中{refund}元退回；净支出{pay-refund}元。</text><text x="50" y="225">{phase===1?'先打好净支出这一包，钱袋尚未扣款。':'把净支出这一包从钱袋扣掉。'}</text></g>}
  <text x="505" y="91" className="operation-object-total">{Math.round(amount)}元</text>
 </svg>;
}

export function ArrayVisual({rows,cols,cut,transposed,onCut}:{rows:number;cols:number;cut:number;transposed:boolean;onCut:(n:number)=>void}){
 const turn=useMotionValue(transposed?1:0,650),id=useId().replace(/:/g,''),drag=useRef(false),diameter=Math.hypot(cols-1,rows-1),cell=Math.min(58,360/diameter),viewHeight=diameter*cell+115,centerY=viewHeight/2-14,angle=turn*Math.PI/2;
 const rotate=(col:number,row:number)=>{const p=arrayTurnPoint(col,row,cols,rows,turn);return {x:300+p.x*cell,y:centerY+p.y*cell}};
 const width=(cols-1)*Math.cos(angle)+(rows-1)*Math.sin(angle),height=(cols-1)*Math.sin(angle)+(rows-1)*Math.cos(angle);
 const p1=rotate(cut-.5,-25/cell),p2=rotate(cut-.5,rows-1+25/cell),cutPath=`M${p1.x} ${p1.y}L${p2.x} ${p2.y}`;
 const update=(event:React.PointerEvent<SVGElement>)=>{const svg=event.currentTarget.closest('svg')!,matrix=svg.getScreenCTM();if(!matrix)return;const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()),localX=((p.x-300)*Math.cos(angle)+(p.y-centerY)*Math.sin(angle))/cell;onCut(Math.max(1,Math.min(cols-1,Math.round(localX+(cols-1)/2+.5))))};
 return <svg className="operation-object-view array-object-view" viewBox={`0 0 600 ${viewHeight}`} role="img" aria-label={`同一批${rows*cols}颗珠子，${transposed?'转过来':'原方向'}数，分界线可拖动`}>
  <defs>{[['left','#9dccdc','#467b95'],['right','#f6d684','#ba883a']].map(([name,light,dark])=><radialGradient key={name} id={id+name} cx=".3" cy=".25"><stop stopColor={light}/><stop offset="1" stopColor={dark}/></radialGradient>)}</defs>
  <rect x={300-width*cell/2-25} y={centerY-height*cell/2-25} width={width*cell+50} height={height*cell+50} rx="12" fill="#edf3ec" stroke="#b3c9bd"/>
  {Array.from({length:rows*cols},(_,i)=>{const row=Math.floor(i/cols),col=i%cols,{x,y}=rotate(col,row);return <g key={i} transform={`translate(${x} ${y})`} data-bead={i}><ellipse cx="2" cy="4" rx="17" ry="15" fill="#253f4322"/><circle r="17" fill={`url(#${id}${col<cut?'left':'right'})`}/><circle cx="-5" cy="-5" r="4" fill="#fff" fillOpacity=".6"/></g>})}
  <g className="array-cut-handle" data-array-cut={cut} onPointerDown={e=>{drag.current=true;e.currentTarget.setPointerCapture(e.pointerId);update(e)}} onPointerMove={e=>{if(drag.current)update(e)}} onPointerUp={()=>{drag.current=false}} onPointerCancel={()=>{drag.current=false}}>
   <path d={cutPath} stroke="#df6c4f" strokeWidth="18" strokeOpacity=".15"/>
   <path d={cutPath} stroke="#df6c4f" strokeWidth="3" strokeDasharray="5 4"/>
  </g>
  <text x="90" y={viewHeight-22}>拖动红色分界线 · 珠子没有增加或减少</text>
 </svg>;
}

export default function OperationVisual({model,observed,choice,step=0}:{model:OperationModel;observed:boolean;choice?:string|number;step?:number}){
 const id=useId().replace(/:/g,''),stepFrame=useMotionValue(step,550);
 if(model.type==='wallet')return <MoneyVisual start={model.start} pay={model.pay} refund={model.refund} phase={observed?2:0} wrong={choice==='add'}/>;
 if(model.type==='division-groups'){
  const m=measureOperationModel(model),valid=observed&&choice==='multiply';
  return <div className="sharing-object-view" role="img" aria-label={`${model.groups}组，每组${model.perGroup}人${valid?`，每人分到${m.perPerson}张卡片`:''}`}><div className="card-source"><b>{model.total}张卡片</b><span className={valid?'is-distributed':''}>▱ ▱ ▱ ▱</span></div><div className="sharing-groups">{Array.from({length:model.groups},(_,g)=><div key={g}><b>第{g+1}组</b><div>{Array.from({length:model.perGroup},(_,p)=><span className="sharing-person" key={p}><svg viewBox="0 0 60 72" aria-hidden="true"><circle cx="30" cy="14" r="10" fill="#e9b44d"/><path d="M13 57V38Q30 22 47 38V57" fill="#527eab"/><path d="M21 57V70M39 57V70" stroke="#304e55" strokeWidth="6"/>{valid&&<g className="operation-visual-arrival"><rect x="10" y="43" width="40" height="20" rx="3" fill="#ffffff" stroke="#469684"/><text x="30" y="58" textAnchor="middle">{m.perPerson}张</text></g>}</svg></span>)}</div></div>)}</div></div>;
 }
 if(model.type==='reverse'){
  const m=measureOperationModel(model),values=[model.target,model.target/model.multiplier,m.unknown];
  return <svg className="operation-object-view" viewBox="0 0 600 190" role="img" aria-label={`倒着走过${step}步；先撤销乘法，再撤销加法`}>
   <path d="M115 82H475" fill="none" stroke="#bdcdc5" strokeWidth="5"/>
   {values.map((v,i)=><g key={i} transform={`translate(${55+i*190} 55)`}><rect width="110" height="70" rx="12" fill={i<=step?'#e8f2ec':'#f0eeea'} stroke={i===step?'#469684':'#c5cfc7'} strokeWidth="2"/><text x="55" y="44" textAnchor="middle" className="operation-object-total">{i<=step?v:'?'}</text><text x="55" y="102" textAnchor="middle">{i===0?'错算的结果':i===1?'撤销最后的乘法':'找回原来的输入'}</text></g>)}
   <text x="205" y="40" textAnchor="middle">÷{model.multiplier} →</text><text x="395" y="40" textAnchor="middle">−{model.addend} →</text>
   <circle cx={110+stepFrame*190} cy="173" r="6" fill="#df6c4f"/>
  </svg>;
 }
 if(model.type==='substitution')return <svg className="operation-object-view" viewBox="0 0 600 240" role="img" aria-label={`${model.copies}盒，每盒${model.left}个红物件与${model.right}个蓝物件；${choice==='whole'?'完整一盒被框住':choice==='partial'?'蓝色部分被框住':'还没有替换'}`}>
  <defs><linearGradient id={id+'box'} x2="0" y2="1"><stop stopColor="#efe2c8"/><stop offset="1" stopColor="#bb9a68"/></linearGradient></defs>
  {Array.from({length:model.copies},(_,i)=><g key={i} transform={`translate(${35+i*185} 60)`}><path d="M0 15L20 0H155L135 15Z" fill="#f5e8cd"/><path d="M135 15L155 0V125L135 140Z" fill="#98794e"/><rect y="15" width="135" height="125" fill={`url(#${id}box)`} rx="3"/>
   <circle cx="37" cy="67" r="23" fill="#df6c4f"/><circle cx="98" cy="67" r="23" fill="#527eab"/><text x="37" y="74" textAnchor="middle" fill="#fff">{model.left}</text><text x="98" y="74" textAnchor="middle" fill="#fff">{model.right}</text>
   {choice&&<rect data-substitution-frame={choice} x={choice==='whole'?-6:70} y={choice==='whole'?9:39} width={choice==='whole'?148:56} height={choice==='whole'?138:56} rx="8" fill="none" stroke="#469684" strokeWidth="4" strokeDasharray={observed?'':'6 4'}/>}
   <text x="68" y="122" textAnchor="middle">{observed?choice==='whole'?'□':`${model.left}＋□`:`第${i+1}盒`}</text>
  </g>)}
 </svg>;
 return null;
}
