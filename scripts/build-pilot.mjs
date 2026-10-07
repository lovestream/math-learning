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

const rollout={version:'2026-10-07.2',generated:true,authority:{teachingPlan:'content/course-plan-v2/grade-3.json',runtimeSource:'content/pilot/source.mjs',runtimeArtifact:'content/pilot/lessons.json',history:'docs/history/rollout-20260913.json'},currentFocus:'三年级第一批：观察物体三课、质量与曹冲称象两课；其它年级冻结',counts:{v2HandsOnLessons:lessons.filter(l=>l.childClassroom).length,lessons:lessons.length,tasks:lessons.reduce((n,l)=>n+Object.values(l.taskSets).flat().length,0),registeredModelLessons:lessons.filter(l=>l.mathScenes?.length||l.lengthScenes?.length||l.conceptScenes?.some(s=>s.modelSpec||s.handsOnSpec)).length,staticReviewLessons:lessons.filter(l=>l.conceptScenes?.some(s=>s.modelStatus==='static-review')).length},batches:grade3UnitMetadata.map(unit=>({id:unit.id,title:unit.title,status:'installed-awaiting-teaching-review',lessonIds:lessons.filter(l=>l.parentUnitId===unit.id).map(l=>l.lessonId)})),validation:{structure:'automated',registeredMathModels:'automated-fixture-and-property-tests',allTaskSemantics:'not-fully-reviewed',kevinTrial:'not-performed-by-agent'}};
fs.writeFileSync(new URL('content/rollout.json',root),JSON.stringify(rollout,null,2)+'\n');
