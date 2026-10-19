import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {lessons} from '../content/pilot/source.mjs';
import {mixedSceneContext,coreSceneMission} from '../shared/scene-context.mjs';
import {expressionASTText,evaluateExpressionAST,formatFraction} from '../shared/pilot-math.mjs';
function coreExpression(model,c,mode){
 const expressions={
  'product-place':`${c[0]}×${c[1]}`,'share-place':`${c[0]}÷${c[1]}`,
  'estimate-product':`${c[0]}×${c[1]}，与预算${c[2]}比较`,
  'pack-remainder':`${c[0]}÷${c[1]}＝□……□`,'nested-groups':`${c[0]}×${c[1]}×${c[2]}`,
  'invariant-table':mode==='total'?`${c[0]}×${c[3]}÷${c[4]}`:`${c[1]}÷${c[0]}×${c[2]}`,
  'fraction-core':model.mode==='add'?`${c[1]}/${c[0]}＋${c[2]}/${c[0]}`:`${c[0]}÷${c[1]}×${c[2]}`,
 };
 return expressions[model.type];
}
export function buildSceneMatrix(){
 const rows=[];
 for(const l of lessons){
  if(l.mathScenes?.length){for(const scene of l.mathScenes){const context=mixedSceneContext(l.mathScenes,scene.sceneId);const result=formatFraction(evaluateExpressionAST(scene.expressionAST));if(result!==String(scene.expected.value))throw Error('算式与场景答案不一致：'+scene.sceneId);
   rows.push({lessonId:l.lessonId,sceneId:scene.sceneId,label:context.label,mission:context.mission,question:scene.story.text,units:scene.story.quantities.map(q=>({value:q.value,unit:q.unit,role:q.role})),geometry:scene.model.type,expression:expressionASTText(scene.expressionAST),resultUnit:scene.expected.unit,explanation:scene.expected.explanation,review:'source-linked-math-checked; browser-coverage-separate'});
  }}else{const model=l.conceptScenes?.[0]?.textbookSpec;
   if(model?.cases){model.cases.forEach((c,i)=>{for(const mode of model.type==='invariant-table'?['price','total']:['default']){const context=model.contexts[i],total=mode==='total';rows.push({lessonId:l.lessonId,sceneId:l.conceptScenes[0].sceneId,case:i+1,mode,label:i===5?'换情境操作':`同类操作${i+1}`,mission:coreSceneMission(model,{choice:i,mode}),question:total?context.alternate:context.story,units:{unit:context.unit,group:context.group,outer:context.outer,inner:context.inner,quantity:context.quantity},geometry:model.type,parameters:c,expression:coreExpression(model,c,mode),explanation:'动作、算式与反馈共用本行参数；探索不是独立判分',review:'finite-reviewed-parameters; browser-coverage-separate'});}});
   }else rows.push({lessonId:l.lessonId,sceneId:l.lengthScenes?.[0]?.sceneId??l.conceptScenes?.[0]?.sceneId??l.lessonId,label:'原情境／可变对象',mission:l.childClassroom.mission,question:l.childClassroom.story,units:l.lengthScenes?.length?'毫米（模型内部），按题目换算':'见当前对象与正式语义台账',geometry:model?.type??l.widget,expression:l.childClassroom.symbols,explanation:l.childClassroom.whyQuestion,review:'single-object-source-scan; prior-evidence-retained'});
  }
 }
 return {schemaVersion:1,scope:'70课逐场景源扫描，不冒充逐张视觉验收或Kevin掌握',lessonCount:new Set(rows.map(r=>r.lessonId)).size,rows};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const path=new URL('../docs/review/三年级逐场景语义一致性矩阵_20261019.json',import.meta.url),text=JSON.stringify(buildSceneMatrix(),null,2)+'\n';
 if(process.argv.includes('--check')){if(await readFile(path,'utf8')!==text)throw Error('逐场景矩阵已过期');}else await writeFile(path,text);
 console.log('逐场景矩阵：'+buildSceneMatrix().lessonCount+'课，'+buildSceneMatrix().rows.length+'行情境；仅源扫描与数学核算。');
}
