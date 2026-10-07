import {useId} from 'react';
import type {MathScene} from './types';
import {MoneyVisual} from './concept/OperationVisual';

// Scene models refer to authored quantities; pictures never parse story numbers.
export default function MathSceneVisual({scene,step}:{scene:MathScene;step:number}){
 const id=useId().replace(/:/g,''),q=(name:string)=>scene.story.quantities.find(item=>item.id===name)?.value??0;
 const box=(x:number,y:number,label:string,children:React.ReactNode)=><g transform={`translate(${x} ${y})`}><path d="M0 0L12-10H114L102 0Z" fill="#f3e2c1"/><path d="M102 0L114-10V79L102 89Z" fill="#987d56"/><rect width="102" height="89" rx="4" fill={`url(#${id}box)`} stroke="#bb9a67"/>{children}<text x="51" y="73" textAnchor="middle">{label}</text></g>;
 const bead=(i:number,x:number,y:number,color='blue',faded=false)=><g key={i} className={faded?'scene-object-removed':'scene-object-present'} transform={`translate(${x} ${y})`}><ellipse cy="3" rx="7" ry="7" fill="#253f4322"/><circle r="7" fill={`url(#${id+color})`}/><circle cx="-2" cy="-2" r="1.5" fill="#fff" fillOpacity=".7"/></g>;
 if(scene.model.type==='money-flow')return <MoneyVisual start={q('start')} pay={q('pay')} refund={q('refund')} phase={Math.min(step,2)} netMode/>;
 const defs=<defs><linearGradient id={id+'box'} x2="0" y2="1"><stop stopColor="#fff4dd"/><stop offset="1" stopColor="#d9bd8e"/></linearGradient>{[['blue','#9dccdc','#467b95'],['red','#f6a58b','#be5f48']].map(([name,light,dark])=><radialGradient key={name} id={id+name} cx=".3" cy=".25"><stop stopColor={light}/><stop offset="1" stopColor={dark}/></radialGradient>)}</defs>;
 const type=scene.model.type;
 if(type==='people-line'){
  const quantities=scene.story.quantities,start=quantities[0].value,remove=quantities[1].value,add=quantities[2].value,people=quantities[0].unit==='人';
  return <svg className="operation-object-view" viewBox="0 0 600 285" role="img" aria-label={`${start}${quantities[0].unit}，${step>0?`已拿走${remove}`:'还没拿走'}，${step>1?`新加入${add}`:'还没加入'}`}>
   {defs}<text x="35" y="30">{people?'车上的乘客':'书架上的书'} · 每个图标表示1{quantities[0].unit}</text>
   {Array.from({length:start},(_,i)=><g key={i} className={step>0&&i>=start-remove?'scene-object-removed':'scene-object-present'} transform={`translate(${47+i%12*42} ${55+Math.floor(i/12)*55})`}>{people?<><circle cx="12" cy="9" r="7" fill="#e9b44d"/><path d="M3 38V24Q12 14 21 24V38" fill="#527eab"/></>:<><path d="M0 5L5 0H25V37L20 42H0Z" fill="#527eab"/><path d="M4 9H19M4 33H19" stroke="#fff" strokeWidth="2"/></>}</g>)}
   {step>1&&<g className="operation-visual-arrival">{Array.from({length:add},(_,i)=><g key={i} transform={`translate(${47+i*42} 230)`}>{people?<><circle cx="12" cy="9" r="7" fill="#e9b44d"/><path d="M3 38V24Q12 14 21 24V38" fill="#469684"/></>:<rect width="22" height="37" rx="3" fill="#469684"/>}</g>)}<text x="330" y="253">新加入的{add}{quantities[0].unit}</text></g>}
  </svg>;
 }
 if(type==='boxes-and-items'){
  const count=q('boxes'),per=q('perBox'),loose=q('loose'),give=q('give');
  return <svg className="operation-object-view" viewBox="0 0 600 300" role="img" aria-label={`${count}盒，每盒${per}支${loose?`，另外${loose}支散笔`:''}${step>1&&give?`，已送出${give}支`:''}`}>
   {defs}<text x="35" y="30">一盒是一份，打开后看清每份的支数</text>
   {Array.from({length:count},(_,i)=><g key={i}>{box(35+i*135,70,`第${i+1}盒`,step===0?<text x="51" y="42" textAnchor="middle">{per}支</text>:<g className="operation-visual-arrival">{Array.from({length:per},(_,j)=><g key={j} className={step>1&&i*per+j>=count*per-give?'scene-object-removed':''}><path d={`M${14+j*14} 11v38`} stroke={j%2?'#527eab':'#df6c4f'} strokeWidth="7"/><path d={`M${11+j*14} 49l3 7 3-7`} fill="#735938"/></g>)}</g>)}</g>)}
   {loose>0&&<g>{Array.from({length:loose},(_,j)=><path key={j} d={`M${58+j*24} 206v42`} stroke="#469684" strokeWidth="9"/>)}<text x="220" y="236">盒子外另外{loose}支</text></g>}
   {step>1&&give>0&&<text x="35" y="230">淡色的{give}支已送出，不再计入剩下的笔。</text>}
  </svg>;
 }
 if(type==='group-boxes'||type==='combine-then-share'){
  const red=q('red'),total=q('beads')||red+q('blue'),per=q('perBox'),grouped=type==='group-boxes'?step>=1:step>=2,groups=total/per;
  return <svg className="operation-object-view" viewBox="0 0 600 295" role="img" aria-label={grouped?`${groups}盒，每盒${per}颗${q('labels')&&step>1?`，每盒贴${q('labels')}张标签`:''}`:`${total}颗珠子${step===1?'合在一起了':'还没有装盒'}`}>
   {defs}<text x="35" y="30">{grouped?'每一盒装同样多的珠子':'先认清珠子的颗数，再按每份颗数装盒'}</text>
   {grouped?Array.from({length:groups},(_,i)=><g key={i} className="operation-visual-arrival">{box(28+i%4*140,70+Math.floor(i/4)*135,`第${i+1}盒`,<>{Array.from({length:per},(_,j)=>bead(j,19+j%4*21,19+Math.floor(j/4)*22,i*per+j<red?'red':'blue'))}{q('labels')>0&&step>1&&Array.from({length:q('labels')},(_,j)=><rect key={j} x={7+j*44} y="91" width="36" height="16" rx="2" fill="#fff" stroke="#469684"/>)}</>)}</g>):Array.from({length:total},(_,i)=>bead(i,55+i%12*39+(step===0&&i>=red&&red>0?8:0),70+Math.floor(i/12)*48,i<red?'red':'blue'))}
  </svg>;
 }
 if(type==='bags-plus-loose'){
  const bags=q('bags'),loose=q('loose'),per=q('perBag'),newBags=step>0?loose/per:0;
  return <svg className="operation-object-view" viewBox="0 0 600 290" role="img" aria-label={`原有${bags}袋，${step>0?`散珠新装成${newBags}袋`:`另外${loose}颗散珠`}，每袋${per}颗`}>
   {defs}<text x="35" y="30">原有的整袋没有拆开；只把散珠装进新袋</text>
   {Array.from({length:bags+newBags},(_,i)=><g key={i} className={i>=bags?'operation-visual-arrival':''} transform={`translate(${40+i%8*65} ${55+Math.floor(i/8)*72})`}><path d="M5 5H30L37 47Q18 59 0 47Z" fill={i<bags?'#d9bd8e':'#78af9a'} stroke="#735938"/><path d="M5 5H30" stroke="#735938" strokeWidth="4"/><text x="18" y="37" textAnchor="middle" fontSize="13">袋</text></g>)}
   {step===0&&Array.from({length:loose},(_,i)=>bead(i,55+i*39,238))}
  </svg>;
 }
 return null;
}
