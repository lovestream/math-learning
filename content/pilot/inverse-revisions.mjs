// Parent-requested reverse reasoning, 2026-10-18. Reuse task IDs and reward rights.
// These are new assessments, not editorial-compatible changes to old answers.
import {chainInverse,boardMeasure} from '../../shared/length-model.mjs';
export const inverseVersion='2026-10-18.1';
const num=(prompt,expected,unit,solution,hint,diagram)=>({kind:'number',prompt,expected:String(expected),unit,solution,hint,...(diagram?{diagram}:{})});
const explain=(prompt,solution,hint,diagram)=>({kind:'explanation',prompt,solution,hint,...(diagram?{diagram}:{})});
export const inverseRevisions={
 'G3-U02-E01.r1':num('泡泡付出35元，又收到5元找零，最后还剩60元。泡泡原来有多少元？',90,'元','实际花了35−5＝30元；原来有60＋30＝90元。代回：90−(35−5)＝60元。','先把付款和找零合成净支出，再把已经花掉的补回去。'),
 'G3-U02-E02-P09':num('120支笔全部装盒，每盒5支。再把这些盒子平均装进8箱，正好装完。每箱有几盒？',3,'盒','先求一共120÷5＝24盒，再24÷8＝3盒。代回：5×3×8＝120支。','题目问每箱盒数，不是支数；先还原一共有几盒。'),
 'G3-U02-E04-P09':num('4个同样的盒子里，每盒有2袋糖。一共40颗糖，每袋的颗数都相同。每袋有多少颗？',5,'颗','一共有4×2＝8袋，40÷8＝5颗。也可先40÷4＝10颗每盒，再10÷2＝5颗。代回：4×(2×5)＝40颗。','先想先求总袋数，或先求每盒颗数；两条路线都要回到每袋。'),
 'G3-U02-O02-P09':num('用□表示一盒糖的颗数。3盒这样的糖和6颗散糖合起来有30颗，即3×□＋6＝30。每盒有多少颗糖？',8,'颗','先把6颗散糖拿走：30−6＝24颗；3盒平均分：24÷3＝8颗。代回：3×8＋6＝30颗。','□表示完整的一盒，先拿掉不在盒子里的散糖。'),
 'G3-U06-E01-P09':explain('同一条纸带平均分成4大格，前3大格涂蓝色。现在把每一大格再平均分成2小格，蓝色部分不变。整条有几小格，蓝色占几小格？用小格计数的分数是什么？','整条4×2＝8小格，蓝色3×2＝6小格，用6/8表示。反过来每2小格合成1大格，仍是涂3大格、共4大格，即3/4。同一整体和涂色长度都没变。','合并小格要除，反过来拆小格要乘；整体与蓝色部分必须一起拆。',{type:'fraction',parts:4,selected:3}),
 'G3-L03-E01-P09':num('两块相同的长方形纸片，每块周长20厘米。沿两块纸片上一样长的一整条边贴合，没有重叠，拼成的大长方形周长28厘米。贴合的那条边长多少厘米？',6,'厘米','原周长合计20＋20＝40厘米，减少40−28＝12厘米。贴合边在原来的两块纸片上各算过一次，所以12÷2＝6厘米。代回：40−6×2＝28厘米。','先求少了多少周长；少掉的是两条同样长的边，不是一条。',{type:'joined-perimeters',eachPerimeter:20,totalPerimeter:28}),
 'G3-LP01-E01-P09':explain('今天是星期六，17天前是星期几？“17天前”表示从今天往前退17个整天，不把今天额外算一天。','17＝7×2＋3，往前退两个整周还是星期六，再退3天：星期五、星期四、星期三。所以是星期三。向后17天又到星期六，可回查。','星期每7天循环；这次是往前退，不是往后走。'),
 'G3-U03-E01.r2':num('6块同样长的木板沿同一直线依次搭接，只有相邻两板重叠，没有三块叠在一起。每处重叠2厘米，拼好后的最外两端相距62厘米。每块木板长多少厘米？',12,'厘米','6块板有5处接头，重叠合计2×5＝10厘米。还原6块板的长度和：62＋10＝72厘米，再72÷6＝12厘米。代回：12×6−2×5＝62厘米。','先把少算的重叠补回材料合计，再平均分成6块。',{type:'measurement',mode:'boards',unknown:'pieceLength',count:6,totalMm:620,overlapsMm:[20,20,20,20,20]}),
 'G3-U03-E02.c4':num('4个相同链环依次扣接并拉直，不首尾闭合。每环外长50毫米，整条链最左外缘到最右外缘相距176毫米。每处接头重叠两个端部的厚度，金属条处处一样厚。金属条厚多少毫米？',4,'毫米','4个外长合计50×4＝200毫米，3处接头重叠合计200−176＝24毫米；每处24÷3＝8毫米，包含两段同厚的端部，所以8÷2＝4毫米。代回：50×4−(4＋4)×3＝176毫米。','先求所有接头合计重叠多少，再分到3处接头，最后一处还要分成两段厚度。',{type:'measurement',mode:'chain',pieceLengthMm:50,count:4,totalMm:176,unknown:'thickness'}),
 'G3-U03-E02.t2':num('6个相同链环依次扣接并拉直，不首尾闭合。金属条厚4毫米，每处接头重叠两段4毫米的端部。整条链最左外缘到最右外缘相距140毫米。一个链环的外长是多少毫米？',30,'毫米','6个环有5处接头，每处4＋4＝8毫米。先补回重叠：140＋8×5＝180毫米，得到6个环的外长和；180÷6＝30毫米。代回：30×6−8×5＝140毫米。','总长不是6个外长的和；先把5处接头的重叠补回，再除以6。',{type:'measurement',mode:'chain',thicknessMm:4,count:6,totalMm:140,unknown:'pieceLength'}),
 'algebra.substitution.intro.r2':{kind:'choice',prompt:'3盒相同的点心，每盒有1块饼干和同样多的糖。饼干和糖合起来共24件。每盒有几颗糖？',options:[{id:'1',text:'7颗'},{id:'2',text:'8颗'},{id:'3',text:'21颗'}],expected:'1',solution:'先求每盒共有24÷3＝8件点心，再减去每盒1块饼干，8−1＝7颗糖。8是每盒点心总件数，21是3盒糖总颗数，都不是每盒糖数。代回：3×(7＋1)＝24件。',hint:'先把“一盒点心”作为整体，再从一盒中去掉那1块饼干。'},
};
export const inverseLessonIds=new Set(Object.keys(inverseRevisions).map(id=>id.startsWith('algebra.')?'algebra.substitution.intro':id.split(/[.-](?=P\d|[crthw]\d)/)[0]));
export function applyInverseRevision(task){
 const revised=inverseRevisions[task.id];if(!revised)return task;
 const d=revised.diagram;
 if(d?.type==='measurement'&&d.unknown){
  // An authored answer is checked by the live mathematical model; it is not
  // generated from an unreviewed prompt or inferred from a drawing's scale.
  const unit=revised.unit==='厘米'?10:1,answer=Number(revised.expected)*unit;
  if(d.mode==='chain'){
   const solved=chainInverse({lengthMm:d.pieceLengthMm,thicknessMm:d.thicknessMm,count:d.count,totalMm:d.totalMm});
   if(answer!==(d.unknown==='thickness'?solved.thicknessMm:solved.lengthMm))throw Error(`逆向答案不符合模型：${task.id}`);
  }else if(boardMeasure(Array(d.count).fill(answer),d.overlapsMm).totalMm!==d.totalMm)throw Error(`逆向木板答案不符合模型：${task.id}`);
 }
 const {id,level}=task;
 const objectiveId=id.startsWith('G3-U03-E02.')?'chain.inverse':id==='G3-U03-E01.r2'?'overlap.inverse':task.objectiveId;
 return {id,level,objectiveId,...revised,responseSpec:{type:revised.kind==='explanation'?'self-explanation':revised.kind},diagnostic:revised.hint};
}
