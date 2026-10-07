import {operationModels,measureOperationModel} from './operation-models.mjs';
import {handsOnModels,scaleMass,balanceState,boatState} from './hands-on-models.mjs';

const strings=new Set(['stateKind','action','mode','sceneId','modelStateVersion','modelType','prediction','intermediate','error','explanation','guess','massUnit']);
const numbers=new Set(['extensionVersion','conceptVersion','labVersion','parameter','reverseStep','step','top','bottom','left','right','rows','parts','take','whole','walk','startMm','overlap','spacing','joint','target','placed','handsOnVersion','cameraAzimuth','cameraElevation','rearHeight','foldProgress','faceId','otherFaceId','weighingStone','chapterScreen']);
const booleans=new Set(['spread','show','checked','showReason','observed','transposed','compared','closed','zoom','broken','elephant','passenger','waterlineMarked','predicted','parentMode']);
const arrays=new Set(['filled','sent','marked','opened','inspected','photos','scaleItems','weights','boatStones','weighed']);
const handsActions={observe:['rotate-camera','change-view','take-photo'],hidden:['rotate-camera','change-view','remove-cube','add-cube','predict-view','compare-view'],fold:['rotate-camera','change-view','select-face','fold-paper','select-other-face','predict-relation','check-faces'],weigh:['change-scale-mode','place-on-scale','remove-from-scale','change-mass-unit','place-weight','remove-weight'],boat:['board-elephant','remove-elephant','load-stone','remove-stone','mark-waterline','toggle-passenger','select-stone','weigh-stone','check-replacement']};
const actions={
  'split-array':['move-cut','compare-prediction'],laws:['move-cut','swap-count-direction','compare-prediction'],
  wallet:['choose-net-payment','execute-wallet'],'division-groups':['choose-total-people','share-cards'],
  reverse:['reverse-divide','reverse-subtract','reverse-attempt'],substitution:['select-whole','select-part','substitute']
};
const choices={wallet:['subtract','add'],'division-groups':['multiply','divide'],substitution:['whole','partial']};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const assert=ok=>{if(!ok)throw Error('实验状态不符合本课模型，请重置实验后重试。')};
function modelState(state,model){
  if(state.parameter!==undefined){assert(['split-array','laws'].includes(model.type));measureOperationModel(model,{cut:state.parameter});}
  if(state.choice!==undefined)assert(choices[model.type]?.includes(state.choice));
  if(state.reverseStep!==undefined)assert(model.type==='reverse'&&Number.isInteger(state.reverseStep)&&state.reverseStep>=0&&state.reverseStep<=2);
}
// Old untagged states remain importable. New states have model-specific constraints;
// neither legacy nor new widgets can carry arbitrary objects or nonfinite numbers.
export function validateWidgetState(state,lessonId,lesson){
  assert(object(state)&&Object.keys(state).length<=60);
  for(const [key,value] of Object.entries(state)){
    if(strings.has(key))assert(typeof value==='string'&&value.length<=1200);
    else if(numbers.has(key))assert(Number.isFinite(value)&&Math.abs(value)<=1e9);
    else if(booleans.has(key))assert(typeof value==='boolean');
    else if(arrays.has(key))assert(Array.isArray(value)&&value.length<=120&&value.every(v=>Number.isSafeInteger(v)&&v>=0&&v<=10000));
    else if(key==='choice')assert((typeof value==='string'&&value.length<=120)||Number.isSafeInteger(value));
    else if(key==='actions')assert(Array.isArray(value)&&value.length<=30&&value.every(a=>object(a)&&Object.keys(a).every(k=>['action','before','after','valid','at'].includes(k))&&typeof a.action==='string'&&a.action.length<=80&&[a.before,a.after].every(v=>v===null||(typeof v==='string'&&v.length<=1200))&&(a.valid===undefined||typeof a.valid==='boolean')&&(a.at===undefined||typeof a.at==='string'&&Number.isFinite(Date.parse(a.at)))));
    else assert(false);
  }
  if(state.chapterScreen!==undefined)assert(Number.isInteger(state.chapterScreen)&&state.chapterScreen>=0&&state.chapterScreen<=5);
  if(state.stateKind!==undefined)assert(['legacy','operation-extension','mixed-operations','hands-on'].includes(state.stateKind));
  if(state.stateKind==='hands-on'||state.handsOnVersion!==undefined){
    const model=handsOnModels[lessonId];assert(model&&state.stateKind==='hands-on'&&state.handsOnVersion===2&&state.sceneId===`${lessonId}-MODEL1`&&state.modelStateVersion===model.version);
    const bound=(key,min,max,integer=false)=>{if(state[key]!==undefined)assert(Number.isFinite(state[key])&&state[key]>=min&&state[key]<=max&&(!integer||Number.isInteger(state[key])))};
    if(model.type==='spatial'){
      bound('cameraAzimuth',0,360);bound('cameraElevation',-35,90);
      if(state.rearHeight!==undefined){assert(model.mode==='hidden');bound('rearHeight',0,2,true)}
      if(state.foldProgress!==undefined){assert(model.mode==='fold');bound('foldProgress',0,100)}
      for(const key of ['faceId','otherFaceId'])if(state[key]!==undefined){assert(model.mode==='fold');bound(key,1,6,true)}
      if(state.photos!==undefined)assert(model.mode==='observe'&&state.photos.length<=6&&state.photos.every(v=>v<=2));
      assert(['scaleItems','weights','boatStones','weighed','elephant','passenger','massUnit'].every(key=>state[key]===undefined));
    }else if(model.mode==='weigh'){
      assert(state.mode===undefined||['scale','container','balance'].includes(state.mode));assert(state.massUnit===undefined||['g','kg'].includes(state.massUnit));
      scaleMass(state.scaleItems??[],state.mode??'scale');balanceState(state.weights??[]);
      assert(['boatStones','weighed','elephant','passenger','waterlineMarked','foldProgress','rearHeight'].every(key=>state[key]===undefined));
    }else{
      boatState(model,state);bound('weighingStone',0,5,true);
      if(state.weighed!==undefined)assert(state.weighed.length<=6&&new Set(state.weighed).size===state.weighed.length&&state.weighed.every(v=>v<=5));
      assert(['scaleItems','weights','mode','massUnit','foldProgress','rearHeight'].every(key=>state[key]===undefined));
    }
    for(const action of state.actions??[]){
      assert(handsActions[model.mode].includes(action.action));
      for(const snapshot of [action.before,action.after])if(snapshot!==null){
        let decoded;try{decoded=JSON.parse(snapshot)}catch{assert(false)}
        assert(object(decoded)&&decoded.actions===undefined);
        validateWidgetState({...decoded,stateKind:'hands-on',handsOnVersion:2,sceneId:`${lessonId}-MODEL1`,modelStateVersion:model.version},lessonId,lesson);
      }
    }
  }
  if(state.stateKind==='operation-extension'||state.extensionVersion!==undefined){
    const model=operationModels[lessonId];assert(model&&state.extensionVersion===1&&state.modelType===model.type);modelState(state,model);
    for(const action of state.actions??[])assert(actions[model.type].includes(action.action));
  }
  if(state.stateKind==='mixed-operations'){
    assert(typeof state.sceneId==='string'&&typeof state.modelStateVersion==='string'&&Number.isInteger(state.step)&&state.step>=0&&state.step<=32);
    if(lesson)assert(lesson.mathScenes?.some(scene=>scene.sceneId===state.sceneId));
    for(const action of state.actions??[])assert(action.action==='evaluate-operation');
  }
  return state;
}
