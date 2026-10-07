import type {WidgetFields,WidgetState} from '../types';
import type {HandsOnModel} from '../../../shared/hands-on-models.mjs';

export function useHandsOn(model:HandsOnModel,sceneId:string,value:WidgetState,onChange:(s:WidgetState)=>void){
 const state:WidgetFields=value.stateKind==='hands-on'&&value.sceneId===sceneId?value:{};
 const tagged=(s:WidgetFields):WidgetState=>({...s,stateKind:'hands-on',handsOnVersion:2,sceneId,modelStateVersion:model.version});
 const snapshot=(s:WidgetFields)=>{const {actions,...rest}=s;return JSON.stringify(rest)};
 const update=(patch:WidgetFields)=>onChange(tagged({...state,...patch}));
 const act=(action:string,patch:WidgetFields,valid=true)=>{
  const next={...state,...patch,error:patch.error??''};
  onChange(tagged({...next,actions:[...(state.actions??[]).slice(-29),{action,before:snapshot(state),after:snapshot(next),valid,at:new Date().toISOString()}]}));
 };
 const undo=()=>{const history=state.actions??[],last=history.at(-1);if(!last?.before)return;try{const restored=JSON.parse(last.before);onChange(tagged({...restored,actions:history.slice(0,-1)}))}catch{onChange(tagged({}))}};
 const reset=()=>onChange(tagged({}));
 const toolbar=<div className="hands-toolbar"><button disabled={!state.actions?.length} onClick={undo}>撤销上次操作</button><button onClick={reset}>重新开始</button><span>操作会保存 · 探索不等于掌握</span></div>;
 return {state,update,act,toolbar};
}
