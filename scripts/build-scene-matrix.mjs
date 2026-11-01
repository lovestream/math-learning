import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {codingExploration} from '../content/pilot/coding-supplement.mjs';
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
  if(l.lessonId==='G3-UP02-B01'){
   const common={lessonId:l.lessonId,contentVersion:l.contentVersion,review:'versioned-coding-source-scan; browser-and-child-approval-separate'};
   const specifications=[
    ['shelf','书架地址',{fields:['架','层','格'],example:'02-03-05'},'字段缺失会不会指向多个位置？'],
    ['identity','身份号码片段',{parts:codingExploration.identity},'按6＋8＋3＋1定位；比较第17与第18位，不补出完整身份证号码'],
    ['postal','六位邮编',{parts:codingExploration.postal},'按2＋1＋1＋2解读邮政层次，与身份证地址码区分'],
    ['class','当前班级标签',codingExploration.classBounds,'保持班内序号，改变班级／年级，比较哪个字段改变'],
    ['stable','长期模拟校内编号',codingExploration.stableBounds,'同一入学年全校流水不得重复；升年级保持编号'],
    ['reasoning','综合辨错',{questions:codingExploration.quiz},'可以试错并重置；即时反馈不作为正式测评或独立掌握']
   ];
   for(const [key,label,parameters,mission]of specifications)rows.push({...common,sceneId:l.lessonId+'-CODING-'+key,label,mission,question:l.childClassroom.story,units:'字符位置与识别范围，不是长度／重量',geometry:'coding-'+key,parameters,expression:[],explanation:mission});
   continue;
  }
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
