import test from 'node:test';
import assert from 'node:assert/strict';
import {grade3CompleteLessons,grade3CompletePlan} from '../content/pilot/grade3-complete.mjs';
import {lessons} from '../content/pilot/source.mjs';
import {equivalent} from '../shared/pilot-math.mjs';

test('三年级完整教案60课、720题全部进入可编译课程源',()=>{
  assert.equal(grade3CompletePlan.lessonCount,60);
  assert.equal(grade3CompletePlan.taskCount,720);
  assert.equal(new Set(grade3CompletePlan.lessonIds).size,60);
  for(const id of grade3CompletePlan.lessonIds)assert.equal(lessons.filter(l=>l.lessonId===id).length,1,`${id}应且只应出现一次`);
});

test('未精修课程保留教案说明与12道任务，不等同已具备操作模型',()=>{
  for(const lesson of grade3CompleteLessons){
    assert.equal(lesson.articleBlocks.length,8,lesson.lessonId);
    assert.equal(lesson.conceptScenes.length,1,lesson.lessonId);
    assert(lesson.conceptScenes[0].steps.length>=3,lesson.lessonId);
    assert.equal(Object.values(lesson.taskSets).flat().length,12,lesson.lessonId);
    assert.equal(lesson.taskSets.review.length,4,lesson.lessonId);
    assert(Object.values(lesson.taskSets).flat().every(task=>task.diagram?.type==='concept'),lesson.lessonId);
  }
});

test('三年级内容覆盖16个分类，不等同16种已验收模型',()=>{
  const families=new Set(grade3CompleteLessons.map(l=>l.conceptScenes[0].family));
  assert.deepEqual([...families].sort(),['angles','areaGrid','boundary','coding','data','decimals','division','fractions','mass','operations','placeValue','planning','sets','spatial','time','transform'].sort());
});

test('非数值题保持解释响应，编译器不制造提示答案的模板选项',()=>{
  for(const lesson of grade3CompleteLessons)for(const task of Object.values(lesson.taskSets).flat()){
    assert(task.responseSpec,task.id);
    if(task.kind==='explanation'){
      assert.equal(task.responseSpec.type,'self-explanation');assert.equal(task.options,undefined);assert.equal(task.reasonEvidence,undefined);
      assert.equal(task.editorialStatus,'parent-assessment');
    }
    assert.equal(task.diagram.values.length,0,`${task.id}不能抓题干数字当模型`);
    assert(task.diagram.variant.endsWith(':task-static'));
    assert(!JSON.stringify(task.diagram).includes(String(task.solution)),`${task.id}题图不应包含完整解答`);
  }
});
test('例题保留实际过程而非第N步占位；专用模型和静态审阅状态明确',()=>{
  for(const lesson of grade3CompleteLessons){
    assert.equal(lesson.editorialStatus,'review-required');
    for(const step of lesson.articleBlocks.flatMap(b=>b.examples??[]).flatMap(e=>e.steps))assert(!/^第\d+步$/.test(step.math),lesson.lessonId);
    const scene=lesson.conceptScenes[0];assert.equal(scene.values.length,0);assert.equal(scene.modelStatus,scene.modelSpec?'registered':'static-review');
  }
  const arithmetic=grade3CompleteLessons.find(l=>l.lessonId==='G3-U02-B02');
  assert(arithmetic.articleBlocks.find(b=>b.type==='workedExample').examples[0].steps.some(s=>s.math.includes('24÷6=4')));
});

test('编译后的纯数值例题等号两边相等，乘数和完整括号不被截断',()=>{
  let checked=0;
  for(const lesson of grade3CompleteLessons)for(const step of lesson.articleBlocks.flatMap(b=>b.examples??[]).flatMap(e=>e.steps))for(const equation of step.math.split('；')){
    if(!/^[\d＋+－−×÷*/.（）()＝=\s]+$/.test(equation)||!/[=＝]/.test(equation))continue;
    const sides=equation.replaceAll('＝','=').split('=');
    for(let i=1;i<sides.length;i++){assert(equivalent(sides[i-1],sides[i]),`${lesson.lessonId}: ${equation}`);checked++;}
  }
  assert(checked>60);
  const lesson=grade3CompleteLessons.find(l=>l.lessonId==='G3-U02-E05');
  assert.equal(lesson.articleBlocks.find(b=>b.examples).examples[0].steps[0].math,'4×(6+2)=32');
});
