import {useId,useRef} from 'react';
import {faces,type SolidFace} from '../../../shared/hands-on-models.mjs';
import {composeSolid,tint} from '../../../shared/solid-rendering.mjs';

export default function SolidView({solid,azimuth,elevation,selected,onFace,onRotate,title,marked=false,foldProgress}:{solid:SolidFace[];azimuth:number;elevation:number;selected?:number;onFace?:(id:number)=>void;onRotate?:(a:number,e:number)=>void;title:string;marked?:boolean;foldProgress?:number}){
 const id=useId().replace(/:/g,''),drag=useRef<{x:number;y:number;a:number;e:number;moved:boolean;face?:number}|null>(null),moved=useRef(false);
 const {faces:projected}=composeSolid(solid,azimuth,elevation),pastels=['#f8edca','#e7ddef','#f5ded7','#dee8f2','#d6ebe2','#ebdecc'];
 return <svg className="solid-viewport" viewBox="0 0 420 350" role="img" aria-label={title} data-evidence="object" data-renderer="lit-solid" data-fold-frame={foldProgress} tabIndex={onRotate?0:undefined} onPointerDown={e=>{if(!onRotate)return;moved.current=false;drag.current={x:e.clientX,y:e.clientY,a:azimuth,e:elevation,moved:false,face:Number((e.target as Element).closest('[data-face-group]')?.getAttribute('data-face-group'))||undefined};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=drag.current;if(!d||!onRotate)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>4)d.moved=true;onRotate(((d.a+dx*.65)%360+360)%360,Math.max(-35,Math.min(90,d.e-dy*.45)))}} onPointerUp={()=>{const d=drag.current;moved.current=!!d?.moved||!!d?.face;if(d&&!d.moved&&d.face)onFace?.(d.face);drag.current=null}} onPointerCancel={()=>{moved.current=true;drag.current=null}} onKeyDown={e=>{if(!onRotate||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();onRotate((azimuth+(e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0)+360)%360,Math.max(-35,Math.min(90,elevation+(e.key==='ArrowUp'?10:e.key==='ArrowDown'?-10:0))))}}>
  <defs>
   <radialGradient id={id+'back'}><stop stopColor="#ffffff"/><stop offset="1" stopColor="#e5eee9"/></radialGradient>
   <radialGradient id={id+'shadow'}><stop stopColor="#253f43" stopOpacity=".22"/><stop offset="1" stopColor="#253f43" stopOpacity="0"/></radialGradient>
   <pattern id={id+'grid'} width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#527eab" strokeOpacity=".09"/></pattern>
   {projected.map(f=>{const color=marked?pastels[f.id-1]:faces[f.id-1].color;return <linearGradient key={f.key} id={id+'face'+f.key} x1="0" y1="0" x2="1" y2="1"><stop stopColor={tint(color,Math.min(1,f.shade+.14))}/><stop offset="1" stopColor={tint(color,f.shade*.89)}/></linearGradient>})}
  </defs>
  <rect width="420" height="350" fill={`url(#${id}back)`}/><rect width="420" height="350" fill={`url(#${id}grid)`}/>
  <ellipse cx="210" cy="294" rx="150" ry="20" fill={`url(#${id}shadow)`}/>
  {projected.map(face=>{
   const def=faces[face.id-1],p=face.points,u={x:p[1].x-p[0].x,y:p[1].y-p[0].y},v={x:p[3].x-p[0].x,y:p[3].y-p[0].y};
   const visibleArea=Math.abs(u.x*v.y-u.y*v.x),size=marked?.26:.22;
   const a=u.x*size,b=u.y*size,c=v.x*size,d=v.y*size,tx=p[0].x+(u.x+v.x)/2,ty=p[0].y+(u.y+v.y)/2;
   // Project onto the sheet, but orient numbers upright from the current camera.
   const flipV=d<0?-1:1,flipU=(a*d-b*c)*flipV<0?-1:1;
   return <g key={face.key} data-face-group={face.id} onClick={()=>{if(!moved.current)onFace?.(face.id)}}>
    <polygon data-face={face.id} data-light={face.shade.toFixed(3)} points={p.map(point=>`${point.x},${point.y}`).join(' ')} fill={`url(#${id}face${face.key})`} stroke={selected===face.id?'#fff7ad':'#304e55'} strokeWidth={selected===face.id?3:1.4} strokeLinejoin="round"/>
    <polygon points={p.map(point=>`${tx+(point.x-tx)*.94},${ty+(point.y-ty)*.94}`).join(' ')} fill="none" stroke="#ffffff" strokeOpacity=".27" strokeWidth="1" pointerEvents="none"/>
    {(onFace||marked)&&visibleArea>90&&<g transform={`matrix(${a*flipU} ${b*flipU} ${c*flipV} ${d*flipV} ${tx} ${ty})`} pointerEvents="none"><circle r=".7" fill="#ffffff" fillOpacity={marked?'.83':'.16'}/><text y=".32" textAnchor="middle" fill={marked?def.color:'#fff'} fontSize={marked?1.1:1} fontWeight="800">{marked?def.mark:face.id}</text></g>}
   </g>;
  })}
  {onRotate&&<g pointerEvents="none"><rect x="107" y="311" width="206" height="27" rx="13" fill="#ffffff" fillOpacity=".9"/><text x="210" y="329" textAnchor="middle" fill="#426568" fontSize="12">拖动画面转动 · 方向键也能转</text></g>}
 </svg>;
}
