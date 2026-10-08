import type {WidgetState} from '../types';
import {initialTextbookState,measureTextbook,validateTextbookState,type TextbookModel,type TextbookState} from '../../../shared/textbook-models.mjs';
export function useTextbook(model:TextbookModel,sceneId:string,value:WidgetState,onChange:(s:WidgetState)=>void){
 const history=value.stateKind==='textbook'?value.actions??[]:[],raw=value.stateKind==='textbook'&&value.sceneId===sceneId?value:{};
 const {stateKind,modelStateVersion,sceneId:unused,actions,textbookVersion,...saved}=raw as WidgetState;
 const state={...initialTextbookState(model),...saved} as TextbookState;
 const tag=(s:TextbookState,records=history):WidgetState=>({...s,stateKind:'textbook',textbookVersion:1,modelStateVersion:model.version,sceneId,actions:records});
 const act=(action:string,patch:TextbookState,valid=true)=>{const next={...state,...patch,error:patch.error??'',checked:patch.checked??false};validateTextbookState(model,next);onChange(tag(next,[...history.slice(-29),{action,before:JSON.stringify(state),after:JSON.stringify(next),valid,at:new Date().toISOString()}]))};
 const undo=()=>{const previous=history.at(-1);if(previous?.before)onChange(tag(JSON.parse(previous.before),history.slice(0,-1)))};
 const toolbar=<footer className="textbook-toolbar"><button disabled={!history.length} onClick={undo}>撤销上次操作</button><button onClick={()=>onChange(tag(initialTextbookState(model),[]))}>重新开始</button><span>可以试错 · 操作不会直接记作掌握</span></footer>;
 return {state,act,toolbar,measured:measureTextbook(model,state)};
}
