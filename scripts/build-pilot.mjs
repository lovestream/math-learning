import {thinkingCards,publicThinkingCard} from '../content/pilot/thinking-source.mjs';
import fs from 'node:fs';
import {lessons} from '../content/pilot/source.mjs';
import {grade3UnitMetadata} from '../content/pilot/grade3-complete.mjs';
import {methodGuides} from '../content/method-guides.mjs';
import {validateIntroVisualCoverage} from '../content/pilot/intro-visuals.mjs';
validateIntroVisualCoverage(lessons);
const root=new URL('../',import.meta.url);
// Only the existing exact SVG paper templates are served, not source textbooks.
const paperDir=new URL('public/math-paper-folding/',root);fs.mkdirSync(paperDir,{recursive:true});
for(const name of ['print-templates.html','template-rectangular-box.svg','template-cube-1.svg','template-cube-2.svg','template-cube-3.svg'])fs.copyFileSync(new URL(`assets/source/solid-shapes/${name}`,root),new URL(name,paperDir));
const blueprint=JSON.parse(fs.readFileSync(new URL('content/Kevin_数学课程结构清单.json',root),'utf8'));
fs.writeFileSync(new URL('content/pilot/lessons.json',root),JSON.stringify(lessons,null,2)+'\n');
const summary={version:blueprint.designVersion,strands:blueprint.strands,units:blueprint.units.map(({unitId,scope,strand})=>({unitId,scope,strand})),counts:{strands:blueprint.strands.length,units:blueprint.units.length,foundation:blueprint.foundation.length,olympiad:blueprint.olympiad.length,methods:blueprint.thinkingSkills.length,plans:blueprint.coursePlans.length}};
fs.writeFileSync(new URL('content/pilot/design-index.json',root),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(new URL('content/pilot/methods.json',root),JSON.stringify(blueprint.thinkingSkills.map(m=>({...m,guide:methodGuides[m.thinkingSkillId]??null})),null,2)+'\n');
console.log(`互动样板：${lessons.length}课，${lessons.reduce((n,l)=>n+Object.values(l.taskSets).flat().length,0)}道任务；全量蓝图仍为 planned。`);

const rollout={version:'2026-10-09.1',generated:true,authority:{teachingPlan:'content/course-plan-v2/grade-3.json',runtimeSource:'content/pilot/source.mjs',runtimeArtifact:'content/pilot/lessons.json',history:'docs/history/rollout-20260913.json'},currentFocus:'三年级70课统一六步短课堂；正式练习三项勾选自查；证据隔离与家长审核闭环；35课教材模型、11课计算精修、17张迁移卡及204组去重复习；11课撤教具五题小测复用55个正式任务ID；其它年级冻结',counts:{thinkingPrepared:thinkingCards.length,thinkingPublished:thinkingCards.filter(t=>t.publicationStatus==='guided-study').length,shortClassroomLessons:lessons.filter(l=>l.childClassroom).length,directManipulationLessons:lessons.filter(l=>['verified','direct-manipulation'].includes(l.interactionStatus)).length,staticRelationLessons:lessons.filter(l=>l.interactionStatus==='static-visual').length,lessons:lessons.length,tasks:lessons.reduce((n,l)=>n+Object.values(l.taskSets).flat().length,0),registeredModelLessons:lessons.filter(l=>l.mathScenes?.length||l.lengthScenes?.length||l.conceptScenes?.some(s=>s.modelSpec||s.handsOnSpec||s.textbookSpec)).length,staticReviewLessons:lessons.filter(l=>l.conceptScenes?.some(s=>s.modelStatus==='static-review')).length},batches:grade3UnitMetadata.map(unit=>({id:unit.id,title:unit.title,status:'installed-awaiting-teaching-review',lessonIds:lessons.filter(l=>l.parentUnitId===unit.id).map(l=>l.lessonId)})),validation:{structure:'automated',registeredMathModels:'automated-fixture-and-property-tests',allTaskSemantics:'not-fully-reviewed',kevinTrial:'not-performed-by-agent'}};
fs.writeFileSync(new URL('content/rollout.json',root),JSON.stringify(rollout,null,2)+'\n');

const ledger=grade3UnitMetadata.map(unit=>{const rows=lessons.filter(l=>l.parentUnitId===unit.id),core=rows.find(l=>l.track==='foundation'&&l.interactionStatus!=='static-visual'),cards=thinkingCards.filter(t=>t.originUnit===unit.id);if(!core)throw Error('教材单元缺核心活动 '+unit.id);return {unitId:unit.id,title:unit.title,sourceId:unit.sourceId,printedPages:unit.printedPages,lessonIds:rows.map(l=>l.lessonId),coreActivity:{lessonId:core.lessonId,status:core.interactionStatus},staticLessonIds:rows.filter(l=>l.interactionStatus==='static-visual').map(l=>l.lessonId),extension:{recommended:cards.find(t=>t.recommended)?.id,published:cards.filter(t=>t.publicationStatus==='guided-study').map(t=>t.id),deferred:cards.filter(t=>t.publicationStatus!=='guided-study').map(t=>t.id)},reviewDays:[1,3,7,21],independentTransfer:'awaiting-adult-review-and-kevin-trial',knowledgeCoverage:'mapped-to-local-textbook-not-teaching-approved'};});
fs.writeFileSync(new URL('content/pilot/chapter-ledger.json',root),JSON.stringify(ledger,null,2)+'\n');
fs.writeFileSync(new URL('content/pilot/thinking.json',root),JSON.stringify(thinkingCards.map(publicThinkingCard),null,2)+'\n');
