import type {CSSProperties,KeyboardEvent} from 'react';
import FoundationWidget,{FoundationDiagram} from './FoundationWidgets';
import LengthWorkbench from './LengthWorkbench';
import ConceptWorkbench from './concept/ConceptWorkbench';
import {formatFraction,rational,gridMeasure,rectangleCells,evaluateExpressionAST,expressionASTText} from '../../shared/pilot-math.mjs';
import type {ConceptScene,DiagramKind,ExpressionAST,LengthScene,MathScene,WidgetKind,WidgetState} from './types';

type Segment=[number,number,number,number];
const outline=(rows:number,cols:number):Segment[]=>[
  ...Array.from({length:cols},(_,x)=>[x,0,x+1,0] as Segment),
  ...Array.from({length:rows},(_,y)=>[cols,y,cols,y+1] as Segment),
  ...Array.from({length:cols},(_,i)=>[cols-i,rows,cols-i-1,rows] as Segment),
  ...Array.from({length:rows},(_,i)=>[0,rows-i,0,rows-i-1] as Segment)
];

export function TilePicture({rows,cols,walk=0,marked=[],onTile,shared=false,allEdges=false,scale=true}:{rows:number;cols:number;walk?:number;marked?:number[];onTile?:(i:number)=>void;shared?:boolean;allEdges?:boolean;scale?:boolean}){
  const unit=48,ox=42,oy=38,edges=outline(rows,cols);
  return <svg className="tile-picture" viewBox={`0 0 ${cols*unit+84} ${rows*unit+86}`} role={onTile?'group':'img'} aria-label={`${rows}排，每排${cols}个正方形${scale?'，每格边长1厘米':''}${shared?'，虚线是中间接缝':''}`}>
    {Array.from({length:rows*cols},(_,i)=>{
      const x=ox+i%cols*unit,y=oy+Math.floor(i/cols)*unit;
      return <g key={i} role={onTile?'button':undefined} tabIndex={onTile?0:undefined} aria-label={onTile?`第${i+1}块地垫${marked.includes(i)?'，已数过':''}`:undefined} aria-pressed={onTile?marked.includes(i):undefined} onClick={()=>onTile?.(i)} onKeyDown={e=>{if(onTile&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onTile(i)}}}>
        <rect x={x+1} y={y+1} width={unit-2} height={unit-2} rx="3" className={marked.includes(i)?'tile-marked':'tile-fill'}/>
        {marked.includes(i)&&<text x={x+unit/2} y={y+unit/2+5} textAnchor="middle" className="tile-count">{marked.indexOf(i)+1}</text>}
      </g>;
    })}
    {edges.map(([x1,y1,x2,y2],i)=><g key={i}>
      <line x1={ox+x1*unit} y1={oy+y1*unit} x2={ox+x2*unit} y2={oy+y2*unit} className={allEdges||i<walk?'rope-traced':'rope-guide'}/>
      {(allEdges||i<walk)&&<text className="edge-count" textAnchor="middle" x={ox+(x1+x2)*unit/2+(x1===x2?(x1===0?-15:15):0)} y={oy+(y1+y2)*unit/2+(y1===y2?(y1===0?-11:20):5)}>{i+1}</text>}
    </g>)}
    {shared&&<line x1={ox+unit} x2={ox+unit} y1={oy} y2={oy+unit} className="shared-edge"/>}
    <circle cx={ox} cy={oy} r="5" fill="#ce6537"/>
    <text x={ox} y="15" className="edge-label">起点 →</text>
    <text x={ox} y={oy+rows*unit+49} className="edge-label">{scale?'每一小段边长1厘米':`${rows}排，每排${cols}块 · 从上往下看`}</text>
  </svg>;
}

export function CandyDots({count,crossed=0}:{count:number;crossed?:number}){
  return <span className="candy-dots" role="img" aria-label={`${count}颗糖${crossed?`，其中${crossed}颗已拿走`:''}`}>{Array.from({length:count},(_,i)=><i key={i} className={i>=count-crossed?'taken':''}><span/></i>)}</span>;
}
function Bag({label='1袋',revealed}:{label?:string;revealed?:number}){return <span className="candy-bag"><span>{revealed===undefined?label:`${revealed}颗`}</span></span>}
function Snack({opened=false}:{opened?:boolean}){return <span className={`snack-contents ${opened?'opened':''}`}>{opened?<><Bag/><span>＋</span><CandyDots count={2}/></>:<span className="snack-closed">点心盒<span>里面：1袋＋2颗</span></span>}</span>}
function Ribbon({parts,take,whole=1,onTake}:{parts:number;take:number;whole?:number;onTake?:(n:number)=>void}){
  return <div className="ribbon-measure"><span>完整彩带：{whole}米</span><div className="ribbon-strip" style={{width:`${whole/2*100}%`,'--parts':parts} as CSSProperties}>
    {Array.from({length:parts},(_,i)=>onTake?<button key={i} className={i<take?'chosen':''} aria-label={`选前${i+1}小段`} onClick={()=>onTake(i+1)}>{i<take?'✓':''}</button>:<i key={i} className={i<take?'chosen':''}/>)}</div>
  </div>;
}

export function TeachingDiagram({kind,reveal=false}:{kind:DiagramKind;reveal?:boolean}){
  if(['picnicCount','countSpacing','appleAddition','appleTransfer','stickerTake','stickerCompare'].includes(kind))return <FoundationDiagram kind={kind}/>;
  return <figure className={`teaching-figure figure-${kind}`}>
    {kind==='readingCorner'&&<><TilePicture rows={3} cols={4} scale={false}/><figcaption><span className="legend-fill">方块：一块块地垫</span><span className="legend-rope">外圈虚线：绳子要走的路线</span></figcaption></>}
    {kind==='joinedTiles'&&<><TilePicture rows={1} cols={2} shared allEdges={reveal}/><figcaption>两个方格并排。中间的紫色虚线是接缝；绳子沿整个图形外圈走。</figcaption></>}
    {kind==='ribbon'&&<><Ribbon parts={6} take={2}/><figcaption>整条长1米，分成6个同样长的小段。涂色的两段给朋友，其余四段留下。</figcaption></>}
    {kind==='groupedRibbon'&&<><p><b>上图 · 重新分组前：</b>共6小段，前2小段给朋友。</p><Ribbon parts={6} take={2}/><p><b>下图 · 重新分组后：</b>共3大段，前1大段给朋友。</p><Ribbon parts={3} take={1}/><figcaption>请比较上下图涂色部分的总长度。两小段合在一起，恰好和一大段一样长。</figcaption></>}
    {kind==='unequalRibbon'&&<><div className="unequal-ribbon"><span>1厘米</span><span>1厘米</span><span>2厘米</span></div><figcaption>这是三段，但不是三等份：最后一段比前两段各自都长。</figcaption></>}
    {kind==='snackBox'&&<><div className="one-snack"><Snack opened/></div><figcaption>每盒的全部东西：一袋糖，另外再放两颗。袋里有几颗暂时不知道。</figcaption></>}
    {kind==='threeSnacks'&&<><div className="three-snacks">{[1,2,3].map(n=><div key={n}><b>第{n}盒</b><Snack opened/></div>)}</div><figcaption>只数袋子外面的散糖，袋内颗数不影响这道题。</figcaption></>}
    {kind==='candyEquality'&&<><div className="candy-comparison"><div><span>左边：袋里和袋外一起算</span><div><Bag label="?颗"/><b>＋</b><CandyDots count={3}/></div></div><strong>＝<small>同样多</small></strong><div><span>右边：10颗</span><CandyDots count={10}/></div></div><figcaption>这里比较糖的颗数。袋子只是遮住了一部分糖。</figcaption></>}
  </figure>;
}

function AreaWidget({value,onChange}:{value:WidgetState;onChange:(s:WidgetState)=>void}){
  const rows=[1,2,3].includes(value.rows)?value.rows:3,cols=12/rows;
  const marked:number[]=Array.isArray(value.marked)?value.marked:[],walk=Number(value.walk)||0;
  const size=gridMeasure(rectangleCells(rows,cols));
  return <div className="hands-on area-lab">
    <div className="experiment-directions"><b>你来做两件事</b><p>① 点一下没数过的地垫，数过的会出现编号。<br/>② 点下面的走一步按钮，绳子每次沿外圈前进1厘米。</p></div>
    <div className="layout-picker" aria-label="选择地垫摆法">{[3,2,1].map(r=><button key={r} aria-pressed={rows===r} onClick={()=>onChange({rows:r,marked:[],walk:0})}>{r}排 · 每排{12/r}块</button>)}</div>
    <div className="area-experiment"><TilePicture rows={rows} cols={cols} marked={marked} walk={walk} onTile={i=>onChange({...value,rows,marked:marked.includes(i)?marked.filter(n=>n!==i):[...marked,i]})}/>
      <div className="experiment-readouts"><div><small>数里面的地垫</small><b>{marked.length} <span>块已数过</span></b><p>{marked.length===size.area?'12块都数到了！图形面积是12平方厘米。':'可以点着数，也可以想想每排几块、一共几排。'}</p></div><div><small>量外圈的绳子</small><b>{walk} <span>厘米已走过</span></b><p>{walk===size.perimeter?`回到起点了！这一圈长${size.perimeter}厘米。`:'从起点沿箭头方向走，直到回到起点。'}</p></div></div>
    </div>
    <div className="experiment-actions"><button className="studio-primary" disabled={walk>=size.perimeter} onClick={()=>onChange({...value,rows,walk:walk+1})}>{walk>=size.perimeter?'已经绕完一圈':'沿外圈走1厘米'}</button><button onClick={()=>onChange({...value,rows,walk:size.perimeter})}>看完整一圈</button><button onClick={()=>onChange({rows,marked:[],walk:0})}>重新数一次</button></div>
    <p className="discovery-line" aria-live="polite">{walk===size.perimeter?`同样12块，这种摆法要${size.perimeter}厘米绳子。换个摆法，绳子还一样长吗？`:'图中每个小方格边长1厘米。外圈实线是已经走过的路，数字记录走了几步。'}</p>
  </div>;
}

function FractionWidget({value,onChange}:{value:WidgetState;onChange:(s:WidgetState)=>void}){
  const parts=[3,4,6,8].includes(value.parts)?value.parts:6,take=Math.max(0,Math.min(parts,value.take??2)),whole=value.whole===2?2:1;
  const reduced=formatFraction(rational(take,parts)),length=formatFraction(rational(whole*take,parts));
  const change=(s:WidgetState)=>onChange({parts,take,whole,...s});
  return <div className="hands-on fraction-lab">
    <div className="experiment-directions"><b>先分成6份，点第2小段</b><p>小勾表示拿给朋友的部分。彩带下方的小路表示从0走到了哪里。</p></div>
    <div className="ribbon-controls"><label>整条长<select value={whole} onChange={e=>change({whole:Number(e.target.value)})}><option value={1}>1米</option><option value={2}>2米</option></select></label><label>平均分成<select value={parts} onChange={e=>change({parts:Number(e.target.value),take:Math.min(take,Number(e.target.value))})}>{[3,4,6,8].map(p=><option key={p} value={p}>{p}份</option>)}</select></label><button onClick={()=>change({take:0})}>全部放回去</button></div>
    <Ribbon parts={parts} take={take} whole={whole} onTake={n=>change({take:n})}/>
    <div className="ribbon-numberline" style={{width:`${whole/2*100}%`}}><div>{Array.from({length:parts+1},(_,i)=><span key={i} style={{left:`${i/parts*100}%`}} className={i===take?'current':''}><i/>{i===0?'0':i===parts?`${whole}米`:i===take?`${length}米`:''}</span>)}</div></div>
    <div className="fraction-explanation" aria-live="polite"><div><span>拿了整条的</span><b className="stack-fraction"><span>{take}</span><span>{parts}</span></b><p>上面{take}：拿了{take}份<br/>下面{parts}：共分成{parts}份</p></div><div><span>拿的这截实际长</span><strong>{length} 米</strong><p>整条是{whole}米。{whole===2?'同样拿几份，整条变长，每份也会更长。':'先区分“整条的几分之几”和“多少米”。'}</p></div></div>
    <div className="experiment-actions"><button disabled={parts!==6||take!==2} onClick={()=>change({parts:3,take:1})}>把每2小份合成1大份</button><button onClick={()=>onChange({parts:6,take:2,whole:1})}>回到6份，拿2份</button></div>
    <p className="discovery-line">{parts===3&&take===1?`原来涂色的2小段，重新分组后叫1大段。和原来那2小段合起来相比，这1大段一样长：2/6＝${reduced}。`:'试完重新分组，再把整条从1米换成2米，观察涂色部分的实际长度。'}</p>
  </div>;
}

function SubstitutionWidget({value,onChange}:{value:WidgetState;onChange:(s:WidgetState)=>void}){
  const opened:number[]=Array.isArray(value.opened)?value.opened:[];
  return <div className="hands-on snack-lab"><div className="experiment-directions"><b>三个盒子，每个都点开</b><p>你换的是一整盒里的东西，袋子和2颗散糖要一起留下。</p></div>
    <div className="three-snacks">{[0,1,2].map(n=><button key={n} aria-label={`打开第${n+1}盒`} aria-pressed={opened.includes(n)} onClick={()=>onChange({opened:opened.includes(n)?opened:[...opened,n]})}><b>第{n+1}盒</b><Snack opened={opened.includes(n)}/><small>{opened.includes(n)?'1袋＋2颗，都在':'点我打开'}</small></button>)}</div>
    <p className="discovery-line" aria-live="polite">{opened.length===3?'三盒全开了：3袋糖，另外还有2＋2＋2＝6颗散糖。':`打开了${opened.length}盒，看见${opened.length}袋糖和${opened.length*2}颗散糖。${opened.length?'继续打开其余盒子。':'先试着点开第一盒。'}`}</p>
    {opened.length===3&&<div className="symbol-bridge"><span>“乙”记一袋的糖有几颗</span><b>(乙＋2)＋(乙＋2)＋(乙＋2)</b><span>把三份合起来写</span><b>3 × (乙＋2) ＝ 3乙＋6</b><p>括号像盒子的边框：提醒我们每一份都要带着“＋2”。</p></div>}
    <button onClick={()=>onChange({opened:[]})}>合上盒子，再数一次</button>
  </div>;
}

function BalanceWidget({value,onChange}:{value:WidgetState;onChange:(s:WidgetState)=>void}){
  const mode=value.mode==='two'?'two':'one',action=value.action??'start',boxes=mode==='two'?2:1,total=mode==='two'?11:10,solution=(total-3)/boxes;
  const leftRemoved=action==='start'?0:3,rightRemoved=action==='both'||action==='divide'?3:0,equal=action!=='left',divided=action==='divide';
  return <div className="hands-on candy-lab"><div className="experiment-directions"><b>先记住：两边原来一样多</b><p>左边有{boxes}袋糖和3颗散糖；右边有{total}颗。我们要找每袋有几颗。</p></div>
    <div className="layout-picker"><button aria-pressed={mode==='one'} onClick={()=>onChange({mode:'one',action:'start'})}>1袋＋3颗，共10颗</button><button aria-pressed={mode==='two'} onClick={()=>onChange({mode:'two',action:'start'})}>2袋＋3颗，共11颗</button></div>
    <div className={`candy-comparison ${equal?'equal':'unequal'}`}><div><span>左边</span><div>{Array.from({length:divided?1:boxes},(_,i)=><Bag key={i} label="x颗"/>)}{!divided&&<><b>＋</b><CandyDots count={3} crossed={leftRemoved}/></>}</div></div><strong>{equal?'＝':'≠'}<small>{equal?'同样多':'不一样多'}</small></strong><div><span>右边</span><CandyDots count={divided?solution:total} crossed={divided?0:rightRemoved}/></div></div>
    <div className="quantity-beam" aria-hidden="true"><i style={{transform:`rotate(${equal?0:5}deg)`}}/><b>▲</b></div>
    <p className="discovery-line" aria-live="polite">{action==='start'?`${boxes===1?'x':'2x'}＋3＝${total}，等号记着两边同样多。`:action==='left'?`只拿左边：左边比右边少3颗，两边不能再写等号。请回到开始，再试两边都拿。`:divided?`两袋同样多，共${total-3}颗，平均分成两份：x＝${solution}。代回：${solution}＋${solution}＋3＝${total}，符合原来的线索。`:`两边各拿走3颗。${boxes===1?'左边只剩一袋，右边剩7颗，所以x＝7。再检查：7＋3＝10。':`左边剩两袋，右边剩8颗：2x＝8。再把两边都平均分成2份。`}`}</p>
    <div className="experiment-actions"><button className="studio-primary" disabled={action!=='start'} onClick={()=>onChange({mode,action:'both'})}>两边各拿走3颗</button><button disabled={action!=='start'} onClick={()=>onChange({mode,action:'left'})}>只从左边拿走3颗</button>{boxes===2&&<button disabled={action!=='both'} onClick={()=>onChange({mode,action:'divide'})}>两边都平均分成2份</button>}<button onClick={()=>onChange({mode,action:'start'})}>回到开始</button></div>
  </div>;
}

const astValue=(node:ExpressionAST)=>formatFraction(evaluateExpressionAST(node));
function operationNodes(node:ExpressionAST,out:ExpressionAST[]=[]){if(node.type==='operation'){operationNodes(node.left,out);operationNodes(node.right,out);out.push(node)}return out;}
function MixedOperationsWidget({value,onChange,scenes=[]}:{value:WidgetState;onChange:(s:WidgetState)=>void;scenes?:MathScene[]}){
  const scene=scenes.find(s=>s.sceneId===value.sceneId)??scenes[0];
  if(!scene)return <div className="hands-on mixed-operations-lab"><p>这节课的场景正在整理。</p></div>;
  const operations=operationNodes(scene.expressionAST),step=Math.min(Number(value.step)||0,operations.length);
  const first=operations[0],firstText=first&&`${expressionASTText(first)}＝${astValue(first)}`;
  const reset=(sceneId=scene.sceneId)=>onChange({sceneId,step:0,prediction:'',error:'',modelStateVersion:`${scene.contentVersion}:${sceneId}`});
  const advance=()=>{if(step>=operations.length){reset();return}if(step===0&&value.prediction!=='correct'){onChange({...value,error:value.prediction==='unit-error'?'这两个数的单位不同，原式保持不动。请改选能先得到“多少支”的那一步。':'请先选出你认为应该先算的那一小步。'});return}onChange({...value,step:step+1,error:''})};
  const onKey=(e:KeyboardEvent<HTMLDivElement>)=>{if(e.key==='Enter'){e.preventDefault();advance()}else if(e.key==='Backspace'){e.preventDefault();onChange({...value,step:Math.max(0,step-1),error:''})}};
  return <div className="hands-on mixed-operations-lab" tabIndex={0} onKeyDown={onKey}>
    {scenes.length>1&&<div className="scene-switcher" aria-label="切换完整故事">{scenes.map((s,i)=><button key={s.sceneId} aria-pressed={s.sceneId===scene.sceneId} onClick={()=>reset(s.sceneId)}>场景 {String.fromCharCode(65+i)}</button>)}</div>}
    <div className="mixed-story"><small>{scene.taskMode==='A_order_and_model'?'A · 顺序与模型':scene.taskMode==='B_equivalent_rewrite'?'B · 等值改写':'C · 运算律'}</small><h3>{scene.story.text}</h3><div className="quantity-cards">{scene.story.quantities.map(item=><span key={item.id}><b>{item.value}</b><em>{item.unit}</em><small>{item.role}</small></span>)}</div></div>
    <div className="operation-track" aria-label={`算式 ${expressionASTText(scene.expressionAST)}`}><p>要解决：{scene.target.prompt}</p><strong>{expressionASTText(scene.expressionAST)}</strong><div>{operations.map((item,i)=><span key={i} className={i<step?'done':i===step?'current':''}>{i<step?'✓':i+1}<small>{i<step?`${expressionASTText(item)}＝${astValue(item)}`:i===step?'下一小步':'还没轮到'}</small></span>)}</div></div>
    {step===0&&<div className="prediction-panel"><b>先预测：第一步算什么？</b><button aria-pressed={value.prediction==='correct'} onClick={()=>onChange({...value,prediction:'correct',error:''})}>{firstText}</button>{scene.sceneId==='G3-U02-B02-A'&&<button aria-pressed={value.prediction==='unit-error'} onClick={()=>onChange({...value,prediction:'unit-error',error:'现在不能算4＋3：4的单位是“支”，3的单位是“盒”。先把3盒换成铅笔的支数。'})}>4＋3＝7</button>}</div>}
    {value.error&&<p className="operation-error" role="alert"><b>先停一下：</b>{value.error}</p>}
    <div className="operation-stage"><div className={`model-board model-${scene.model.type}`}>{scene.story.quantities.map(item=><i key={item.id}><b>{item.value}</b><span>{item.unit}</span><small>{item.role}</small></i>)}</div><div className="operation-readout" aria-live="polite">{step===0?<p>图和算式都还保持原样。选好第一步再操作。</p>:step<operations.length?<><b>刚算出：{expressionASTText(operations[step-1])}＝{astValue(operations[step-1])}</b><p>这是中间量，还要看看整条算式有没有未完成的运算。</p></>:<><b>整条算式完成：{scene.expected.value}{scene.expected.unit}</b><p>{scene.expected.explanation}</p></>}</div></div>
    <div className="experiment-actions"><button className="studio-primary" onClick={advance}>{step>=operations.length?'再讲一遍':step===0?'按预测算第一步':'算下一步'}</button><button disabled={step===0} onClick={()=>onChange({...value,step:Math.max(0,step-1),error:''})}>撤销一步</button><button onClick={()=>reset()}>恢复初始状态</button></div>
    <p className="keyboard-tip">键盘也能操作：Enter 算下一步，Backspace 撤销。</p>
  </div>;
}

export default function TeachingWidget({kind,value,onChange,scenes,lengthScenes,conceptScenes}:{kind:WidgetKind;value:WidgetState;onChange:(s:WidgetState)=>void;scenes?:MathScene[];lengthScenes?:LengthScene[];conceptScenes?:ConceptScene[]}){
  if(['quantity','addition','subtraction'].includes(kind))return <FoundationWidget kind={kind} value={value} onChange={onChange}/>;
  if(kind==='mixedOperations')return <MixedOperationsWidget value={value} onChange={onChange} scenes={scenes}/>;
  if(kind==='lengthWorkbench')return <LengthWorkbench value={value} onChange={onChange} scenes={lengthScenes}/>;
  if(kind==='conceptLab')return <ConceptWorkbench value={value} onChange={onChange} scenes={conceptScenes}/>;
  if(kind==='area')return <AreaWidget value={value} onChange={onChange}/>;
  if(kind==='fraction')return <FractionWidget value={value} onChange={onChange}/>;
  if(kind==='substitution')return <SubstitutionWidget value={value} onChange={onChange}/>;
  return <BalanceWidget value={value} onChange={onChange}/>;
}
