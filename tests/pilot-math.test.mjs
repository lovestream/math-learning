import test from 'node:test';
import assert from 'node:assert/strict';
import {formatFraction,gridMeasure,parseNumber,equivalent,validateTask,evaluateExpressionAST,expressionASTText} from '../shared/pilot-math.mjs';

test('分数使用精确有理数而不是浮点近似',()=>{assert.equal(formatFraction(parseNumber('2/6')),'1/3');assert.equal(formatFraction(parseNumber('0.5')),'1/2');});
test('等量替换检查括号与展开保持等价',()=>{assert.equal(equivalent('3*(乙+2)','3乙+6'),true);assert.equal(equivalent('3乙+2','3*(乙+2)'),false);});
test('网格面积与外边界分开计算',()=>{assert.deepEqual(gridMeasure([[0,0],[1,0],[0,1],[1,1]]),{area:4,perimeter:8});});
test('非法输入不会被当作答错',()=>{const out=validateTask({kind:'number',expected:'1/3',fields:[{key:'value',label:'答案',expected:'1/3'}]},{value:'1/0'});assert.equal(out.status,'invalidInput');});
test('单位由题目给定，只填数值即可，旧存档的单位选择不影响判分',()=>{
  const task={kind:'fields',fields:[{key:'area',label:'面积',expected:'12',unit:'平方厘米'},{key:'perimeter',label:'周长',expected:'14',unit:'厘米'}]};
  assert.equal(validateTask(task,{area:'12',perimeter:'14'}).status,'correct');
  assert.equal(validateTask(task,{area:'12',perimeter:'14',areaUnit:'厘米'}).status,'correct');
  assert.equal(validateTask(task,{area:'14',perimeter:'12'}).status,'incorrect');
  assert.equal(validateTask(task,{area:'12',perimeter:''}).status,'invalidInput');
  assert.equal(validateTask({kind:'number',expected:'1/3',unit:'米'},{value:'2/6'}).status,'correct');
});
test('混合运算受限AST精确计算审计要求的主例与反例',()=>{
  const n=value=>({type:'number',value}),op=(operator,left,right,grouped=false)=>({type:'operation',operator,left,right,grouped});
  const value=ast=>formatFraction(evaluateExpressionAST(ast));
  assert.equal(value(op('add',op('subtract',n(28),n(9)),n(6))),'25');
  assert.equal(value(op('multiply',op('divide',n(24),n(6)),n(2))),'8');
  assert.equal(value(op('divide',op('add',n(12),n(8),true),n(4))),'5');
  assert.equal(value(op('add',n(12),op('divide',n(8),n(4)))),'14');
  assert.equal(value(op('subtract',n(20),op('subtract',n(8),n(3),true))),'15');
  assert.equal(value(op('subtract',n(70),op('subtract',n(28),n(8),true))),'50');
  assert.equal(value(op('subtract',op('subtract',n(20),n(8)),n(3))),'9');
  assert.equal(value(op('divide',n(48),op('divide',n(6),n(2),true))),'16');
  assert.equal(value(op('divide',op('divide',n(48),n(6)),n(2))),'4');
  assert.equal(expressionASTText(op('divide',op('add',n(12),n(8),true),n(4))),'(12 ＋ 8) ÷ 4');
});
