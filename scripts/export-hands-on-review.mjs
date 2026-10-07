import fs from 'node:fs';
import {lessons} from '../content/pilot/source.mjs';

const lines=['# 第二代动手课堂：五课完整教案与练习审核稿','',
 '生成自当前运行编译源，2026-10-07。仅包含观察物体三课与质量／曹冲称象两课。答案供家长及外部审核使用，儿童独立练习界面不显示这些答案。','',
 '来源：教材目录和原教案框架来自 `content/course-plan-v2/grade-3.json`；五课的新教学流程、逐题响应与自查来自 `content/pilot/hands-on-teaching.mjs`；数学对象与可操作状态来自 `shared/hands-on-models.mjs`。本文件由脚本导出，请修改源后重新导出，避免形成第二套题库。',''];
const groups={warmup:'热身',core:'核心独立练习',transfer:'新情境迁移',challenge:'深入思考挑战',review:'独立复习变式'};
for(const lesson of lessons.filter(l=>l.childClassroom)){
 const teaching=lesson.childClassroom,model=lesson.conceptScenes[0].handsOnSpec;
 lines.push(`## ${lesson.lessonId} ${lesson.title}`,'',`内容版本：${lesson.contentVersion}。教材单元：${lesson.textbookUnit.title}，印刷页${lesson.textbookUnit.printedPages}。建议先修：${lesson.recommendedPrerequisites.join('；')||'无需强制先修，可直接进入'}。`,'',`学习目标：${lesson.objectives.map(o=>o.action).join('；')}`,'',
  '### 第1屏：真实问题','',teaching.story,'',`对应图形：${teaching.storyVisual.title}。${teaching.storyVisual.caption}`,'','### 第2屏：预测','',teaching.predictQuestion,'',`预测图形：${teaching.predictionVisual.title}。${teaching.predictionVisual.caption}`,'',...teaching.predictionOptions.map(text=>`- ${text}`),'', '可以点选、口头想过后进入；一句话输入可选，预测不会直接判分。图形展示已知条件，不展示待猜的新照片、折好后的面关系、净重或替换质量。','',
  '### 第3屏：操作与证据','',teaching.modelText,'',`具体任务：${teaching.mission}`,'',`模型：${model.type} / ${model.mode} / ${model.version}。必须呈现的证据：${model.requiredEvidence.join('、')}。`,'',
  '允许试错、撤销、重来；状态、参数和动作快照随课程保存。操作表示探索，不发答对积分、不直接记掌握。','',
  '### 第4屏：自己复述与发现','',teaching.retell,'', '先自己讲，再按需展开参考关系：','',...teaching.discovery.map(text=>`- ${text}`),'',
  '### 第5屏：翻译成数学语言','',...teaching.symbols.map(text=>`- ${text}`),'','另一个完整例子：','');
 for(const example of lesson.articleBlocks.flatMap(b=>b.examples??[])){
  lines.push(example.title,'',...example.steps.map(step=>`- ${step.math}；${step.why}`),'');
 }
 lines.push('### 第6屏：独立练习、自查与复习','',
  '直接进入本课3题核心组；先保存首答，再逐项自查、保留订正并提交终答。核心练习、新迁移、至少隔日的到期复习分别记录；同日重做、使用帮助或迁移／复习中自我订正不能冒充独立达标。','');
 for(const [key,title] of Object.entries(groups)){
  lines.push(`### ${title}（${lesson.taskSets[key].length}题）`,'');
  for(const task of lesson.taskSets[key]){
   lines.push(`#### ${task.id}`,'',task.prompt,'',`响应：${task.kind==='explanation'?'解释，待家长核对；不自动判对或发答对积分':task.responseSpec.type}`,'');
   if(task.options){lines.push('结论选项：','',...task.options.map(option=>`- ${option.text}${option.id===task.expected?'〔参考正确结论〕':''}`),'')}
   if(task.responseSpec.type==='claim-evidence')lines.push('证据选项（结论和证据都要正确）：','',...task.responseSpec.evidenceOptions.map(option=>`- ${option.text}${option.id===task.responseSpec.expectedEvidence?'〔参考正确证据〕':''}`),'');
   if(task.fields)lines.push('需要填写的量：','',...task.fields.map(field=>`- ${field.label}：${field.expected}${field.unit??''}`),'');
   lines.push(`参考解答：${task.solution}`,'',`第一层提示：${task.hint}`,'');
   if(task.selfCheckItems)lines.push('本题专用自查：','',...task.selfCheckItems.map(text=>`- ${text}`),'');
  }
 }
}
const file=new URL('../docs/review/第二代五课完整教案_20261007.md',import.meta.url);
fs.writeFileSync(file,lines.join('\n').replaceAll('。。','。').trimEnd()+'\n');
console.log('已导出5课完整流程与60道分层任务，包含逐题响应、参考解答与15题专用自查。');
