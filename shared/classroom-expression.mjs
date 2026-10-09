import {initialCoreState,validateCoreState} from './core-models.mjs';
import {expressionASTText} from './pilot-math.mjs';
import {boundedInteger} from './length-model.mjs';

// Conditions and blank templates only. Never use measured answers or task solutions.
export function currentClassroomExperiment(lesson,state={}){
 const active=state.actions?.length||state.sceneId||state.labVersion||state.handsOnVersion||state.stateKind;
 if(!active)return null;
 const math=lesson.mathScenes?.find(s=>s.sceneId===state.sceneId)??lesson.mathScenes?.[0];
 if(math)return {conditions:math.story.quantities.map(q=>`${q.role}：${q.value}${q.unit}`),template:`${expressionASTText(math.expressionAST)}＝□`,relation:'算式中的数来自这一组珠子、物品或变化；结果由你来求。'};
 const concept=lesson.conceptScenes?.find(s=>s.sceneId===state.sceneId)??lesson.conceptScenes?.[0],model=concept?.textbookSpec;
 if(model?.cases){
  const choice=Number.isInteger(state.choice)?state.choice:0;
  if(choice<0||choice>=model.cases.length)return null;
  const normalized=initialCoreState(model,choice);
  for(const key of [...Object.keys(normalized),'error','checked'])if(state[key]!==undefined)normalized[key]=state[key];
  try{validateCoreState(model,normalized);}catch{return null;}
  const c=model.cases[choice],ctx=model.contexts[choice];
  let template;
  if(model.type==='product-place')template=`${c[0]}×${c[1]}＝□（${ctx.unit}）`;
  else if(model.type==='share-place')template=`${c[0]}÷${c[1]}＝□（${ctx.unit}/${ctx.group}）`;
  else if(model.type==='pack-remainder')template=`${c[0]}÷${c[1]}＝□ 余 □`;
  else if(model.type==='nested-groups')template=`${c[0]}×${c[1]}×${c[2]}＝□（${ctx.unit}）`;
  else if(model.type==='estimate-product')template=`${c[0]}×${c[1]} 与预算 ${c[2]} 比较：先选可靠的估计界限`;
  else if(model.type==='invariant-table')template='先求不变的单价或总量：□；再求新条件下的结果：□';
  else if(model.type==='fraction-core')template=model.mode==='add'?`${c[1]}/${c[0]}＋${c[2]}/${c[0]}＝□；剩下：1−□＝□`:`${c[0]}÷${c[1]}×${c[2]}＝□（${ctx.unit}）`;
  if(template)return {conditions:[ctx.story],template,relation:model.type==='fraction-core'?'先说清这个整体和每一份；换了整体，就重新确定实际数量。':'换计数单位或分配材料不改变原总量；每个数都要指回当前条件。'};
 }
 const length=lesson.lengthScenes?.find(s=>s.sceneId===state.sceneId)??lesson.lengthScenes?.[0];
 if(length?.mode==='boards'){
  const [a,b]=length.pieceLengthsMm,max=Math.min(a,b,120)-Math.min(a,b,120)%10;
  const overlap=boundedInteger(state.overlap,length.overlapsMm?.[0]??80,0,max);
  return {conditions:[`甲板${a}毫米，乙板${b}毫米，当前搭接${overlap}毫米`],template:`${a}＋${b}−${overlap}＝□（毫米）`,relation:'一段搭接在两块材料中出现两次，端到端只保留一次。'};
 }
 if(length?.mode==='chain'){
  const target=boundedInteger(state.target,length.count??4,2,5),count=boundedInteger(state.placed,1,1,target),outer=length.pieceLengthsMm?.[0]??40,t=length.thicknessMm??5;
  return {conditions:[`现在已扣${count}个环（计划${target}个）；每环外长${outer}毫米、厚${t}毫米`],template:`${outer}＋(${outer}−${t}−${t})×(${count}−1)＝□（毫米）`,relation:'写的是当前已扣的环，不是尚未添齐的目标环数；每次添环增加一处接头。'};
 }
 if(concept?.handsOnSpec?.mode==='boat')return {conditions:[state.waterlineMarked?'已标原水线':'尚未标原水线',state.passenger?'当前额外乘员在船上':'当前没有额外乘员'],template:state.passenger?'同船同水线时：象的质量＝石块总质量＋乘员质量':'同船同水线时：象的质量＝石块总质量',relation:'先核对船、水、水线以及额外载荷；不恢复同一水线，不能使用等量替换。'};
 // Unsupported models deliberately get no invented expression or result.
 return null;
}
