import fs from 'node:fs';

const plan=JSON.parse(fs.readFileSync(new URL('../course-plan-v2/grade-3.json',import.meta.url),'utf8'));
const block=(blockId,type,title,extra={})=>({blockId,type,title,...extra});
const numbers=text=>(String(text).match(/\d+(?:\.\d+)?/g)??[]).map(Number).filter(Number.isFinite).slice(0,6);
const compact=text=>String(text).replace(/[。；，].*$/,'').slice(0,24)||'观察模型变化';
const family=id=>id.startsWith('G3-U01')?'spatial':id.startsWith('G3-U02')?'operations':id.startsWith('G3-U03')?'operations':id.startsWith('G3-UP01')?'mass':id.startsWith('G3-U04')?'placeValue':id.startsWith('G3-UP02')?'coding':id.startsWith('G3-U05')?'angles':id.startsWith('G3-U06')?'fractions':id.startsWith('G3-U07')?'planning':id.startsWith('G3-L01')?'transform':id.startsWith('G3-L02')?'division':id.startsWith('G3-L03')?'boundary':id.startsWith('G3-L04')?'areaGrid':id.startsWith('G3-L05')?'data':id.startsWith('G3-LP01')?'time':id.startsWith('G3-L06')?'decimals':'sets';
const strand=id=>id.startsWith('G3-U01')||id.startsWith('G3-U03')||id.startsWith('G3-U05')||id.startsWith('G3-L01')||id.startsWith('G3-L03')||id.startsWith('G3-L04')?'geometry':id.startsWith('G3-U06')?'fractions':id.startsWith('G3-UP02')||id.startsWith('G3-U07')||id.startsWith('G3-L05')||id.startsWith('G3-L07')?'logic':id.startsWith('G3-LP01')?'patterns':'numbers';
const colors={spatial:'#4d7698',operations:'#a75a43',mass:'#92723f',placeValue:'#3e7776',coding:'#5e6d9b',angles:'#536e9a',fractions:'#3e8477',planning:'#9b6a35',transform:'#7d639a',division:'#397b83',boundary:'#4d7f69',areaGrid:'#4b7891',data:'#8a6a43',time:'#695f9b',decimals:'#367d79',sets:'#9b5e4b'};
const skills={spatial:['F02','F27'],operations:['F05','F07','F27'],mass:['F03','F08'],placeValue:['F03','F05','F27'],coding:['F01','F27'],angles:['F02','F15'],fractions:['F03','F07'],planning:['F14','F27'],transform:['F02','F15'],division:['F03','F05','F27'],boundary:['F02','F15'],areaGrid:['F02','F03','F15'],data:['F14','F27'],time:['F11','F15'],decimals:['F03','F07'],sets:['F05','F15','F27']};
const track=lesson=>lesson.tier==='E'?'enhancement':lesson.tier==='O'||(lesson.learningRole==='optional-extension'&&lesson.tier==='B')?'olympiad':'foundation';
const simpleNumber=/^\s*([+-]?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)\s*([\u4e00-\u9fff²³a-zA-Z]*)[。.]?\s*$/;
const numericUnits=new Set(['','个','本','朵','袋','盒','段','元','角','分','页','毫米','厘米','分米','米','千米','克','千克','块','颗','张','支','人','组','排','大格','种','条','辆','平方厘米','平方分米','平方米','票','个月','天','次','时','小时','分钟','秒']);
const inline=text=>String(text).trim().replace(/[。！？；，]+$/,'');
const familyMistakes={
  spatial:['只凭看到的轮廓猜位置，没有核对前、右、上各面的标记。','看到的样子一变，就认定盒子本身也变形了。'],
  operations:['没有标出先算哪一步，就从顺眼的数字开始算。','一次改写了算式里的好几处，后来无法检查是哪一步出错。'],
  mass:['只比较数字大小，没有先看克、千克等单位。','把包装和物品一起称出的总质量，当成物品本身的质量。'],
  placeValue:['拆开数字后忘了十位表示几个十，直接把各位结果拼起来。','看见末尾有0就机械添0，没有说明每一位表示多少。'],
  coding:['把编码当成数量大小，没有先查每一段代表什么。','编号时不固定每段位数，导致两个对象可能得到同一个号码。'],
  angles:['只凭看起来像不像来判断，没有检查端点、直角或边的关系。','把图画得长短不同，当成线的种类或角的大小发生了变化。'],
  fractions:['没有先确定“1”是谁，就直接比较分子或分母。','虽然分成了几份，却没有检查每一份是否一样大。'],
  planning:['看到数字就列式，没有先写清每个数量代表什么。','只检查计算结果，没有把答案放回原问题核对条件。'],
  transform:['只凭左右看起来差不多，就判断能够完全重合。','只盯住一个点，没有检查整个图形上的对应点怎样移动。'],
  division:['只看被除数里的数字分别相除，没有守住位值和平均分的意思。','出现余数后没有检查余数是否小于除数。'],
  boundary:['把里面有多大和外边一圈有多长混在一起。','拼接图形时把内部重合边也算进外边界。'],
  areaGrid:['只数方格个数，没有先确认每个方格的大小相同。','把长和宽相加，当成铺满内部所需的面积。'],
  data:['只看表里最大的数字，没有回到调查问题说明结论。','记录总数与人数不一致时仍继续计算，没有先检查漏记或重复。'],
  time:['把开始时刻、结束时刻和经过时间当成同一种量。','跨天或包含起止日期时，没有先说明边界算不算。'],
  decimals:['只比较小数点后的数字，没有按十分位、百分位对齐。','换单位时移动了小数点，却没有说明每一位的单位怎样变化。'],
  sets:['把同时属于两类的对象重复计算了两次。','只算两个圈各自的数量，没有检查重叠和圈外区域。']
};
const diagnosticTail={
  spatial:'再指出物体哪里没动、观察者站在哪里、正对哪个面。',operations:'圈出括号并标出第一步；每次只替换刚算完的部分。',mass:'写出每个量的单位，统一单位后再比较。',placeValue:'把数拆成几个百、几个十、几个一，再检查合并。',coding:'逐段说出编码规则，并检查是否会重号。',angles:'用端点、直角、边或对应位置说明，不能只说“看起来像”。',fractions:'先圈出整体，再检查是否平均分，最后解释分子和分母。',planning:'先写每个数量的意思，再说明为什么选择这个步骤。',transform:'找出至少一组对应点，说明它们移动前后的位置关系。',division:'说清平均分或包含关系，并用乘法和余数条件验算。',boundary:'先用手指描外边一圈，再判断题目问周长还是面积。',areaGrid:'先确认单位方格，再用每行个数和行数解释面积。',data:'核对调查对象、记录总数和问题，再从表中找证据。',time:'在时间轴上标出起点、终点和经过的每一段。',decimals:'对齐相同单位或相同数位，再解释小数点两边各位。',sets:'分别标出只属于左边、两边共有、只属于右边的部分。'
};
const rotate=(items,seed)=>{const n=[...seed].reduce((s,c)=>s+c.charCodeAt(0),0)%items.length;return [...items.slice(n),...items.slice(0,n)]};

function choiceParts(practice,lesson,fam){
  const correct=`${practice.answer}${practice.reason?`。因为${practice.reason}`:''}`.replace(/。。/g,'。');
  const wrongA=`按这种想法判断：${lesson.misconception?.wrong??'只看表面现象，不检查数量关系。'}`;
  const candidates=[wrongA,...(familyMistakes[fam]??familyMistakes.planning).map(text=>`这样判断不对：${text}`)];
  const unique=[correct,...candidates].filter((x,i,a)=>x&&a.indexOf(x)===i);
  while(unique.length<3)unique.push('这样判断不对：没有把结论放回题目，逐项核对条件。');
  const options=rotate(unique.slice(0,3),practice.id),expected=String(options.indexOf(correct)+1);
  return {options,expected};
}

function task(practice,lesson,fam,setName){
  const rawMatch=String(practice.answer).match(simpleNumber),match=rawMatch&&numericUnits.has(rawMatch[2]||'')?rawMatch:null,base={id:practice.id,level:setName,objectiveId:lesson.objectives[0].id,prompt:practice.question,solution:`${practice.answer}${practice.reason?`。${practice.reason}`:''}`.replace(/。。/g,'。'),hint:practice.hints?.[0]?.text??`先回到“${inline(lesson.model)}”，把题目里的对象逐一对应。`,diagnostic:`${lesson.misconception?.correction??lesson.why} ${diagnosticTail[fam]??diagnosticTail.planning}`,diagram:{type:'concept',family:fam,variant:`${lesson.id}:task`,values:numbers(practice.question),labels:[practice.question,lesson.title],caption:'先在图中找到本题的对象、单位和关系；题图帮助读题，不会替你算出答案。'}};
  if(match)return {...base,kind:'number',expected:match[1],unit:match[2]||undefined};
  const {options,expected}=choiceParts(practice,lesson,fam);
  return {...base,kind:'choice',options:options.map((text,i)=>({id:String(i+1),text})),expected,reasonEvidence:true};
}

function makeSets(lesson,fam){
  const p=lesson.practice;
  return {
    warmup:[task(p[0],lesson,fam,'warmup'),task(p[1],lesson,fam,'warmup')],
    core:[task(p[2],lesson,fam,'core'),task(p[3],lesson,fam,'core'),task(p[6],lesson,fam,'core')],
    transfer:[task(p[4],lesson,fam,'transfer'),task(p[7],lesson,fam,'transfer')],
    challenge:[task(p[5],lesson,fam,'challenge')],
    review:p.slice(8,12).map(x=>task(x,lesson,fam,'review'))
  };
}

function checkpoint(lesson,fam){
  const source=lesson.practice[0],{options,expected}=choiceParts(source,lesson,fam);
  return {prompt:`${source.question} 请选择“结论和理由都完整”的回答。`,options:options.map((text,i)=>({text,correct:String(i+1)===expected,reason:String(i+1)===expected?source.reason:`这个回答没有守住本课的关键关系：${lesson.misconception?.correction??lesson.why}`}))};
}

function compile(lesson){
  const fam=family(lesson.id),interaction=lesson.interaction,cp=checkpoint(lesson,fam),steps=lesson.explanation.slice(0,3).map((explanation,i)=>({label:compact(explanation),explanation}));
  const scene={sceneId:`${lesson.id}-MODEL1`,family:fam,variant:lesson.id,title:compact(lesson.title),prompt:lesson.objective,initialState:interaction.initialState,learnerAction:interaction.learnerAction,observableChange:interaction.observableChange,question:interaction.question,expectedExplanation:interaction.expectedExplanation,wrongActionFeedback:interaction.wrongActionFeedback,steps,values:numbers(`${interaction.initialState} ${interaction.observableChange}`),labels:[lesson.title,lesson.model]};
  const exampleSteps=[...(lesson.example.steps??[]).map((why,i)=>({math:`第${i+1}步`,why})),{math:`得到：${lesson.example.answer}`,why:'把答案放回真实问题，检查单位、条件和结果是否对应。'}];
  return {contentSource:'grade3-complete',contentVersion:'2026-09-27.2',editorialRevision:'2026-09-27.2',lessonId:lesson.id,exampleId:`FULL-${lesson.id}`,title:lesson.title,shortTitle:lesson.title.length>15?`${lesson.title.slice(0,15)}…`:lesson.title,question:lesson.realProblem,subtitle:lesson.why,grade:[3],strand:strand(lesson.id),track:track(lesson),parentUnitId:lesson.unitId,coverageIds:[lesson.id],coveredSubitemIds:[],thinkingSkills:skills[fam],recommendedPrerequisites:lesson.prerequisites??[],relatedLessonIds:[],representation:['real-problem','interactive-model','symbol-language','self-explanation'],estimatedActiveMinutes:lesson.minutes??30,color:colors[fam],widget:'conceptLab',prerequisiteNote:'可以直接进入；不熟悉的地方先在实验台上操作，再决定是否回补前面的课。',objectives:[{id:lesson.objectives[0].id,action:lesson.objectives[0].description,scope:lesson.objective}],conceptScenes:[scene],retellPrompt:lesson.retell,articleBlocks:[
    block('start','leadQuestion','把问题放进一个真实故事',{paragraphs:[lesson.realProblem,lesson.why]}),
    block('try','manipulative','先预测，再把模型一步步操作出来',{widget:'conceptLab',text:lesson.model}),
    block('meaning','text','图里的每一部分分别代表什么',{paragraphs:[lesson.model,...lesson.explanation]}),
    block('examples','workedExample','跟着一个完整例子走一遍',{examples:[{title:lesson.example.question,steps:exampleSteps}]}),
    block('why','compareCases','为什么这种常见想法会出错',{cases:[{label:'守住题目中的关系',math:lesson.misconception?.correction??lesson.why,explanation:interaction.expectedExplanation,valid:true},{label:'只记表面规则',math:lesson.misconception?.wrong??'直接套一个算式',explanation:interaction.wrongActionFeedback,valid:false}]}),
    block('check','checkpoint','轮到 Kevin 自己判断',{...cp,revisit:'try'}),
    block('connections','methodBridge','把这次发现带到下一类问题',{text:lesson.next,methods:[{id:`${lesson.id}.method`,name:compact(lesson.objective),question:interaction.question,action:lesson.model,condition:lesson.why,counterexample:`注意：${lesson.misconception?.wrong??interaction.wrongActionFeedback}`}]}),
    block('practice','practice','撤掉模型，换一组新问题',{text:'练习不会照抄实验数字。先保存首答，再按本课的对象、单位和关系逐项自查。'})
  ],taskSets:makeSets(lesson,fam)};
}

export const grade3CompleteLessons=plan.lessons.map(compile);
export const grade3CompletePlan={lessonCount:plan.lessons.length,taskCount:plan.lessons.reduce((n,l)=>n+l.practice.length,0),lessonIds:plan.lessons.map(l=>l.id)};
