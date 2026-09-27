import test from 'node:test';
import assert from 'node:assert/strict';
import {grade3CompleteLessons,grade3CompletePlan} from '../content/pilot/grade3-complete.mjs';
import {lessons} from '../content/pilot/source.mjs';

test('三年级完整教案60课、720题全部进入可编译课程源',()=>{
  assert.equal(grade3CompletePlan.lessonCount,60);
  assert.equal(grade3CompletePlan.taskCount,720);
  assert.equal(new Set(grade3CompletePlan.lessonIds).size,60);
  for(const id of grade3CompletePlan.lessonIds)assert.equal(lessons.filter(l=>l.lessonId===id).length,1,`${id}应且只应出现一次`);
});

test('未被精修样板替换的完整课程都有三步实验与12道分层任务',()=>{
  for(const lesson of grade3CompleteLessons){
    assert.equal(lesson.articleBlocks.length,8,lesson.lessonId);
    assert.equal(lesson.conceptScenes.length,1,lesson.lessonId);
    assert(lesson.conceptScenes[0].steps.length>=3,lesson.lessonId);
    assert.equal(Object.values(lesson.taskSets).flat().length,12,lesson.lessonId);
    assert.equal(lesson.taskSets.review.length,4,lesson.lessonId);
    assert(Object.values(lesson.taskSets).flat().every(task=>task.diagram?.type==='concept'),lesson.lessonId);
  }
});

test('三年级概念实验覆盖16种数学模型家族',()=>{
  const families=new Set(grade3CompleteLessons.map(l=>l.conceptScenes[0].family));
  assert.deepEqual([...families].sort(),['angles','areaGrid','boundary','coding','data','decimals','division','fractions','mass','operations','placeValue','planning','sets','spatial','time','transform'].sort());
});

test('自动编译的选择题只有一个可判定答案且不把答案写进题图',()=>{
  for(const lesson of grade3CompleteLessons)for(const task of Object.values(lesson.taskSets).flat()){
    if(task.kind==='choice'){
      assert.equal(task.options.length,3,task.id);
      assert(task.options.some(option=>option.id===task.expected),task.id);
      assert.equal(new Set(task.options.map(option=>option.text)).size,3,task.id);
    }
    const pictured=JSON.stringify(task.diagram);
    assert(!pictured.includes(String(task.solution)),`${task.id}题图不应包含完整解答`);
  }
});
