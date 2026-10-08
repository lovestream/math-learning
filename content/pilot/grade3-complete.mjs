import {textbookModels} from '../../shared/textbook-models.mjs';
import fs from 'node:fs';
import {handsOnModels} from '../../shared/hands-on-models.mjs';
import {handsOnTeaching,handsOnResponses,handsOnSelfChecks} from './hands-on-teaching.mjs';
import {operationResponses} from './operation-responses.mjs';
import {operationModels} from '../../shared/operation-models.mjs';
import {parseLinear} from '../../shared/pilot-math.mjs';

const plan=JSON.parse(fs.readFileSync(new URL('../course-plan-v2/grade-3.json',import.meta.url),'utf8'));
const block=(blockId,type,title,extra={})=>({blockId,type,title,...extra});
const compact=text=>String(text).replace(/[。；，].*$/,'').slice(0,24)||'观察模型变化';
const family=id=>id.startsWith('G3-U01')?'spatial':id.startsWith('G3-U02')?'operations':id.startsWith('G3-U03')?'operations':id.startsWith('G3-UP01')?'mass':id.startsWith('G3-U04')?'placeValue':id.startsWith('G3-UP02')?'coding':id.startsWith('G3-U05')?'angles':id.startsWith('G3-U06')?'fractions':id.startsWith('G3-U07')?'planning':id.startsWith('G3-L01')?'transform':id.startsWith('G3-L02')?'division':id.startsWith('G3-L03')?'boundary':id.startsWith('G3-L04')?'areaGrid':id.startsWith('G3-L05')?'data':id.startsWith('G3-LP01')?'time':id.startsWith('G3-L06')?'decimals':'sets';
const strand=id=>id.startsWith('G3-U01')||id.startsWith('G3-U03')||id.startsWith('G3-U05')||id.startsWith('G3-L01')||id.startsWith('G3-L03')||id.startsWith('G3-L04')?'geometry':id.startsWith('G3-U06')?'fractions':id.startsWith('G3-UP02')||id.startsWith('G3-U07')||id.startsWith('G3-L05')||id.startsWith('G3-L07')?'logic':id.startsWith('G3-LP01')?'patterns':'numbers';
const colors={spatial:'#4d7698',operations:'#a75a43',mass:'#92723f',placeValue:'#3e7776',coding:'#5e6d9b',angles:'#536e9a',fractions:'#3e8477',planning:'#9b6a35',transform:'#7d639a',division:'#397b83',boundary:'#4d7f69',areaGrid:'#4b7891',data:'#8a6a43',time:'#695f9b',decimals:'#367d79',sets:'#9b5e4b'};
const skills={spatial:['F02','F27'],operations:['F05','F07','F27'],mass:['F03','F08'],placeValue:['F03','F05','F27'],coding:['F01','F27'],angles:['F02','F15'],fractions:['F03','F07'],planning:['F14','F27'],transform:['F02','F15'],division:['F03','F05','F27'],boundary:['F02','F15'],areaGrid:['F02','F03','F15'],data:['F14','F27'],time:['F11','F15'],decimals:['F03','F07'],sets:['F05','F15','F27']};
const track=lesson=>lesson.tier==='E'?'enhancement':lesson.tier==='O'?'olympiad':'foundation';
const simpleNumber=/^\s*([+-]?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)\s*([\u4e00-\u9fff²³a-zA-Z]*)[。.]?\s*$/;
const numericUnits=new Set(['','个','本','朵','袋','盒','段','元','角','分','页','毫米','厘米','分米','米','千米','克','千克','块','颗','张','支','人','组','排','大格','种','条','辆','平方厘米','平方分米','平方米','票','个月','天','次','时','小时','分钟','秒']);
const inline=text=>String(text).trim().replace(/[。！？；，]+$/,'');
const diagnosticTail={
  spatial:'再指出物体哪里没动、观察者站在哪里、正对哪个面。',operations:'圈出括号并标出第一步；每次只替换刚算完的部分。',mass:'写出每个量的单位，统一单位后再比较。',placeValue:'把数拆成几个百、几个十、几个一，再检查合并。',coding:'逐段说出编码规则，并检查是否会重号。',angles:'用端点、直角、边或对应位置说明，不能只说“看起来像”。',fractions:'先圈出整体，再检查是否平均分，最后解释分子和分母。',planning:'先写每个数量的意思，再说明为什么选择这个步骤。',transform:'找出至少一组对应点，说明它们移动前后的位置关系。',division:'说清平均分或包含关系，并用乘法和余数条件验算。',boundary:'先用手指描外边一圈，再判断题目问周长还是面积。',areaGrid:'先确认单位方格，再用每行个数和行数解释面积。',data:'核对调查对象、记录总数和问题，再从表中找证据。',time:'在时间轴上标出起点、终点和经过的每一段。',decimals:'对齐相同单位或相同数位，再解释小数点两边各位。',sets:'分别标出只属于左边、两边共有、只属于右边的部分。'
};

function task(practice,lesson,fam,setName){
  const rawMatch=String(practice.answer).match(simpleNumber),match=rawMatch&&numericUnits.has(rawMatch[2]||'')?rawMatch:null,base={id:practice.id,level:setName,objectiveId:lesson.objectives[0].id,prompt:practice.question,solution:`${practice.answer}${practice.reason?`。${practice.reason}`:''}`.replace(/。。/g,'。'),hint:practice.hints?.[0]?.text??`先回到“${inline(lesson.model)}”，把题目里的对象逐一对应。`,diagnostic:`${lesson.misconception?.correction??lesson.why} ${diagnosticTail[fam]??diagnosticTail.planning}`,diagram:{type:'concept',family:fam,variant:`${lesson.id}:task-static`,values:[],labels:[practice.question,lesson.title],caption:'这是一张关系整理卡。它不抓取题干数字、不生成计算结果；请你自己圈出对象、单位和变化。'}};
  if(handsOnModels[lesson.id])base.diagram=undefined;
  if(handsOnResponses[practice.id])return {...base,...handsOnResponses[practice.id],selfCheckItems:handsOnSelfChecks[practice.id]};
  if(operationResponses[practice.id])return {...base,...operationResponses[practice.id]};
  if(match)return {...base,kind:'number',selfCheckItems:handsOnSelfChecks[practice.id],responseSpec:{type:'number'},expected:match[1],unit:match[2]||undefined};
  // A prose answer is not evidence that a meaningful multiple-choice item exists.
  // Preserve the original response demand and ask a parent to assess the explanation.
  return {...base,kind:'explanation',responseSpec:{type:'self-explanation',rubric:['回答题目所问的结论','写出算式、图示关系或关键一步','说明这一步为什么符合题目条件']},editorialStatus:'parent-assessment'};
}

function makeSets(lesson,fam){
  const p=lesson.practice;
  return {
    warmup:[task(p[0],lesson,fam,'warmup'),task(p[1],lesson,fam,'warmup')],
    core:[task(p[2],lesson,fam,'core'),task(p[3],lesson,fam,'core'),task(p[6],lesson,fam,'core')],
    transfer:[task(p[4],lesson,fam,'transfer'),task(p[7],lesson,fam,'transfer')],
    challenge:[task(p[5],lesson,fam,'challenge')],
    review:p.slice(8,12).map(x=>task(x,lesson,fam,'review'))
  };
}

function checkpoint(lesson,fam){
  const source=lesson.practice[0];
  return {prompt:source.question,responseSpec:{type:'self-explanation'},referenceAnswer:`${source.answer} ${source.reason??''}`};
}

function workedStep(text){
  const why=String(text).trim(),equation=(why.match(/[0-9甲乙橘梨xX□?＋+－−×÷*/.（）()＝=\s]+/g)??[]).map(part=>part.trim()).filter(part=>{
    if(!/[＝=]/.test(part))return false;
    try{return part.replaceAll('＝','=').split('=').every(side=>{parseLinear(side);return true})}catch{return false}
  }).join('；');
  if(!equation)return {math:why,why};
  const [expressionBefore,expressionAfter]=equation.replaceAll('＝','=').split('=');
  return {math:equation,why,expressionBefore:expressionBefore?.trim(),operation:'=',expressionAfter:expressionAfter?.trim()};
}

function compile(lesson){
  const authored=handsOnTeaching[lesson.id];
  if(authored)lesson={...lesson,realProblem:authored.story,model:authored.modelText,explanation:authored.discovery};
  const fam=family(lesson.id),interaction=authored?{...lesson.interaction,initialState:authored.modelText,learnerAction:authored.mission,observableChange:authored.discovery.join(' '),question:authored.predictQuestion,expectedExplanation:authored.discovery.join(' ')}:lesson.interaction,cp=checkpoint(lesson,fam),guidance=lesson.explanation.map(explanation=>({label:compact(explanation),explanation}));
  const scene={sceneId:`${lesson.id}-MODEL1`,family:fam,variant:lesson.id,title:compact(lesson.title),prompt:lesson.objective,initialState:interaction.initialState,learnerAction:interaction.learnerAction,observableChange:interaction.observableChange,question:interaction.question,expectedExplanation:interaction.expectedExplanation,wrongActionFeedback:interaction.wrongActionFeedback,guidance,values:[],labels:[lesson.title,lesson.model],modelSpec:operationModels[lesson.id],handsOnSpec:handsOnModels[lesson.id],textbookSpec:textbookModels[lesson.id],modelStatus:operationModels[lesson.id]||handsOnModels[lesson.id]||textbookModels[lesson.id]?'registered':'static-review'};
  const exampleSteps=[...(lesson.example.steps??[]).map(workedStep),{math:`结论：${lesson.example.answer}`,why:'把答案放回真实问题，检查单位、条件和结果是否对应。'}];
  return {childClassroom:handsOnTeaching[lesson.id],contentSource:'grade3-complete',editorialStatus:'review-required',contentVersion:'2026-10-02.1',editorialRevision:'2026-10-02.1',lessonId:lesson.id,exampleId:`FULL-${lesson.id}`,title:lesson.title,shortTitle:lesson.title.length>15?`${lesson.title.slice(0,15)}…`:lesson.title,question:lesson.realProblem,subtitle:lesson.why,grade:[3],strand:strand(lesson.id),track:track(lesson),parentUnitId:lesson.unitId,coverageIds:[lesson.id],coveredSubitemIds:[],thinkingSkills:skills[fam],recommendedPrerequisites:lesson.prerequisites??[],relatedLessonIds:plan.lessons.filter(other=>other.unitId===lesson.unitId&&other.id!==lesson.id).map(other=>other.id),representation:['real-problem','interactive-model','symbol-language','self-explanation'],estimatedActiveMinutes:lesson.minutes??30,color:colors[fam],widget:'conceptLab',prerequisiteNote:'可以直接进入；不熟悉的地方先在实验台上操作，再决定是否回补前面的课。',objectives:[{id:lesson.objectives[0].id,action:lesson.objectives[0].description,scope:lesson.objective}],conceptScenes:[scene],retellPrompt:handsOnTeaching[lesson.id]?.retell??lesson.retell,articleBlocks:[
    block('start','leadQuestion','把问题放进一个真实故事',{paragraphs:[lesson.realProblem,lesson.why]}),
    block('try','manipulative','先想一想，再用模型核对关系',{widget:'conceptLab',text:lesson.model}),
    block('meaning','text','图里的每一部分分别代表什么',{paragraphs:[lesson.model,...lesson.explanation]}),
    block('examples','workedExample','跟着一个完整例子走一遍',{examples:[{title:lesson.example.question,steps:exampleSteps}]}),
    block('why','compareCases','为什么这种常见想法会出错',{cases:[{label:'守住题目中的关系',math:lesson.misconception?.correction??lesson.why,explanation:interaction.expectedExplanation,valid:true},{label:'只记表面规则',math:lesson.misconception?.wrong??'直接套一个算式',explanation:interaction.wrongActionFeedback,valid:false}]}),
    block('check','checkpoint','轮到 Kevin 自己判断',{...cp,revisit:'try'}),
    block('connections','methodBridge','把这次发现带到下一类问题',{text:lesson.next,methods:[{id:`${lesson.id}.method`,name:compact(lesson.objective),question:interaction.question,action:lesson.model,condition:lesson.why,counterexample:`注意：${lesson.misconception?.wrong??interaction.wrongActionFeedback}`}]}),
    block('practice','practice','撤掉模型，换一组新问题',{text:'练习不会照抄实验数字。先保存首答，再按本课的对象、单位和关系逐项自查。'})
  ],taskSets:makeSets(lesson,fam)};
}

export const grade3CompleteLessons=plan.lessons.map(compile);
export const grade3CompletePlan={lessonCount:plan.lessons.length,taskCount:plan.lessons.reduce((n,l)=>n+l.practice.length,0),lessonIds:plan.lessons.map(l=>l.id)};

export const grade3UnitMetadata=plan.units.map(({id,title,term,sourceId,printedPages,notes,sequence})=>({id,title,term,sourceId,printedPages,notes,sequence}));
