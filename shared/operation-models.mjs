import {buildReverseAddMultiplyFlow} from './pilot-math.mjs';
export const operationModels={
  'G3-U02-E02':{type:'division-groups',total:48,groups:6,perGroup:2},
  'G3-U02-E03':{type:'wallet',start:60,pay:14,refund:6},
  'G3-U02-E04':{type:'laws',rows:3,cols:4,piles:[8,2,7]},
  'G3-U02-E05':{type:'split-array',rows:7,cols:8,cut:5},
  'G3-U02-O01':{type:'reverse',addend:7,multiplier:4,target:44},
  'G3-U02-O02':{type:'substitution',left:12,right:8,copies:3}
};
const integer=(v,min,max,label)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw Error(`${label}超出模型允许的范围。`);return v;};
export function measureOperationModel(model,state={}){
  if(model.type==='split-array'||model.type==='laws'){
    const rows=integer(state.rows??model.rows,1,9,'行数'),cols=integer(state.cols??model.cols,2,12,'列数'),cut=integer(state.cut??model.cut??1,1,cols-1,'切割线');
    const left=rows*cut,right=rows*(cols-cut);return {rows,cols,cut,left,right,total:left+right,missed:(rows-1)*(cols-cut)};
  }
  if(model.type==='division-groups'){
    const total=integer(model.total,1,1000,'总数'),groups=integer(model.groups,1,12,'组数'),perGroup=integer(model.perGroup,1,12,'每组人数');
    if(total%(groups*perGroup))throw Error('卡片必须能平均分给每个人。');
    return {total,groups,perGroup,people:groups*perGroup,perPerson:total/(groups*perGroup),firstShare:total/groups};
  }
  if(model.type==='wallet'){
    const start=integer(model.start,0,1000,'余额'),pay=integer(model.pay,0,start,'付款'),refund=integer(model.refund,0,pay,'退款');
    return {start,pay,refund,net:pay-refund,final:start-pay+refund,counterexample:start-pay-refund};
  }
  if(model.type==='reverse')return buildReverseAddMultiplyFlow(model.addend,model.multiplier,model.target);
  if(model.type==='substitution'){
    const left=integer(model.left,0,100,'红色数量'),right=integer(model.right,0,100,'蓝色数量'),copies=integer(model.copies,1,9,'盒数');
    return {left,right,copies,whole:left+right,total:(left+right)*copies,partial:left+right*copies};
  }
  throw Error('这个数学模型尚未注册。');
}
