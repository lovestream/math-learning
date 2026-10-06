import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {evaluateExpressionAST,formatFraction,validateTask,equivalent} from '../shared/pilot-math.mjs';
import {measureOperationModel} from '../shared/operation-models.mjs';
import {boardMeasure,chainMeasure,intervalMeasure,rulerReading,validateLengthScene} from '../shared/length-model.mjs';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const lessons=JSON.parse(fs.readFileSync(path.join(root,'content/pilot/lessons.json'),'utf8'));
const blueprint=JSON.parse(fs.readFileSync(path.join(root,'content/pilot/design-index.json'),'utf8'));
const reserved={warmup:2,core:5,transfer:2,challenge:1,review:2};
const allowedWidgets=new Set(['fraction','area','substitution','balance','quantity','addition','subtraction','mixedOperations','lengthWorkbench','conceptLab']);
const allowedConceptFamilies=new Set(['spatial','operations','mass','placeValue','coding','angles','fractions','planning','transform','division','boundary','areaGrid','data','time','decimals','sets']);
const allowedDiagrams=new Set(['readingCorner','joinedTiles','ribbon','unequalRibbon','groupedRibbon','snackBox','threeSnacks','candyEquality','picnicCount','countSpacing','appleAddition','appleTransfer','stickerTake','stickerCompare']);
const allowedBlocks=new Set(['leadQuestion','text','manipulative','workedExample','compareCases','checkpoint','practice','methodBridge']);
const fail=(message)=>{throw new Error(`样板内容检查失败：${message}`)};
const rollout=JSON.parse(fs.readFileSync(path.join(root,'content/rollout.json'),'utf8'));
for(const batch of rollout.batches.filter(b=>b.status!=='planned'))for(const id of batch.lessonIds)if(!lessons.some(l=>l.lessonId===id))fail(`${batch.id} 缺少 ${id}`);
const ids=new Set();
for(const lesson of lessons){
  if(ids.has(lesson.lessonId))fail(`课程 ID 重复：${lesson.lessonId}`);ids.add(lesson.lessonId);
  if(lesson.status!=='draft')fail(`${lesson.lessonId} 必须标为 draft`);
  if(!allowedWidgets.has(lesson.widget))fail(`${lesson.lessonId} 的互动组件未注册：${lesson.widget}`);
  for(const scene of lesson.mathScenes??[]){
    if(scene.lessonId!==lesson.lessonId||!scene.sceneId||!scene.story?.text||!scene.target?.prompt)fail(`${lesson.lessonId} 的数学场景缺少身份、故事或目标`);
    const quantityIds=scene.story.quantities?.map(q=>q.id)??[];if(quantityIds.length<2||new Set(quantityIds).size!==quantityIds.length||scene.story.quantities.some(q=>!q.unit||!q.role))fail(`${scene.sceneId} 的数量引用不完整或重复`);
    if(scene.model.quantityRefs.some(id=>!quantityIds.includes(id)))fail(`${scene.sceneId} 的模型引用了不存在的数量`);
    if(formatFraction(evaluateExpressionAST(scene.expressionAST))!==String(scene.expected.value))fail(`${scene.sceneId} 的算式AST与预期答案不一致`);
  }
  for(const scene of lesson.lengthScenes??[])try{validateLengthScene(scene)}catch(error){fail(error.message)}
  for(const scene of lesson.conceptScenes??[]){
    if(!scene.sceneId||!allowedConceptFamilies.has(scene.family)||!scene.title||!scene.prompt||!scene.initialState||!scene.learnerAction||!scene.observableChange||!scene.expectedExplanation)fail(`${lesson.lessonId} 的概念实验场景不完整`);
    if(scene.modelSpec)try{measureOperationModel(scene.modelSpec)}catch(error){fail(`${scene.sceneId}: ${error.message}`)}
    if(!Array.isArray(scene.steps)||scene.steps.length<3||scene.steps.some(step=>!step.label||!step.explanation))fail(`${scene.sceneId} 至少需要3个可解释的操作步骤`);
  }
  if(!Array.isArray(lesson.articleBlocks)||lesson.articleBlocks.length<8)fail(`${lesson.lessonId} 的讲解段少于8段`);
  for(const block of lesson.articleBlocks){
    for(const step of (block.examples??[]).flatMap(example=>example.steps))for(const equation of step.math.split('；')){
      if(!/^[\d＋+－−×÷*/.（）()＝=\s]+$/.test(equation)||!/[=＝]/.test(equation))continue;
      const sides=equation.replaceAll('＝','=').split('=');
      for(let i=1;i<sides.length;i++)if(!equivalent(sides[i-1],sides[i]))fail(`${lesson.lessonId} 例题等号不成立：${equation}`);
    }
    if(!allowedBlocks.has(block.type))fail(`${lesson.lessonId} 使用了未登记的讲解类型 ${block.type}`);
    if(block.diagram&&!allowedDiagrams.has(block.diagram))fail(`${lesson.lessonId} 缺少图解组件 ${block.diagram}`);
    if(block.type==='leadQuestion'&&((!block.diagram&&!lesson.mathScenes?.length&&!lesson.lengthScenes?.length&&!lesson.conceptScenes?.length)||!block.paragraphs?.length))fail(`${lesson.lessonId} 开场要同时有具体场景和图`);
    if(block.type==='checkpoint'&&block.responseSpec?.type!=='self-explanation'){
      if(!block.prompt||(!block.diagram&&!lesson.mathScenes?.length&&!lesson.lengthScenes?.length&&!lesson.conceptScenes?.length)||!block.options?.length)fail(`${lesson.lessonId} 课内核对缺少题干、图或选项`);
      if(block.options.filter(o=>o.correct).length!==1||block.options.some(o=>!o.reason))fail(`${lesson.lessonId} 每个选项都要有解释，且只有一个正确选项`);
      if(!lesson.articleBlocks.some(b=>b.blockId===block.revisit))fail(`${lesson.lessonId} 回看入口无效`);
    }
  }
  const required=lesson.contentSource==='grade3-complete'?{warmup:2,core:3,transfer:2,challenge:1,review:4}:reserved;
  for(const [set,count] of Object.entries(required)){const tasks=lesson.taskSets?.[set]??[];if(tasks.length<count)fail(`${lesson.lessonId}.${set} 只有${tasks.length}题，至少需要${count}题`);}
  const taskIds=new Set();
  for(const task of Object.values(lesson.taskSets).flat()){
    if(taskIds.has(task.id))fail(`${lesson.lessonId} 任务 ID 重复：${task.id}`);taskIds.add(task.id);
    if(!lesson.objectives.some(o=>o.id===task.objectiveId))fail(`${task.id} 的目标未定义`);
    if(!task.prompt||!task.solution||!task.hint)fail(`${task.id} 缺少题干、答案说明或提示`);
    if(task.diagram?.type==='measurement')try{
      const d=task.diagram;
      if(d.mode==='chain')chainMeasure(d.pieceLengthMm,d.thicknessMm,d.count);
      else if(d.mode==='boards')boardMeasure(d.pieceLengthsMm,d.overlapsMm);
      else if(d.mode==='ruler')rulerReading(d.startMm,d.endMm-d.startMm);
      else if(d.mode==='interval')intervalMeasure(d.lengthMm,d.spacingMm,Boolean(d.closed));
      else if(d.mode==='route'){
        const sections=d.sectionLengthsMm?.length?d.sectionLengthsMm:[d.lengthMm];
        if(sections.some(n=>!Number.isFinite(n)||n<=0))throw new Error('路线分段必须是正数');
        const total=d.lengthMm??sections.reduce((sum,n)=>sum+n,0);
        if(d.sectionLengthsMm?.length&&sections.reduce((sum,n)=>sum+n,0)!==total)throw new Error('路线分段之和与全程不一致');
        if(d.progressMm!==undefined&&(!Number.isFinite(d.progressMm)||d.progressMm<0||d.progressMm>total))throw new Error('已走路程超出全程');
      }else throw new Error('未注册的测量题图');
    }catch(error){fail(`${task.id} 的题图无效：${error.message}`)}
    if(!task.responseSpec)fail(`${task.id} 缺少显式响应规格`);
    if(task.kind==='choice'){
      if(!task.options?.some(o=>o.id===task.expected)||new Set(task.options.map(o=>o.text)).size!==task.options.length)fail(`${task.id} 选项或答案键不完整`);
      if(task.options.some(o=>/这样判断不对|按这种想法判断|正确值|错误写法/.test(o.text)))fail(`${task.id} 选项含答案提示标签`);
    }
    if(task.kind==='explanation'&&(task.responseSpec.type!=='self-explanation'||task.reasonEvidence))fail(`${task.id} 解释题不能冒充自动判分或理由奖励`);
    if(['number','expression'].includes(task.kind)&&validateTask(task,{value:task.expected}).status!=='correct')fail(`${task.id} 标准答案不能通过其响应检查`);
    if(task.diagram?.type==='concept'){
      if(!allowedConceptFamilies.has(task.diagram.family)||!task.diagram.variant||!Array.isArray(task.diagram.values)||task.diagram.values.some(n=>!Number.isFinite(n)))fail(`${task.id} 的概念题图无效`);
    }
  }
}
const report=`# 互动样板内容检查报告\n\n- 生成版本：${lessons[0]?.contentVersion??'unknown'}\n- 当前样板：${lessons.length} 节\n- 当前任务：${lessons.reduce((n,l)=>n+Object.values(l.taskSets).flat().length,0)} 道\n- 讲解段：每节至少 8 段，含真实问题、实验、例题、比较、小检查与方法桥\n- 全量蓝图：${blueprint.units.length} 个单元、${blueprint.counts.foundation} 个基础覆盖项、${blueprint.counts.olympiad} 个奥数覆盖项、${blueprint.counts.methods} 个思维方法\n\n结构校验和数学模型求值通过，不表示全体任务已逐题语义审计，也不表示Kevin已真实试学。\n`;
if(process.argv.includes('--report'))fs.writeFileSync(path.join(root,'docs/pilot-content-report.md'),report);
console.log(`样板内容通过：${lessons.length} 课，${lessons.reduce((n,l)=>n+Object.values(l.taskSets).flat().length,0)} 道任务；全量蓝图 ${blueprint.units.length} 单元仍标记为 planned。`);
