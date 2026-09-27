const LEVEL_LABEL = {warmup:'热身',core:'核心',transfer:'迁移',challenge:'挑战'};

const worldChains = {
  numbers: ['看见数量', '选择计数单位', '理解位值与运算', '估计并检查'],
  relations: ['找出两个量', '画出数量关系', '寻找不变量', '用未知数表达'],
  geometry: ['观察真实物体', '抽取形状与度量', '剪拼或变换', '说明为什么不变'],
  patterns: ['记录几个例子', '比较变化', '找重复结构', '用规律预测'],
  logic: ['说清条件', '分类且不遗漏', '排除矛盾', '解释结论必然成立'],
  fractions: ['确定一个整体', '公平等分', '记录取了几份', '连接分数、小数和比']
};

const birthStories = {
  'counting-quantities': {
    whyQuestion:'如果没有“数”，怎样知道羊有没有少、果子够不够分？',
    humanNeed:'很早的人们要放牧、交换和分配食物。只说“很多”不够可靠，于是让每件东西对应一颗石子、一道刻痕或一个数词。数先解决“有多少”，后来才有数字这种写法。',
    invention:'把每个对象和数词一一对应，最后说到的数表示这一堆对象的总量。数字只是记录数的符号。',
    essence:'数把不同东西的“多少”抽出来：3只羊、3颗果子和3步路都能共享同一个数量3。',
    extensionChain:['一一对应','自然数与0','数轴与顺序','位值与大数','数量关系'],
    retellPrompt:'请不用课本定义，给家人讲讲：人们为什么需要数？“3”为什么既能说羊，也能说果子？'
  },
  'operation-meaning': {
    whyQuestion:'人们已经会数了，为什么还要发明加、减、乘、除？',
    humanNeed:'生活里不只要知道静止的一堆有多少，还要记录合起来、拿走后、许多相同组和公平分配。四种反复出现的现实动作，逐渐被压缩成四种运算。',
    invention:'加法记录合并或增加；减法记录拿走、剩余或相差；乘法压缩相同加数的重复；除法记录平均分和一个量里包含几份。先读懂关系，再选符号。',
    essence:'运算符号不是“叫你计算”的口令，而是在说明数量怎样发生关系。',
    extensionChain:['合并与加法','剩余/比较与减法','等量重复与乘法','平均分/包含与除法','逆运算'],
    birthStories:[
      {name:'加法为什么出现',problem:'两篮果子合到一起、队伍又来了几个人，人们要知道“合起来有多少”。',tool:'把原来的量与增加的量合并，写成 a+b。'},
      {name:'减法为什么出现',problem:'拿走后还剩多少、甲比乙多多少、离目标还差多少，都需要从整体中找出一部分或差距。',tool:'减法同时表达拿走、剩余和比较；它也是加法的逆过程。'},
      {name:'乘法为什么出现',problem:'每袋6个，连续20袋，如果一直写6+6+…会又长又容易漏。',tool:'相同加数重复许多次时，用“每份数×份数”压缩表达。'},
      {name:'除法为什么出现',problem:'12个果子平均给3人，或12里面能装几个3，问法不同却共享同一个分组结构。',tool:'平均分问每份多少，包含除问能分几份；都用除法表达。'}
    ],
    retellPrompt:'请各举一个生活例子，说明加、减、乘、除分别解决了什么问题。'
  },
  arrays: {
    whyQuestion:'为什么不一直做重复加法，还要发明乘法？',
    humanNeed:'相同数量一组一组反复出现时，逐项相加太长，也看不出“每份数”和“份数”。排成行列后，这两个量一眼就能看见。',
    invention:'乘法用“每份数×份数”压缩重复加法；交换两个因数，是换一个方向数同一个阵列。',
    essence:'乘法抓住的是等量重复和二维组合结构，不只是一种更快的计算口诀。',
    extensionChain:['重复加法','每份数×份数','倍数关系','面积模型','分配律'],
    retellPrompt:'请用一个阵列或生活例子讲清楚：为什么3×5既像5+5+5，也像3行5个？'
  },
  division: {
    whyQuestion:'为什么12÷3既能问“每人几个”，又能问“可以分给几人”？',
    humanNeed:'分食物时会遇到两种真实问题：人数已经知道，求每份；每份大小已经知道，求份数。两者都在把总量分成相同大小的组。',
    invention:'平均分固定份数，包含除固定每份数；乘法能把答案重新合起来，所以除法是乘法的逆过程。',
    essence:'除法是在总量、每份数、份数三个量中，知道两个寻找第三个。余数记录不能再组成完整一组的部分。',
    extensionChain:['平均分','包含关系','乘除互逆','余数','归一思想'],
    retellPrompt:'请用12颗糖分别编一道“平均分”和一道“包含除”的问题，再说说两题哪里相同。'
  },
  'fraction-meaning': {
    whyQuestion:'数已经能表示1、2、3，为什么还需要分数？',
    humanNeed:'一个饼平均分给多人、半米布或不到一杯水，都不是完整的1个，却仍需要准确记录。整数无法说清这些“不到一个单位”的量。',
    invention:'先确定整体，再把整体平均分成若干份。分母记录平均分成几份，分子记录取了几份。没有平均分，就不能直接用这个分数描述。',
    essence:'分数是一个数，也是一种关系：它说明“取的部分”相对于“一个整体”有多大。',
    extensionChain:['公平等分','几分之一','多个几分之一','等值分数','小数与百分数','比与比例'],
    retellPrompt:'请解释为什么半个西瓜能写成1/2，并说明换成大小不同的西瓜时“1/2”有什么不变、什么会变。'
  },
  'g6-negative-number': {
    whyQuestion:'有了0和正数，为什么还要发明负数？',
    humanNeed:'温度会低于0℃，账本会欠钱，楼层会在地面以下，方向也会相反。只用0以上的数，会把“相反方向的量”混在一起。',
    invention:'选定0作为分界，用正负号记录同一种量的相反方向；数轴把方向和距离放到同一幅图上。',
    essence:'负数不是“没有”，而是相对0位于另一个方向；−3和3离0一样远、方向相反。',
    extensionChain:['0作分界','相反意义的量','有向数轴','负数运算','坐标与变化率'],
    retellPrompt:'请用温度或欠款解释：0、3和−3分别是什么意思，为什么−3不是“什么都没有”？'
  },
  equality: {
    whyQuestion:'为什么等号不能只理解成“答案写在后面”？',
    humanNeed:'交换、称重和查账都要判断两种写法是否代表同样多。人们需要一个符号记录“两边数量相同”，也需要给暂时不知道的数留一个位置。',
    invention:'等号表示左右两边保持平衡；空格、方框或字母可以代表还不知道但能够由关系找出的数量。',
    essence:'等式是一条关系陈述。未知数只是暂时没有确定的数量，换一个名字不会改变它和其他量的关系。',
    extensionChain:['同样多','等号与平衡','未知数占位','逆运算','方程'],
    retellPrompt:'请解释3+□=8为什么像一架天平，并说说把□改叫x后，数学关系有没有改变。'
  },
  'g5-equation-balance': {
    whyQuestion:'为什么需要未知数和方程，直接猜答案不行吗？',
    humanNeed:'查账、测量和设计中经常知道几个量之间的关系，却不知道其中一个量。问题复杂后，靠猜容易遗漏，也无法把推理过程交给别人检查。',
    invention:'先用字母给未知量取一个临时名字，再把已知关系写成等式。方程把“要找什么”和“它必须满足什么条件”同时保存下来。',
    essence:'解方程是在保持两边相等的前提下逐步撤去操作，让未知数单独留下；每一步都能用原等式检查。',
    extensionChain:['等量关系','未知数','列出方程','等式同变','代换与消元'],
    retellPrompt:'请用“盒子里原有一些球”编一道题，说明为什么用x和方程比反复猜更清楚。'
  },
  'g6-algebra-model': {
    whyQuestion:'为什么要用字母，具体数字不是更直观吗？',
    humanNeed:'火柴图、路程和总价会随着“第几个”或“买多少”不断变化。列出十个具体答案仍不能说清第一百个，更不能表达所有情况。',
    invention:'字母能代表未知量，也能代表会变化的量；一个式子把许多个具体算式中重复的关系压缩成通用规则。',
    essence:'代数是在给结构取名字。代换像把名字换成具体数，消元像利用关系把暂时不需要的名字消去。',
    extensionChain:['具体算式','变化规律','字母表示','代入与方程','代换和消元','函数'],
    retellPrompt:'请用“每本书8元，买n本”解释8n说了什么，以及n和未知数有什么相同、不同。'
  }
};

function rotateChoices(correct, distractors, seed) {
  const choices=[correct,...distractors.filter(x=>x&&x!==correct)].slice(0,3);
  while(choices.length<3)choices.push('只要记住计算步骤，不需要知道数量关系');
  const offset=[...seed].reduce((n,c)=>n+c.charCodeAt(0),0)%choices.length;
  const rotated=choices.slice(offset).concat(choices.slice(0,offset));
  return {choices:rotated,answer:rotated.indexOf(correct)+1};
}

function choiceQuestion(lesson, suffix, prompt, correct, distractors, level, representation, explanation) {
  const picked=rotateChoices(correct,distractors,`${lesson.id}:${suffix}`);
  return {
    id:`${lesson.id}-${suffix}`,
    prompt:`【${LEVEL_LABEL[level]}·说理由】${prompt}`,
    answer:picked.answer,
    unit:'号',choices:picked.choices,hints:['先问：现实中遇到了什么麻烦？','再找哪个选项说清了数量之间的关系。'],
    explanation, misconception:'把数学只理解成要背诵的计算规则，没有连接现实问题和数量结构。',level,representation,exerciseType:'choice'
  };
}

export function enrichLesson(input) {
  const lesson={...input};
  const special=birthStories[lesson.id]??{};
  const whyQuestion=special.whyQuestion??lesson.origin??`生活中为什么需要研究“${lesson.title}”？`;
  const humanNeed=special.humanNeed??lesson.origin??'人们遇到了需要比较、度量或预测的真实问题。';
  const invention=special.invention??`人们把反复出现的关系抽象出来，形成了“${lesson.concept}”这件数学工具。`;
  const essence=special.essence??lesson.mathIdea??lesson.concept;
  const extensionChain=special.extensionChain??[lesson.concept.split(/[，；。]/)[0],...(worldChains[lesson.world]??worldChains.relations).slice(1)];
  const retellPrompt=special.retellPrompt??`请用自己的话讲给家人听：人们遇到了什么问题，“${lesson.title}”抓住了什么关系？再举一个新的例子。`;
  const originals=(lesson.questions??[]).map(q=>({...q,exerciseType:q.exerciseType??'numeric'}));
  const qWhy=choiceQuestion(lesson,'why','人们为什么需要这一关里的数学工具？',humanNeed,[`因为课本规定必须学习“${lesson.title}”。`,'为了把所有题都变成更长的计算。'],'warmup','story',`数学工具从真实需要中长出来：${humanNeed}`);
  const qModel=choiceQuestion(lesson,'model',`哪一种做法最能看见“${lesson.title}”背后的结构？`,`先用${lesson.representations?.[0]??'生活情境'}理解，再用${lesson.representations?.[1]??'图形模型'}表示，最后写成算式。`,['直接抄一个公式，不检查每个量表示什么。','只看数字大小，不管题目中的关系。'],'core',lesson.representations?.[1]??'model',`表示不是装饰。${invention}`);
  const qReason=choiceQuestion(lesson,'reason',`关于“${lesson.title}”，哪句话抓住了本质？`,essence,[`只要最后算对，“为什么”并不重要。`,`这只是一个孤立题型，换个情境就要重新背。`],'transfer','reason',`本质结论：${essence}`);
  const qTransfer=choiceQuestion(lesson,'transfer-idea','遇到一个新情境时，怎样判断能不能迁移这一关的方法？',`先找是否存在同样的数量关系：${lesson.mathIdea??lesson.concept}`,['看到相同数字就套用同一算式。','看到题目更长就先把所有数相加。'],'challenge','transfer',`情境可以改变，结构可以重复出现。${lesson.mathIdea??lesson.concept}`);
  const questions=originals.length>=4
    ? [originals[0],qWhy,originals[1],qModel,originals[2],qReason,originals[3],qTransfer]
    : [...originals,qWhy,qModel,qReason,qTransfer];
  return {
    ...lesson,
    whyQuestion,humanNeed,invention,essence,extensionChain,retellPrompt,
    birthStories:special.birthStories??[],
    practiceCount:Math.min(6,questions.length),
    lessonFlow:['本质结论','生活麻烦','为什么这样发明','动手建模','分层练习','Kevin复述'],
    questions
  };
}
