import {useRef} from 'react';
import {faces,projectPoint,type SolidFace} from '../../../shared/hands-on-models.mjs';

export default function SolidView({solid,azimuth,elevation,selected,onFace,onRotate,title,marked=false}:{solid:SolidFace[];azimuth:number;elevation:number;selected?:number;onFace?:(id:number)=>void;onRotate?:(a:number,e:number)=>void;title:string;marked?:boolean}){
 const drag=useRef<{x:number;y:number;a:number;e:number;moved:boolean}|null>(null);
 const moved=useRef(false),pastels=['#f8edca','#e7ddef','#f5ded7','#dee8f2','#d6ebe2','#ebdecc'];
 const projected=solid.map((face,i)=>{const p=face.points.map(v=>projectPoint(v,azimuth,elevation));return {...face,key:i,points:p,depth:p.reduce((s,v)=>s+v.depth,0)/p.length}}).sort((a,b)=>a.depth-b.depth);
 const scale=65;
 return <svg className="solid-viewport" viewBox="0 0 420 350" role="img" aria-label={title} data-evidence="object" tabIndex={onRotate?0:undefined} onPointerDown={e=>{if(!onRotate)return;moved.current=false;drag.current={x:e.clientX,y:e.clientY,a:azimuth,e:elevation,moved:false};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=drag.current;if(!d||!onRotate)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>4)d.moved=true;onRotate(((d.a+dx*.65)%360+360)%360,Math.max(-35,Math.min(90,d.e-dy*.45)))}} onPointerUp={()=>{moved.current=!!drag.current?.moved;drag.current=null}} onKeyDown={e=>{if(!onRotate||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();onRotate((azimuth+(e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0)+360)%360,Math.max(-35,Math.min(90,elevation+(e.key==='ArrowUp'?10:e.key==='ArrowDown'?-10:0))))}}>
  <defs><pattern id="spatial-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1" fill="#a7b8b0"/></pattern></defs><rect x="0" y="0" width="420" height="350" fill="url(#spatial-dots)"/><ellipse cx="210" cy="291" rx="120" ry="17" fill="#253f4312"/>
  {projected.map(face=>{const def=faces.find(f=>f.id===face.id)!,cx=210+scale*face.points.reduce((s,p)=>s+p.x,0)/4,cy=163+scale*face.points.reduce((s,p)=>s+p.y,0)/4;return <g key={face.key} onClick={()=>{if(!moved.current)onFace?.(face.id)}}><polygon data-face={face.id} points={face.points.map(p=>`${210+p.x*scale},${163+p.y*scale}`).join(' ')} fill={marked?pastels[face.id-1]:def.color} stroke={selected===face.id?'#253f43':'#fff9ef'} strokeWidth={selected===face.id?4:2}/>{(onFace||marked)&&<text x={cx} y={cy+5} textAnchor="middle" fill={marked?def.color:'#fff'} fontSize={marked?24:18} fontWeight="800">{marked?def.mark:face.id}</text>}</g>})}
  {onRotate&&<text x="210" y="326" textAnchor="middle" fill="#53716d" fontSize="13">拖动画面转动视角 · 也可用方向键</text>}
 </svg>;
}
