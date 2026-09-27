import fs from 'node:fs';
import path from 'node:path';
import { enrichLesson } from './course-framework.mjs';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const targetDir = path.join(root, 'content', 'grade-3');
const source = path.join(targetDir, 'legacy-seed.json');
fs.mkdirSync(targetDir, {recursive: true});

const LEVEL_LABEL = {warmup: '热身', core: '核心', transfer: '迁移', challenge: '挑战'};
const q = (id, prompt, answer, unit, h1, h2, explanation, misconception, level = 'core', representation = 'story') => ({
  id, prompt: '【' + LEVEL_LABEL[level] + '】' + prompt, answer, unit,
  hints: [h1, h2], explanation, misconception, level, representation
});

const oldIdeas = {
  'place-value': ['人为什么要把很多东西分组计数？', '位值把很多个对象压缩成可读、可比较的记号。'],
  'number-line': ['怎样记录不断增加或减少的数量？', '数轴把数量和方向放在一条可走的路上。'],
  arrays: ['重复的相同组怎样快速数完？', '乘法是等量重复的压缩，也能在阵列里看见分配。'],
  division: ['怎样公平地分东西？分不完怎么办？', '除法描述每组多少或能分几组，余数记录尚未成组的量。'],
  equality: ['两边怎样表示同样多？', '等号表示数量关系的平衡，不只是算出答案。'],
  'sum-difference': ['只知道总数和相差，怎样找出各自数量？', '把总量拆成相同部分与多出部分，问题就能反向还原。'],
  'sum-multiple': ['一份和几份合起来，怎样找出一份？', '总量对应若干份，先找到份数，再找到单位量。'],
  'difference-multiple': ['知道多出的几份，怎样找出一份？', '差量对应份数差，数量关系可以用份来度量。'],
  perimeter: ['怎样给一块地围上边界？', '周长只沿边界走一圈，长度和面积是不同的量。'],
  area: ['怎样比较一块地方有多大？', '用相同大小的小方格铺满，面积就能被数出来。'],
  planting: ['为什么树的棵数和间隔数不总是一样？', '先数间隔，再根据开头和结尾是否放树判断棵数。'],
  matchstick: ['图形一个接一个拼时，为什么增加量不一样？', '相邻图形会共享边，变化量来自没有共享的新部分。'],
  'patterns-parity': ['一堆东西能不能两两配完？', '奇偶性来自配对后是否留下一个，和具体大小无关。'],
  periods: ['重复出现的现象怎样预测？', '周期问题先找周期长度，再用余数定位。'],
  'pairing-sums': ['连续很多数怎样不用一个个相加？', '首尾配对保持和不变，把长清单变成重复结构。'],
  'age-invariant': ['年龄在变，哪些关系却不变？', '同时增加相同量，差保持不变，这是不变量思想。'],
  enumeration: ['怎样把所有可能列全而不重复？', '固定一个选择，再系统改变另一个选择，清单才可靠。'],
  'chicken-rabbit': ['只看到头和脚，怎样还原动物组合？', '先假设全是同类，再看每次替换带来的固定变化。'],
  reverse: ['只知道结果，怎样倒着找起点？', '逆运算把每一步撤销，倒推就是沿过程反向走。'],
  pigeonhole: ['为什么有些结果不用试完就能保证发生？', '对象比容器多时，至少一个容器必然装下两个。'],
  'fraction-meaning': ['一个整体怎样公平地分成几份？', '分数同时记录整体被等分成几份和取了几份。'],
  'fraction-compare': ['份数不同的分数怎样比较？', '比较分数要先确认整体相同，再比较取的份数或每份大小。'],
  'equivalent-fractions': ['同一部分为什么能写出不同分数？', '整体和取的部分同时细分，表示的量不变。'],
  'time-scale': ['钟表上的刻度怎样转成经过的时间？', '时间是有方向的量，跨刻度要数间隔而不是只看数字差。']
};

const common = {
  gradeBand: '三年级',
  learningCycle: '现实问题→数学对象→图形模型→符号语言→规律→迁移',
  assessment: ['能说清数量关系', '能选择合适表示', '能检查答案是否合理']
};

function enrichOld(lesson) {
  const idea = oldIdeas[lesson.id] || ['生活中的数量需要一种可交流的表示。', lesson.concept];
  return enrichLesson({
    ...lesson, ...common, origin: idea[0], mathIdea: idea[1],
    representations: ['生活情境', '图形或表格', '算式语言'],
    strand: lesson.world, sourceRefs: ['人教版三年级上、下册：思想线索参考'],
    story: '为什么要研究它？' + idea[0] + ' ' + lesson.story,
    discovery: '数学思想：' + idea[1] + ' ' + lesson.discovery,
    questions: lesson.questions.map((item, index) => ({
      ...item,
      level: item.level || ['warmup', 'core', 'transfer', 'challenge'][index],
      representation: item.representation || ['story', 'bar', 'equation', 'grid'][index],
      prompt: '【' + LEVEL_LABEL[item.level || ['warmup', 'core', 'transfer', 'challenge'][index]] + '】' + item.prompt
    }))
  });
}

function lesson(o) {
  return enrichLesson({
    id: o.id, world: o.world, title: o.title, subtitle: o.subtitle,
    kind: o.kind || 'foundation', minutes: o.minutes || 10, concept: o.concept,
    origin: o.origin, mathIdea: o.mathIdea, representations: o.representations,
    thinkingSkills: o.skills, story: o.story, discovery: o.discovery,
    steps: o.steps || ['先把问题说成自己的话。', '画出或操作一个模型。', '用算式表达并检查结果。'],
    takeaway: o.takeaway || o.discovery || o.mathIdea, lab: o.lab || 'table', labConfig: o.labConfig || {},
    prerequisites: o.prerequisites || [], sourceRefs: ['教材单元思想锚点：' + o.anchor],
    ...common,
    story: '为什么要研究它？' + o.origin + ' ' + o.story,
    discovery: '数学思想：' + o.mathIdea + ' ' + o.discovery,
    questions: o.questions.map(x => q(...x))
  });
}

const additions = [
  lesson({id:'counting-quantities',world:'numbers',title:'数数为什么有效',subtitle:'从一个一个对应到“有多少个”',anchor:'数学基础·数量与计数',concept:'数数建立对象与数词的一一对应；最后一个数词表示总数量，0表示没有对象。',origin:'人们交换物品、分配食物时，首先要知道眼前到底有多少个。',mathIdea:'自然数来自计数，数量、顺序和符号是逐步连接起来的。',representations:['实物计数','数词序列','数轴'],skills:['一一对应','基数意识'],story:'泡泡把散落的星石一个个放进格子，发现“数到最后”不是只记住最后一个声音，而是在记录总数。',discovery:'每数一个对象就前进一步；最后落脚的数词表示总量。',lab:'table',labConfig:{total:12,parts:3,mode:'table'},questions:[
  ['cq-1','七颗星石一个不漏地数完，最后一个数词表示共有多少颗？',7,'颗','每颗星石对应一个数词。','最后数到7。','共有7颗。','把最后一个数词当成最后一颗的编号。','warmup','count'],
  ['cq-2','盒子里没有星石，用哪个数表示数量？',0,'颗','没有对象就是空集合。','数学里用0表示没有。','数量是0颗。','把没有写成1。','core','count'],
  ['cq-3','数到99后再数一个，应该说什么数？',100,'','数词序列继续向前一步。','99的后继是100。','下一个数是100。','只把个位9再加1写成910。','transfer','numberline'],
  ['cq-4','从3数到8（包括3和8），一共数了几个数？',6,'个','把3、4、5、6、7、8列出来。','8−3+1。','一共6个数。','只做8−3漏掉起点。','challenge','numberline']
]}),
  lesson({id:'compare-order',world:'relations',title:'谁更多，谁更远',subtitle:'比较数量和比较位置都要有依据',anchor:'数学基础·比较与数轴',concept:'用一一对应、数轴位置和位值可以比较数量大小规律；差表示相差多少。',origin:'分东西、排队和安排路线都需要判断多、少、近、远。',mathIdea:'“大于”不是看数字长相，而是数量或位置关系的判断。',representations:['一一对应','数轴','位值表'],skills:['比较关系','差量'],story:'两队蛋仔争论谁收集的星石更多。Kevin 把星石配对，再把数量放到数轴上。',discovery:'比较可以靠对应，也可以靠位值；差把“多多少”变成一个数量。',lab:'numberline',labConfig:{a:4,b:9,total:12},prerequisites:['counting-quantities'],questions:[
  ['coo-1','307和370中，哪个数更大？',370,'','先比较百位，再比较十位。','7个十比0个十多。','370更大。','只看个位或数字顺序。','warmup','place-value'],
  ['coo-2','18比5多多少？',13,'','比较多多少用减法。','18−5。','多13。','把18+5当成相差。','core','bar'],
  ['coo-3','数轴上从4走到9，要走几格？',5,'格','数相邻刻度之间的间隔。','9−4。','要走5格。','把端点个数5和间隔混淆在别的题型中。','transfer','numberline'],
  ['coo-4','204、240、402中最小的数是多少？',204,'','先比较百位相同的两个数。','204的十位最小。','最小数是204。','只看数字总和。','challenge','place-value']
]}),
  lesson({id:'grouping-ten',world:'numbers',title:'十个一为什么变成一个十',subtitle:'分组让数量变得可读、可交换',anchor:'数学基础·十进制',concept:'十进制把10个同级单位换成1个更高一级单位；分组不改变总量，只改变记录方式。',origin:'逐个清点大量物品很慢，固定每十个成一组能让记录和交换更可靠。',mathIdea:'进位和退位本质是单位之间的等量替换。',representations:['十格框','位值表','展开式'],skills:['分组计数','单位替换'],story:'芽芽把十颗散星石装进一个十豆袋，又把十袋装进百箱。',discovery:'10个一=1个十，10个十=1个百，单位变了但总量不变。',lab:'table',labConfig:{a:346,b:10,total:346,parts:3,mode:'place-value'},prerequisites:['counting-quantities'],questions:[
  ['gt-1','10个一可以换成几个十？',1,'个','十个一组成一个十。','按一组十来换。','10个一=1个十。','把10个一写成10个十。','warmup','place-value'],
  ['gt-2','4个十和6个一合起来是多少？',46,'','4个十是40。','40+6。','合起来46。','把4和6相加成10。','core','place-value'],
  ['gt-3','86里面有几个十？',8,'个','看十位数字。','8个十表示80。','有8个十。','把十位8误答成80个十。','transfer','place-value'],
  ['gt-4','100里面有几个十？',10,'个','100可以分成10组十。','100÷10。','有10个十。','把100写成100个十。','challenge','group']
]}),
  lesson({id:'shape-language',world:'geometry',title:'图形也有自己的词汇',subtitle:'从物体轮廓认识点、边、角和面',anchor:'数学基础·图形语言',concept:'图形可以用边、顶点、角、面等结构描述；准确命名比只凭外观更可靠。',origin:'盖房、画图和制作物品需要共享一套描述形状的语言。',mathIdea:'几何把连续的世界抽象成可数、可比较的结构。',representations:['实物轮廓','平面图形','立体表面'],skills:['结构观察','几何语言'],story:'Kevin 看到盒子、三角旗和圆盘，发现“像不像”不够用，还要数边和角。',discovery:'先找结构，再给图形命名；一个图形可以同时属于多个类别。',lab:'geometry',labConfig:{a:6,b:4,mode:'geometry'},questions:[
  ['sh-1','三角形有几条边？',3,'条','三角形的名字提示三条边。','沿边界数一圈。','有3条边。','把顶点数当成边数。','warmup','shape'],
  ['sh-2','长方形有几个直角？',4,'个','四个角都一样大。','逐个数四个顶点。','有4个直角。','把边长4当成直角数量。','core','shape'],
  ['sh-3','正方形的4条边中，有几条和第一条边一样长？',3,'条','另外三条也相等。','不把第一条和自己比较。','有3条另外的等长边。','把4条都算作“另外的”。','transfer','shape'],
  ['sh-4','一个正方体有几个面？',6,'个','想象前后、左右、上下。','三组相对的面，每组2个。','正方体有6个面。','只数看得见的3个面。','challenge','solid']
]}),
  lesson({id:'viewpoint-models',world:'geometry',title:'同一个物体，为什么长得不一样',subtitle:'从不同方向观察，学会给信息换一个角度',anchor:'上册·观察物体',concept:'同一物体从不同方向观察会得到不同图形；三视图是在平面上记录立体信息的方式。',origin:'搭积木、看地图、读包装盒时，我们要把立体物体的信息交给没有站在现场的人。',mathIdea:'观察角度改变的是表示，物体本身并没有改变。',representations:['实物视角','平面图','立体想象'],skills:['空间想象','对应关系'],story:'泡泡把三个木盒摆在桌上。它和 Kevin 站在不同位置，却都说自己看到的图形才是“真的”。',discovery:'先固定物体，再移动观察者：视图是信息的投影，不是物体本身。',lab:'table',labConfig:{total:9,parts:3,mode:'table'},questions:[
  ['vm-1','一个盒子从正面、上面、右面各看到1个面，三次一共记录了几个“面视图”？',3,'个','每次只记录一个方向。','把三个不同方向相加。','1+1+1=3个视图。','把看到几个面和有几个视图混成一件事。','warmup','viewpoint'],
  ['vm-2','一个正方体有6个面，已经从3个互相垂直的方向观察过，还剩几个面没有被直接观察？',3,'个','总面数是6。','用6减去已经观察的3个。','6−3=3个。','把方向误当成所有面。','core','viewpoint'],
  ['vm-3','三块积木从正面看到的高度分别是2、1、3层，正面图中共有几层积木？',6,'层','正面图记录每列的高度。','把三列高度相加。','2+1+3=6层。','只取最高的一列。','transfer','bar'],
  ['vm-4','一个物体从上面看是4个小方格，从正面看也是4个小方格。至少可以确定它有几个小方格？',4,'个','两个视图都必须由同一批方格组成。','至少取两个视图中都需要的4个。','至少4格；只凭两个视图不能断定更多。','认为两个视图的方格要相加。','challenge','viewpoint']
]}),
  lesson({id:'symmetry-fold',world:'geometry',title:'对折以后，另一半去哪儿了',subtitle:'从生活图案发现轴对称',anchor:'下册·生活中的运动现象',concept:'沿一条直线对折后两边能够完全重合的图形是轴对称图形。',origin:'剪纸、窗花、叶片和脸部都在利用折过去能重合的结构。',mathIdea:'对称是一种不变性：翻到另一边，形状和距离关系仍然保持。',representations:['折纸','对称轴','网格镜像'],skills:['空间变换','不变性'],story:'芽芽只画出窗花的一半，想让另一半自动出现。它发现复制之前要先找到一条折痕。',discovery:'对称轴像镜子：每个点到轴的距离相等，方向相反。',lab:'geometry',labConfig:{a:6,b:4,mode:'geometry'},prerequisites:['viewpoint-models'],questions:[
  ['sf-1','一张纸沿中线对折，原来的1个整体被分成几部分？',2,'部分','一次对折会把整体分成两半。','数左右两边。','一次对折得到2个相等部分。','把折痕也当成一部分。','warmup','fold'],
  ['sf-2','一个对称图形左边有4个格子，右边会有几个对应格子？',4,'个','对称轴两侧完全对应。','右边数量与左边相同。','4个左侧格子对应4个右侧格子。','认为镜像会改变数量。','core','grid'],
  ['sf-3','正方形有4个顶点，沿一条对称轴折叠时，有几对顶点会与另一个顶点重合？',2,'对','对称轴两侧的顶点成对对应。','4个顶点两两配对。','4个顶点组成2对对应顶点。','把位于对称轴上的点也重复计算。','transfer','fold'],
  ['sf-4','一个图案有3条彼此不同的对称轴，每条轴上都能折出同一个图案，至少有几种不同折法？',3,'种','每条对称轴对应一种折法。','数对称轴。','有3条对称轴，就有3种折法。','把连续折叠的过程重复计数。','challenge','grid']
]}),
  lesson({id:'operation-meaning',world:'relations',title:'运算符号是在说什么',subtitle:'先读懂动作，再决定用哪种运算',anchor:'上册·混合运算',concept:'加、减、乘、除分别描述合并、比较差、等量重复和公平分配。',origin:'人们需要记录合并、拿走、重复和平均分配，运算才从动作中产生。',mathIdea:'运算不是四个孤立按钮，而是数量关系的语言。',representations:['动作故事','条形图','算式翻译'],skills:['语言建模','运算选择'],story:'星光仓库里有四扇门：合并门、比较门、重复门和分配门。',discovery:'先问数量发生了什么变化，再写运算符号。',lab:'bar',labConfig:{a:4,b:9,mode:'compare'},prerequisites:['place-value'],questions:[
  ['om-1','3袋星石，每袋4颗，又找到2颗，一共有多少颗？',14,'颗','先算3袋有多少颗。','再把2颗合并进去。','3×4+2=14颗。','把每袋4颗误写成3+4。','warmup','bar'],
  ['om-2','18颗糖平均分给3个伙伴，每个伙伴得到多少颗？',6,'颗','平均分用除法。','算18里面有几个3。','18÷3=6颗。','看到3个伙伴就直接做18−3。','core','group'],
  ['om-3','一本书原有25页，读了9页，还剩多少页？',16,'页','读掉的部分从总量中减少。','用25减9。','25−9=16页。','把读了9页误当成增加9页。','transfer','bar'],
  ['om-4','4盒彩笔，每盒6支，送出5支后还剩多少支？',19,'支','先求总支数，再减送出的。','4×6−5。','4×6−5=19支。','只做6−5，漏掉4盒。','challenge','bar']
]}),
  lesson({id:'mixed-operation',world:'relations',title:'一串算式，先做哪一步',subtitle:'用结构读混合运算',anchor:'上册·混合运算',concept:'含有乘除和加减的算式，要根据括号和运算关系确定顺序。',origin:'购物、路线和生产常把几步动作连在一起，需要约定大家都能读懂的顺序。',mathIdea:'运算顺序是共同语言，让同一串符号只对应一种过程。',representations:['分步流程','括号','算式树'],skills:['结构识别','过程追踪'],story:'泡泡收到一张没有标箭头的任务单：先装箱还是先加星石？',discovery:'先看括号，再看乘除，最后看加减；每一步都说清现在算的是什么。',lab:'table',labConfig:{total:12,parts:3,mode:'enumeration'},prerequisites:['operation-meaning'],questions:[
  ['mo-1','计算：3×4+2，先算乘法后结果是多少？',14,'','先算3×4。','12再加2。','3×4+2=14。','从左到右先算3+2。','warmup','flow'],
  ['mo-2','计算：(18−6)÷3，括号里的数先算，结果是多少？',4,'','先求18和6相差多少。','12平均分成3份。','(18−6)÷3=4。','忘记先算括号。','core','flow'],
  ['mo-3','4盒彩笔每盒6支，再平均分给2组，每组几支？',12,'支','先求4盒总数。','24÷2。','4×6÷2=12支。','直接用6÷2，漏掉盒数。','transfer','bar'],
  ['mo-4','小队有5人，每人收集7片叶子，后来又找到9片，平均放入4个篮子，每篮多少片？',11,'片','先求5×7+9。','最后除以4。','(5×7+9)÷4=11片。','把最后的除法提前。','challenge','flow']
]}),
  lesson({id:'length-measure',world:'numbers',title:'给长度找到合适的尺子',subtitle:'单位是测量世界的共同刻度',anchor:'上册·毫米、分米和千米',concept:'毫米、厘米、分米、米、千米是不同尺度的长度单位，换算依靠进率。',origin:'手、步、绳子会因人而异，统一单位让测量结果可以比较和复现。',mathIdea:'单位是数量的尺度；换单位就是换一把尺子。',representations:['实物估测','刻度尺','单位换算'],skills:['量感','单位意识'],story:'芽芽要给一条探险路线贴标签：米适合房间，千米适合城市，毫米适合纸片边缘。',discovery:'先判断尺度，再选择单位；换算时数量和单位一起变化。',lab:'numberline',labConfig:{a:0,b:10,total:20},prerequisites:['place-value'],questions:[
  ['lm-1','1米等于多少厘米？',100,'厘米','米和厘米相差100倍。','把1米分成100个1厘米。','1米=100厘米。','把进率记成10。','warmup','scale'],
  ['lm-2','3分米等于多少厘米？',30,'厘米','1分米=10厘米。','3个10厘米。','3×10=30厘米。','把分米当成厘米直接写3。','core','scale'],
  ['lm-3','2千米等于多少米？',2000,'米','1千米=1000米。','2个1000米。','2×1000=2000米。','只在数字后添一个0。','transfer','scale'],
  ['lm-4','4米6厘米一共是多少厘米？',406,'厘米','4米先换成400厘米。','再加6厘米。','400+6=406厘米。','把4米6厘米写成46厘米。','challenge','scale']
]}),
  lesson({id:'mass-equivalence',world:'numbers',title:'曹冲为什么能称象',subtitle:'用等量替换测量无法直接放上秤的东西',anchor:'上册·曹冲称象的故事',concept:'克和千克是质量单位；保持总质量相等，可以用可测量物体替换难以直接测量的对象。',origin:'大物体不能直接放进小秤，古人用同样下沉把难测量变成许多次可测量。',mathIdea:'等量替换把不可操作的问题变成可操作的问题，核心是保持关系不变。',representations:['天平','等量替换','单位换算'],skills:['守恒','替换策略'],story:'星星遇到一块不能搬上小秤的陨石，想起曹冲的办法。',discovery:'秤的是等量，不一定要把目标物直接放上秤。',lab:'balance',labConfig:{a:8,b:3,mode:'balance'},prerequisites:['length-measure'],questions:[
  ['me-1','3千克等于多少克？',3000,'克','1千克=1000克。','3个1000克。','3×1000=3000克。','把进率记成100。','warmup','balance'],
  ['me-2','2千克500克一共是多少克？',2500,'克','2千克先换成2000克。','再加500克。','2000+500=2500克。','把2千克500克写成205克。','core','scale'],
  ['me-3','4盒饼干，每盒250克，一共是多少千克？',1,'千克','先算4×250克。','1000克就是1千克。','4×250=1000克=1千克。','只算出1000后忘了换单位。','transfer','bar'],
  ['me-4','一块石头和6千克砝码平衡，拿走800克后还需放回多少克？',800,'克','拿走多少就补回多少。','平衡要求两边质量相等。','少了800克，补回800克即可。','把6千克减800克当成补回量。','challenge','balance']
]}),
  lesson({id:'multi-digit-multiply',world:'numbers',title:'把大阵列拆成小阵列',subtitle:'多位数乘一位数从位值和面积模型长出来',anchor:'上册·多位数乘一位数',concept:'多位数乘一位数可以按百、十、个分解，再把各部分积合并。',origin:'座位、箱子和砖块都按组重复，逐个数太慢，于是需要拆开计算。',mathIdea:'分配律让复杂计算拆成局部，再把局部合并。',representations:['点阵','位值分解','竖式'],skills:['分解重组','位值计算'],story:'泡泡要给24排座位各放3颗星石，把24拆成20和4。',discovery:'24×3=(20+4)×3=20×3+4×3。',lab:'array',labConfig:{a:4,b:6,mode:'multiply',total:24},prerequisites:['arrays','place-value'],questions:[
  ['mm-1','23×3等于多少？',69,'','把23拆成20和3。','60+9。','23×3=69。','把23×3写成23+3。','warmup','array'],
  ['mm-2','204×4等于多少？',816,'','200×4=800，4×4=16。','中间的0占住十位。','204×4=816。','漏掉个位4或把204看成24。','core','place-value'],
  ['mm-3','37×6等于多少？',222,'','30×6=180，7×6=42。','180+42。','37×6=222。','只乘个位。','transfer','array'],
  ['mm-4','125×8等于多少？',1000,'','100、20、5分别乘8。','800+160+40。','125×8=1000。','没有检查数量级。','challenge','array']
]}),
  lesson({id:'multiply-distributive',world:'patterns',title:'乘法的捷径从哪里来',subtitle:'用拆分、补偿和凑整减少计算',anchor:'上册·多位数乘一位数',concept:'利用分配律、交换律和结合律，可以把难算乘法改写成容易计算的等值算式。',origin:'算盘和心算都在寻找更短的路线：拆成好算部分，结果仍保持不变。',mathIdea:'改变表达式结构，不改变数量本身，这是代数思维的早期形式。',representations:['阵列切分','等值算式','凑整'],skills:['结构改写','灵活计算'],story:'星星发现99×5比100×5难算，于是先借一个整百再扣回来。',discovery:'99×5=(100−1)×5=500−5。',lab:'array',labConfig:{a:5,b:8,mode:'multiply',total:40},prerequisites:['multi-digit-multiply'],questions:[
  ['md-1','25×4等于多少？',100,'','4个25可以凑成100。','25+25+25+25。','25×4=100。','把25×4算成25+4。','warmup','array'],
  ['md-2','99×5等于多少？',495,'','把99看成100−1。','500−5。','99×5=495。','只算100×5没有补回。','core','array'],
  ['md-3','125×8等于多少？',1000,'','125×4=500，再乘2。','或拆成100、20、5。','125×8=1000。','错误取整。','transfer','array'],
  ['md-4','48×5等于多少？',240,'','48×10再除以2。','480÷2。','48×5=240。','把乘5当成加5。','challenge','array']
]}),
  lesson({id:'coding-information',world:'logic',title:'数字也能当作地址',subtitle:'把复杂信息编码成可读、可检查的数字',anchor:'上册·数字编码',concept:'编码用位置和规则表示类别、顺序或属性；编码中的数字不一定表示数量。',origin:'车牌、座位号、快递单和学号都需要信息短、唯一、容易查找。',mathIdea:'先读规则再解释数字；符号是否表示数量取决于所在系统。',representations:['编码表','位置值','分类规则'],skills:['规则阅读','信息压缩'],story:'探险岛给每颗星石贴了三位编码：颜色、大小、序号各占一位。',discovery:'编码的关键不是算出多大，而是每个位置约定了什么。',lab:'table',labConfig:{total:12,parts:3,mode:'enumeration'},prerequisites:['place-value'],questions:[
  ['ci-1','编码由颜色3种×大小4种组成，不考虑序号，最多有多少种组合？',12,'种','每种颜色都能和4种大小搭配。','3×4。','3×4=12种。','把3和4相加。','warmup','table'],
  ['ci-2','一个日期编码写成20260906，共有几位数字？',8,'位','2026、09、06分别是4、2、2位。','逐个数数字字符。','4+2+2=8位。','把年份当成一个整体只数一次。','core','code'],
  ['ci-3','三位密码每位可用0到9，允许重复，共有多少种密码？',1000,'种','每一位都有10种选择。','10×10×10。','10×10×10=1000种。','把三位数字相加。','transfer','tree'],
  ['ci-4','编码307中各位数字相加是多少？',10,'','把3、0、7相加。','0不会改变和。','3+0+7=10。','把307当成三百零七做别的运算。','challenge','place-value']
]}),
  lesson({id:'lines-angles',world:'geometry',title:'线把世界切出方向',subtitle:'从边界和转弯认识线段、直线和角',anchor:'上册·线和角',concept:'线段有两个端点，直线向两端延伸，角由顶点和两条边组成。',origin:'道路、墙角、折痕和钟表指针都需要描述方向和转弯。',mathIdea:'几何先研究关系和形状，再研究长度。',representations:['实物边缘','线段图','角的张口'],skills:['抽象图形','空间语言'],story:'芽芽沿着地图边界走，发现有的线有尽头，有的可以继续延伸，转弯处出现了一个张口。',discovery:'边是线段，转弯形成角；先辨认对象，再测量它。',lab:'geometry',labConfig:{a:7,b:4,mode:'geometry'},prerequisites:['viewpoint-models'],questions:[
  ['la-1','直角是多少度？',90,'度','直角是四分之一圈。','一整圈360度。','360÷4=90度。','把直角和180度平角混淆。','warmup','angle'],
  ['la-2','长方形有4个直角，4个直角一共是多少度？',360,'度','每个直角90度。','4×90。','4×90=360度。','把4个角当成4度。','core','angle'],
  ['la-3','从一个点向外画出3条射线，能组成几个不同的角？',3,'个','两条射线确定一个角。','三条射线两两配对。','三条射线两两组合得到3个角。','只数射线条数。','transfer','angle'],
  ['la-4','4个点中任意两点连一条线段，最多能得到几条不同线段？',6,'条','每条线段由一对点决定。','4×3÷2。','4×3÷2=6条。','把AB和BA重复计算。','challenge','graph']
]}),
  lesson({id:'fraction-quantity',world:'fractions',title:'分数可以去量一堆东西',subtitle:'从分数条走向一个数的几分之几',anchor:'上册·分数的初步认识',concept:'求一个数量的几分之几，先按分母平均分，再按分子取份。',origin:'配方、路程和分配常需要取一个量的一部分，不能只停留在涂色图上。',mathIdea:'分数不只描述形状，也能作用在数量上。',representations:['数量条','分组模型','除乘算式'],skills:['模型迁移','分步计算'],story:'探险队带了24颗能量豆，要取总数的2/3给导航器。',discovery:'先求一份，再求几份：24的2/3=24÷3×2。',lab:'fraction',labConfig:{a:2,parts:3},prerequisites:['fraction-meaning','arrays'],questions:[
  ['fq-1','18颗星石的1/3是多少颗？',6,'颗','先平均分成3份。','18÷3。','18÷3=6颗。','把18除以1或乘3。','warmup','fraction'],
  ['fq-2','20米路程的2/5是多少米？',8,'米','先求1/5。','20÷5×2。','20÷5×2=8米。','只算1/5。','core','fraction'],
  ['fq-3','30页故事书读了2/3，还剩多少页？',10,'页','先求读了20页。','总页数减去读了的。','30÷3×2=20，剩10页。','把2/3当成剩下部分。','transfer','bar'],
  ['fq-4','一篮水果36个，先拿走1/4，又拿走剩下的1/3，共拿走多少个？',18,'个','第一次9个，剩27个。','第二次27÷3=9个。','9+9=18个。','第二次仍按原总数36的1/3计算。','challenge','bar']
]}),
  lesson({id:'division-algorithm',world:'numbers',title:'把大数公平分组',subtitle:'一位数除法是反复分配和位值的记录',anchor:'下册·除数是一位数的除法',concept:'除数是一位数的除法可以按百、十、个逐步分配；商写在对应数位。',origin:'大量物品要按相同规则分组，逐个分太慢，于是人们把分组过程写成竖式。',mathIdea:'竖式是从高位开始分配、把剩余带下去的流程图。',representations:['分组物','位值分解','除法竖式'],skills:['算法理解','位值追踪'],story:'仓库有432颗星石，要平均装进4个箱子。泡泡先分百，再分十，最后分个。',discovery:'每一步都在问当前这一级平均给每组多少。',lab:'array',labConfig:{total:32,b:4,mode:'remainder'},prerequisites:['division'],questions:[
  ['da-1','96÷3等于多少？',32,'','90÷3=30，6÷3=2。','用分组图检查。','96÷3=32。','把96÷3算成96−3。','warmup','group'],
  ['da-2','432÷4等于多少？',108,'','400÷4=100，32÷4=8。','合起来是108。','432÷4=108。','把432看成42。','core','place-value'],
  ['da-3','738÷3等于多少？',246,'','用乘法246×3检查。','商的每一位都要有意义。','246×3=738，所以商246。','只做73÷3而忘记个位。','transfer','group'],
  ['da-4','250÷5等于多少？',50,'','25÷5=5，再考虑末尾0。','5个50是250。','250÷5=50。','去掉末尾0后忘记补回。','challenge','place-value']
]}),
  lesson({id:'division-remainder',world:'numbers',title:'余数在告诉我们什么',subtitle:'分不完的部分也有规则',anchor:'下册·除数是一位数的除法',concept:'有余数除法表示装满若干组后剩下多少，余数必须小于除数。',origin:'物品、座位和轮班不能整齐分完时，剩下的量决定下一步安排。',mathIdea:'余数是周期、分组和整除关系的证据。',representations:['分组','余数图','乘加关系'],skills:['余数解释','条件检查'],story:'27颗星石每4颗装一袋，装满6袋后还剩3颗。',discovery:'被除数=除数×商+余数，余数必须比除数小。',lab:'array',labConfig:{total:27,b:4,mode:'remainder'},prerequisites:['division-algorithm'],questions:[
  ['dr-1','27÷4的商是多少？',6,'组','4×6=24。','还能装满6组。','27÷4=6余3，商是6。','把余数3误当商。','warmup','group'],
  ['dr-2','27÷4的余数是多少？',3,'个','装满6组用了24个。','27−24。','余数是3。','写成余数4，违反余数小于除数。','core','group'],
  ['dr-3','每辆车坐5人，23人至少需要几辆车？',5,'辆','23÷5=4余3。','剩下的人也要一辆车。','需要5辆。','把商4直接当车辆数。','transfer','story'],
  ['dr-4','一个数除以6，商7，余数4，这个数是多少？',46,'','被除数=除数×商+余数。','6×7+4。','6×7+4=46。','只算6×7。','challenge','equation']
]}),
  lesson({id:'perimeter-area-bridge',world:'geometry',title:'围一圈和铺满地是两种量',subtitle:'同一块地，边界和内部要用不同方法描述',anchor:'下册·长方形和正方形、图形的面积',concept:'周长是边界一周长度，面积是内部大小；同一形状可以分别研究两者。',origin:'围栏要买边界长度的材料，铺地要买覆盖内部的材料。',mathIdea:'区分对象是建模的第一步：沿边走和铺满格子不是一件事。',representations:['围栏','方格','长方形公式'],skills:['量的区分','模型选择'],story:'数学工坊要给花园围栏，还要铺地砖。芽芽发现绕一圈和铺满得到的数字不同。',discovery:'周长沿边界，面积看内部，单位也不同。',lab:'geometry',labConfig:{a:8,b:5,mode:'geometry'},prerequisites:['perimeter','area'],questions:[
  ['pab-1','长8米、宽5米的长方形花园，周长是多少米？',26,'米','两条长加两条宽。','2×(8+5)。','周长26米。','把长×宽当周长。','warmup','geometry'],
  ['pab-2','同一个花园的面积是多少平方米？',40,'平方米','面积是长×宽。','8×5。','面积40平方米。','把面积写成26平方米。','core','grid'],
  ['pab-3','正方形边长6米，周长是多少米？',24,'米','四条边一样长。','6×4。','周长24米。','只算两条边。','transfer','geometry'],
  ['pab-4','6×4方格长方形沿中线分成两个相同图形，每个面积是多少平方格？',12,'平方格','总面积24平方格。','平均分成2份。','每个12平方格。','把每个图形周长当面积。','challenge','grid']
]}),
  lesson({id:'area-decomposition',world:'geometry',title:'剪开、拼回，面积不会消失',subtitle:'用分割和添补处理不规则图形',anchor:'下册·图形的面积',concept:'图形分割或拼接时，若没有重叠和空缺，总面积保持不变。',origin:'铺地、裁纸和设计窗台常遇到缺角形状，要拆成可数的部分。',mathIdea:'分解与重组是几何中的守恒思想：换形状不一定换面积。',representations:['方格图','分割线','长方形'],skills:['分割添补','守恒'],story:'一块L形花圃没有现成长方形公式，泡泡先补出大长方形再扣掉缺口。',discovery:'补进去和扣掉的部分必须标记清楚，面积才不会重复。',lab:'geometry',labConfig:{a:7,b:5,mode:'geometry'},prerequisites:['perimeter-area-bridge'],questions:[
  ['ad-1','一个5×4长方形面积是多少平方格？',20,'平方格','每行5格，共4行。','5×4。','面积20平方格。','把5+4当面积。','warmup','grid'],
  ['ad-2','L形由5×4和3×2两个不重叠长方形组成，面积是多少平方格？',26,'平方格','先算20和6。','不重叠所以相加。','5×4+3×2=26。','把边长相加。','core','grid'],
  ['ad-3','大长方形面积30平方格，挖去6平方格缺口，剩下多少？',24,'平方格','缺口从总面积减去。','30−6。','剩下24平方格。','把缺口再加一次。','transfer','grid'],
  ['ad-4','把24平方格拼成3个面积相同的图形，每个面积是多少？',8,'平方格','平均分成3份。','24÷3。','每个8平方格。','把24−3或24×3。','challenge','grid']
]}),
  lesson({id:'data-table',world:'logic',title:'先收集，再让数据说话',subtitle:'从一堆记录到表格和结论',anchor:'下册·数据的收集与整理',concept:'数据要按同一标准收集、分类、计数和整理，结论要回到数据证据。',origin:'调查水果、记录天气和统计运动次数，都需要把零散观察变成可比较信息。',mathIdea:'表格固定了谁、多少和比较什么。',representations:['计数符号','表格','条形图'],skills:['分类整理','证据表达'],story:'四个伙伴口头报告喜欢的水果，记录很快乱成一团。Kevin 设计表格让每个答案都有位置。',discovery:'同一类别只计一次，表头要说明对象和单位。',lab:'table',labConfig:{total:12,parts:3,mode:'table'},prerequisites:['enumeration'],questions:[
  ['dt-1','三类水果分别有8、5、7人喜欢，一共调查了多少人？',20,'人','把三类人数相加。','8+5+7。','一共20人。','只取最多的一类。','warmup','table'],
  ['dt-2','上题中喜欢人数最多和最少的水果相差多少人？',3,'人','最多8，最少5。','8−5。','相差3人。','把5和7比较。','core','table'],
  ['dt-3','一周运动次数为2、4、3、4、1、4、2，出现最多的数字是几？',4,'次','数每个数字出现次数。','4出现3次。','出现最多的是4。','把总次数14当答案。','transfer','table'],
  ['dt-4','条形图每格代表2人，某柱高6格，表示多少人？',12,'人','每格2人，共6格。','2×6。','表示12人。','把柱高6当人数。','challenge','bar']
]}),
  lesson({id:'calendar-cycles',world:'patterns',title:'日历上藏着周期',subtitle:'用7天循环预测日期',anchor:'下册·年、月、日的秘密',concept:'一周7天形成周期；日期推移可以用整周和余数描述。',origin:'安排课程、旅行和轮班都要预测未来某天，日历把循环规律公开出来。',mathIdea:'周期本质是走了多少个完整周期，还剩几步。',representations:['日历','时间轴','余数'],skills:['周期建模','跨单位计算'],story:'探险队每7天补给一次。泡泡把日期差拆成整周和余数。',discovery:'差7天星期不变，差1天星期前进一格。',lab:'table',labConfig:{total:28,parts:7,mode:'period'},prerequisites:['time-scale'],questions:[
  ['cc-1','2024年是闰年，全年有多少天？',366,'天','闰年比平年多一天。','平年365天。','闰年366天。','把闰年也写成365天。','warmup','calendar'],
  ['cc-2','4月有多少天？',30,'天','4月是小月。','小月有30天。','4月30天。','把所有月份都记成31天。','core','calendar'],
  ['cc-3','3周一共有多少天？',21,'天','1周7天。','3×7。','3周21天。','把3周写成3天。','transfer','calendar'],
  ['cc-4','若1月1日是星期一，7天后是星期几？约定星期一编号为1。',1,'星期序号','7天正好一个周期。','星期回到起点。','7天后仍是星期一，编号1。','把7天后当成星期日。','challenge','period']
]}),
  lesson({id:'decimal-money',world:'fractions',title:'小数把一元钱继续分下去',subtitle:'从元角分理解十分位和小数点',anchor:'下册·小数的初步认识',concept:'小数表示把1平均分成10份或100份后的量，小数点分开整数和小数部分。',origin:'钱、长度和重量经常不够一个完整单位，元角分让不到1元也能精确记录。',mathIdea:'小数是十进分割后的记号，与分数和位值系统相连。',representations:['货币','十格条','小数位值'],skills:['单位连接','位值迁移'],story:'商店里一支笔3元5角，收银台要把它写成一个数。',discovery:'小数点左边是完整元，右边第一位是角。',lab:'fraction',labConfig:{a:5,parts:10},prerequisites:['fraction-meaning'],questions:[
  ['de-1','3元5角写成多少元？',3.5,'元','5角是0.5元。','3+0.5。','3元5角=3.5元。','把3元5角写成35元。','warmup','money'],
  ['de-2','0.7元和0.2元合起来是多少元？',0.9,'元','十分位相加7+2。','0.7+0.2。','合起来0.9元。','小数点没有对齐。','core','decimal'],
  ['de-3','1.2米比0.5米长多少米？',0.7,'米','同单位直接相减。','1.2−0.5。','长0.7米。','只算整数部分。','transfer','decimal'],
  ['de-4','2元8分写成多少元？',2.08,'元','8分是0.08元，要保留百分位。','2+0.08。','2元8分=2.08元。','漏掉十分位的0写成2.8元。','challenge','money']
]}),
  lesson({id:'motion-transformations',world:'geometry',title:'图形会平移、旋转和翻折',subtitle:'用动作描述图形怎样变化',anchor:'下册·生活中的运动现象',concept:'平移保持形状和方向，旋转改变方向，翻折产生镜像；运动前后图形大小保持。',origin:'风车、滑梯、推拉门和剪纸都在展示图形的运动。',mathIdea:'研究变化时要区分变了什么和保持什么。',representations:['动作动画','网格','对应点'],skills:['变换观察','保持量'],story:'游乐场的风车转起来，滑梯沿直线移动，窗花沿折痕翻过去。',discovery:'变换可以改变位置或方向，但不会凭空改变图形的大小。',lab:'table',labConfig:{total:20,parts:4,mode:'period'},prerequisites:['viewpoint-models'],questions:[
  ['mt-1','图形旋转半圈是几度？',180,'度','一整圈360度。','360÷2。','半圈180度。','把半圈和四分之一圈混淆。','warmup','rotation'],
  ['mt-2','图形旋转四分之一圈是几度？',90,'度','一整圈分成4份。','360÷4。','四分之一圈90度。','写成45度。','core','rotation'],
  ['mt-3','平移一个图形5格后，图形的面积改变多少？',0,'平方格','平移只改变位置。','大小保持。','面积改变0平方格。','把移动距离当面积变化。','transfer','grid'],
  ['mt-4','先向右平移3格，再向左平移3格，最后离起点几格？',0,'格','方向相反的位移抵消。','3−3。','最后回到起点，距离0格。','把两段路程相加。','challenge','numberline']
]}),
  lesson({id:'factors-multiples',world:'patterns',title:'数可以被怎样整齐分组',subtitle:'从分组和余数发现因数与倍数',anchor:'教材目录思想延展·数与运算',concept:'若一个数能被另一个数整除，后者是前者的因数，前者是后者的倍数。',origin:'排座位、装箱和制作方阵时，人们关心哪些数量能恰好分组。',mathIdea:'整除关系把乘法、除法和数的结构连接起来，是数论的入口。',representations:['阵列','因数对','整除检验'],skills:['结构分类','整除意识'],story:'24颗星石可以排成1×24、2×12、3×8、4×6的方阵。',discovery:'因数成对出现，乘法和除法是同一关系的两种读法。',lab:'array',labConfig:{total:24,b:4,mode:'remainder'},prerequisites:['arrays','division'],kind:'thinking',questions:[
  ['fx-1','12÷3的商是多少？',4,'','3×4=12。','商是另一条因数。','12÷3=4。','把除数3当成商。','warmup','array'],
  ['fx-2','24排成3行，每行几个？',8,'个','24÷3。','3×8=24。','每行8个。','把3行当成每行3个。','core','array'],
  ['fx-3','小于30的5的正倍数有几个？',5,'个','列出5、10、15、20、25。','题目说小于30。','共有5个。','把0也算成正倍数。','transfer','period'],
  ['fx-4','一个数除以4余1，哪个数可能是它：17、18、20？请填选项序号（17为1）。',1,'号','逐个看除以4的余数。','17=4×4+1。','选项序号1。','只看个位不验证。','challenge','group']
]}),
  lesson({id:'estimation-check',world:'numbers',title:'先估一估，答案才有方向',subtitle:'估算不是随便猜，是带着数量级检查',anchor:'教材目录思想延展·数感',concept:'估算用接近的整十或整百替代精确数，快速判断结果范围。',origin:'购物预算、路程时间和仓库盘点常不需要精确到个位，但需要及时发现错误。',mathIdea:'估算把复杂问题压缩成可比较的尺度，是数学判断力的一部分。',representations:['数轴','近似数','范围'],skills:['数量级','合理性检查'],story:'商店结账前，泡泡先在脑中估计总价，避免把18元算成180元。',discovery:'估算不是精确答案，却能告诉我们精算是否值得相信。',lab:'numberline',labConfig:{a:0,b:10,total:20},prerequisites:['place-value'],questions:[
  ['ec-1','198+304估算到百位约是多少？',500,'','198约200，304约300。','200+300。','约500。','把198约成100。','warmup','numberline'],
  ['ec-2','49×6估算到整十约是多少？',300,'','49约50。','50×6。','约300。','把49约成40。','core','numberline'],
  ['ec-3','602−298估算到百位约是多少？',300,'','602约600，298约300。','600−300。','约300。','直接写精确差。','transfer','numberline'],
  ['ec-4','97÷3的商大约是几十？填最接近的整十数。',30,'个','97约100，商约33。','最接近30。','最接近30。','把估算当精确商32。','challenge','numberline']
]}),
  lesson({id:'counting-combinations',world:'logic',title:'选择可以画成树',subtitle:'把一个接一个的选择变成乘法',anchor:'下册·数据整理、教材目录思想延展·搭配',concept:'若每个第一步选择都能和每个第二步选择搭配，组合总数等于各步选择数相乘。',origin:'穿衣、点餐、路线和密码都要求把多个选择系统地组合起来。',mathIdea:'乘法不仅表示重复数量，也表示独立选择的组合数。',representations:['树状图','列表','乘法'],skills:['系统计数','乘法迁移'],story:'Kevin 有3种帽子和2种围巾，泡泡先固定一顶帽子，再接上两条分支。',discovery:'每一顶帽子都拥有同样多的围巾选择，所以可以用3×2。',lab:'table',labConfig:{total:9,parts:3,mode:'enumeration'},prerequisites:['enumeration'],kind:'thinking',questions:[
  ['co-1','2种口味和3种配料，每种口味都能配任意配料，有多少种搭配？',6,'种','每种口味有3种配料。','2×3。','共有6种。','把2和3相加。','warmup','tree'],
  ['co-2','3件上衣和2条裤子共有多少种穿法？',6,'种','每件上衣都能配2条裤子。','3×2。','共有6种。','只数一类衣物。','core','tree'],
  ['co-3','家到公园2条路，公园到学校3条路，共有多少条不同路线？',6,'条','每条第一段都能接3条第二段。','2×3。','共有6条。','把两段路线相加。','transfer','tree'],
  ['co-4','3×3个点组成的方格网中，从左上角点到右下角点，只能向右或向下，最短路线有几条？',6,'条','要走2次右和2次下。','4步中选2步向右。','共有6条。','把所有乱走路线也算进去。','challenge','path']
]}),
  lesson({id:'reverse-thinking',world:'logic',title:'把过程倒放',subtitle:'用逆运算找回未知的起点',anchor:'教材目录思想延展·问题解决',concept:'加减、乘除互为逆运算；倒推时从结果开始按相反顺序撤销每一步。',origin:'解密码、查账和修复错误记录时，人们常知道结果却要找回起点。',mathIdea:'过程可以正着执行，也可以反着还原，这是方程和算法的共同思想。',representations:['流程箭头','逆运算','检查链'],skills:['倒推','结果验证'],story:'星星把一个数经过两道门变成36，却忘了起点。',discovery:'倒推顺序与正推相反，每一步都用相反运算。',lab:'balance',labConfig:{a:8,b:3,mode:'unknown-addend'},prerequisites:['reverse'],kind:'thinking',questions:[
  ['rt-1','一个数加15后变成42，这个数是多少？',27,'','倒过来做减法。','42−15。','42−15=27。','仍然做42+15。','warmup','flow'],
  ['rt-2','一个数乘3后变成36，这个数是多少？',12,'','乘法的逆运算是除法。','36÷3。','36÷3=12。','用36−3。','core','flow'],
  ['rt-3','一篮水果拿走7个后还剩18个，原来有多少个？',25,'个','把拿走的加回来。','18+7。','原来25个。','再减7得到更小的数。','transfer','bar'],
  ['rt-4','一个数先加6，再乘2，结果30。原数是多少？',9,'','先撤销乘2：30÷2。','再撤销加6：15−6。','原数9。','按正向顺序先减6再除2。','challenge','flow']
]}),
  lesson({id:'invariant-relations',world:'patterns',title:'有些关系不会变',subtitle:'同时变化，差和总量的规律仍在',anchor:'教材目录思想延展·数学关系',concept:'两个量同时增加或减少相同数，差不变；一个量增加另一个量减少相同数，总和不变。',origin:'年龄、队伍和物品转移中，数字一直变，但关系可能保持稳定。',mathIdea:'不变量是复杂问题的锚点：先找不会变的量，再追踪变化。',representations:['时间线','条形图','变化箭头'],skills:['寻找不变量','关系推理'],story:'两只蛋仔一起长大，年龄在变，但年龄差像一根不会松的绳子。',discovery:'变化不等于所有关系都变化，先比较变化量再找保持量。',lab:'balance',labConfig:{a:8,b:3,mode:'balance'},prerequisites:['age-invariant'],kind:'thinking',questions:[
  ['ir-1','哥哥12岁，妹妹8岁，4年后两人的年龄差是多少岁？',4,'岁','两人都增加4岁。','12−8。','年龄差仍是4岁。','把4年加进年龄差。','warmup','timeline'],
  ['ir-2','两个数相差7，两数同时加3，新的差是多少？',7,'','两边一起加，间隔不变。','差仍为7。','新差仍为7。','把差也加3。','core','bar'],
  ['ir-3','篮子里15个红球和9个蓝球，拿走2个红球并放入2个蓝球，总数改变多少？',0,'个','拿走2个又放入2个。','一减一加抵消。','总数改变0个。','只看到拿走。','transfer','balance'],
  ['ir-4','甲比乙多12，甲减少5、乙增加5，新的差是多少？',2,'','差减少两个5。','12−5−5。','新的差是2。','只减一个5得到7。','challenge','bar']
]}),
  lesson({id:'optimization-modeling',world:'geometry',title:'同样的材料，怎样安排更合适',subtitle:'把最大、最省、最公平变成可比较的模型',anchor:'教材目录思想延展·问题解决',concept:'在总长度、总数或面积固定时，不同安排会产生不同结果；系统比较才能找到最优。',origin:'围栏、分组、铺地和路线设计都不只问能不能，还问怎样更省、更大、更均匀。',mathIdea:'最优化先明确目标和限制，再系统比较可行方案。',representations:['方案表','方格图','比较量'],skills:['条件建模','方案比较'],story:'花园有20米围栏，泡泡想围出面积尽可能大的长方形，于是画出方案表。',discovery:'周长固定时，边长越接近，面积通常越大。',lab:'geometry',labConfig:{a:6,b:4,mode:'geometry'},prerequisites:['area-decomposition','patterns-parity'],kind:'thinking',questions:[
  ['op-1','用20根1米小棒围成长方形，边长为整数，面积最大是多少？',25,'平方米','长+宽=10。','5×5。','面积最大25平方米。','把周长当面积。','warmup','grid'],
  ['op-2','24颗星石平均分成3组，每组多少颗？',8,'颗','公平分配用除法。','24÷3。','每组8颗。','把24−3。','core','group'],
  ['op-3','6×4方格剪成两个面积相同长方形，每个面积多少？',12,'平方格','总面积24。','平均分2份。','每个12平方格。','把6和4直接平均。','transfer','grid'],
  ['op-4','用12米围成长方形，边长为整数，面积可能是5、8、9中的最大值是多少？',9,'平方米','长+宽=6。','最接近3和3。','最大值9平方米。','忽略周长限制。','challenge','grid']
]}),
  lesson({id:'multi-step-modeling',world:'relations',title:'把真实问题拆成几步',subtitle:'从读题到模型，再从模型回到生活',anchor:'上、下册·问题解决与复习关联',concept:'复杂问题先识别对象、单位和数量关系，再分步计算并把结果放回情境检查。',origin:'买东西、安排时间和准备材料都需要连续决策。',mathIdea:'数学建模是现实、图表和算式之间的来回翻译。',representations:['情境图','线段图','分步算式'],skills:['建模','单位检查','表达理由'],story:'探险队要准备早餐：按人数买面包，加水果，最后平均分到篮子里。',discovery:'每一个中间结果都应有单位和意义。',lab:'bar',labConfig:{a:6,b:14,mode:'sum-difference',total:20},prerequisites:['mixed-operation','data-table'],questions:[
  ['mb-1','3盒面包，每盒8片，又买5片水果，一共多少片？',29,'片','先算3×8。','再加5。','3×8+5=29片。','把3、8、5直接相加。','warmup','bar'],
  ['mb-2','60颗星石用掉18颗，剩下的平均装进3袋，每袋多少颗？',14,'颗','先算剩42颗。','42÷3。','(60−18)÷3=14颗。','先除60再减18。','core','bar'],
  ['mb-3','一条路长2千米，已经走了600米，还剩多少米？',1400,'米','2千米=2000米。','2000−600。','还剩1400米。','单位不一致仍直接计算。','transfer','scale'],
  ['mb-4','4天每天收集12、9、15、14片叶子，平均每天多少片？',12.5,'片','总数50。','50÷4。','总数50，平均12.5片。','忘记平均要除以4。','challenge','table']
]})
];

const additionIds = new Set(additions.map(x => x.id));
const old = JSON.parse(fs.readFileSync(source, 'utf8')).filter(x => !additionIds.has(x.id)).map(enrichOld);
const courses = additions.concat(old);
const ids = new Set(courses.map(x => x.id));
if (ids.size !== courses.length) throw new Error('课程 ID 重复');
const questionIds = new Set();
for (const c of courses) {
  if (!c.origin || !c.mathIdea || !Array.isArray(c.representations) || !c.representations.length) throw new Error('课程思想元数据缺失：' + c.id);
  if (c.questions.length !== 8) throw new Error('每关必须有8道题：' + c.id);
  for (const pre of c.prerequisites) if (!ids.has(pre)) throw new Error(c.id + ' 的前置课不存在：' + pre);
  for (const item of c.questions) {
    if (questionIds.has(item.id)) throw new Error('题目 ID 重复：' + item.id);
    if (!Number.isFinite(item.answer) || item.hints.length !== 2) throw new Error('题目结构不完整：' + item.id);
    questionIds.add(item.id);
  }
}

fs.writeFileSync(path.join(targetDir, 'catalog.json'), JSON.stringify(courses, null, 2) + '\n');
const foundation = courses.filter(x => x.kind === 'foundation').length;
const thinking = courses.filter(x => x.kind === 'thinking').length;
const total = courses.reduce((n, x) => n + x.questions.length, 0);
const strands = [...new Set(courses.map(x => x.world))];
const map = '# 三年级数学思想地图\n\n本目录以两册人教版教材的单元顺序作为年龄与难度锚点，但课程节点不复制教材页码。每个节点都走“现实麻烦→数学发明→图形/表格模型→符号语言→结构生长→Kevin复述”的循环。教材来源只用于定位思想线索，奥数思想从同一个基础结构向外生长。\n\n- 课程节点：' + courses.length + '\n- 基础探索：' + foundation + '\n- 思维延展：' + thinking + '\n- 练习题：' + total + '\n- 数学世界：' + strands.join('、') + '\n\n## 八题分层练习\n\n每个节点包含6道主关练习与2道间隔复习变式，交替安排计算、现实动机、模型选择、结构判断、迁移和挑战。完成主关后必须用自己的话复述，才留下完成证据。\n\n## 教材思想锚点\n\n- 上册：观察物体、混合运算、毫米分米千米、曹冲称象、多位数乘一位数、数字编码、线和角、分数初步认识。\n- 下册：生活中的运动现象、除数是一位数的除法、长方形和正方形、图形的面积、数据的收集与整理、年月日、小数初步认识。\n- 课程还补入数感、因数与倍数、估算、组合计数、逆向、不变量和最优化，作为基础课程通往奥数和初中代数几何的桥。\n';
fs.writeFileSync(path.join(targetDir, 'curriculum-map.md'), map);
console.log('Grade 3 catalog built: ' + courses.length + ' lessons, ' + total + ' questions');
