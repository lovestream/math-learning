// Authored simulations. Only the reported final equations are historical input;
// no invented intermediate reasoning is attributed to the learner.
const number=(question,answer,unit='')=>({kind:'number',question,answer:String(answer),unit,options:[]});
const choice=(question,options,answer)=>({kind:'choice',question,answer,unit:'',options});
const reasons={
  units:['换成相同单位后再比较。','只比较题目里最大的数字。','单位不同也直接比较。'],
  relation:['先弄清一组有几个，再对应总量。','组数和张数总是相同。','只要数字相同，单位可以不管。'],
  order:['每一步要按算式中的先后顺序来。','随意调换运算先后，结果不变。','只算第一步就能结束。'],
  value:['要核对每个数字代表几个百、几个十。','写出的数字越多，总量越大。','进位只是在末尾添数字。'],
  calculation:['用另一条计算路线核对结果。','只看答案写得是否整齐。','答案是两位数就一定对。']
};
function base(n,title,prompt,steps,verdict,errorStep,family,reasonList,repair,verify,solution,visual,hints){return {id:`DET-G3-${String(n).padStart(3,'0')}`,content:{title,prompt,steps,verdict,errorStep,family,reasons:reasonList,reason:0,repair,verify,solution,visual,hints,sourceNotes:'家长讨论素材改编；儿童端为匿名模拟案卷，不是原作业逐字复现。'}};}
const visual=(kind,...values)=>({kind,values:values.map(String)});
const seeds=[];
seeds.push(base(1,'香蕉长度调查','估计一根普通香蕉大约有多长。小智的估计合理吗？',['一根普通香蕉大约长2厘米。'],'wrong',0,'PLAUSIBILITY',
 ['用熟悉的尺子比较，判断长度的大致范围。','任何香蕉都有固定不变的长度。','水果的长度只看写了几个数字。'],
 choice('哪一种估计更符合普通香蕉的长度？',['十几厘米左右','约2厘米','约1米'],'十几厘米左右'),
 number('换用手指来比：1厘米左右宽的指甲并排放几枚，大约是2厘米？',2,'枚'),
 '2厘米大约只有两枚指甲那么宽，对普通香蕉明显偏小。普通香蕉常有十几厘米左右；品种和大小不同，不能指定一个唯一厘米数。',visual('banana','10厘米参照尺'),
 ['想想2厘米大概有多长。','可以用指甲宽或熟悉的10厘米尺作参照。','两枚约1厘米宽的指甲只合起来约2厘米；这和普通香蕉的尺度相差很大。']));
const lengths=['73毫米','3米8分米','54分米','9千米200米'];
const order=[...lengths].reverse();
seeds.push(base(2,'四个长度的排列','把四个长度从长到短排列。下面是小智排出的整列。',['从长到短：'+lengths.join(' → ')],'wrong',0,'READING_DIRECTION',reasons.units,
 {kind:'ordering',question:'把卡片从上到下排成从长到短。',unit:'',options:lengths,answer:order.join('|')},
 number('换成米来检查最长的一项：9千米200米一共是多少米？',9200,'米'),
 '先统一成毫米：9200000、5400、3800、73，所以9千米200米＞54分米＞3米8分米＞73毫米。原来的整列是从短到长，方向反了。',visual('lengths',...lengths),
 ['题目要从长到短，最前面应是什么样的长度？','先把千米、米、分米、毫米换成相同单位。','54分米是5米4分米，比3米8分米长；再检查千米和毫米两端。']));
for(const [n,correct]of [[3,false],[14,true]])seeds.push(base(n,correct?'三十张卡的厚度':'卡片厚度记录','3张一样的卡合起来厚2毫米。叠到2厘米厚，需要多少张？',
 correct?['30÷3=10（组）','10×2=20（毫米），所以30张厚20毫米。']:['2厘米=20毫米','20÷2=10（组）','所以只要10张。'],correct?'correct':'wrong',correct?null:2,'MODEL_RELATION',reasons.relation,
 number('需要多少张卡，才能叠到2厘米厚？',30,'张'),correct?number('换个方向：20毫米，每组厚2毫米，一共可以分成几组？',10,'组'):number('反过来检验：30张，每3张厚2毫米，一共厚多少毫米？',20,'毫米'),
 '20÷2=10组没有错，但每组是3张。10×3=30张。反查30÷3×2=20毫米，正好2厘米。组数和张数不能直接当成同一种数量。',visual('cards',3,2,'2厘米'),
 ['留意每一组里究竟有几张卡。','20÷2得到的是几组，不是几张。','每组3张，组数要再乘3；反过来可以先求30张有多少组。']));
for(const [n,correct]of [[4,false],[11,true]])seeds.push(base(n,correct?'步道换算记录':'步道的米数记录','一条步道全长1千米。小智把它换成米。',[correct?'1千米=1000米':'1千米=100米'],correct?'correct':'wrong',correct?null:0,'UNIT_CONVERSION',reasons.units,
 number('1千米等于多少米？',1000,'米'),number('换个角度：这条步道每100米放一面旗，从起点走到终点，共走过几个100米？',10,'个'),
 '1千米=1000米。十个100米合起来是1000米，正好1千米；100米只是其中的一段。',visual('road',10,100),
 ['想想千米和米各表示多长。','图中每段100米，数一数共有几段。','十段100米合起来是1000米，不是100米。']));
// Structured calculation state is the single source for expression, answer and inverse check.
const calculations=[
 {n:5,title:'一道除减算式',a:9,b:3,c:2,op:'÷',tail:'−',suspect:6,answer:1,check:3,checkQ:'从你的结果倒着走：给结果加回2，应得到多少？',solution:'先9÷3=3，再3−2=1。反查1+2=3，3×3=9。',family:'ORDER_OF_OPERATIONS'},
 {n:6,title:'九个九，再添五',a:9,b:9,c:5,op:'×',tail:'＋',suspect:76,answer:86,check:81,checkQ:'从最后的总数拿走后来添的5个，应该剩多少？',solution:'9×9=81，81+5=86。反查86−5=81，81÷9=9。',family:'CALCULATION'},
 {n:7,title:'七盒和散装的十八个',a:7,b:8,c:18,op:'×',tail:'＋',suspect:38,answer:74,check:56,checkQ:'拿走散装的18个，七盒一共应有多少个？',solution:'7×8=56，56+18=74。反查74−18=56，56÷7=8。',family:'CALCULATION'}
];
for(const x of calculations){const first=x.op==='÷'?x.a/x.b:x.a*x.b;const computed=x.tail==='−'?first-x.c:first+x.c;if(computed!==x.answer)throw Error('Calculation seed mismatch');seeds.push(base(x.n,x.title,`计算${x.a}${x.op}${x.b}${x.tail}${x.c}，检查小智写的结果。`,[`${x.a}${x.op}${x.b}${x.tail}${x.c}=${x.suspect}`],'wrong',0,x.family,reasons[x.n===5?'order':'calculation'],number('完整算完，结果是多少？',computed),number(x.checkQ,x.check),x.solution,visual('expression',`${x.a}${x.op}${x.b}`,`${x.tail}${x.c}`),['先分别看清运算符号。',`先算${x.a}${x.op}${x.b}，然后还有一步。`,`第一步得到${first}，再按最后的符号计算；验证时要倒着走。`]));}
seeds.push(base(8,'百位积木记录','500加600是多少？请检查模拟学生的做法。',['5个百加6个百，是11个百。','所以500＋600=1010。'],'wrong',1,'PLACE_VALUE',reasons.value,
 number('11个百合起来是多少？',1100),number('换个办法：从正确总数中减去500，应该剩多少？',600),
 '5个百+6个百=11个百；10个百换成1个千，另有1个百，所以是1100。1100−500=600，验算吻合。',visual('hundreds',5,6),['先看每块积木代表多少。','11个百里，10个百能换成一个千。','换完是1个千和1个百，十位与个位没有数量。']));
seeds.push(base(9,'拿走三个百','1100里面拿走300，还剩多少？',['1100−300=980。'],'wrong',0,'PLACE_VALUE',reasons.value,
 number('1100−300等于多少？',800),number('把拿走的300加回来：剩下的数＋300应该是多少？',1100),
 '1100是11个百。拿走3个百，剩8个百，即800。800+300=1100，回到原来的总量。',visual('hundreds',11,-3),['把1100看成若干个百。','拿走300，就是从11个百里拿走3个百。','减完可以用加法把拿走的部分放回去。']));
seeds.push(base(10,'三组各三个','三个盘子，每盘3颗糖，一共有多少颗？',['3×3=6。'],'wrong',0,'MODEL_RELATION',reasons.relation,
 number('一共有多少颗糖？',9,'颗'),number('把所有糖重新每3颗装一袋，一共能装几袋？',3,'袋'),
 '3×3表示3组、每组3颗，合起来3+3+3=9颗。反查9÷3=3袋，每袋3颗。',visual('array',3,3),['看清是几个3相加。','不要把“3组各3颗”当成3+3。','可以先数每一排，再看有几排；最后反过来分袋检验。']));
seeds.push(base(12,'带括号的计算记录','计算(12+8)÷4，检查下面的完整过程。',['12+8=20','20÷4=5'],'correct',null,'ORDER_OF_OPERATIONS',reasons.order,
 number('按正确过程，最后结果是多少？',5),number('倒着核对：最后的结果×4，再减去原来的8，应回到多少？',12),
 '括号里的12+8先算，得到20；20÷4=5。倒查5×4−8=12，回到原数。',visual('expression','(12+8)','÷4'),['先看括号圈住的是哪一步。','核对是否先把括号里的数量合起来。','验证时倒着用乘法和减法，看看能否回到12。']));
seeds.push(base(13,'两种长度的比较','比较9千米200米和54分米。小智这样判断：',['9千米200米比54分米长。'],'correct',null,'UNIT_CONVERSION',reasons.units,
 choice('核对之后，哪一个更长？',['9千米200米','54分米'],'9千米200米'),number('不用原单位再查一次：54分米合多少厘米？',540,'厘米'),
 '9千米200米是9200米；54分米是5米4分米，即5.4米，所以前者更长。另查54分米=540厘米，和920000厘米相比仍短得多。',visual('lengths','9千米200米','54分米'),['先观察两个数后面的单位。','9千米已经远远超过几十分米。','统一成米是9200米和5.4米；再换厘米也应得到相同的比较。']));
seeds.sort((a,b)=>a.id.localeCompare(b.id));
export const seedCases=seeds;
export const legacyPendingCase={id:'DET-G3-PENDING-015',content:{title:'铁丝题：等待补全原题',prompt:'',steps:['仅知道原答案17分米，参考答案18分米，完整原题尚缺。'],verdict:'wrong',errorStep:0,family:'PENDING',reasons:['需要补齐题目条件再判断。','仅凭答案不同猜题意。'],reason:0,repair:{kind:'oral',question:'',unit:'',options:[],answer:''},verify:{kind:'oral',question:'',unit:'',options:[],answer:''},hints:['','',''],solution:'',visual:visual('manual'),sourceNotes:'缺少原题与原步骤，不得自行补造或发布。'}};

// The reported problem is complete. Only the learner's original intermediate
// work is unknown; never substitute a simulation for that historical evidence.
export const pendingCase={id:legacyPendingCase.id,content:{...legacyPendingCase.content,title:'铁丝题：等待原始计算过程',prompt:'一根铁丝绕竹竿3圈后多3分米，绕4圈还差2分米，铁丝长多少分米？',steps:['已知报告的结果是17分米；原始中间计算过程尚未提供，不能据此确定首错行。'],reasons:['题意已完整；需要原始过程才能判断实际错因。','仅凭答案不同猜测原始步骤。'],sourceNotes:'题意已完整，缺孩子原始计算过程。正确铁丝长18分米；匿名模拟另立新案，不冒充原始作答。'}};
