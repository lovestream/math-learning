import {regroupPositions} from '../../../shared/visual-relations.mjs';
import '../concept/relationships.css';
export default function RegroupFigure({count,oldEach,newEach,changed,unit,container,onToggle}:{count:number;oldEach:number;newEach:number;changed:boolean;unit:string;container:string;onToggle:()=>void}){
 const m=regroupPositions(count,oldEach,newEach,changed),height=78+Math.ceil(m.groups/6)*122;
 return <figure className="regroup-figure" data-relation="fixed-total" data-arrangement={changed?'new':'original'}>
  <p><b>同一批材料：共{m.total}{unit}，只换分装方式。</b>一个小图表示1{unit}，每个都保留原来的编号。</p>
  <svg viewBox={`0 0 640 ${height}`} role="img" aria-label={`同一批${m.total}${unit}，现在${m.groups}${container}，每${container}${m.each}${unit}`}>
   <text className="regroup-summary" x="35" y="32">{m.groups}{container} × 每{container}{m.each}{unit}＝{m.total}{unit}</text>
   {m.boxes.map((box,i)=><g key={i}><rect x={box.x} y={box.y} width={box.width} height="102" rx="10" fill="#edf3e8" stroke="#9cb6a3" strokeWidth="2"/><text x={box.x+box.width/2} y={box.y+92} textAnchor="middle">第{i+1}{container}</text></g>)}
   {m.items.map(item=><g key={item.id} className="regroup-item" style={{transform:`translate(${item.x}px,${item.y}px)`}} data-material-id={item.id}><rect x="0" y="-12" width="19" height="20" rx="2" fill={item.id%2?'#e9b44d':'#527eab'}/><path d="M3-9V5" stroke="#fff" strokeWidth="1"/><text x="10" y="1" textAnchor="middle" fill="#fff" fontSize="8">{item.id+1}</text></g>)}
  </svg>
  <button className="studio-ghost" aria-pressed={changed} onClick={onToggle}>{changed?`回到每${container}${oldEach}${unit}`:`换成每${container}${newEach}${unit}`}</button>
  <figcaption>分组框变了，材料编号一个不少。总量不变，每份数量改变后，所需{container}数怎样变化？</figcaption>
 </figure>;
}
