import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {lessons} from '../content/pilot/source.mjs';
import {withdrawnLessons,withdrawnTasks} from '../shared/withdrawn-checks.mjs';
import {semanticContexts} from '../docs/review/semantic-ledger/contexts.mjs';
import {auditDocument,baselineSha,semanticNotes} from '../docs/review/semantic-ledger/notes.mjs';
import {semanticReviewMatches} from './audit-formal-tasks.mjs';

const root=new URL('../',import.meta.url);
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const relative=name=>new URL(name,root);
const stages=['真实问题','先猜一猜','亲手实验／静态课画图想一想','说出发现','写成数学','自己验证'];

export function buildSemanticLedger(options={}){
 const ids=new Set(lessons.map(l=>l.lessonId));
 if(ids.size!==70||Object.keys(semanticNotes).length!==70||Object.keys(semanticNotes).some(id=>!ids.has(id)))throw Error('教学语义台账必须精确对应70个入口');
 const evidencePath=relative('docs/review/semantic-ledger/desktop-verification.json');
 const evidence=Object.hasOwn(options,'evidence')?options.evidence:existsSync(evidencePath)?JSON.parse(readFileSync(evidencePath,'utf8')):null;
 const closedBaseline=JSON.parse(readFileSync(relative('docs/review/final-task-review/classroom-baseline.json'),'utf8'));
 const taskReview=JSON.parse(readFileSync(relative('docs/review/849题最终审校清单_20261009.json'),'utf8'));
 const rows=lessons.map(lesson=>{
  const id=lesson.lessonId,c=lesson.childClassroom,note=semanticNotes[id];
  const block=lesson.articleBlocks.find(b=>b.widget);
  const scene=lesson.conceptScenes?.[0];
  const model=scene?.textbookSpec??scene?.handsOnSpec??scene?.modelSpec??lesson.lengthScenes?.[0]??lesson.mathScenes?.[0]??{type:lesson.widget??block.widget};
  const tasks=withdrawnLessons.includes(id)?withdrawnTasks(lesson):lesson.taskSets.core;
  const picture=c.storyVisual??lesson.introVisual;
  const contextFigure=picture?{renderer:'src/studio/IntroVisual.tsx',spec:picture}:lesson.articleBlocks[0]?.diagram?{renderer:'src/studio/TeachingDiagrams.tsx',diagram:lesson.articleBlocks[0].diagram}:lesson.mathScenes?.[0]?{renderer:'src/studio/MathSceneVisual.tsx',sceneId:lesson.mathScenes[0].sceneId}:lesson.lengthScenes?.[0]?{renderer:'src/studio/measurement/TaskDiagram.tsx',sceneId:lesson.lengthScenes[0].sceneId}:{renderer:null,reason:'当前入口按文字推理题开放，是否足够直观仍需逐章教学核对'};
  const fingerprint=sha({classroom:c,model,taskSets:lesson.taskSets});
  const original=closedBaseline.rows.find(r=>r.lessonId===id);
  const taskOnlyCompatible=evidence?.source?.sha===closedBaseline.desktopEvidenceSource.sha&&original?.classroomFingerprint===sha(c)&&original?.modelFingerprint===sha(model)&&Object.values(lesson.taskSets).flat().every(t=>semanticReviewMatches(taskReview.rows.find(r=>r.taskId===t.id),t,lesson.contentVersion));
  const verified=evidence?.passed===true&&evidence?.source?.dirty===false&&/^[a-f0-9]{40}$/.test(evidence.source.sha)?evidence.rows?.find(r=>r.lessonId===id&&(r.contentFingerprint===fingerprint||(taskOnlyCompatible&&r.contentFingerprint===original.contentFingerprint))&&r.result==='pass'&&(lesson.interactionStatus==='static-visual'?r.mathBehavior==='static-relation-verified':r.mathBehavior==='full-path-verified'&&r.actionsPerformed?.length>0)):null;
  const taskOnlyAmendment=verified&&verified.contentFingerprint!==fingerprint?{scope:'classroom-and-model-unchanged; formal-task-review-separate',verifiedClassroomSourceFingerprint:verified.contentFingerprint,currentContentFingerprint:fingerprint,semanticRegister:'docs/review/849题最终审校清单_20261009.json',assessmentVersion:lesson.contentVersion,mathBehaviorSha:evidence.source.sha}:null;
  return {
   lessonId:id,title:lesson.title,unitId:lesson.textbookUnit?.id??'foundation-bridge',unitTitle:lesson.textbookUnit?.title??'基础与跨单元桥梁',track:lesson.track,
   sourceAnchor:lesson.sourceAnchors,contentVersion:lesson.contentVersion,editorialRevision:lesson.editorialRevision,
   quantities:semanticContexts[id],
   contentFingerprint:fingerprint,
   story:{text:c.story,figure:contextFigure},
   prediction:{question:c.predictQuestion,options:c.predictionOptions,figure:c.predictionVisual??contextFigure},
   experiment:{widget:block.widget,blockId:block.blockId,classification:lesson.interactionStatus,mission:c.mission,model,sourceInitialDescription:scene?.initialState??null,sourceLearnerAction:scene?.learnerAction??null,sourceObservableChange:scene?.observableChange??null,note:'运行参数以model为准，旧场景文字也列出用于发现不一致；不把模型状态匹配当正式判分'},
   discovery:{statements:c.discovery,retell:c.retell},mathematicalLanguage:{statements:c.symbols,scope:'开头故事，未声明与变更后的实验条件自动同步'},
   independentCheck:{scope:'巩固及撤教具练习，可能含已见原故事；不宣称整组为未见迁移',source:withdrawnLessons.includes(id)?'withdrawn-v1-existing-task-ids':'core-existing-task-ids',tasks:tasks.map(t=>({id:t.id,kind:t.kind,prompt:t.prompt,sourceSet:Object.entries(lesson.taskSets).find(([,items])=>items.some(original=>original.id===t.id))?.[0]??'unknown',novelty:Object.entries(lesson.taskSets).find(([,items])=>items.some(original=>original.id===t.id))?.[0]==='transfer'?'designed-transfer-not-certified-unseen':'consolidation-not-certified-unseen'})),allTaskCounts:Object.fromEntries(Object.entries(lesson.taskSets).map(([set,ts])=>[set,ts.length])),selfCheckItems:3},
   review:{intervalDays:[1,3,7,21],technicalStatus:'shared-scheduler-regressions-separate-from-individual-course-delay-trials',teachingStatus:'requires-new-context-and-unassisted-trial'},
   ...note,initialSourceReview:note.sourceReview,sourceReview:verified?'chapter-desktop-reviewed':note.sourceReview,
   verification:{implementation:lesson.interactionStatus==='static-visual'?'static-relation':'manipulable-six-step',contentReviewed:note.sourceFinding==='initial-source-issue'?'issue-fixed':'source-checked',desktopVisual:verified?.visualInspected?'inspected-pass':verified?'screenshot-recorded':'not-run',mathBehavior:verified?.mathBehavior??'not-run',parentReviewed:'no',learnerMastery:'no-data',evidence:verified?{sha:evidence.source.sha,prHeadSha:evidence.source.prHeadSha,assertions:verified.assertions,actionsPerformed:verified.actionsPerformed,screenshots:verified.screenshots,taskOnlyAmendment}:null},
   acceptance:{sourceInspection:'recorded',mathematicalInvariants:verified?verified.mathBehavior:'listed-not-individually-retested',browserSemanticEvidence:verified?'desktop-run-with-sha':'pending-chapter-run',parentTeachingApproval:'not-verified',kevinMastery:'not-assessed'},
  };
 });
 return {
  schemaVersion:2,date:'2026-10-09',baselineSha,
  requestedAudit:{path:'docs/review/PR1_三年级70课完成度与电脑端全量审计_20261009.md',initialAudit:auditDocument,availability:'read-after-fetch-37219a5',alignment:'audit-fields-and-phase-order-recorded'},
  scope:{entrances:70,textbookLessons:63,foundationBridgeLessons:7,textbookUnits:17,formalTasks:849,staticLessons:6,publishedThinkingCards:17,deferredThinkingCards:43},
  safeguards:{classroomStages:stages,selfCheckItems:3,noAddedRequiredSteps:true,noRealLearnerDataReadsOrWrites:true,grades4To6Frozen:true,noMainMerge:true},
  reviewBoundary:'70课源语义与电脑端完整数学路径及代理看图分别记录。不是849题逐题人工审批，不替家长或Kevin填掌握。旧源核对状态保留为历史，当前证据按SHA和内容指纹映射。',
  summary:{initialSourceIssues:rows.filter(r=>r.sourceFinding==='initial-source-issue').length,sourceRefinementNeeded:rows.filter(r=>r.sourceFinding==='initial-source-issue'&&!r.verification.evidence).length,initiallyNoConfirmedIssue:rows.filter(r=>r.sourceFinding!=='initial-source-issue').length,chapterVerificationNeeded:rows.filter(r=>!r.verification.evidence).length},
  verificationSummary:{desktopMath:rows.filter(r=>r.verification.evidence).length,fullPaths:rows.filter(r=>r.verification.mathBehavior==='full-path-verified').length,staticRelations:rows.filter(r=>r.verification.mathBehavior==='static-relation-verified').length,visualInspected:rows.filter(r=>r.verification.desktopVisual==='inspected-pass').length,parentReviewed:0,learnerMastery:0},
  rows,
 };
}
const cell=s=>String(s??'').replaceAll('|','／').replaceAll('\n',' ');
export function renderSemanticLedger(ledger){
 let out=`# 三年级70课教学语义台账（2026-10-09）\n\n初查基线：\`${ledger.baselineSha}\`。保留初次源核对历史，当前电脑端结果按指纹从已归档验证记录生成。\n\n**已读取指定复审文档**：\`${ledger.requestedAudit.path}\`。历史源编排基线79a0f90，最新全量审计要求来自37219a5；每课实际验收SHA与状态如下，不能混用旧版本结论。\n\n70入口＝17教材单元63课＋7基础／桥梁课；849道正式题与11课的66组操作情境分开统计。保留六步课堂和三项自查；台账阶段先提交，随后课堂文案／图形在展示修订2026-10-09.2精修、2026-10-09.3补齐九节条件图；当前状态来自全量电脑验证。课堂和数学模型保留原样；2026-10-09封闭终审已另列849题逐题记录，并修正实际题库表述及三课评分版本。Kevin学习数据、四至六年级和43张暂缓卡均不变。\n\n检查的是问题→对象→动作→发现→数学语言→独立新题之间的联系。\n\n- 初次核对发现${ledger.summary.initialSourceIssues}课存在文字、条件、对象过渡或模型主题衔接项；保留原发现与修正说明，当前逐课验收结果在下文verification状态列中，不重复沿用初查pending。\n- ${ledger.summary.initiallyNoConfirmedIssue}课尚无本次源核对确认的衔接缺陷，当前电脑端结果由新证据映射，不能用初查pending覆盖后来的有效验证。\n- 电脑端结果按课程内容指纹从desktop-verification.json映射；源内容改变会自动失效。家长核对与孩子迁移独立记录，均不代填通过。\n\n机器台账：[teaching-semantic-ledger.json](semantic-ledger/teaching-semantic-ledger.json)。人工逐课批注：[notes.mjs](semantic-ledger/notes.mjs)。生成／查新：\`node scripts/build-semantic-ledger.mjs\` ／ \`node scripts/build-semantic-ledger.mjs --check\`。生成器仅导入课程源，不读取或写入学习数据库。\n\n## 按章总览\n\n|章节|课数|初查需精修（历史）|当前状态|\n|---|---:|---:|---|\n`;
 const groups=Map.groupBy(ledger.rows,r=>r.unitId);
 for(const [id,rows] of groups)out+=`|${id} ${cell(rows[0].unitTitle)}|${rows.length}|${rows.filter(r=>r.sourceFinding==='initial-source-issue').length}|${rows.filter(r=>r.verification.evidence).length}/${rows.length}课电脑端数学行为核对；${rows.filter(r=>r.verification.desktopVisual==='inspected-pass').length}课代理看图|\n`;
 out+='\n## 逐课检查清单\n\n';
 for(const [id,rows] of groups){
  out+=`### ${id} ${rows[0].unitTitle}\n\n`;
  for(const r of rows){
   out+=`#### ${r.lessonId} ${r.title}\n\n**源核对**：${r.verification.evidence?'已完成电脑端核对':r.sourceReview==='refined-awaiting-chapter-verification'?'已精修、待逐章验证':'待逐章验证'}；${r.classroomTrial==='user-reported-trial-of-template'?'用户报告已试过模板，不等于每项教学目标获证。':'尚无本轮真实试课证据。'}\n\n|环节|当前内容／语义证据|\n|---|---|\n`;
   const values=[['教材／分支',`${r.unitTitle}；${r.track}；考核版本${r.contentVersion}`],['真实问题',r.story.text],['对象／单位／已知／未知',`${r.quantities.object}；${r.quantities.unit}；已知：${r.quantities.known}；待求：${r.quantities.unknown}`],['可改变状态',r.quantities.changes],['条件图',r.story.figure.renderer??r.story.figure.reason],['先猜一猜',r.prediction.question],['猜想选项',r.prediction.options.join('；')],['操作任务',r.experiment.mission],['真实模型／静态图',`${r.experiment.classification}；${r.experiment.widget}；${r.experiment.model.type??r.experiment.model.mode??r.experiment.model.sceneId??'参见机器台账'}`],['发现依据',r.discovery.statements.join('；')],['自己复述',r.discovery.retell],['数学语言',r.mathematicalLanguage.statements.join('；')],['独立检查',`${r.independentCheck.tasks.length}题；${r.independentCheck.source}；${r.independentCheck.tasks.map(t=>t.id).join('、')}`],['数学不变量',r.invariant],['初次核对项（保留历史）',r.nextInspection],['源内容修正说明（保留记录）',r.resolution??'已补具体因果追问与反例，模型保留；当前电脑端数学与图示结果见验收状态'],['验收状态',`电脑图示：${r.verification.desktopVisual}；数学行为：${r.verification.mathBehavior}；证据SHA：${r.verification.evidence?.sha??'尚无'}；家长未确认；不判断Kevin掌握`]];
   for(const [name,value] of values)out+=`|${name}|${cell(value)}|\n`;
   out+='\n独立练习题干（既有题ID，无额外任务或积分）：\n\n';
   r.independentCheck.tasks.forEach(t=>out+=`- \`${t.id}\`（${t.kind}；${t.sourceSet}；${t.novelty==='designed-transfer-not-certified-unseen'?'迁移设计题，是否未见须由作答历史判断':'巩固题，不计作未见迁移'}）：${t.prompt}\n`);
   out+='\n';
  }
 }
 out+='## 逐章实施与退出条件\n\n本轮70课的当前电脑端核对已逐课回填，后续课程内容改变仍按以下规则重新验证。保留初次台账和逐章修正历史，不把历史检查项当作当前未完成项；保留已有模型及六步导航。\n\n1. 核对本章教材主线、提升、数学思想的学习目标，明确哪里是当前操作、哪里是换情境迁移。\n2. 问题条件、图、实验初态和开头数学表达一致；可变实验不能用固定故事的结果假装实时结论。发现和复述必须能回指具体动作。\n3. 独立题沿用稳定任务ID；确需改题意／答案时先制定新版本和旧证据归档方案，不直接改Kevin数据库。\n4. 以独立临时数据验证正确、错误、撤回／重置、刷新与三项自查；检查故事、猜想、操作、复述、数学语言和实际练习的浏览器路径。\n5. 截图／测试结果绑定该章提交SHA；人工审查diff，写明修正、保留和未解决项，再提交。静态课不为清零数量加装饰交互或必填步骤。\n6. 源核对、数学测试、浏览器验证、教学核对、Kevin独立迁移分别记状态，任何一种都不替代其余验收。\n';
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
 console.log(`70课语义台账${process.argv.includes('--check')?'查新通过':'已生成'}：${ledger.summary.initialSourceIssues}课有初次核对项，${ledger.summary.chapterVerificationNeeded}课待逐章验证；当前电脑端${ledger.verificationSummary.desktopMath}/70课，代理看图${ledger.verificationSummary.visualInspected}/70课。`);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
