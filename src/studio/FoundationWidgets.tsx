import type {WidgetState} from './types';

const bounded=(v:unknown,initial:number,max=14)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=max?Number(v):initial;
function Apples({count,spread=false}:{count:number;spread?:boolean}){
  return <div className={`apple-row ${spread?'spread':''}`} role="img" aria-label={`${count}个苹果，${spread?'摆开':'摆紧'}`}>{Array.from({length:count},(_,i)=><span key={i} aria-hidden="true">🍎</span>)}</div>;
}
function AppleBaskets({left=3,right=2}:{left?:number;right?:number}){
  return <div className="apple-baskets"><div><b>左篮 · {left}个</b><Apples count={left}/></div><span aria-hidden="true">＋</span><div><b>右篮 · {right}个</b><Apples count={right}/></div></div>;
}
function Stickers({count,removed=0,sent,onPick,label}:{count:number;removed?:number;sent?:number[];onPick?:(i:number)=>void;label:string}){
  const isSent=(i:number)=>sent?sent.includes(i):i>=count-removed;
  return <div className="sticker-row"><b>{label}</b><div role={onPick?'group':'img'} aria-label={`${count}张贴纸${removed?`，其中${removed}张已送出`:''}`}>{Array.from({length:count},(_,i)=>onPick?<button key={i} disabled={isSent(i)} className={isSent(i)?'sent':''} aria-label={isSent(i)?'这张已经送出':`送出第${i+1}张贴纸`} onClick={()=>onPick(i)}>★</button>:<span key={i} className={isSent(i)?'sent':''} aria-hidden="true">★</span>)}</div></div>;
}
export function FoundationDiagram({kind}:{kind:string}){
  return <figure className="teaching-diagram foundation-picture">
    {kind==='picnicCount'&&<><div className="lunchboxes">{Array.from({length:7},(_,i)=><div key={i}><span>饭盒 {i+1}</span><i aria-hidden="true">🍎</i></div>)}</div><figcaption>每盒配1个苹果。7个饭盒，正好对应7个苹果。</figcaption></>}
    {kind==='countSpacing'&&<><b>上排：原来的7个苹果，摆紧</b><Apples count={7}/><b>下排：还是这些苹果，摆开</b><Apples count={7} spread/><figcaption>每个苹果都还在，只改变了苹果之间的空隙。</figcaption></>}
    {kind==='appleAddition'&&<><AppleBaskets/><figcaption>左篮3个，右篮2个。两篮里的苹果都要算到。</figcaption></>}
    {kind==='appleTransfer'&&<><b>挪动前</b><AppleBaskets/><p className="move-caption">右篮的1个 → 挪进左篮</p><b>挪动后</b><AppleBaskets left={4} right={1}/><figcaption>请数两篮合起来有几个。只换了篮子，没有新加苹果。</figcaption></>}
    {kind==='stickerTake'&&<><Stickers count={9} removed={5} label="原来的9张"/><figcaption>打叉的5张送给了朋友，其余4张是 Kevin 留下的。</figcaption></>}
    {kind==='stickerCompare'&&<><Stickers count={9} label="Kevin · 9张"/><Stickers count={5} label="朋友 · 5张"/><figcaption>两排从同一个位置开始摆，一张对一张，找没有配对的部分。这些贴纸都还在。</figcaption></>}
  </figure>;
}
type Props={value:WidgetState;onChange:(v:WidgetState)=>void};
function Quantity({value,onChange}:Props){
  const filled:number[]=Array.isArray(value.filled)?[...new Set<number>(value.filled.filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<7))]:[];
  const spread=Boolean(value.spread);
  return <div className="hands-on foundation-lab"><div className="experiment-directions"><b>每个空饭盒点一次</b><p>放好苹果的饭盒会显示小勾，不会重复放。数的是放了苹果的饭盒个数。</p></div>
    <div className="lunchboxes">{Array.from({length:7},(_,i)=><button key={i} disabled={filled.includes(i)} onClick={()=>onChange({...value,filled:[...filled,i]})}><span>饭盒 {i+1}</span><i aria-hidden="true">{filled.includes(i)?'🍎':'＋'}</i><small>{filled.includes(i)?'✓ 已放1个':'点我放苹果'}</small></button>)}</div>
    <p className="discovery-line" aria-live="polite">已经配好 {filled.length} 盒，还差 {7-filled.length} 盒。{filled.length===7?'每盒都有1个，所以需要7个苹果。':''}</p>
    {filled.length===7&&<div className="spacing-experiment"><b>同一组7个苹果，换个摆法看</b><Apples count={7} spread={spread}/><p>现在是{spread?'摆开':'摆紧'}的7个苹果。苹果一个没添，也一个没拿走。</p><div className="experiment-actions"><button aria-pressed={!spread} onClick={()=>onChange({...value,spread:false})}>摆紧一点</button><button aria-pressed={spread} onClick={()=>onChange({...value,spread:true})}>摆开一点</button></div><div className="count-line" role="img" aria-label="从0开始，每增加一个苹果就前进一格，到7"><span>0</span>{Array.from({length:7},(_,i)=><span key={i}>→ {i+1}</span>)}</div><p>在数字小路上，从0开始，一个苹果走一格，最后到7。</p></div>}
    <button onClick={()=>onChange({filled:[],spread:false})}>拿出全部苹果，重新配一次</button>
  </div>;
}
function Addition({value,onChange}:Props){
  const left=bounded(value.left,3,12),right=bounded(value.right,2,12),total=left+right,show=Boolean(value.show);
  const change=(s:WidgetState)=>onChange({left,right,show,...s});
  return <div className="hands-on foundation-lab"><div className="experiment-directions"><b>先看各有几个，再看合起来有几个</b><p>把一篮的苹果挪到另一篮，与从厨房新添苹果，分别试一次。</p></div><AppleBaskets left={left} right={right}/>
    <div className="experiment-actions"><button className="studio-primary" onClick={()=>change({show:true})}>合起来看看</button><button disabled={!right||left>=12} onClick={()=>change({left:left+1,right:right-1,show:true,action:'move'})}>右篮挪1个到左篮</button><button disabled={!left||right>=12} onClick={()=>change({left:left-1,right:right+1,show:true,action:'move'})}>左篮挪1个到右篮</button><button disabled={total>=12} onClick={()=>change({right:right+1,show:true,action:'add'})}>从厨房新添1个到右篮</button><button onClick={()=>onChange({left:3,right:2,show:false})}>回到左3、右2</button></div>
    {show&&<div className="part-whole"><p className="discovery-line" aria-live="polite"><b>{left}＋{right}＝{total}</b> · 两篮合起来{total}个。{value.action==='move'?'这次只挪动，和挪动前相比，总数不变。':value.action==='add'?'这次从外面新添1个，比添加前的总数多1。':''}</p><div className="parts-bar" role="img" aria-label={`每格表示一个苹果，左${left}格加右${right}格，总共${total}格`}>{Array.from({length:total},(_,i)=><span key={i} className={i<left?'left-part':'right-part'}>{i+1}</span>)}</div><p>每格表示1个苹果。颜色标出来自哪一篮，整条表示总数。</p></div>}
  </div>;
}
function Subtraction({value,onChange}:Props){
  const sent:number[]=Array.isArray(value.sent)?[...new Set<number>(value.sent.filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<9))]:[];
  const compare=value.mode==='compare',removed=sent.length,top=bounded(value.top,9),bottom=Math.min(top,bounded(value.bottom,5));
  const change=(s:WidgetState)=>onChange({mode:compare?'compare':'take',sent,top,bottom,...s});
  return <div className="hands-on foundation-lab"><div className="layout-picker"><button aria-pressed={!compare} onClick={()=>change({mode:'take'})}>送出贴纸：求剩下</button><button aria-pressed={compare} onClick={()=>change({mode:'compare'})}>比较两人的贴纸：求相差</button></div>
    {!compare?<><div className="experiment-directions"><b>原来9张，试着送出5张</b><p>点一张贴纸，这一张就打叉，表示已经送给朋友。数数没有打叉的贴纸，还剩几张？</p></div><Stickers count={9} removed={removed} sent={sent} label="原来的贴纸" onPick={i=>change({sent:[...sent,i]})}/><p className="discovery-line" aria-live="polite">9−{removed}＝{9-removed}。原来9张，送出{removed}张，还剩{9-removed}张。检查：剩下{9-removed}张＋送出{removed}张＝9张。</p><button onClick={()=>change({sent:[]})}>把送出的贴纸拿回来</button></>:<><div className="experiment-directions"><b>两人各自的贴纸都没有拿走</b><p>上下从同一个位置开始，一张对一张，多出来的就是相差的张数。</p></div><Stickers count={top} label={`Kevin · ${top}张`}/><Stickers count={bottom} label={`朋友 · ${bottom}张`}/><p className="discovery-line" aria-live="polite">{top}−{bottom}＝{top-bottom}。{top===bottom?'两人一样多，相差0张。':`Kevin 比朋友多${top-bottom}张。`}</p><div className="experiment-actions"><button disabled={top>=14} onClick={()=>change({top:top+1,bottom:bottom+1})}>两人各新得1张</button><button disabled={bottom>=top} onClick={()=>change({bottom:bottom+1})}>只有朋友新得1张</button><button onClick={()=>change({top:9,bottom:5})}>回到 Kevin 9张、朋友5张</button></div><p>两人各加1张时，新贴纸互相配成一对；只有朋友加1张时，会配上 Kevin 原来多出来的1张。</p></>}
  </div>;
}
export default function FoundationWidget({kind,...props}:Props&{kind:string}){
  return kind==='quantity'?<Quantity {...props}/>:kind==='addition'?<Addition {...props}/>:<Subtraction {...props}/>;
}
