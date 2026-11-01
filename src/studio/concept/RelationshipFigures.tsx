import type {WidgetState} from '../types';
import {moneyExchange,supplyPlan} from '../../../shared/visual-relations.mjs';
import './relationships.css';
type Props={value?:WidgetState;onChange?:(value:WidgetState)=>void};
const ink='#294b53',green='#469684',gold='#e9b44d',blue='#527eab';
export function MoneyExchangeFigure({value={},onChange}:Props){
 const a={yuan:3,jiao:8},b={yuan:2,jiao:5},m=moneyExchange(a.yuan,a.jiao,b.yuan,b.jiao),shown=!!value.show;
 return <figure className="relationship-figure static-concept-figure" data-relation="money-exchange" data-revealed={shown}>
  <header><h3>同样的钱，换一种拿法</h3><p>{a.yuan}.{a.jiao}元＋{b.yuan}.{b.jiao}元：先合并元和角，再把满10角换成1元。</p></header>
  <svg viewBox="0 0 900 370" role="img" aria-label={shown?`兑换后${m.resultYuan}元${m.remainder}角；价值仍是${m.totalJiao}角`:`合并后${m.yuan}元和${m.jiao}角；黄色${a.jiao}角、蓝色${b.jiao}角，圈出10角等待兑换`}>
   <text x="40" y="40">元：{a.yuan}元＋{b.yuan}元{shown?'＋换来的1元':''}</text>
   {Array.from({length:shown?m.resultYuan:m.yuan},(_,i)=><g key={'yuan'+i} className={shown&&i===m.yuan?'relation-reveal':''} transform={`translate(${72+i*125} 100)`}><circle r="39" fill={i===m.yuan?'#dcebdd':'#fff0c7'} stroke={i===m.yuan?green:gold} strokeWidth="3"/><text textAnchor="middle" y="7">1元</text></g>)}
   <line x1="35" y1="165" x2="860" y2="165" stroke="#ccd9c6"/>
   <text x="40" y="205">角：{shown?`10角换走，留下${m.remainder}角`:`${a.jiao}角＋${b.jiao}角＝${m.jiao}角`}</text>
   {!shown&&<rect x="38" y="225" width="573" height="62" rx="20" fill="#e7f0e6" stroke={green} strokeWidth="2" strokeDasharray="7 5"/>}
   {Array.from({length:shown?m.remainder:m.jiao},(_,i)=><g key={'jiao'+i} transform={`translate(${shown?70+i*57:67+i*57} 256)`}><circle r="21" fill={shown||i>=a.jiao?'#e0eaf4':'#fff0c7'} stroke={shown||i>=a.jiao?blue:gold} strokeWidth="2"/><text textAnchor="middle" y="6" fontSize="16">1角</text></g>)}
   <text x="40" y="333" fill={green}>{shown?'10角＝1元；钱没有增加，也没有减少。':'虚线圈里的10枚1角，正好可以换成1元。'}</text>
  </svg>
  <footer><button className="studio-primary" aria-pressed={shown} onClick={()=>onChange?.({...value,show:!shown})}>{shown?'回看兑换前':'把10角换成1元'}</button>{shown?<strong className="relation-reveal">{a.yuan}.{a.jiao}＋{b.yuan}.{b.jiao}＝{m.resultYuan}.{m.remainder}（元）</strong>:<span>先说一说：换完后有几元几角？</span>}</footer>
  <figcaption>这是同一道例子的两种表示，可以来回看；不是独立测验，也不会自动记作掌握。</figcaption>
 </figure>;
}
export function SupplyPlanFigure({value={},onChange}:Props){
 const m=supplyPlan(36,2,20),shown=!!value.show,w=800,ownedWidth=w*m.used/m.demand;
 return <figure className="relationship-figure static-concept-figure" data-relation="supply-plan" data-revealed={shown}>
  <header><h3>需要的贴纸＝已有的＋还缺的</h3><p>{m.count}份礼物，每份{m.each}张贴纸；先摆出全部需求，再看已有的{m.owned}张能覆盖哪里。</p></header>
  <svg viewBox="0 0 900 325" role="img" aria-label={shown?`总需求${m.demand}张，已有${m.owned}张，还缺${m.missing}张`:`全部需求中，蓝色一段为已有${m.owned}张，余下的一段待求`}>
   <path d="M50 78V62H850V78" fill="none" stroke={ink} strokeWidth="2"/><text x="450" y="43" textAnchor="middle">{m.count}份 × 每份{m.each}张＝{shown?m.demand:'？'}张</text>
   <rect x="50" y="110" width={ownedWidth} height="84" rx="8" fill="#d9e8f2" stroke={blue} strokeWidth="2"/>
   <rect x={50+ownedWidth} y="110" width={w-ownedWidth} height="84" rx="8" fill={shown?'#dfeddf':'#fbf2dc'} stroke={shown?green:gold} strokeWidth="2"/>
   <text x={50+ownedWidth/2} y="160" textAnchor="middle">已有{m.owned}张</text><text x={50+ownedWidth+(w-ownedWidth)/2} y="160" textAnchor="middle">还缺{shown?m.missing:'？'}张</text>
   <path d={`M${50+ownedWidth} 204v25H850v-25`} fill="none" stroke={green} strokeWidth="2"/>
   <text x="450" y="280" textAnchor="middle" fill={green}>{shown?`${m.demand}张需求中，先用已有${m.owned}张，剩下的才需要买。`:'先求需要多少张，再扣掉已经有的。'}</text>
  </svg>
  <footer><button className="studio-primary" aria-pressed={shown} onClick={()=>onChange?.({...value,show:!shown})}>{shown?'把结果收起来':'对照数量关系'}</button>{shown?<strong className="relation-reveal">{m.count}×{m.each}−{m.owned}＝{m.missing}（张）</strong>:<span>指着两段，说说“已有”与“还缺”。</span>}</footer>
  <figcaption>图示只帮助解释数量关系；可以直接口头说或在纸上画，不增加必填步骤。</figcaption>
 </figure>;
}
