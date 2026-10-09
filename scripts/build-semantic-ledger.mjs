import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {lessons} from '../content/pilot/source.mjs';
import {withdrawnLessons,withdrawnTasks} from '../shared/withdrawn-checks.mjs';
import {semanticContexts} from '../docs/review/semantic-ledger/contexts.mjs';
import {auditDocument,baselineSha,semanticNotes} from '../docs/review/semantic-ledger/notes.mjs';

const root=new URL('../',import.meta.url);
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const relative=name=>new URL(name,root);
const stages=['真实问题','先猜一猜','亲手实验／静态课画图想一想','说出发现','写成数学','自己验证'];

export function buildSemanticLedger(){
 const ids=new Set(lessons.map(l=>l.lessonId));
 if(ids.size!==70||Object.keys(semanticNotes).length!==70||Object.keys(semanticNotes).some(id=>!ids.has(id)))throw Error('教学语义台账必须精确对应70个入口');
 const rows=lessons.map(lesson=>{
  const id=lesson.lessonId,c=lesson.childClassroom,note=semanticNotes[id];
  const block=lesson.articleBlocks.find(b=>b.widget);
  const scene=lesson.conceptScenes?.[0];
  const model=scene?.textbookSpec??scene?.handsOnSpec??scene?.modelSpec??lesson.lengthScenes?.[0]??lesson.mathScenes?.[0]??{type:lesson.widget??block.widget};
  const tasks=withdrawnLessons.includes(id)?withdrawnTasks(lesson):lesson.taskSets.core;
  const picture=c.storyVisual??lesson.introVisual;
  const contextFigure=picture?{renderer:'src/studio/IntroVisual.tsx',spec:picture}:lesson.articleBlocks[0]?.diagram?{renderer:'src/studio/TeachingDiagrams.tsx',diagram:lesson.articleBlocks[0].diagram}:lesson.mathScenes?.[0]?{renderer:'src/studio/MathSceneVisual.tsx',sceneId:lesson.mathScenes[0].sceneId}:lesson.lengthScenes?.[0]?{renderer:'src/studio/measurement/TaskDiagram.tsx',sceneId:lesson.lengthScenes[0].sceneId}:{renderer:null,reason:'当前入口按文字推理题开放，是否足够直观仍需逐章教学核对'};
  return {
   lessonId:id,title:lesson.title,unitId:lesson.textbookUnit?.id??'foundation-bridge',unitTitle:lesson.textbookUnit?.title??'基础与跨单元桥梁',track:lesson.track,
   sourceAnchor:lesson.sourceAnchors,contentVersion:lesson.contentVersion,editorialRevision:lesson.editorialRevision,
   quantities:semanticContexts[id],
   contentFingerprint:sha({classroom:c,model,taskSets:lesson.taskSets}),
   story:{text:c.story,figure:contextFigure},
   prediction:{question:c.predictQuestion,options:c.predictionOptions,figure:c.predictionVisual??contextFigure},
   experiment:{widget:block.widget,blockId:block.blockId,classification:lesson.interactionStatus,mission:c.mission,model,sourceInitialDescription:scene?.initialState??null,sourceLearnerAction:scene?.learnerAction??null,sourceObservableChange:scene?.observableChange??null,note:'运行参数以model为准，旧场景文字也列出用于发现不一致；不把模型状态匹配当正式判分'},
   discovery:{statements:c.discovery,retell:c.retell},mathematicalLanguage:{statements:c.symbols,scope:'开头故事，未声明与变更后的实验条件自动同步'},
   independentCheck:{scope:'巩固及撤教具练习，可能含已见原故事；不宣称整组为未见迁移',source:withdrawnLessons.includes(id)?'withdrawn-v1-existing-task-ids':'core-existing-task-ids',tasks:tasks.map(t=>({id:t.id,kind:t.kind,prompt:t.prompt})),allTaskCounts:Object.fromEntries(Object.entries(lesson.taskSets).map(([set,ts])=>[set,ts.length])),selfCheckItems:3},
   review:{intervalDays:[1,3,7,21],technicalStatus:'existing-scheduler-not-rerun-in-this-document-phase',teachingStatus:'requires-new-context-and-unassisted-trial'},
   ...note,
   acceptance:{sourceInspection:'recorded',mathematicalInvariants:'listed-not-individually-retested',browserSemanticEvidence:'pending-chapter-run',parentTeachingApproval:'not-verified',kevinMastery:'not-assessed'},
  };
 });
 return {
  schemaVersion:1,date:'2026-10-09',baselineSha,
  requestedAudit:{path:auditDocument,availability:'read-after-fetch-f463dc8',alignment:'audit-fields-and-phase-order-recorded'},
  scope:{entrances:70,textbookLessons:63,foundationBridgeLessons:7,textbookUnits:17,formalTasks:849,staticLessons:6,publishedThinkingCards:17,deferredThinkingCards:43},
  safeguards:{classroomStages:stages,selfCheckItems:3,noAddedRequiredSteps:true,noRealLearnerDataReadsOrWrites:true,grades4To6Frozen:true,noMainMerge:true},
  reviewBoundary:'70课源内容和操作规格的逐课台账，非849题逐题人工审查，非新浏览器验收，非Kevin掌握证明。已读取指定复审文档，台账依照A01列项；数学、视觉和试学状态分开记录。',
  summary:{sourceRefinementNeeded:rows.filter(r=>r.sourceReview==='needs-refinement').length,chapterVerificationNeeded:rows.filter(r=>r.sourceReview!=='needs-refinement').length},
  rows,
 };
}
const cell=s=>String(s??'').replaceAll('|','／').replaceAll('\n',' ');
export function renderSemanticLedger(ledger){
 let out=`# 三年级70课教学语义台账（2026-10-09）\n\n基线：\`${ledger.baselineSha}\`。先整理台账，再逐章精修；本文件仅记录源核对和后续验收条件。\n\n**已读取指定复审文档**：\`${auditDocument}\`。对应远端文档修订f463dc8；源代码基线仍为79a0f90。\n\n70入口＝17教材单元63课＋7基础／桥梁课；849道正式题与11课的66组操作情境分开统计。保留六步课堂和三项自查；本阶段不改课堂、题库、判分、版本、Kevin学习数据、四至六年级或43张暂缓卡。\n\n检查的是问题→对象→动作→发现→数学语言→独立新题之间的联系。\n\n- ${ledger.summary.sourceRefinementNeeded}课存在明确的文字、条件、对象过渡或模型主题核对项，已标为“需精修”。\n- ${ledger.summary.chapterVerificationNeeded}课尚无本次源核对确认的衔接缺陷，标为“待逐章验证”；这不代表教学验收通过。\n- 全70课浏览器语义验收、家长核对与孩子迁移均待逐章记录；旧技术报告不能充当本轮语义检查证据。\n\n机器台账：[teaching-semantic-ledger.json](semantic-ledger/teaching-semantic-ledger.json)。人工逐课批注：[notes.mjs](semantic-ledger/notes.mjs)。生成／查新：\`node scripts/build-semantic-ledger.mjs\` ／ \`node scripts/build-semantic-ledger.mjs --check\`。生成器仅导入课程源，不读取或写入学习数据库。\n\n## 按章总览\n\n|章节|课数|需精修|状态|\n|---|---:|---:|---|\n`;
 const groups=Map.groupBy(ledger.rows,r=>r.unitId);
 for(const [id,rows] of groups)out+=`|${id} ${cell(rows[0].unitTitle)}|${rows.length}|${rows.filter(r=>r.sourceReview==='needs-refinement').length}|台账完成；待逐章精修与验证|\n`;
 out+='\n## 逐课检查清单\n\n';
 for(const [id,rows] of groups){
  out+=`### ${id} ${rows[0].unitTitle}\n\n`;
  for(const r of rows){
   out+=`#### ${r.lessonId} ${r.title}\n\n**源核对**：${r.sourceReview==='needs-refinement'?'需精修':'待逐章验证'}；${r.classroomTrial==='user-reported-trial-of-template'?'用户报告已试过模板，不等于每项教学目标获证。':'尚无本轮真实试课证据。'}\n\n|环节|当前内容／语义证据|\n|---|---|\n`;
   const values=[['教材／分支',`${r.unitTitle}；${r.track}；考核版本${r.contentVersion}`],['真实问题',r.story.text],['对象／单位／已知／未知',`${r.quantities.object}；${r.quantities.unit}；已知：${r.quantities.known}；待求：${r.quantities.unknown}`],['可改变状态',r.quantities.changes],['条件图',r.story.figure.renderer??r.story.figure.reason],['先猜一猜',r.prediction.question],['猜想选项',r.prediction.options.join('；')],['操作任务',r.experiment.mission],['真实模型／静态图',`${r.experiment.classification}；${r.experiment.widget}；${r.experiment.model.type??r.experiment.model.mode??r.experiment.model.sceneId??'参见机器台账'}`],['发现依据',r.discovery.statements.join('；')],['自己复述',r.discovery.retell],['数学语言',r.mathematicalLanguage.statements.join('；')],['独立检查',`${r.independentCheck.tasks.length}题；${r.independentCheck.source}；${r.independentCheck.tasks.map(t=>t.id).join('、')}`],['数学不变量',r.invariant],['下一轮具体核对',r.nextInspection],['验收状态','模型不变量待逐章重测；浏览器语义截图待补；家长教学核对未完成；不判断Kevin掌握']];
   for(const [name,value] of values)out+=`|${name}|${cell(value)}|\n`;
   out+='\n独立练习题干（既有题ID，无额外任务或积分）：\n\n';
   r.independentCheck.tasks.forEach(t=>out+=`- \`${t.id}\`（${t.kind}）：${t.prompt}\n`);
   out+='\n';
  }
 }
 out+='## 逐章实施与退出条件\n\n按复审文档PR-A/B/C/D在现有PR #1分批提交。先完成70课台账，再逐章精修，最后收束测试与证据；每章只修实际存在的衔接问题，保留已有模型及六步导航。\n\n1. 核对本章教材主线、提升、数学思想的学习目标，明确哪里是当前操作、哪里是换情境迁移。\n2. 问题条件、图、实验初态和开头数学表达一致；可变实验不能用固定故事的结果假装实时结论。发现和复述必须能回指具体动作。\n3. 独立题沿用稳定任务ID；确需改题意／答案时先制定新版本和旧证据归档方案，不直接改Kevin数据库。\n4. 以独立临时数据验证正确、错误、撤回／重置、刷新与三项自查；检查故事、猜想、操作、复述、数学语言和实际练习的浏览器路径。\n5. 截图／测试结果绑定该章提交SHA；人工审查diff，写明修正、保留和未解决项，再提交。静态课不为清零数量加装饰交互或必填步骤。\n6. 源核对、数学测试、浏览器验证、教学核对、Kevin独立迁移分别记状态，任何一种都不替代其余验收。\n';
 return out;
}

async function main(){
 const ledger=buildSemanticLedger();
 const files=[['docs/review/semantic-ledger/teaching-semantic-ledger.json',`${JSON.stringify(ledger,null,2)}\n`],['docs/review/三年级70课_六步教学语义台账.md',renderSemanticLedger(ledger)]];
 for(const [name,text] of files){
  if(process.argv.includes('--check')){
   if(await readFile(relative(name),'utf8')!==text)throw Error(`${name}已过期，请根据章节修改复核批注并重新生成`);
  }else{await mkdir(new URL('./',relative(name)),{recursive:true});await writeFile(relative(name),text);}
 }
 console.log(`70课语义台账${process.argv.includes('--check')?'查新通过':'已生成'}：${ledger.summary.sourceRefinementNeeded}课需精修，${ledger.summary.chapterVerificationNeeded}课待逐章验证；按复审A01列项。`);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
