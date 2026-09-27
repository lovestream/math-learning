import { useMemo, useState } from 'react';
import { Minus, Plus, RotateCw, Scissors, Undo2 } from 'lucide-react';
import type { Lesson } from './types';

const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
const getNum=(config:Record<string,unknown>,key:string,fallback:number)=>typeof config[key]==='number'?Number(config[key]):fallback;
const Controls=({children,onReset}:{children?:React.ReactNode;onReset:()=>void})=><div className="lab-controls">{children}<button className="tool-button" onClick={onReset}><Undo2 size={17}/>重置</button></div>;

function NumberLine({lesson}:{lesson:Lesson}){
  const a=getNum(lesson.labConfig,'a',3),b=getNum(lesson.labConfig,'b',5),total=getNum(lesson.labConfig,'total',Math.max(10,a+b));
  const min=Math.min(0,a,b)-2,max=Math.max(10,total,a+b)+2;const [position,setPosition]=useState(clamp(a,min,max));
  const ticks=Array.from({length:max-min+1},(_,i)=>i+min);const x=(n:number)=>(n-min)*48+12;
  return <div className="lab-demo">
    <div className="live-equation"><span>{a}</span><b>＋</b><span>{position-a}</span><b>＝</b><strong>{position}</strong></div>
    <svg className="number-line" viewBox={`0 0 ${x(max)+12} 130`} role="img" aria-label={`数轴，当前位置 ${position}`}>
      <line x1="12" y1="62" x2={x(max)} y2="62" className="axis"/>
      {ticks.map(n=><g key={n} className="tick" onClick={()=>setPosition(n)} role="button"><line x1={x(n)} y1="52" x2={x(n)} y2="72"/><text x={x(n)} y="96">{n}</text></g>)}
      <g className="number-ship" transform={`translate(${x(position)} 32)`}><circle r="19"/><text textAnchor="middle" dy="6">{position}</text></g>
      {position!==a&&<path d={`M ${x(a)} 48 Q ${(x(a)+x(position))/2} 5 ${x(position)} 48`} className="jump"/>}
    </svg>
    <Controls onReset={()=>setPosition(clamp(a,min,max))}><button className="tool-button" onClick={()=>setPosition(v=>clamp(v-1,min,max))}><Minus size={17}/>向左 1</button><button className="tool-button" onClick={()=>setPosition(v=>clamp(v+1,min,max))}><Plus size={17}/>向右 1</button></Controls>
  </div>;
}
function ArrayLab({lesson}:{lesson:Lesson}){
  const initialA=clamp(getNum(lesson.labConfig,'a',4),1,9),initialB=clamp(getNum(lesson.labConfig,'b',6),1,10);
  const [turned,setTurned]=useState(false),[split,setSplit]=useState(Math.max(1,Math.floor(initialB/2)));
  const [groupSize,setGroupSize]=useState(initialB);
  const mode=String(lesson.labConfig.mode??'multiply'),total=clamp(getNum(lesson.labConfig,'total',initialA*initialB),1,40);
  if(mode==='remainder'||mode==='parity'){
    const size=mode==='parity'?2:groupSize,full=Math.floor(total/size),rest=total%size;
    return <div className="lab-demo grouping-demo"><div className="live-equation"><span>{total}</span><b>÷</b><span>{size}</span><b>＝</b><strong>{full} 余 {rest}</strong></div><div className="division-groups">{Array.from({length:Math.ceil(total/size)},(_,group)=>{const count=Math.min(size,total-group*size);return <div className={count<size?'remainder-group':''} key={group}><small>{count<size?'剩余':'第 '+(group+1)+' 组'}</small><span>{Array.from({length:count},(_,i)=><i key={i}/>)}</span></div>})}</div><p className="model-caption">{mode==='parity'?(rest?'最后有 1 个没有伙伴，所以是奇数。':'全部两两配对，所以是偶数。'):`装满 ${full} 组，还剩 ${rest} 个；余数要小于每组数量。`}</p><Controls onReset={()=>setGroupSize(initialB)}>{mode==='remainder'&&<><button className="tool-button" onClick={()=>setGroupSize(v=>clamp(v-1,2,9))}><Minus size={17}/>每组少 1 个</button><button className="tool-button" onClick={()=>setGroupSize(v=>clamp(v+1,2,9))}><Plus size={17}/>每组多 1 个</button></>}</Controls></div>;
  }
  const rows=turned?initialB:initialA,cols=turned?initialA:initialB;
  return <div className="lab-demo"><div className="live-equation"><span>{rows}</span><b>×</b><span>{cols}</span><b>＝</b><strong>{rows*cols}</strong></div>
    <div className="array-board" style={{gridTemplateColumns:`repeat(${cols}, 1fr)`}}>{Array.from({length:rows*cols},(_,i)=><button aria-label={`第 ${Math.floor(i/cols)+1} 行第 ${i%cols+1} 个`} key={i} className={i%cols<split?'array-dot cut':'array-dot'}/>)}</div>
    <p className="model-caption">沿虚线切开：{rows}×{split} ＋ {rows}×{cols-split} ＝ {rows*cols}</p>
    <Controls onReset={()=>{setTurned(false);setSplit(Math.max(1,Math.floor(initialB/2)))}}><button className="tool-button" onClick={()=>setTurned(v=>!v)}><RotateCw size={17}/>旋转方阵</button><label className="range-tool"><Scissors size={17}/>切在第 {split} 列<input type="range" min="1" max={Math.max(1,cols-1)} value={Math.min(split,Math.max(1,cols-1))} onChange={e=>setSplit(Number(e.target.value))}/></label></Controls>
  </div>;
}
function BalanceLab({lesson}:{lesson:Lesson}){
  const a=getNum(lesson.labConfig,'a',8),b=getNum(lesson.labConfig,'b',3),mode=String(lesson.labConfig.mode??'balance');const [box,setBox]=useState(0);const [left,setLeft]=useState(a),[right,setRight]=useState(a);
  if(mode==='unknown-addend'){
    const leftTotal=a+box,balanced=leftTotal===b;
    return <div className="lab-demo"><div className={`balance-readout ${balanced?'balanced':'tilted'}`}><span>{a} ＋ <i className="mystery-box">{box||'□'}</i></span><b>{balanced?'＝':leftTotal>b?'＞':'＜'}</b><span>{b}</span></div><svg className="balance" viewBox="0 0 560 230" role="img" aria-label={balanced?'天平平衡':'天平还没有平衡'}><line x1="280" y1="72" x2="280" y2="190"/><path d="M230 200 H330 L306 180 H254 Z"/><g transform={`rotate(${balanced?0:leftTotal>b?-7:7} 280 78)`}><line x1="95" y1="78" x2="465" y2="78"/><line x1="120" y1="78" x2="82" y2="145"/><line x1="440" y1="78" x2="478" y2="145"/><path d="M38 145 Q82 194 126 145 Z"/><path d="M434 145 Q478 194 522 145 Z"/><text x="82" y="166">{leftTotal}</text><text x="478" y="166">{b}</text></g></svg><p className="model-caption">给神秘盒增加星石，直到左右两边同样多。</p><Controls onReset={()=>setBox(0)}><button className="tool-button" onClick={()=>setBox(v=>clamp(v-1,0,b))}><Minus size={17}/>盒子少 1</button><button className="tool-button primary-tool" onClick={()=>setBox(v=>clamp(v+1,0,b))}><Plus size={17}/>盒子多 1</button><button className="tool-button" onClick={()=>setBox(Math.max(0,b-a))}>用差补平</button></Controls></div>;
  }
  const balanced=left===right;
  const both=(delta:number)=>{setLeft(v=>clamp(v+delta,0,20));setRight(v=>clamp(v+delta,0,20));};
  return <div className="lab-demo"><div className={`balance-readout ${balanced?'balanced':'tilted'}`}><span>{left}</span><b>{balanced?'＝':left>right?'＞':'＜'}</b><span>{right}</span></div>
    <svg className="balance" viewBox="0 0 560 230" role="img" aria-label={balanced?'天平平衡':'天平不平衡'}><line x1="280" y1="72" x2="280" y2="190"/><path d="M230 200 H330 L306 180 H254 Z"/><g transform={`rotate(${balanced?0:left>right?-7:7} 280 78)`}><line x1="95" y1="78" x2="465" y2="78"/><line x1="120" y1="78" x2="82" y2="145"/><line x1="440" y1="78" x2="478" y2="145"/><path d="M38 145 Q82 194 126 145 Z"/><path d="M434 145 Q478 194 522 145 Z"/><text x="82" y="166">{left}</text><text x="478" y="166">{right}</text></g></svg>
    <p className="model-caption">试试只动一边，再用“两边一起”找回平衡。初始提示量：{b}</p>
    <Controls onReset={()=>{setLeft(a);setRight(a)}}><button className="tool-button" onClick={()=>setLeft(v=>clamp(v-1,0,20))}>左边 −1</button><button className="tool-button" onClick={()=>setRight(v=>clamp(v-1,0,20))}>右边 −1</button><button className="tool-button primary-tool" onClick={()=>both(1)}>两边 ＋1</button><button className="tool-button primary-tool" onClick={()=>both(-1)}>两边 −1</button></Controls>
  </div>;
}
function BarLab({lesson}:{lesson:Lesson}){
  const a=getNum(lesson.labConfig,'a',3),b=getNum(lesson.labConfig,'b',9),total=getNum(lesson.labConfig,'total',a+b),mode=String(lesson.labConfig.mode??'compare');const [equalized,setEqualized]=useState(false);
  let small=Math.min(a,b),large=Math.max(a,b),difference=large-small,label='相差';
  if(mode==='sum-difference'){difference=b;small=(total-difference)/2;large=small+difference;label='拿走多出的一段';}
  if(mode==='sum-multiple'){small=total/(a+1);large=small*a;difference=large-small;label=`长条是 ${a} 份`;}
  if(mode==='difference-multiple'){small=b/(a-1);large=small*a;difference=b;label=`多出的 ${a-1} 份`;}
  const max=Math.max(large,1);const width=(n:number)=>Math.max(10,n/max*80),shownLarge=equalized?small:large;
  return <div className="lab-demo"><div className="bar-stage"><div><span>甲</span><button className={equalized?'equalized':''} style={{width:`${width(shownLarge)}%`}}>{shownLarge}</button></div><div><span>乙</span><button className="bar-alt" style={{width:`${width(small)}%`}}>{small}</button></div><div className="difference"><i style={{width:`${width(difference)}%`}}/>{equalized?'两条现在一样长':`${label}：${difference}`}</div></div>
    <div className="live-equation compact"><span>{large}</span><b>－</b><span>{small}</span><b>＝</b><strong>{difference}</strong></div>
    <Controls onReset={()=>setEqualized(false)}><button className="tool-button primary-tool" onClick={()=>setEqualized(v=>!v)}><Scissors size={17}/>{equalized?'放回多出的一段':'暂时拿走差'}</button></Controls>
  </div>;
}
function GeometryLab({lesson}:{lesson:Lesson}){
  const w=clamp(getNum(lesson.labConfig,'a',6),2,10),h=clamp(getNum(lesson.labConfig,'b',4),2,8),mode=String(lesson.labConfig.mode??'geometry');const initialControl=mode==='matchstick'?w:Math.max(1,Math.floor(w/2));const [cut,setCut]=useState(initialControl);
  const cells=useMemo(()=>Array.from({length:w*h},(_,i)=>i),[w,h]);
  if(mode==='planting'){
    const points=clamp(getNum(lesson.labConfig,'total',5),2,12),interval=getNum(lesson.labConfig,'b',2);
    return <div className="lab-demo planting-demo"><div className="planting-line">{Array.from({length:points},(_,i)=><span key={i}><i/><b>{i+1}</b>{i<points-1&&<em>{interval} 米</em>}</span>)}</div><div className="live-equation compact"><span>{points}</span><b>个点</b><span>{points-1}</span><b>个间隔</b><strong>{(points-1)*interval} 米</strong></div><p className="model-caption">从第1盏到第{points}盏，只走过{points-1}段距离。</p></div>;
  }
  if(mode==='matchstick'){
    const squares=clamp(cut,1,6),sticks=4+3*(squares-1);
    return <div className="lab-demo matchstick-demo"><div className="matchstick-chain">{Array.from({length:squares},(_,i)=><span key={i}><i className="top"/><i className="bottom"/><i className="left"/>{i===squares-1&&<i className="right"/>}</span>)}</div><div className="live-equation compact"><span>4</span><b>＋</b><span>3×{squares-1}</span><b>＝</b><strong>{sticks} 根</strong></div><p className="model-caption">相邻正方形共享一条边，每增加一个只增加3根。</p><Controls onReset={()=>setCut(initialControl)}><button className="tool-button" onClick={()=>setCut(v=>clamp(v-1,1,6))}><Minus size={17}/>少一个</button><button className="tool-button primary-tool" onClick={()=>setCut(v=>clamp(v+1,1,6))}><Plus size={17}/>接一个</button></Controls></div>;
  }
  return <div className="lab-demo"><div className="geometry-grid" style={{gridTemplateColumns:`repeat(${w}, 1fr)`,aspectRatio:`${w}/${h}`}}>{cells.map(i=><span className={i%w<cut?'selected':''} key={i}/>)}</div><div className="geometry-values"><span>沿边走一圈：{2*(w+h)}</span><span>铺满小格：{w*h}</span></div><Controls onReset={()=>setCut(Math.max(1,Math.floor(w/2)))}><label className="range-tool"><Scissors size={17}/>移动分割线<input type="range" min="1" max={w-1} value={cut} onChange={e=>setCut(Number(e.target.value))}/></label></Controls></div>;
}
function FractionLab({lesson}:{lesson:Lesson}){
  const parts=clamp(getNum(lesson.labConfig,'parts',getNum(lesson.labConfig,'b',4)),2,12);const initial=clamp(getNum(lesson.labConfig,'a',1),0,parts);const [selected,setSelected]=useState(initial);
  return <div className="lab-demo"><div className="fraction-strip">{Array.from({length:parts},(_,i)=><button key={i} className={i<selected?'selected':''} onClick={()=>setSelected(i+1)} aria-label={`选择 ${i+1} 份`}>{i+1}</button>)}</div><div className="live-equation"><span>{selected}</span><b>／</b><span>{parts}</span><b>＝</b><strong>{selected} 份</strong></div><p className="model-caption">整体始终一样大，只改变涂色的份数。</p><Controls onReset={()=>setSelected(initial)}><button className="tool-button" onClick={()=>setSelected(v=>clamp(v-1,0,parts))}><Minus size={17}/>少一份</button><button className="tool-button" onClick={()=>setSelected(v=>clamp(v+1,0,parts))}><Plus size={17}/>多一份</button></Controls></div>;
}
function TableLab({lesson}:{lesson:Lesson}){
  const total=clamp(getNum(lesson.labConfig,'total',12),4,360),parts=clamp(getNum(lesson.labConfig,'parts',3),2,8),mode=String(lesson.labConfig.mode??'table');const [marked,setMarked]=useState<number[]>([]);const [value,setValue]=useState(getNum(lesson.labConfig,'a',0));
  const toggle=(i:number)=>setMarked(v=>v.includes(i)?v.filter(x=>x!==i):[...v,i]);
  if(mode==='place-value'){
    const hundreds=Math.floor(value/100)%10,tens=Math.floor(value/10)%10,ones=value%10;
    return <div className="lab-demo place-value-demo"><div className="place-columns"><section><b>百位</b><span>{hundreds}</span><div>{Array.from({length:hundreds},(_,i)=><i className="hundred" key={i}/>)}</div></section><section><b>十位</b><span>{tens}</span><div>{Array.from({length:tens},(_,i)=><i className="ten" key={i}/>)}</div></section><section><b>个位</b><span>{ones}</span><div>{Array.from({length:ones},(_,i)=><i className="one" key={i}/>)}</div></section></div><div className="live-equation compact"><span>{hundreds*100}</span><b>＋</b><span>{tens*10}</span><b>＋ {ones} ＝</b><strong>{value}</strong></div><Controls onReset={()=>setValue(getNum(lesson.labConfig,'a',346))}><button className="tool-button" onClick={()=>setValue(v=>clamp(v-10,0,999))}>十位 −1</button><button className="tool-button primary-tool" onClick={()=>setValue(v=>clamp(v+10,0,999))}>十位 ＋1</button><button className="tool-button" onClick={()=>setValue(Math.floor(value/100)*100+value%10)}>十位放 0</button></Controls></div>;
  }
  if(mode==='enumeration'){
    const sum=getNum(lesson.labConfig,'b',8);return <div className="lab-demo"><div className="enumeration-list">{Array.from({length:sum+1},(_,i)=><button key={i} className={marked.includes(i)?'marked':''} onClick={()=>toggle(i)}><span>{i}</span><b>＋</b><span>{sum-i}</span><em>＝ {sum}</em></button>)}</div><p className="model-caption">让第一个数从0开始每次加1，第二个数随之减1：不漏，也不重复。</p><Controls onReset={()=>setMarked([])}><button className="tool-button primary-tool" onClick={()=>setMarked(Array.from({length:sum+1},(_,i)=>i))}>按顺序检查全部</button></Controls></div>;
  }
  if(mode==='period'){
    const cycle=parts,count=clamp(getNum(lesson.labConfig,'total',16),8,30),colors=['红','黄','蓝','绿','紫'];return <div className="lab-demo"><div className="period-row">{Array.from({length:count},(_,i)=><button key={i} className={marked.includes(i)?'focus':''} onClick={()=>setMarked([i])} style={{'--period':`var(--period-${i%cycle})`} as React.CSSProperties}><i>{colors[i%cycle]}</i><b>{i+1}</b></button>)}</div><p className="model-caption">每 {cycle} 个重复一次。点任意位置，用位置÷{cycle}的余数找到它在周期中的座位。</p><Controls onReset={()=>setMarked([])}/></div>;
  }
  if(mode==='pair-sum'){
    const start=getNum(lesson.labConfig,'a',1),end=getNum(lesson.labConfig,'b',10),count=end-start+1,pairs=Math.floor(count/2);return <div className="lab-demo"><div className="pair-list">{Array.from({length:pairs},(_,i)=><button key={i} onClick={()=>toggle(i)} className={marked.includes(i)?'marked':''}><span>{start+i}</span><b>＋</b><span>{end-i}</span><em>＝ {start+end}</em></button>)}</div><div className="live-equation compact"><span>{start+end}</span><b>×</b><span>{pairs} 对</span><b>＝</b><strong>{(start+end)*pairs}</strong></div><Controls onReset={()=>setMarked([])}><button className="tool-button primary-tool" onClick={()=>setMarked(Array.from({length:pairs},(_,i)=>i))}>首尾全部配对</button></Controls></div>;
  }
  if(mode==='chicken-rabbit'){
    const heads=getNum(lesson.labConfig,'a',20),targetLegs=getNum(lesson.labConfig,'b',56),rabbits=clamp(value,0,heads),chickens=heads-rabbits,legs=chickens*2+rabbits*4;
    return <div className="lab-demo animal-demo"><div className="animal-counts"><span>🐔 × {chickens}</span><span>🐰 × {rabbits}</span></div><div className={`live-equation compact ${legs===targetLegs?'solved':''}`}><span>{heads} 个头</span><b>｜</b><span>{legs} 只脚</span><b>{legs===targetLegs?'＝':'目标'}</b><strong>{targetLegs}</strong></div><p className="model-caption">每把1只鸡替换成兔，头数不变，脚数增加2。</p><Controls onReset={()=>setValue(0)}><button className="tool-button" onClick={()=>setValue(v=>clamp(v-1,0,heads))}>换回一只鸡</button><button className="tool-button primary-tool" onClick={()=>setValue(v=>clamp(v+1,0,heads))}>换成一只兔</button></Controls></div>;
  }
  if(mode==='pigeonhole'){
    const drawers=getNum(lesson.labConfig,'a',3),balls=clamp(value,0,drawers*3),counts=Array.from({length:drawers},(_,i)=>Math.floor(balls/drawers)+(i<balls%drawers?1:0));
    return <div className="lab-demo"><div className="drawer-row">{counts.map((n,i)=><section key={i}><b>第{i+1}类</b><div>{Array.from({length:n},(_,j)=><i key={j}/>)}</div><span>{n} 个</span></section>)}</div><p className="model-caption">先尽量平均地避开重复。放到第 {balls} 个时，观察哪一类一定挤进更多物品。</p><Controls onReset={()=>setValue(0)}><button className="tool-button primary-tool" onClick={()=>setValue(v=>clamp(v+1,0,drawers*3))}><Plus size={17}/>再放一个</button></Controls></div>;
  }
  const shown=clamp(total,4,36);
  return <div className="lab-demo"><div className="table-lab" style={{gridTemplateColumns:`repeat(${parts}, 1fr)`}}>{Array.from({length:shown},(_,i)=><button key={i} className={marked.includes(i)?'marked':''} onClick={()=>toggle(i)}>{i+1}</button>)}</div><p className="model-caption">按顺序点选，确保每一种情况只数一次。已标记 {marked.length} 个。</p><Controls onReset={()=>setMarked([])}><button className="tool-button primary-tool" onClick={()=>setMarked(Array.from({length:shown},(_,i)=>i))}>标记全部情况</button></Controls></div>;
}
export default function MathLab({lesson}:{lesson:Lesson}){
  if(lesson.lab==='numberline')return <NumberLine lesson={lesson}/>;
  if(lesson.lab==='array')return <ArrayLab lesson={lesson}/>;
  if(lesson.lab==='balance')return <BalanceLab lesson={lesson}/>;
  if(lesson.lab==='bar')return <BarLab lesson={lesson}/>;
  if(lesson.lab==='geometry')return <GeometryLab lesson={lesson}/>;
  if(lesson.lab==='fraction')return <FractionLab lesson={lesson}/>;
  return <TableLab lesson={lesson}/>;
}
