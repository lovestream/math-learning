import {projectPoint} from './hands-on-models.mjs';

const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// Orthographic construction, also used by the photographs. Lighting is visual,
// while every vertex, face identity and projected label comes from the solid.
export function composeSolid(solid,azimuth,elevation){
 const raw=solid.map((face,index)=>{
  const points=face.points.map(p=>projectPoint(p,azimuth,elevation));
  const normal=cross(subtract(face.points[1],face.points[0]),subtract(face.points[3],face.points[0]));
  const n=projectPoint(normal,azimuth,elevation),length=Math.hypot(n.x,n.y,n.depth);
  const light=Math.min(1,Math.abs((-n.x*.35-n.y*.65+n.depth*.68)/(length*Math.hypot(.35,.65,.68))));
  return {...face,key:index,points,depth:points.reduce((s,p)=>s+p.depth,0)/4,shade:.68+.32*light};
 });
 const all=raw.flatMap(f=>f.points),xs=all.map(p=>p.x),ys=all.map(p=>p.y);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(290/Math.max(maxX-minX,.4),245/Math.max(maxY-minY,.4),185);
 const ox=210-(minX+maxX)/2*scale,oy=160-(minY+maxY)/2*scale;
 return {scale,faces:raw.sort((a,b)=>a.depth-b.depth).map(f=>({...f,points:f.points.map(p=>({...p,x:ox+p.x*scale,y:oy+p.y*scale}))}))};
}
export function tint(hex,factor){
 return '#'+hex.slice(1).match(/../g).map(part=>Math.round(parseInt(part,16)*factor).toString(16).padStart(2,'0')).join('');
}
