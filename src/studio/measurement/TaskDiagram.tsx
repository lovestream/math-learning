import {boardMeasure,chainMeasure,intervalMeasure} from '../../../shared/length-model.mjs';
import type {MeasurementTaskDiagram} from '../types';
import {cm,Dimension,Ring} from './Primitives';
// Story pictures load before the interactive workbench: their diagram styles
// must not depend on first opening that lazy-loaded experiment.
import './measurement.css';
import ChainJointFigure from './ChainJointFigure';

export default function TaskDiagram({diagram,intro=false}:{diagram:MeasurementTaskDiagram;intro?:boolean}){
  if(diagram.unknown){
    const n=diagram.count??2,chain=diagram.mode==='chain',step=480/n;
    return <figure className="measurement-question inverse-length-question"><svg viewBox="0 0 600 220" role="img" aria-label={`${n}${chain?'个环':'块板'}的逆向关系图，最外两端相距${diagram.totalMm}毫米。问号表示待求尺寸；示意图不按比例。`}>
      {Array.from({length:n},(_,i)=><g key={i}>
        {chain?<Ring x={40+i*step} y={50+(i%2)*14} width={step+20} height={70-(i%2)*22} thickness={8} index={i}/>:<rect x={40+i*step} y={50+(i%2)*18} width={step+20} height="38" rx="4" fill={i%2?'#b47a27':'#327c8a'}/>}
        <text x={40+i*step+(step+20)/2} y="157" textAnchor="middle" fontSize="16">{chain?`环${i+1}`:`板${i+1}`}</text>
      </g>)}
      <Dimension x1={40} x2={540} y={193} label={`两端距离 ${chain?diagram.totalMm:(diagram.totalMm??0)/10}${chain?'毫米':'厘米'}`}/>
      <text x="300" y="24" textAnchor="middle" fontSize="17">{diagram.unknown==='thickness'?`每环外长${diagram.pieceLengthMm}毫米；金属条厚？`:`每${chain?'环外长':'块板长'}？；${chain?`金属条厚${diagram.thicknessMm}毫米`:`每处重叠${(diagram.overlapsMm?.[0]??0)/10}厘米`}`}</text>
    </svg><figcaption>只画连接关系，不按比例。{chain?'每处接头重叠两段金属厚度。':'只有相邻两板重叠。'}问号是待求量，不能拿屏幕上的长度当已知条件。</figcaption></figure>;
  }
  if(diagram.mode==='chain'){
    const length=diagram.pieceLengthMm??40,t=diagram.thicknessMm??5,count=diagram.count??4,model=chainMeasure(length,t,count),scale=480/Math.max(model.totalMm,160),x0=46;
    return <figure className="measurement-question"><svg viewBox="0 0 620 220" role="img" aria-label={`${count}个外长${length}毫米、厚${t}毫米的链环依次扣接`}>
      {model.starts.map((start,i)=><Ring key={i} x={x0+start*scale} y={45+(i%2?16:0)} width={length*scale} height={i%2?60:88} thickness={t*scale} index={i}/>)}
      {model.joints.map((j,i)=><g key={i} className="task-joint"><rect x={x0+j.start*scale} y="38" width={(j.end-j.start)*scale} height="111"/><text x={x0+(j.start+model.overlapMm/2)*scale} y="172" textAnchor="middle">接头{i+1}</text></g>)}
      <Dimension x1={x0} x2={x0+model.totalMm*scale} y={207} label="求最左外缘到最右外缘的长度"/>
    </svg>{intro&&<div className="chain-condition-detail"><ChainJointFigure thickness={t}/><p>深色是端部金属，浅色是整环的左右范围。两环上下错开画，便于比较左右位置：前环右外缘到框右边，后环左外缘到框左边。两段厚度在中线处相碰，虚线框宽{t}＋{t}毫米。</p></div>}<figcaption>{diagram.caption??`每个环外长${length}毫米，金属条厚${t}毫米；每处接头重叠两个端部。`}</figcaption></figure>;
  }
  if(diagram.mode==='boards'){
    const lengths=diagram.pieceLengthsMm??[300,250],overlaps=diagram.overlapsMm??[80],model=boardMeasure(lengths,overlaps),scale=510/model.totalMm,x0=48,jointY=Math.max(185,125+(lengths.length-1)*35),dimensionY=jointY+33;
    return <figure className="measurement-question"><svg viewBox={`0 0 620 ${dimensionY+14}`} role="img" aria-label={`${lengths.length}段材料沿同一直线依次搭接`}>
      {lengths.map((length,i)=><g key={i}><rect x={x0+model.starts[i]*scale} y={48+i*35} width={length*scale} height="55" rx="5" className={`lab-wood ${i%2?'wood-dark':'wood-light'}`}/><text className="board-name" x={x0+model.starts[i]*scale+12} y={81+i*35}>{['甲','乙','丙','丁'][i]??`第${i+1}块`} · {cm(length)}</text></g>)}
      {model.joints.map((j,i)=><g className="task-joint" key={i}><rect x={x0+j.start*scale} y={42} width={(j.end-j.start)*scale} height={55+(lengths.length-1)*35}/><text x={x0+(j.start+j.end)/2*scale} y={jointY} textAnchor="middle">重叠{cm(j.end-j.start)}</text></g>)}
      <Dimension x1={x0} x2={x0+model.totalMm*scale} y={dimensionY} label="求拼好后的端到端长度"/>
    </svg><figcaption>{diagram.caption??'彩色区域是重复覆盖的同一段位置。'}</figcaption></figure>;
  }
  if(diagram.mode==='ruler'){
    const start=diagram.startMm??20,end=diagram.endMm??73,maxTick=Math.ceil(Math.max(end,100)/10)*10,s=520/maxTick,x0=50;
    return <figure className="measurement-question"><svg viewBox="0 0 620 210" role="img" aria-label={`小棒从直尺${cm(start)}放到${cm(end)}`}>
      <rect x={x0+start*s} y="35" width={(end-start)*s} height="35" rx="4" className="lab-stick"/><path d={`M${x0+start*s} 27v128m${(end-start)*s} 0V27`} className="endpoint-guide"/>
      <rect x={x0-12} y="91" width={maxTick*s+24} height="76" rx="5" className="lab-ruler-body"/>
      {Array.from({length:maxTick+1},(_,i)=><g key={i}><line x1={x0+i*s} x2={x0+i*s} y1="91" y2={i%10===0?127:i%5===0?118:106}/>{i%10===0&&<text x={x0+i*s} y="151" textAnchor="middle">{i/10}</text>}</g>)}
      <text x="577" y="160" textAnchor="end" className="ruler-unit">厘米</text>
      <Dimension x1={x0+start*s} x2={x0+end*s} y={199} label={intro?'小棒的长度是多少？':'小棒长度＝右端读数－左端读数'}/>
    </svg><figcaption>{diagram.caption??`左端读数${cm(start)}，右端读数${cm(end)}。`}</figcaption></figure>;
  }
  if(diagram.mode==='route'){
    const sections=diagram.sectionLengthsMm?.length?diagram.sectionLengthsMm:[diagram.lengthMm??1000000],total=diagram.lengthMm??sections.reduce((sum,n)=>sum+n,0),scale=520/total,x0=50,y=105;
    const format=(mm:number)=>{const metres=mm/1000,kilometres=Math.floor(metres/1000),rest=metres%1000;return kilometres?`${kilometres}千米${rest?`${rest}米`:''}`:`${metres}米`};
    const starts=sections.map((_,i)=>sections.slice(0,i).reduce((sum,n)=>sum+n,0));
    return <figure className="measurement-question task-route-question"><svg viewBox="0 0 620 210" role="img" aria-label={`由${sections.length}段组成的路线示意图`}>
      <path d={`M${x0} ${y}H${x0+520}`} className="task-route-base"/>
      {sections.map((length,i)=><g key={i}><path d={`M${x0+starts[i]*scale} ${y}H${x0+(starts[i]+length)*scale}`} className={`task-route-segment route-segment-${i%3}`}/><text x={x0+(starts[i]+length/2)*scale} y={y+(i%2?-26:37)} textAnchor="middle" className="lab-svg-small route-segment-label">第{i+1}段</text></g>)}
      {Array.from({length:sections.length+1},(_,i)=>{const at=i===sections.length?total:starts[i];return <circle key={i} cx={x0+at*scale} cy={y} r="8" className="route-task-pin"/>})}
      {diagram.progressMm!==undefined&&<g className="route-progress-mark"><path d={`M${x0+diagram.progressMm*scale} 54V156`}/><text x={x0+diagram.progressMm*scale} y="43" textAnchor="middle">已经走了{format(diagram.progressMm)}</text></g>}
      <Dimension x1={x0} x2={x0+520} y={193} label={diagram.progressMm!==undefined?`整条路线 ${format(total)}`:'求整条路线的总长度'}/>
    </svg><div className="route-segment-legend" aria-label="各段长度">{sections.map((length,i)=><span key={i}><i className={`route-segment-${i%3}`}/><b>第{i+1}段</b><em>{diagram.sectionLabels?.[i]??format(length)}</em></span>)}</div><figcaption>{diagram.caption??'路线按实际行走顺序分段；各段首尾相接。'}</figcaption></figure>;
  }
  const length=diagram.lengthMm??24000,spacing=diagram.spacingMm??4000,closed=Boolean(diagram.closed),{segments,points}=intervalMeasure(length,spacing,closed);
  const point=(i:number)=>closed?{x:310+82*Math.sin(i/segments*Math.PI*2),y:98-82*Math.cos(i/segments*Math.PI*2)}:{x:50+i*520/segments,y:100};
  return <figure className="measurement-question"><svg viewBox="0 0 620 210" role="img" aria-label={`${closed?'环形':'直线'}共有${segments}个相等间隔`}>
    {closed?<circle cx="310" cy="98" r="82" className="lab-rope"/>:<path d="M50 100H570" className="lab-rope"/>}
    {Array.from({length:closed?segments:segments+1},(_,i)=>{const p=point(i);return <g key={i} className="lab-rope-pin"><circle cx={p.x} cy={p.y} r="10"/><text x={p.x} y={p.y+(closed&&p.y>98?28:-18)} textAnchor="middle">{i+1}</text></g>})}
    <text x="310" y="201" textAnchor="middle" className="lab-svg-small">{intro?`绳长${length/1000}米，每${spacing/1000}米作标记；请你数不同标记。`:`${length/1000}米 ÷ ${spacing/1000}米＝${segments}段；请判断有几个不同标记。`}</text>
  </svg><figcaption>{diagram.caption??`${closed?'首尾接成环':'两端都标记'}；图中数字只是标记编号。`}</figcaption></figure>;
}
