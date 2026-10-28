// Explicit editorial index of existing tasks. No prompt regex, new task identity or reward.
export const inverseTaskIndex=[
 {taskId:'G3-U02-E01.r1',lessonId:'G3-U02-E01',direction:'逆推',unknown:'原有金额',forwardCheck:'原有金额－实际花费＝余额'},
 {taskId:'G3-U02-E02-P09',lessonId:'G3-U02-E02',direction:'逆推',unknown:'每箱盒数',forwardCheck:'每盒支数×每箱盒数×箱数＝总支数'},
 {taskId:'G3-U02-E04-P09',lessonId:'G3-U02-E04',direction:'逆推',unknown:'每袋颗数',forwardCheck:'盒数×每盒袋数×每袋颗数＝总颗数'},
 {taskId:'G3-U02-O02-P09',lessonId:'G3-U02-O02',direction:'逆推',unknown:'每盒颗数',forwardCheck:'盒数×每盒颗数＋散糖＝总颗数'},
 {taskId:'G3-U06-E01-P09',lessonId:'G3-U06-E01',direction:'双向验证',unknown:'拆分后份数及分数',forwardCheck:'把小格按同样大小合回，整体与涂色长度都不变'},
 {taskId:'G3-L03-E01-P09',lessonId:'G3-L03-E01',direction:'逆推',unknown:'贴合边长',forwardCheck:'两块周长之和－贴合边长×2＝拼后周长'},
 {taskId:'G3-LP01-E01-P09',lessonId:'G3-LP01-E01',direction:'逆推',unknown:'原来的星期',forwardCheck:'从求出的星期向后走17天，应回到星期六'},
 {taskId:'G3-U03-E01.r2',lessonId:'G3-U03-E01',direction:'逆推',unknown:'每块木板长',forwardCheck:'单块长×块数－各接头重叠合计＝拼后两端距离'},
 {taskId:'G3-U03-E02.c4',lessonId:'G3-U03-E02',direction:'逆推',unknown:'金属条厚度',forwardCheck:'外长×环数－厚度×2×接头数＝整链长'},
 {taskId:'G3-U03-E02.t2',lessonId:'G3-U03-E02',direction:'逆推',unknown:'单环外长',forwardCheck:'外长×环数－厚度×2×接头数＝整链长'},
 {taskId:'algebra.substitution.intro.r2',lessonId:'algebra.substitution.intro',direction:'逆推',unknown:'每盒糖数',forwardCheck:'盒数×（每盒饼干＋每盒糖）＝全部点心'},
];
export const inverseClassroomId='G3-U02-O01';
export function inverseEntries(lessons){
 return inverseTaskIndex.flatMap(meta=>{const lesson=lessons.find(l=>l.lessonId===meta.lessonId);if(!lesson)return [];
  const found=Object.entries(lesson.taskSets).find(([,tasks])=>tasks.some(t=>t.id===meta.taskId));if(!found)throw Error('逆向索引任务不存在：'+meta.taskId);
  return [{...meta,title:lesson.shortTitle,set:found[0]}];
 });
}
