// Closed 849-task final review, 2026-10-09. IDs and existing reward rights stay stable.
// Assessment changes require a new contentVersion; editorial fixes preserve old evidence.
export const assessmentRevisions = new Set(['G3-U02-B04','G3-U02-E01','G3-UP02-B01']);
export const formalTaskErrata = {
 'G3-U02-B02.h1': {prompt:'有4支散铅笔和3盒铅笔，每盒6支，用4＋3×6求总支数。为什么不能先算4＋3？'},
 'G3-U02-B03.w1': {prompt:'12颗红珠和8颗蓝珠全部装盒，每盒装4颗。要先求珠子总数再求盒数，第一步做什么？'},
 'G3-U02-B04.c2': {expected:'50-18+6=38',responseSpec:{type:'expression',preserveOperands:true,optionalResult:true,requiredOperators:['-','+']}},
 'G3-U02-E01.c2': {expected:'20-8+3=15',responseSpec:{type:'expression',preserveOperands:true,optionalResult:true,forbidBrackets:true,requiredOperators:['-','+']}},
 'G3-U02-E01.c4': {expected:'70-28+8=50',responseSpec:{type:'expression',preserveOperands:true,optionalResult:true,forbidBrackets:true,requiredOperators:['-','+']}},
 'G3-U02-E01.r2': {expected:'90-35+5=60',responseSpec:{type:'expression',preserveOperands:true,optionalResult:true,forbidBrackets:true,requiredOperators:['-','+']}},
 'G3-UP01-B02-P12': {
  options:[{id:'c0',text:'同船同水线，其他负载不变，称全部石块'},
   {id:'c1',text:'同船舱装满，其他负载不变，称全部石块'},
   {id:'c2',text:'同船同水线，其他负载不变，称最大石块'}],
  solution:'同一只船、同样的水环境、其他负载不变，放石块直到恢复原水线，再称船上全部石块并求和。同水线建立载重相等；船舱装满只比较体积；只称最大一块会漏掉其他替代物的质量。',
 },
 'G3-U04-B03-P06': {prompt:'一个两位数乘9，积是三位数。积的最高位数字一定是1吗？请举例说明。'},
 'G3-UP02-B01-P07': {kind:'explanation',expected:undefined,unit:undefined,responseSpec:{type:'self-explanation',rubric:['写出符合规定的四位编号','指出年级、班级、序号的字段']},editorialStatus:'parent-assessment'},
 'G3-U06-B01-P06': {solution:'不同。8厘米绳子的一半是4厘米，4厘米绳子的一半是2厘米。同样取一半，实际长度还要看原来的整根绳子有多长。'},
 'G3-U06-E01-P11': {solution:'可能。3/9与1/3表示同一根绳子相同的用量；如果两人说的是同一段，取用的起点和终点也应一致。即使用掉的小段分散在不同位置，3个九分之一合起来的总长度仍是整根的1/3，不能把“必须相邻”当作比例相等的条件。'},
 'G3-U06-E01-P12': {solution:'2/4是取两个四分之一，3/6是取三个六分之一，两者合起来的涂色总长度都是整条的一半。纸带一样长，所以涂色总长度一样。可以剪下涂色部分分别首尾拼齐，再把两段对齐比较；涂色不连续时，原来的位置和边界不必相同。'},
 'G3-L02-B06-P08': {solution:'甲需要20组，6表示每组6张；乙每组20张，6表示共有6组。两题都用120÷6，但“每组有几张”和“共有几组”的角色不同，所以商20分别表示20组和20张。'},
 'G3-L06-B03-P09': {solution:'2.3＋1.4＝3.7。小数点对齐后，十分之一与十分之一相加，整数与整数相加，才是在合并相同的计数单位。'},
};
export function applyFormalTaskErrata(task){
 const patched={...task,...formalTaskErrata[task.id]};
 // An expression task must describe the existing structural grading requirements.
 // No extra confirmation, unit selection or input step is added.
 if(patched.kind==='expression'&&patched.responseSpec?.preserveOperands){
  patched.prompt+=' 请保留题目原来的数字，写出完整改写式；如果计算结果，把结果写在等号后。';
 }
 if(patched.id.startsWith('G3-U06-B04-'))patched.diagnostic=patched.diagnostic.replace('分母表示等分成3组','分母表示平均分成几组');
 if(patched.id.startsWith('G3-L07-R01-'))patched.diagnostic=patched.diagnostic.replace('分别标出只属于左边、两边共有、只属于右边的部分。','先分别说清材料、包装、费用和时间，再检查是否满足活动需要。');
 if(patched.diagram?.type==='concept')patched.diagram={...patched.diagram,labels:patched.diagram.labels.map(label=>label===task.prompt?patched.prompt:label)};
 return patched;
}
