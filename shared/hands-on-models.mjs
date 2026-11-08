// Explicitly authored objects. No numbers are extracted from lesson prose.
export const handsOnModels={
 'G3-U01-B01':{type:'spatial',mode:'observe',version:'spatial.v2',dimensions:[2.4,1.5,1.2],requiredEvidence:['object','observer','direction','projection']},
 'G3-U01-B02':{type:'spatial',mode:'hidden',version:'spatial.v2',frontHeight:2,maxRearHeight:2,requiredEvidence:['object','observer','direction','projection','hidden-cubes']},
 'G3-U01-B03':{type:'spatial',mode:'fold',version:'spatial.v2',net:'cross-tail',requiredEvidence:['object','face-identity','hinge','fold-progress','opposite-faces']},
 'G3-UP01-B01':{type:'mass',mode:'weigh',version:'mass.v2',requiredEvidence:['scale','unit','container','balance']},
 'G3-UP01-B02':{type:'mass',mode:'boat',version:'mass.v2',elephantMass:900,boatMass:400,passengerMass:150,requiredEvidence:['boat','water','waterline','elephant','replacement','same-waterline','stone-scale']}
};
export const scaleObjects=[{id:0,name:'回形针',mass:1},{id:1,name:'苹果',mass:150},{id:2,name:'米袋',mass:1000},{id:3,name:'书',mass:400}];
export const containerObjects=[{id:0,name:'空杯',mass:120},{id:1,name:'单独的水',mass:260},{id:2,name:'杯和水',mass:380}];
export const balanceWeights=[100,200,500];
export const stones=[100,200,250,300,400,500].map((mass,id)=>({id,mass,name:`石块${id+1}`}));
export const faces=[{id:1,name:'上面',color:'#e9b44d',mark:'★'},{id:2,name:'左面',color:'#9477b6',mark:'●'},{id:3,name:'前面',color:'#df6c4f',mark:'●'},{id:4,name:'右面',color:'#527eab',mark:'◆'},{id:5,name:'下面',color:'#469684',mark:'●'},{id:6,name:'后面',color:'#b18b66',mark:'▲'}];
const rad=d=>d*Math.PI/180;
export function projectPoint([x,y,z],azimuth=25,elevation=20){
 const a=rad(azimuth),e=rad(elevation);
 return {x:x*Math.cos(a)+z*Math.sin(a),y:x*Math.sin(a)*Math.sin(e)+y*Math.cos(e)-z*Math.cos(a)*Math.sin(e),depth:x*Math.sin(a)*Math.cos(e)-y*Math.sin(e)-z*Math.cos(a)*Math.cos(e)};
}
export function boxFaces(width=1,height=1,depth=1,origin=[0,0,0]){
 const [x,y,z]=origin,a=x-width/2,b=x+width/2,c=y-height/2,d=y+height/2,f=z-depth/2,g=z+depth/2;
 return [
  {id:1,points:[[a,c,f],[b,c,f],[b,c,g],[a,c,g]]},
  {id:2,points:[[a,c,g],[a,c,f],[a,d,f],[a,d,g]]},
  {id:3,points:[[a,c,f],[b,c,f],[b,d,f],[a,d,f]]},
  {id:4,points:[[b,c,f],[b,c,g],[b,d,g],[b,d,f]]},
  {id:5,points:[[a,d,f],[b,d,f],[b,d,g],[a,d,g]]},
  {id:6,points:[[b,c,g],[a,c,g],[a,d,g],[b,d,g]]}
 ];
}
// A continuous hinge transform, not a cross-fade between a net and a cube.
// 3 is the fixed front; 6 folds around the outer edge of 5.
export function foldedFaces(progress){
 if(!Number.isFinite(progress)||progress<0||progress>100)throw Error('折叠程度应在0到100之间');
 const t=progress*Math.PI/200,c=Math.cos(t),s=Math.sin(t),c2=Math.cos(2*t),s2=Math.sin(2*t);
 return [
  {id:3,points:[[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]]},
  {id:1,points:[[-.5,-.5,0],[.5,-.5,0],[.5,-.5-c,s],[-.5,-.5-c,s]]},
  {id:2,points:[[-.5,-.5,0],[-.5,.5,0],[-.5-c,.5,s],[-.5-c,-.5,s]]},
  {id:4,points:[[.5,-.5,0],[.5+c,-.5,s],[.5+c,.5,s],[.5,.5,0]]},
  {id:5,points:[[-.5,.5,0],[.5,.5,0],[.5,.5+c,s],[-.5,.5+c,s]]},
  {id:6,points:[[-.5,.5+c,s],[.5,.5+c,s],[.5,.5+c+c2,s+s2],[-.5,.5+c+c2,s+s2]]}
 ];
}
export function faceRelation(a,b){if(a===b)return 'same';return [[1,5],[2,4],[3,6]].some(pair=>pair.includes(a)&&pair.includes(b))?'opposite':'adjacent'}
export function hiddenCubes(rearHeight){
 if(!Number.isInteger(rearHeight)||rearHeight<0||rearHeight>2)throw Error('后排高度越界');
 return [{x:0,y:0,z:0},{x:0,y:1,z:0},...Array.from({length:rearHeight},(_,y)=>({x:0,y,z:1}))];
}
export function cubeProjection(rearHeight,view){
 const cubes=hiddenCubes(rearHeight);
 if(!['front','right','top'].includes(view))throw Error('观察方向无效');
 return [...new Set(cubes.map(({x,y,z})=>view==='front'?`${x},${y}`:view==='right'?`${z},${y}`:`${x},${z}`))].sort();
}
export function scaleMass(ids,mode='scale'){
 const objects=mode==='container'?containerObjects:scaleObjects;
 if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!objects.some(o=>o.id===id)))throw Error('称量物体无效');
 if(mode==='container'&&ids.includes(2)&&ids.length>1)throw Error('同一杯水不能和拆开的杯、水重复称量');
 return ids.reduce((sum,id)=>sum+objects[id].mass,0);
}
export function balanceState(ids,objectMass=400){
 if(!Array.isArray(ids)||ids.length>12||ids.some(id=>!Number.isInteger(id)||id<0||id>=balanceWeights.length))throw Error('砝码无效');
 const rightMass=ids.reduce((sum,id)=>sum+balanceWeights[id],0),difference=objectMass-rightMass;
 return {leftMass:objectMass,rightMass,difference,angle:difference===0?0:Math.max(-16,Math.min(16,-difference/25)),balanced:difference===0};
}
export function boatState(model,state={}){
 const ids=state.boatStones??[];
 if(new Set(ids).size!==ids.length||ids.some(id=>!stones.some(s=>s.id===id)))throw Error('石块无效');
 const stoneMass=ids.reduce((sum,id)=>sum+stones[id].mass,0),load=stoneMass+(state.elephant?model.elephantMass:0)+(state.passenger?model.passengerMass:0);
 // Constant-section model vessel: equal waterline iff equal TOTAL load.
 return {stoneMass,load,sink:load/50,targetSink:model.elephantMass/50,sameWaterline:load===model.elephantMass,replacementValid:load===model.elephantMass&&!state.elephant&&!state.passenger,boatMass:model.boatMass};
}
