// Renewed after parent/child trial, 2026-10-17. Stable task IDs preserve reward rights.
// Only E01.w2 changes the assessed quantity/answer; all other edits clarify the existing model.
export const clarityVersion='2026-10-17.1';
export const correctedAssessments=new Map([['G3-U03-E01.w2',{lessonId:'G3-U03-E01',version:clarityVersion}]]);
export const clarityLessonIds=new Set(['G3-U03-E01','G3-U03-E02','G3-U03-O01','G3-U07-R01','G3-L06-B03','G3-L02-B06','G3-L03-B02','G3-L03-E01','G3-L07-R01','G3-L07-B01']);
export const clarityErrata={
 'G3-U07-R01-P04':{prompt:'两根绳子各长40厘米，沿同一直线搭接，中间重叠10厘米。拼好后，从最左端到最右端的距离是多少厘米？'},
 'G3-L06-B03-P05':{prompt:'两根绳子分别长2.4米和1.8米，沿同一直线搭接，中间重叠0.5米。拼好后，从最左端到最右端的距离是多少米？'},
 'G3-L02-B06-P04':{prompt:'小乐每小时走4千米，走3小时到达公园。沿同一路线返回，用2小时走完全程。返回时平均每小时走多少千米？',solution:'去程路程是4×3＝12千米。返回路程也为12千米，12÷2＝6，所以返回时平均每小时走6千米。'},
 'G3-L03-B02-P05':{prompt:'一根铁丝长20厘米，把整根铁丝弯成一个正方形，首尾相接，没有重叠，也没有剪去铁丝。正方形每条边长多少厘米？'},
 'G3-L03-E01-P12':{prompt:'两块图形沿一整条边贴合，没有重叠。求拼成图形的外周长时，为什么要从两块图形原周长的和中，减去共同边长度的两倍？'},
 'G3-L07-R01-P06':{prompt:'20人做手工，每人需3张纸。甲店每包10张4元，乙店每包8张3元，两店都只卖整包。只在一家买够所需的纸：两家各要买几包、花多少钱、剩几张？比较后，是否有一家花钱更少？'},
 'G3-L07-B01-P01':{prompt:'甲组5人，乙组4人，两组没有重复成员。把两组成员合在一起，一共有多少人？'},
 'G3-L07-B01-P02':{prompt:'甲、乙两组各有6人，其中2人同时属于两组。把两组成员合在一起，每人只数一次，一共有多少人？'},
 'G3-L07-B01-P04':{prompt:'全班20人，其中12人参加了画画或唱歌中的至少一项。画画、唱歌两项都没有参加的有多少人？'},
};
export function applyClarityErrata(task){
 const patch=clarityErrata[task.id];if(!patch)return task;
 const result={...task,...patch};
 if(task.diagram?.type==='concept')result.diagram={...task.diagram,labels:task.diagram.labels.map(label=>label===task.prompt?result.prompt:label)};
 return result;
}
