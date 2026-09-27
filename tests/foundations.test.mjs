import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../content/pilot/source.mjs';
import {validateTask} from '../shared/pilot-math.mjs';

// Independently worked answers: including position vs quantity, duplicate counts,
// transfers that preserve totals, and transfers that change a difference twice.
const cases={
  'numbers.quantity.intro':{w1:'4',w2:'6',c1:'2',c2:'3',c3:'2',c4:'3',c5:'5',c6:'2',t1:'9',t2:'2',t3:'0',h1:'2',h2:'7',r1:'1',r2:'3'},
  'numbers.addition.meaning':{w1:'5',w2:'7',c1:'11',c2:'9',c3:'4',c4:'7',c5:{left:'4',right:'4',total:'8'},c6:'2',t1:'9',t2:'10',t3:'2',h1:'12',h2:'11',r1:'9',r2:'3'},
  'numbers.subtraction.meaning':{w1:'4',w2:'7',c1:'4',c2:'8',c3:'2',c4:'4',c5:'2',c6:'11',t1:'12',t2:'5',t3:'4',h1:'18',h2:'6',r1:'9',r2:'3'}
};
for(const [id,answers] of Object.entries(cases))test(`${id}：15道不同结构的答案都能正确判定`,()=>{
  const lesson=lessons.find(l=>l.lessonId===id),tasks=Object.values(lesson.taskSets).flat();
  assert.equal(tasks.length,Object.keys(answers).length);
  for(const task of tasks){
    const fixture=answers[task.id.slice(id.length+1)];assert.notEqual(fixture,undefined,task.id);
    const answer=typeof fixture==='string'?{value:fixture}:fixture;
    assert.equal(validateTask(task,answer).status,'correct',task.id);
    const key=Object.keys(answer)[0],wrong={...answer,[key]:String(Number(answer[key])+1)};
    assert.notEqual(validateTask(task,wrong).status,'correct',`${task.id} 应拒绝错答`);
  }
});
