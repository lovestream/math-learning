import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../content/pilot/source.mjs';
import {classroomReasoning} from '../content/pilot/classroom-reasoning.mjs';
import {currentClassroomExperiment} from '../shared/classroom-expression.mjs';
import {initialCoreState,measureCore} from '../shared/core-models.mjs';
import {evaluateExpressionAST,expressionASTText,formatFraction} from '../shared/pilot-math.mjs';
import {chainMeasure,boardMeasure} from '../shared/length-model.mjs';
import {introVisuals} from '../content/pilot/intro-visuals.mjs';
const get=id=>lessons.find(l=>l.lessonId===id);

test('条件图、初态和因果问题来自同一数量条件；数据课不预先分类或给票数答案',()=>{
 for(const l of lessons){const model=l.conceptScenes?.[0]?.textbookSpec;
  if(model?.cases){assert.equal(l.conceptScenes[0].initialState,model.contexts[0].story);assert.equal(l.conceptScenes[0].question,l.childClassroom.whyQuestion);}
  assert.equal(l.articleBlocks[0].paragraphs?.[0]??l.articleBlocks[0].text,l.childClassroom.story,l.lessonId);
 }
 assert.deepEqual(introVisuals['G3-L05-B02'].values,get('G3-L05-B02').conceptScenes[0].textbookSpec.data);
 assert.equal(introVisuals['G3-L05-B01'].values[0],get('G3-L05-B01').conceptScenes[0].textbookSpec.people);
 assert.deepEqual(introVisuals['G3-L04-B03'].values,[10,10]);
 assert.equal(introVisuals['G3-U04-B03'].values[0],get('G3-U04-B03').conceptScenes[0].textbookSpec.cases[0][1]);
 assert.equal(introVisuals['G3-U04-B03'].values[1],get('G3-U04-B03').conceptScenes[0].textbookSpec.cases[0][0]);
});

test('70课有针对动作的因果追问、可观察证据和反例，发现不再复用混合运算通用段落',()=>{
 assert.equal(Object.keys(classroomReasoning).length,70);
 const prompts=new Set();
 for(const l of lessons){const c=l.childClassroom;assert(c.predictionFocus&&c.observedEvidence&&c.whyQuestion&&c.counterexamplePrompt,l.lessonId);assert.equal(c.retell,c.whyQuestion);prompts.add(c.whyQuestion);}
 assert.equal(prompts.size,70);
 const basic=['B01','B02','B03','B04','B05','E01'].map(s=>get('G3-U02-'+s).childClassroom.discovery[0]);
 assert.equal(new Set(basic).size,6);
 assert.match(get('G3-U02-B03').childClassroom.discovery[0],/不是所有/);
 assert.match(get('G3-L04-B03').childClassroom.whyQuestion,/100/);
});

test('11课66组参数的当前实验表达来自模型条件，只留空白结果，不取实时测量答案',()=>{
 let cases=0;
 for(const lesson of lessons){const model=lesson.conceptScenes?.[0]?.textbookSpec;if(!model?.cases)continue;
  model.cases.forEach((c,choice)=>{
   const state={...initialCoreState(model,choice),stateKind:'textbook',sceneId:lesson.conceptScenes[0].sceneId};
   const live=currentClassroomExperiment(lesson,state);assert(live,lesson.lessonId);assert.deepEqual(live.conditions,[model.contexts[choice].story]);
   if(model.type!=='estimate-product')assert.match(live.template,/□/);
   if(model.type==='product-place'){assert.equal(live.template,`${c[0]}×${c[1]}＝□（${model.contexts[choice].unit}）`);assert.equal(measureCore(model,initialCoreState(model,choice)).target,c[0]*c[1]);}
   if(model.type==='fraction-core'&&model.mode==='add')assert.equal(live.template,`${c[1]}/${c[0]}＋${c[2]}/${c[0]}＝□；剩下：1−□＝□`);
   cases++;
  });
 }
 assert.equal(cases,66);
});

test('括号课切换情境后，当前算式和单位随结构化条件切换，原式单独保留',()=>{
 const l=get('G3-U02-B03');
 assert.equal(currentClassroomExperiment(l),null);
 for(const s of l.mathScenes){const live=currentClassroomExperiment(l,{sceneId:s.sceneId,stateKind:'mixed-operations'});assert.equal(live.template,expressionASTText(s.expressionAST)+'＝□');assert.equal(live.conditions.length,s.story.quantities.length);const v=evaluateExpressionAST(s.expressionAST);assert.equal(formatFraction(v),String(s.expected.value));}
 assert.equal(l.childClassroom.symbols[0],'(12＋8)÷4');
 assert.notEqual(currentClassroomExperiment(l,{sceneId:l.mathScenes[0].sceneId}).template,currentClassroomExperiment(l,{sceneId:l.mathScenes[1].sceneId}).template);
});

test('链环按实际已扣环数，木板按实际搭接；单位统一，边界不伪造目标答案',()=>{
 const chain=get('G3-U03-E02');
 for(let n=1;n<=5;n++){const live=currentClassroomExperiment(chain,{labVersion:2,target:5,placed:n});assert.equal(live.template,`40＋(40−5−5)×(${n}−1)＝□（毫米）`);assert.equal(chainMeasure(40,5,n).totalMm,40+30*(n-1));}
 const boards=get('G3-U03-E01');
 for(const overlap of [0,80,120]){const live=currentClassroomExperiment(boards,{labVersion:2,overlap});assert.equal(live.template,`300＋250−${overlap}＝□（毫米）`);assert.equal(boardMeasure([300,250],[overlap]).totalMm,550-overlap);}
});

test('空间观察不强行生成算式；称象只给有条件的等量关系，不捏造质量数值',()=>{
 assert.equal(currentClassroomExperiment(get('G3-U01-B01'),{stateKind:'hands-on',cameraAzimuth:90}),null);
 const l=get('G3-UP01-B02');
 const live=currentClassroomExperiment(l,{handsOnVersion:2,waterlineMarked:true,passenger:true});
 assert.match(live.template,/同船同水线/);assert.match(live.template,/乘员质量/);assert(!/\d/.test(live.template));
});
