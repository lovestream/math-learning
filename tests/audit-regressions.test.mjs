import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReverseAddMultiplyFlow,evaluateExpressionAST,formatFraction,firstOperationOptions,validateTask,equivalent,parseLinear} from '../shared/pilot-math.mjs';
import {operationModels,measureOperationModel} from '../shared/operation-models.mjs';
import {lessonEvidence} from '../shared/learning-evidence.mjs';
import {freshProgress,exportEnvelope,validateEnvelope} from '../server/store.mjs';
import {lessons} from '../content/pilot/source.mjs';
import {createSession,selfCheckTask,submitTask,publicSession} from '../server/pilot-store.mjs';
import {evidence,completeSelfCheck} from './fixtures/self-check.mjs';
import {operationResponses} from '../content/pilot/operation-responses.mjs';
import {validateWidgetState} from '../shared/widget-state.mjs';

test('新模型有限状态拒绝越界参数、错误模型、任意动作；旧状态保留导入兼容',()=>{
  const state={stateKind:'operation-extension',extensionVersion:1,modelType:'split-array',parameter:3,observed:false};
  assert.deepEqual(validateWidgetState(state,'G3-U02-E05'),state);
  assert.throws(()=>validateWidgetState({...state,parameter:8},'G3-U02-E05'));
  assert.throws(()=>validateWidgetState(state,'G3-U02-E03'));
  assert.throws(()=>validateWidgetState({...state,actions:[{action:'substitute',before:null,after:null}]},'G3-U02-E05'));
  assert.throws(()=>validateWidgetState({...state,extra:{arbitrary:true}},'G3-U02-E05'));
  assert.throws(()=>validateWidgetState({step:Infinity},'G3-U02-B01'));
  assert.deepEqual(validateWidgetState({parts:6,take:2,whole:1},'legacy'),{parts:6,take:2,whole:1});
});

test('倒推同时验证错算流程44和题目原式23，两者不能混称',()=>{
  const flow=buildReverseAddMultiplyFlow(7,4,44);
  assert.equal(flow.unknown,4);assert.equal(formatFraction(evaluateExpressionAST(flow.forward)),'44');
  assert.equal(formatFraction(evaluateExpressionAST(flow.intended)),'23');assert.match(flow.forwardText,/\(4 ＋ 7\) × 4/);
  for(let addend=0;addend<=12;addend++)for(let multiplier=1;multiplier<=9;multiplier++)for(let unknown=0;unknown<=20;unknown++){
    const target=(unknown+addend)*multiplier,result=buildReverseAddMultiplyFlow(addend,multiplier,target);
    assert.equal(result.unknown,unknown);assert.equal(formatFraction(evaluateExpressionAST(result.forward)),String(target));
    assert.equal(result.intendedValue,String(addend+unknown*multiplier));
  }
  assert.throws(()=>buildReverseAddMultiplyFlow(7,0,44));assert.throws(()=>buildReverseAddMultiplyFlow(7,4,45));
});
test('点阵切割按每个点的区域计数，所有合法参数满足守恒且漏乘有明确漏数',()=>{
  for(let rows=1;rows<=9;rows++)for(let cols=2;cols<=12;cols++)for(let cut=1;cut<cols;cut++){
    const model={type:'split-array',rows,cols,cut},m=measureOperationModel(model);
    const pictured=Array.from({length:rows*cols},(_,i)=>i%cols<cut?'left':'right');
    assert.equal(pictured.filter(x=>x==='left').length,m.left);assert.equal(pictured.filter(x=>x==='right').length,m.right);
    assert.equal(m.left+m.right,m.total);assert.equal(m.total-(m.left+cols-cut),m.missed);
  }
  assert.throws(()=>measureOperationModel(operationModels['G3-U02-E05'],{cut:8}));
});
test('付款退回、连续除法、整体替换的例题与反例从模型求值',()=>{
  assert.deepEqual(measureOperationModel(operationModels['G3-U02-E03']),{start:60,pay:14,refund:6,net:8,final:52,counterexample:40});
  assert.deepEqual(measureOperationModel(operationModels['G3-U02-E02']),{total:48,groups:6,perGroup:2,people:12,perPerson:4,firstShare:8});
  const m=measureOperationModel(operationModels['G3-U02-O02']);assert.equal(m.total,60);assert.equal(m.partial,36);
});
test('第一步选项不显示中间答案；不同选择对应不同算式结构',()=>{
  for(const lesson of lessons)for(const scene of lesson.mathScenes??[]){
    const options=firstOperationOptions(scene.expressionAST,scene.sceneId);
    assert.equal(options.filter(o=>o.correct).length,1);assert.equal(new Set(options.map(o=>o.text)).size,options.length);
    assert(options.every(o=>!/[=＝]|正确|错误/.test(o.text)),scene.sceneId);
  }
});
test('结论正确但证据缺失或不支持，不算理由正确；答案键不送到客户端',()=>{
  const task={id:'claim',kind:'choice',expected:'c1',options:[{id:'c1',text:'两条路线都剩15元'},{id:'c2',text:'两条路线都剩9元'},{id:'c3',text:'两条路线余额不同'}],responseSpec:{type:'claim-evidence',evidenceOptions:[{id:'e1',text:'退款使余额增加3元'},{id:'e2',text:'退款使余额减少3元'},{id:'e3',text:'退款不改变余额'}],expectedEvidence:'e1'}};
  assert.equal(validateTask(task,{value:'c1'}).status,'invalidInput');assert.equal(validateTask(task,{value:'c1',evidence:'e2'}).status,'incorrect');assert.equal(validateTask(task,{value:'c1',evidence:'e1'}).status,'correct');
  const publicTask=publicSession({tasks:[task]}).tasks[0];assert.equal(publicTask.expected,undefined);assert.equal(publicTask.responseSpec.expectedEvidence,undefined);
});
test('仅保存首答不能越过自查门槛，检查草稿不制造自我订正',()=>{
  const p=freshProgress(),l=lessons.find(l=>l.lessonId==='G3-U02-B01'),s=createSession(p,{lessonId:l.lessonId,setName:'core'},lessons),t=s.tasks[0];
  selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:t.expected},eventId:'audit:first'});
  assert.throws(()=>submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:t.expected},eventId:'audit:skip'},lessons),/自查证据/);
  assert.throws(()=>selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,phase:'evidence',evidence:{...evidence,checks:[]},eventId:'audit:empty'}),/三项/);
  selfCheckTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,phase:'evidence',evidence,eventId:'audit:checked'});
  const r=submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:t.expected,check0:'done',checkReflection:'核对过第一步'},eventId:'audit:final'},lessons);
  assert.equal(r.status,'correct');assert.equal(r.selfCorrection,false);assert.deepEqual(r.selfCheckEvidence,evidence);
  assert.deepEqual(validateEnvelope(exportEnvelope(p),[]),p);
});
test('解释题保存为待核对，既不冒充正确，也不获得理由积分',()=>{
  const p=freshProgress(),l=lessons.find(l=>l.taskSets.core.some(t=>t.kind==='explanation')),s=createSession(p,{lessonId:l.lessonId,setName:'core'},lessons),t=s.tasks.find(t=>t.kind==='explanation');
  const answer={value:'先找出整体，再根据关系比较。'};completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:'audit:explanation'});
  const r=submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:'audit:explanation-submit'},lessons);
  assert.equal(r.status,'pendingReview');assert.equal(r.paid,0);assert.equal(p.wallet.coins,0);assert.equal(lessonEvidence(p,l.lessonId,l.contentVersion).independent,false);
});
test('逐题编写的响应规格含一致的算式事实，正确结论必须配正确证据',()=>{
  for(const [id,task] of Object.entries(operationResponses)){
    const answer=task.kind==='fields'?Object.fromEntries(task.fields.map(f=>[f.key,f.expected])):{value:task.expected,...(task.responseSpec.type==='claim-evidence'?{evidence:task.responseSpec.expectedEvidence}:{})};
    assert.equal(validateTask(task,answer).status,'correct',id);
    if(task.kind==='expression'){
      const sides=task.expected.split('=');if(sides.length===2)assert(equivalent(sides[0],sides[1]),id);
      if(task.responseSpec.optionalResult){assert.equal(validateTask(task,{value:sides[0]}).status,'correct',id);assert.notEqual(validateTask(task,{value:sides[0]+'=9999'}).status,'correct',id);}
      assert.notEqual(validateTask(task,{value:formatFraction(parseLinear(sides[0]).constant)}).status,'correct',`${id}不能用最后数字冒充改写过程`);
    }
    if(task.kind==='choice'){
      assert.equal(new Set(task.options.map(o=>o.text)).size,3,id);
      assert.equal(new Set(task.responseSpec.evidenceOptions.map(o=>o.text)).size,3,id);
      assert([...task.options,...task.responseSpec.evidenceOptions].every(o=>!/正确|错误|不对|按这种想法判断|这样判断/.test(o.text)),id);
      for(const option of task.options.filter(o=>o.id!==task.expected))assert.equal(validateTask(task,{value:option.id,evidence:task.responseSpec.expectedEvidence}).status,'incorrect',id);
      for(const option of task.responseSpec.evidenceOptions.filter(o=>o.id!==task.responseSpec.expectedEvidence))assert.equal(validateTask(task,{value:task.expected,evidence:option.id}).status,'incorrect',id);
    }
  }
});
test('中途提交错答后改回首答，不冒充全组独立迁移',()=>{
  const p=freshProgress(),l=lessons.find(l=>l.lessonId==='G3-U02-B01'),s=createSession(p,{lessonId:l.lessonId,setName:'transfer'},lessons);
  for(const [i,t] of s.tasks.entries()){
    const answer={value:t.expected};completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:`history:first:${i}`});
    if(i===0)submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer:{value:'999'},eventId:'history:wrong'},lessons);
    submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:`history:correct:${i}`},lessons);
  }
  assert(s.completedAt);assert.equal(s.hadIncorrect,true);assert.equal(s.results[s.tasks[0].id].selfCorrection,false);
  assert.equal(lessonEvidence(p,l.lessonId,l.contentVersion).transfer,0);
});
test('无提示完成核心只是已练习，首答订正或当天复习不能冒充独立留存',()=>{
  const p=freshProgress(),l=lessons.find(l=>l.lessonId==='G3-U02-B01'),now=Date.UTC(2026,9,2);
  const solve=(set,at)=>{
    const s=createSession(p,{lessonId:l.lessonId,setName:set},lessons,at);
    for(const t of s.tasks){const answer={value:t.expected};completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:`${set}-${at}-${t.id}`},at);submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:`submit-${set}-${at}-${t.id}`},lessons,at);}
    return s;
  };
  solve('core',now);assert.equal(lessonEvidence(p,l.lessonId,l.contentVersion).status,'practiced');
  solve('transfer',now);assert.equal(lessonEvidence(p,l.lessonId,l.contentVersion).independent,false);
  solve('review',now);assert.equal(lessonEvidence(p,l.lessonId,l.contentVersion).independent,false);
  solve('review',now+86400000);assert.equal(lessonEvidence(p,l.lessonId,l.contentVersion).independent,true);
  assert.equal(lessonEvidence(p,l.lessonId,'future-version').independent,false);
});
test('响应版本变化保留旧会话、首答与奖励权利，新版本不能重复领取同题奖励',()=>{
  const p=freshProgress(),base=lessons.find(l=>l.lessonId==='G3-U02-E05'),old={...base,contentVersion:'older-response-version'};
  const s=createSession(p,{lessonId:base.lessonId,setName:'warmup'},[old]),t=s.tasks[0],answer={value:t.expected};
  completeSelfCheck(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:'old:first'});
  const first=submitTask(p,{sessionId:s.id,revision:s.revision,taskId:t.id,answer,eventId:'old:final'},[old]);
  const newer=createSession(p,{lessonId:base.lessonId,setName:'warmup'},[base]),nt=newer.tasks[0];assert.notEqual(newer.id,s.id);assert(p.studio.sessions[s.id]);
  completeSelfCheck(p,{sessionId:newer.id,revision:newer.revision,taskId:nt.id,answer:{value:nt.expected},eventId:'new:first'});
  const second=submitTask(p,{sessionId:newer.id,revision:newer.revision,taskId:nt.id,answer:{value:nt.expected},eventId:'new:final'},[base]);
  assert(first.paid>0);assert.equal(second.paid,0);assert.deepEqual(p.studio.sessions[s.id].selfChecks[t.id].firstAnswer,answer);
});
