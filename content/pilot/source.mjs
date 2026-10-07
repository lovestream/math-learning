import {introVisuals,predictionVisuals} from './intro-visuals.mjs';
// Authored pilot lessons for the user's v0.3 blueprint. These are previews, not full published coverage.
import {teaching} from './teaching.mjs';
import {foundations} from './foundations.mjs';
import {taskObjective} from './objective-tasks.mjs';
import {mixedOperationLessons} from './mixed-operations.mjs';
import {lengthMeasurementLessons} from './length-measurement.mjs';
import {grade3CompleteLessons,grade3UnitMetadata} from './grade3-complete.mjs';
const number=(id,prompt,expected,unit,solution,hint)=>({id,kind:'number',prompt,expected,unit,solution,hint});
const choice=(id,prompt,options,expected,solution,hint)=>({id,kind:'choice',prompt,options:options.map((text,i)=>({id:String(i+1),text})),expected:String(expected),solution,hint,reasonEvidence:true});
const expression=(id,prompt,expected,solution,hint)=>({id,kind:'expression',prompt,expected,solution,hint});
const fields=(id,prompt,values,solution,hint)=>({id,kind:'fields',prompt,fields:values.map(([key,label,expected,unit])=>({key,label,expected,unit})),solution,hint});
const hints={
  'geometry.area.perimeter':'先找题目问的是里面还是外圈。面积可以一排一排数；周长从一角出发，把上、右、下、左四条边都算上。',
  'numbers.fractions.meaning':'先找完整的一条（或一杯），再看平均分成几份、拿了几份。下面写总份数，上面写拿的份数。',
  'algebra.substitution.intro':'先圈出题目让你换掉的那个字，把它换成已知相等的全部内容。外面的加减、乘几份和等号右边也要保留。',
  'algebra.balance.intro':'先想怎样让左边只剩一袋。拿走散糖时两边要拿同样多；剩几袋一样多，就把总颗数平均分成几份。'
};
function lesson(o){
  const taskSets=Object.fromEntries(Object.entries(o.taskSets).map(([level,tasks])=>[level,tasks.map(t=>({...t,id:t.id.startsWith('G3-')?t.id:`${o.lessonId}.${t.id}`,level,objectiveId:taskObjective(o,t),hint:t.hint??o.defaultHint??hints[o.lessonId]}))]));
  return {schemaVersion:3,editorialRevision:'2026-09-12.1',contentVersion:'2026-09-11.1',status:'draft',previewEnabled:true,sourceAnchors:[{id:'design.v03',purpose:'用户提供的课程和交互设计；未复刻外站内容',status:'userProvided'}],masteryRuleId:'pilot.evidence.v1',rewardRuleId:'pilot.task-group.v1',assetIds:[],generatorIds:[],validatorIds:['rational.v1','linear.v1','choice.v1'],reviewRecord:{math:'automated-fixture-checks',editorial:'awaiting-parent-preview',publication:'not-published'},...o,...teaching[o.lessonId],taskSets};
}

const existingLessons=[
...mixedOperationLessons.map(lesson),
...lengthMeasurementLessons.map(lesson),
lesson({lessonId:'numbers.fractions.meaning',exampleId:'R01',title:'分数：取了整体的几份？',shortTitle:'分数与整体',question:'同样是三分之一，为什么长度会不同？',subtitle:'先确定“一个整体”，再认识等分、取份和数线。',grade:[3,4,5,6],strand:'numbers',track:'foundation',parentUnitId:'N07',coverageIds:['B013','B014','B016'],coveredSubitemIds:['B013.s01','B013.s02','B014.s02'],thinkingSkills:['F02','F03','F07'],recommendedPrerequisites:['平均分','数线上的0和1'],relatedLessonIds:['geometry.area.perimeter'],representation:['fractionModel','numberLine'],estimatedActiveMinutes:18,color:'#147d73',widget:'fraction',prerequisiteNote:'会把物品平均分就能开始。数线还不熟悉时，可以先只看纸带。',objectives:[{id:'fractions.equal-parts',action:'辨别是否等分，并用分数记录取份',scope:'一个整体以内'},{id:'fractions.whole',action:'区分占整体的比例和实际长度',scope:'1米和2米纸带'},{id:'fractions.equivalent',action:'合并相邻等份，解释长度不变',scope:'2/6与1/3'}],taskSets:{
warmup:[number('w1','12颗葡萄平均分给3人，每人几颗？','4','颗','12÷3=4，每人的份数相同。','把12分成3个同样大的组。'),choice('w2','一根纸条被分成1、1、2厘米三段，能说每段都是原纸条的1/3吗？',['能，只要分成3段','不能，因为三段不等长','不能，因为分数不能表示长度'],2,'要先平均分。总长4厘米，两小段各占1/4，大段占1/2。','比较三段的长度。')],
core:[number('c1','1米纸带平均分成8份，取3份。取出的长度是多少米？','3/8','米','每份1/8米，3份就是3/8米。','分母记录总份数，分子记录取份数。'),fields('c2','把1米彩带平均分成6小段，把前2小段涂色。再把相邻的每2小段看作1大段，彩带和涂色部分都不变。按新的分组方法，整条彩带共有几大段？涂色部分占几大段？',[['all','整条彩带共有几大段','3','份'],['take','涂色部分占几大段','1','份']],'整体6÷2=3大份，取出2÷2=1大份。长度仍是1/3米。','整体和取出的部分，都按每2小份合一组。'),number('c3','2米纸带平均分成3份，取1份。取出的实际长度是多少米？','2/3','米','2米的三分之一是2/3米；占整体1/3和长2/3米是两种描述。','先看“1个整体”现在长多少米。'),choice('c4','0到1的数线分成8个相等间隔。3/8位于哪里？',['从0出发第3个间隔的右端','从0出发第8个间隔的右端','数字3所在的位置'],1,'每个间隔长1/8，走3个间隔就到3/8。','数间隔，不把起点也算成一份。'),choice('c5','同一条1米纸带，1/2和2/4表示的长度有什么关系？',['1/2短，因为分子小','2/4短，因为每份小','一样长，两份四分之一合成一半'],3,'整体相同，二分之一和两个四分之一的覆盖范围相同。','想象把一半再平分成2小份。')],
transfer:[number('t1','1升果汁平均装进5个同样的杯子。3杯共有多少升？','3/5','升','每杯1/5升，3杯3/5升。故事换了，等分结构没变。'),choice('t2','短绳长1米，长绳长2米。两根绳子都平均分成2段，各拿1段。拿出的短绳这一段，与拿出的长绳这一段，哪句话说对了？',['都拿了各自整条的一半，但长绳拿出的那段更长','都拿了一半，所以拿出的两段一样长','长绳拿出的那段超过了长绳的一半'],1,'两者都占原绳1/2；实际分别是1/2米和1米。')],
challenge:[fields('h1','把2米彩带平均分成6段，每段一样长，拿其中2段。拿出的这2段合起来，是整条彩带的几分之几？这2段合起来长多少米？',[['part','占整体的比例','1/3',''],['length','实际长度','2/3','米']],'比例是2/6=1/3；实际长度是2×1/3=2/3米。')],
review:[number('r1','1米彩带等分成10份，取4份。取出多少米？','2/5','米','4/10米和2/5米等值。'),choice('r2','同一杯水的3/6与1/2，水量是否相同？',['相同，只是等分方式不同','不同，分子3更大','无法比较同一个整体'],1,'同一整体内，3份六分之一恰好是一半。')]
}}),
lesson({lessonId:'geometry.area.perimeter',exampleId:'R02',title:'铺满里面，还是绕着边走？',shortTitle:'面积与周长',question:'同样12块地砖，围一圈为什么会变长？',subtitle:'用相同的单位方格，分清内部覆盖与外部边界。',grade:[3,4],strand:'geometry',track:'foundation',parentUnitId:'G04',coverageIds:['B069','B070'],coveredSubitemIds:['B069.s01','B069.s02','B070.s01','B070.s02','B070.s03'],thinkingSkills:['F02','F05','F15'],recommendedPrerequisites:['乘法阵列','长度单位'],relatedLessonIds:['numbers.fractions.meaning'],representation:['grid','boundary','expression'],estimatedActiveMinutes:20,color:'#3679a0',widget:'area',prerequisiteNote:'会数方格、会把边长相加就能开始；公式会从操作里长出来。',objectives:[{id:'area.units',action:'区分长度单位与面积单位',scope:'厘米与平方厘米'},{id:'area.boundary',action:'从方格邻接关系数出外边界',scope:'网格图形'},{id:'area.invariant',action:'在12块方格的不同排列中比较面积和周长',scope:'整数边长矩形'}],taskSets:{
warmup:[number('w1','3行小方格，每行4个，一共有多少个？','12','个','3×4=12。'),choice('w2','给相框的外面一圈粘装饰带，主要需要知道什么？',['相框占地面积','外边界的长度','相框有几个角'],2,'装饰带沿边界走，需要周长。')],
core:[fields('c1','长4厘米、宽3厘米的长方形，面积和周长分别是多少？',[['area','面积','12','平方厘米'],['perimeter','周长','14','厘米']],'面积3×4=12平方厘米；周长(3+4)×2=14厘米。'),fields('c2','12个小正方形，每个边长1厘米，紧挨着摆成2排，每排6格。这个长方形的面积和周长分别是多少？',[['area','面积','12','平方厘米'],['perimeter','周长','16','厘米']],'面积2×6=12，周长2+6+2+6=16。'),number('c3','两块边长1厘米的正方形并排，共享一整条边。外周长是多少厘米？','6','厘米','4+4−2=6，共享边被计了两次，应去掉。'),choice('c4','一张长方形小图，每格边长1厘米，摆了3排，每排4格。要知道小图里面铺满了多大的地方，应该怎样算？',['沿外圈把四条边加起来：4＋3＋4＋3','把里面三排小方格加起来：4＋4＋4','只数四个角：1＋1＋1＋1'],2,'面积数里面有多少个单位小方格。3排，每排4格，共12格，面积是12平方厘米。'),fields('c5','12个小正方形，每个边长1厘米，紧挨着摆成1排。这个长条的面积和周长分别是多少？',[['area','面积','12','平方厘米'],['perimeter','周长','26','厘米']],'面积1×12=12；周长(1+12)×2=26。')],
transfer:[number('t1','长5米、宽2米的花坛，四周全部围起来，需要多少米围栏？','14','米','5+2+5+2=14米。'),number('t2','长6米、宽3米的地面要铺满地砖，需要覆盖多少平方米？','18','平方米','6×3=18平方米。')],
challenge:[number('h1','面积12平方厘米、边长为正整数的长方形，最小周长是多少厘米？','14','厘米','因数对只有1×12、2×6、3×4，周长依次26、16、14厘米。列全因数对后可以确定最小值。')],
review:[fields('r1','长5厘米、宽3厘米的长方形，面积和周长分别是多少？',[['area','面积','15','平方厘米'],['perimeter','周长','16','厘米']],'面积15平方厘米，周长16厘米。'),choice('r2','两个长方形，一个长4厘米、宽4厘米，另一个长8厘米、宽2厘米。比较它们的面积和周长，哪个说法正确？',['面积相同，周长不同','周长相同，面积不同','面积和周长都相同'],1,'面积都是16；周长分别16和20。')]
}}),
lesson({lessonId:'algebra.substitution.intro',exampleId:'M13',title:'把一个量，换成相等的整一块',shortTitle:'等量替换',question:'甲等于乙＋2，为什么3个甲要换成3个“乙＋2”？',subtitle:'不急着求答案，先看替换的范围，以及必须保留的外层运算。',grade:[3,4,5,6],strand:'algebra',track:'olympiad',parentUnitId:'A04',coverageIds:['O32'],coveredSubitemIds:[],thinkingSkills:['F08','F27'],recommendedPrerequisites:['等号的含义','相同的几份'],relatedLessonIds:['algebra.balance.intro'],representation:['objects','expression'],estimatedActiveMinutes:20,color:'#967144',widget:'substitution',prerequisiteNote:'只需要知道甲和乙代表数量。这一课先练替换，不要求解出未知数。',objectives:[{id:'substitution.whole',action:'把一个甲替换成完整的乙+2',scope:'已知相等关系'},{id:'substitution.outer',action:'保留外层乘法和未替换部分',scope:'一次表达式'},{id:'substitution.check',action:'用具体数比较漏乘常数的错误表达式',scope:'反例检查'}],taskSets:{
warmup:[choice('w1','已知甲=乙+2，替换甲时哪一块和它等量？',['乙','乙+2整个表达式','只有2'],2,'甲等于乙加上2，必须连在一起替换。'),number('w2','每个点心盒里都有一袋糖，袋子旁边再放2颗散糖。3个盒子里的散糖合起来有几颗？','6','颗','每一份都带着2，所以3×2=6。')],
core:[expression('c1','已知甲=乙+2，把“甲+5=10”中的甲换成乙来表示。','(乙+2)+5=10','只换甲，保留外面的+5与等号右边的10。','先把甲的位置留出括号，再放入乙+2。'),expression('c2','已知甲=3乙，把“甲−6=乙”中的甲替换掉。','3乙-6=乙','甲换成3乙，其余的−6和右边的乙不动。'),expression('c3','已知乙=甲+5，把“3甲=乙+9”中的乙替换掉。','3甲=(甲+5)+9','右边乙替换为甲+5，原来的+9仍然保留。'),expression('c4','已知甲=乙+2，把“3甲=18”中的甲替换掉。可以保留括号，也可以正确展开。','3*(乙+2)=18','3×(乙+2)=18，与3乙+6=18等价。不要漏乘括号里的2。'),choice('c5','把3甲中的甲替换成乙+2，外面的3作用于哪里？',['只作用于乙','作用于乙+2整一块','只作用于2'],2,'甲原来是1个整体，换写后外面的3仍然乘整个对象。')],
transfer:[expression('t1','已知橘=2梨，把“橘+梨=12”中的橘换掉。','2梨+梨=12','一个橘对应两份梨，原来另外的一份梨也保留。'),expression('t2','已知甲=乙+4，把“2甲+1=19”中的甲替换掉。','2*(乙+4)+1=19','保留外层的2和原来的+1；展开是2乙+9=19。')],
challenge:[fields('h1','令乙=4。分别计算3×(乙+2)和3乙+2，用结果检查是否漏乘。',[['whole','3×(乙+2)','18',''],['wrong','3乙+2','14','']],'3×(4+2)=18；3×4+2=14。相差4，是两个+2被漏掉了。')],
review:[expression('r1','已知甲=乙+3，把“2甲=16”中的甲换掉。','2*(乙+3)=16','2×(乙+3)=16，也可展开为2乙+6=16。'),choice('r2','4×(乙+1)正确展开是哪一个？',['4乙+1','乙+4','4乙+4'],3,'每份都有乙和1，共4份；两部分都乘4。')]
}}),
lesson({lessonId:'algebra.balance.intro',exampleId:'M12',title:'天平两边，为什么要一起变？',shortTitle:'天平与方程',question:'怎样一步步打开未知盒子，又让两边仍然相等？',subtitle:'把解方程变成看得见、能撤销、能代回的等量操作。',grade:[3,4,5,6],strand:'algebra',track:'foundation',parentUnitId:'A04',coverageIds:['X02'],coveredSubitemIds:[],thinkingSkills:['F07','F27'],recommendedPrerequisites:['等号','加减和乘除互逆'],relatedLessonIds:['algebra.substitution.intro'],representation:['objects','expression'],estimatedActiveMinutes:18,color:'#8670ae',widget:'balance',prerequisiteNote:'x只是盒子里还不知道的数量。先试物体天平，再看符号；不要求提前会解方程。',objectives:[{id:'balance.equal',action:'比较单边操作与两边同步操作',scope:'等式加减'},{id:'balance.solve',action:'用同减或同除得到未知量',scope:'除数已知且非零'},{id:'balance.verify',action:'代回原等式核对左右数值',scope:'一次方程'}],taskSets:{
warmup:[number('w1','□+3=10，□里是多少？','7','','10−3=7，可以用7+3=10检查。'),choice('w2','等号“=”的意思是什么？',['右边一定是单独一个数','两边表示相同的量','左边必须先算完'],2,'两边可以长得不一样，只要表示的量相等。')],
core:[number('c1','x+3=10。两边同时减去3后，x是多少？','7','','两边都减3，得到x=7。'),number('c2','2x=14。两袋糖的颗数一样多，两袋共有14颗。每袋有几颗糖？','7','','左右同时除以2，x=7。'),choice('c3','3x=x+14，两边各拿走一个x之后得到什么？',['3x=14','2x=14','2x=x+14'],2,'两边都减少同一个x，左边剩2份x，右边剩14。'),number('c4','x−4=5。x是多少？','9','','两边同时加4，x=9；代回9−4=5。'),number('c5','2x+3=11。x是多少？','4','','两边减3得2x=8，再除以2得x=4。')],
transfer:[number('t1','两个同样的文具盒加3元包装费，共19元。每个盒子多少元？','8','元','设每盒x元，2x+3=19；先减3，再除2，得8元。'),fields('t2','把x=5代回2x+4=x+9。左右两边的数值分别是多少？',[['left','左边','14',''],['right','右边','14','']],'左边2×5+4=14，右边5+9=14，两个条件表示相等。')],
challenge:[choice('h1','原来等式成立，为什么左边减3、右边减2不能保持相等？',['两边减少的量不同，新左边会比新右边少1','因为方程不能做减法','因为只能移动未知数'],1,'设原来都为a，变后是a−3与a−2，两者相差1。')],
review:[number('r1','3x+2=17，x是多少？','5','','两边减2得3x=15，再除以3，得x=5。'),number('r2','x−6=8，x是多少？','14','','两边同时加6，x=14。')]
}})
,...foundations.map(lesson)];

const existingById=new Map(existingLessons.map(item=>[item.lessonId,item]));
const planIds=new Set(grade3CompleteLessons.map(item=>item.lessonId));
const compiledGrade3=grade3CompleteLessons.map(item=>existingById.get(item.lessonId)??lesson(item));
const extraLessons=existingLessons.filter(item=>!planIds.has(item.lessonId));
export const lessons=[...compiledGrade3,...extraLessons].map(item=>{
  const unit=grade3UnitMetadata.find(u=>u.id===item.parentUnitId);
  return {...item,introVisual:introVisuals[item.lessonId],childClassroom:item.childClassroom?{...item.childClassroom,storyVisual:introVisuals[item.lessonId],predictionVisual:predictionVisuals[item.lessonId]}:undefined,contentVersion:item.childClassroom?'2026-10-07.2':'2026-10-02.1',editorialRevision:item.childClassroom?'2026-10-07.2':'2026-10-02.1',masteryRuleId:'pilot.evidence.v2',mathScenes:item.mathScenes?.map(scene=>({...scene,contentVersion:'2026-10-02.1'})),textbookUnit:unit,sourceAnchors:unit?[{id:unit.sourceId,purpose:`教材单元：${unit.title}，印刷页${unit.printedPages}`,status:'local-textbook-reference'}]:item.sourceAnchors,
    taskSets:Object.fromEntries(Object.entries(item.taskSets).map(([set,tasks])=>[set,tasks.map(t=>({...t,responseSpec:t.responseSpec??{type:t.kind},reasonEvidence:undefined}))]))};
});
