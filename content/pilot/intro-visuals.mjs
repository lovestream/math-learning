// Authored KNOWN conditions, never numbers extracted from prose or answer diagrams.
import {introVisualTypes} from '../../shared/intro-visuals.mjs';
// The same object/face IDs are used by the later hands-on experiments.
const picture=(type,title,caption,values=[],labels=[])=>({type,title,caption,values,labels});
export const introVisuals={
 'G3-U01-B01':picture('box-camera','桌上这个盒子与拍照位置','盒子不动。先认清三个标记，再看相机站在哪里。'),
 'G3-U01-B02':picture('hidden-blocks','两种搭法：前排一样，后排不同','这是从斜上方看的搭法示意，不是机器人拍到的正面照片。'),
 'G3-U01-B03':picture('cube-net','六个面摊开后的编号','虚线是折痕。2号、3号、4号在同一行；折好后的关系留给你猜。'),
 'G3-UP01-B01':picture('cup-scale','秤上放的是杯子和水','图中读数是杯和水的总质量，水本身的质量还不知道。'),
 'G3-UP01-B02':picture('boat-replacement','同一只船：象上船与象下船','红线画在船身上；蓝线是水面。象下船后船浮高，船身红线也跟着上移。'),
 'G3-U02-E04':picture('dot-array','3袋珠子，排成3行4列','每个圆点是一颗珠子。这里只摆出原来的3行4列，还没有换位置。',[3,4]),
 'G3-U02-E05':picture('dot-array','教室的左右两区座位','每个圆点是一个座位；每排左5个、右3个，一共7排。',[7,8,5]),
 'G3-U02-O02':picture('groups','三盒一样的彩笔','每个盒子里12支红笔、8支蓝笔；问号表示三盒合起来的总数。',[3,12,8],['红笔','蓝笔']),
 'G3-U04-B01':picture('groups','每盒12支笔，买3盒','框是一盒，每盒同样12支；先看每盒，再想三盒合起来。',[3,12],['支笔']),
 'G3-U04-B02':picture('groups','16个一份，共有3份','每个框表示一组16根小棒。先看每组的根数，再思考三组怎样整理进数位表。',[3,16],['根小棒']),
 'G3-U04-B03':picture('groups','8箱饮料，每箱147瓶','图是分组示意，每箱标的是瓶数，没有把147瓶缩成一个瓶子的数量。',[8,147],['瓶']),
 'G3-U04-B04':picture('groups','8个区，每区604个座位','每个框是一个区，604表示这个区里的座位数，十位的0也保留。',[8,604],['个座位']),
 'G3-UP02-B01':picture('shelves','书架的位置可以变成地址','示意一个书架的4层、每层8格。编号表示位置，不表示这里有多少本书。',[4,8]),
 'G3-U05-B01':picture('lines','路线、光线与向两边延伸的线','实心点表示端点，箭头表示还可以沿这个方向延伸。',[5]),
 'G3-U05-B02':picture('angles','剪刀的张口','两把剪刀的刀片画得一样长，只改变张口；图中不标角度答案。',[25,65]),
 'G3-U05-B03':picture('angle-reference','把书本角贴到墙角','左边是书本的直角，右边是待比较的墙角。让两个顶点和一条边对齐，再判断。'),
 'G3-U06-B01':picture('fraction-strip','一块饼，平均分成4份','用纸带代替这块饼。四份一样大，蓝色表示其中一个人的那一份。',[4,1]),
 'G3-U06-B02':picture('fraction-strip','贴纸分8格，涂前3格','整条贴纸是一个整体；蓝色是已经涂好的部分。',[8,3]),
 'G3-U06-B03':picture('fraction-strip','同一块饼的两次取用','蓝色表示上午吃的2份，橙色表示下午吃的3份，每份都是这块饼的八分之一。',[8,2,3]),
 'G3-U06-B04':picture('fraction-collection','一盒12颗糖','大框表示这一整盒。先看清总数，再想平均分成3份；图中还没有替你分组。',[12,3,1],['糖']),
 'G3-U06-B05':picture('fraction-collection','24张贴纸是一个整体','大框是全部24张。需要平均分成8份，取其中3份；图中还没有分好。',[24,8,3],['贴纸']),
 'G3-U06-E01':picture('fraction-strip','同一条纸带：只改变看格子的方式','两幅图代表同一条纸带。细格与大格的线不同，蓝色部分的起点和终点没有移动。',[6,2,0,2]),
 'G3-U07-B01':picture('outfits','2种上衣、3种裤子','一次穿一件上衣和一条裤子。图中只列可选衣服，还没有替你配好所有套装。',[2,3]),
 'G3-L01-B01':picture('symmetry','沿中间折痕对折的窗花','虚线是准备对折的位置。两侧的图案是否能重合，要通过对折来检查。'),
 'G3-L01-B02':picture('movement','抽屉拉开与风车转动','箭头表示准备怎样移动：抽屉向外滑，风车绕中心转。'),
 'G3-L02-B01':picture('groups','90张纸，准备平分给3人','每捆是10张纸，9捆合计90张；三个人的框还空着。',[3,90],['张纸']),
 'G3-L02-B02':picture('groups','52颗糖，准备平分给4人','每捆表示10颗，散点表示1颗。下面四个分配框还没有放糖。',[4,52],['颗糖']),
 'G3-L02-B03':picture('groups','53颗糖，每4颗装一袋','每捆代表10颗，不是一个袋子；袋子每袋能装4颗，袋数暂时未知。',[0,53,4],['颗糖']),
 'G3-L02-B04':picture('groups','408本书，准备平分给4班','这里用数位记录总数：4个百、0个十、8个一。四个班的分配框还空着。',[4,408],['本书']),
 'G3-L03-B01':picture('frame-shapes','做相框之前，先看形状','长方形和正方形有四个直角；右边的斜菱形四边一样长，但角不同。',[7,4]),
 'G3-L03-B02':picture('rectangle','花坛的里面与外边一圈','红线表示准备装围栏的外边界。已知长8米、宽5米，围栏总长还不知道。',[8,5],['米']),
 'G3-L03-E01':picture('joined-squares','两个方形相框并排拼接','每块边长3厘米。虚线是两块之间的接缝，不是拼好后外边界上的一段。',[3],['厘米']),
 'G3-L04-B01':picture('area-grid','花坛：外面围一圈，里面铺满','红线表示围栏位置，绿色方格表示要铺砖的位置；两件事要数不同的量。',[3,4],['示意图，不代表题目另给了尺寸']),
 'G3-L04-B02':picture('area-grid','长6米、宽4米的地面','每个方格表示1平方米的方砖，地面要铺满；砖的总数留给你求。',[4,6],['每格1平方米']),
 'G3-L04-B03':picture('unit-square','边长1分米的方纸','每一小段是1厘米，每个小格是1平方厘米。两个方向都分成10段。',[10,10],['1分米＝10厘米']),
 'G3-LP01-B01':picture('calendar','两张真实的二月月历','2023年与2024年的二月：每格是一天，空格不算一天。',[2023,2024]),
 'G3-LP01-B02':picture('timeline','一天里的上午与下午','“3点”可以出现在上午或下午。图中标出两个位置，先认清说的是哪一个。',[0,3,12,15,24]),
 'G3-LP01-E01':picture('week-calendar','某月1日是星期二','只填好已知的1日；其他日期与星期的对应关系由你来排。'),
 'G3-L06-B01':picture('length-comparison','1米3分米的纸条','长的整段是1米，后面接3个1分米的小段。图上还没有写出用米表示的小数。',[100,130],['1米','1米3分米']),
 'G3-L06-B02':picture('length-comparison','在同一把米尺上比较跳高','两个标记分别是0.9米和0.85米。先看标记，再比较；尺子从同一个0开始。',[90,85],['0.9米','0.85米']),
 'G3-L07-B01':picture('overlapping-sets','两个小组里有相同的人','中间3个位置是两个组共有的人。读书组8人包含这3人，绘画组7人也包含这3人。',[8,7,3]),
};
// Explicit requirement list: new geometry lessons must declare an introductory picture.
export const graphicIntroRequired=Object.keys(introVisuals);
export const predictionVisuals=Object.fromEntries(['G3-U01-B01','G3-U01-B02','G3-U01-B03','G3-UP01-B01','G3-UP01-B02'].map(id=>[id,{...introVisuals[id],title:{'G3-U01-B01':'相机从前方移到右侧：新照片先不揭晓','G3-U01-B02':'后排由1块变成2块：哪种照片能看出变化？','G3-U01-B03':'只看展开图，先追踪2号与4号','G3-UP01-B01':'同一个米袋，换一种显示单位','G3-UP01-B02':'象下船以后，怎样用石块替代？'}[id]}]));
predictionVisuals['G3-UP01-B01'].caption='左边是原来的读数。右边仍是同一个米袋，只把显示单位换成千克；先猜质量是否改变。';
// These introductions ask about arithmetic or reasoning from fully stated data.
// Every other entrance must have authored objects, a canonical scene or a diagram.
export const textOnlyIntroLessonIds=new Set(['G3-U02-E03','G3-U02-E02','G3-U02-O01','G3-U04-B05','G3-U07-R01','G3-L02-B05','G3-L02-B06','G3-L05-B01','G3-L05-B02','G3-L06-B03','G3-L07-R01']);
export function validateIntroVisualCoverage(lessons){
 for(const lesson of lessons){
  if(!lesson.introVisual&&!lesson.mathScenes?.length&&!lesson.lengthScenes?.length&&!lesson.articleBlocks[0]?.diagram&&!textOnlyIntroLessonIds.has(lesson.lessonId))throw Error(`${lesson.lessonId} 的真实问题缺少对应图形或明确的文字题审核`);
  for(const spec of [lesson.introVisual,lesson.childClassroom?.storyVisual,lesson.childClassroom?.predictionVisual].filter(Boolean)){
   if(!introVisualTypes.has(spec.type)||!spec.title||!spec.caption||!Array.isArray(spec.values)||!spec.values.every(Number.isFinite))throw Error(`${lesson.lessonId} 图形规格不完整`);
   const v=spec.values;
   if(spec.type==='fraction-strip'&&(!Number.isInteger(v[0])||v[0]<1||v[1]<0||v[1]+(v[2]??0)>v[0]||(v[3]&&v[0]%v[3]!==0)))throw Error(`${lesson.lessonId} 纸带分组不符合整体`);
   if(spec.type==='overlapping-sets'&&(v[2]>v[0]||v[2]>v[1]||v.some(n=>n<0)))throw Error(`${lesson.lessonId} 共有部分超过小组人数`);
  }
  if(lesson.childClassroom&&lesson.introVisual&&(!lesson.childClassroom.storyVisual||!lesson.childClassroom.predictionVisual))throw Error(`${lesson.lessonId} 短课堂前两屏缺图`);
  if(lesson.childClassroom){const c=lesson.childClassroom;if(!c.story||!c.predictQuestion||c.predictionOptions.length<2||c.predictionOptions.length>3||!c.mission||!c.discovery.length||!c.symbols.length||!c.retell)throw Error(`${lesson.lessonId} 六步短课堂缺少教案`);}
 }
}
