import {deeperThinkingVariant} from "./thinking-deeper-variants.mjs";
import {thinkingHints} from "./thinking-hints.mjs";
// Four independently authored isomorphic contexts per released card. Conditions,
// parent reference and arithmetic checks share one parameter object, never prose parsing.
const rows = [
  [
    1,
    42,
    18,
    3,
    5,
    9,
    30,
    210,
    26,
    3,
    14,
    21,
    5,
    7,
    4,
    6,
    28,
    5,
    3,
    4,
    28,
    8,
    4,
    9,
    12,
    4,
    5,
    30,
    2,
    [13, 17, 23, 27],
    40,
    23,
    19,
    6,
  ],
  [
    2,
    48,
    16,
    4,
    6,
    10,
    40,
    240,
    38,
    5,
    16,
    24,
    3,
    5,
    2,
    4,
    35,
    6,
    2,
    5,
    32,
    10,
    6,
    10,
    14,
    3,
    6,
    29,
    0,
    [11, 19, 21, 29],
    36,
    21,
    17,
    4,
  ],
  [
    3,
    54,
    24,
    3,
    7,
    12,
    50,
    300,
    46,
    6,
    18,
    27,
    6,
    8,
    3,
    5,
    42,
    7,
    4,
    6,
    36,
    12,
    4,
    12,
    15,
    5,
    6,
    31,
    6,
    [14, 16, 24, 26],
    32,
    18,
    16,
    3,
  ],
  [
    4,
    60,
    20,
    5,
    8,
    13,
    60,
    340,
    57,
    7,
    20,
    30,
    4,
    6,
    3,
    7,
    49,
    8,
    5,
    6,
    40,
    10,
    8,
    14,
    16,
    6,
    7,
    30,
    5,
    [12, 18, 22, 28],
    30,
    17,
    15,
    4,
  ],
];
// Extension parameters are bounded and checked by the same reference oracle.
// The original four rows above are preserved for saved attempts.
for (let k=1;k<=8;k++) {
 const div=3+k%3, given=div*(7+k), total=given+div*(12+k);
 rows.push([4+k,total,given,div,10+k,18+2*k,70+10*k,300+30*k,60+k,2+k%7,
  24+2*k,36+3*k,7+k,10+k,4+k,6+k,56+7*k,9+k,k,7+k,
  44+4*k,12+k,4,16+k,19+k,5,6,29+k%3,k%7,[10+k,30-k,15+k,25-k],
  40+k,24+k,20+k,7]);
}
export const THINKING_VARIANT_LIMIT=12;
const weekdays = [
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期日",
];
function buildThinkingVariant(id, index) {
  if (!Number.isInteger(index) || index < 1 || index > THINKING_VARIANT_LIMIT)
    throw Error("没有这组复习情境");
  const [
    n,
    total,
    given,
    div,
    a,
    b,
    weight,
    heavy,
    num,
    mult,
    red,
    blue,
    bread1,
    bread2,
    drink1,
    drink2,
    beads,
    bag,
    rem,
    hi,
    per,
    w,
    h,
    people1,
    people2,
    apple1,
    apple2,
    days,
    start,
    prices,
    all,
    swim,
    draw,
    neither,
  ] = rows[index - 1];
  const simple = (question, answer, conditions, reason) => ({
    id: `${id}-R${index}`,
    index,
    question,
    answer,
    reason,
    conditions,
    hints: thinkingHints(id),
    solutionSteps: [reason],
  });
  switch (id) {
    case "G3-U01-TH1": {
      const top = n + 1;
      return simple(
        `用相同方块搭积木：前左、前右、后左各一堆，后右空着；每堆至少1块且竖直叠齐。正面左列最高${top}块、右列最高1块；右侧前排最高${top}块、后排最高1块。三堆各有几块？总共几块？`,
        `前左${top}、前右1、后左1，共${top + 2}块。`,
        [
          `地面：前左／前右／后左有堆，后右空`,
          `正面高度：${top}、1；右侧高度：${top}、1`,
        ],
        "右列和后排各只有一堆，先确定都是1块；左列最高的那堆只能在前左。",
      );
    }
    case "G3-U02-TH1":
      return simple(
        `有${total}张卡片，先送走${given}张，剩下平均分给${div}人。把${total}−${given}÷${div}加一对括号表示这个故事；每人几张？加括号前后是否等值？`,
        `(${total}−${given})÷${div}=${(total - given) / div}；原式${total - given / div}，不等值。`,
        [`原有${total}张；送走${given}张；剩下分${div}人`],
        "剩下的卡片是一个整体，减法先做；添加括号改变原式的运算顺序，不能把这称为等值去括号。",
      );
    case "G3-U03-TH1":
      return simple(
        `两条硬纸条分别长${a}厘米、${b}厘米，无中间刻度。允许在纸上标端点。怎样准确得到${b - a}厘米，再得到${2 * b - a}厘米？`,
        `${b}−${a}=${b - a}；${b}+${b - a}=${2 * b - a}厘米。`,
        [`两纸条：${a}厘米和${b}厘米（无中间刻度）`],
        "先同起点对齐，终点之间是长度的差；复制该线段，与长纸条首尾连接，不重叠不留缝。",
      );
    case "G3-UP01-TH1":
      return simple(
        `天平平衡：左盘3个相同密封袋和${weight}克砝码，右盘2个同样袋和${heavy}克砝码，其中可以取出${weight}克。每袋重多少克？说明两边同时拿走什么。`,
        `${heavy - weight}克。`,
        [`左：3袋＋${weight}克；右：2袋＋${heavy}克`],
        `同时去掉2袋，再同时去掉${weight}克，剩一袋对应${heavy - weight}克。`,
      );
    case "G3-U04-TH1":
      return simple(
        `计算${num}×${mult}时，把十位数字看大1，结果多多少？若只把个位看大1呢？不分别计算完整乘积，解释原因。`,
        `分别多${10 * mult}和${mult}。`,
        [`正确式：${num}×${mult}；一次只看错一个数位`],
        "十位大1代表每组多10，个位大1代表每组多1；重复组数没有变化。",
      );
    case "G3-UP02-TH1":
      if(index>4) {
        const rack=index-4, book=24+index%5, second=rack*10+2, digit=index;
        // rack=1..8, book=25..32. A valid split must use the actual tens/ones.
        const tens=Math.floor(book/10), ones=book%10;
        const other=rack*10+tens;
        return simple(`架号和本号均为1到99。${rack}架${book}本直接连写为${rack}${book}；另一种合法分法是什么？分别用分隔符和固定两位字段改写。`,
          `${other}架${ones}本；${rack}-${book}和${other}-${ones}；${String(rack).padStart(2,'0')}${book}和${other}${String(ones).padStart(2,'0')}。`,
          [`连写编码${rack}${book}；架号、本号1到99；字段可不足两位`], '把连写串的分界移动一位，验证两边都在1到99；固定两位必须补0。');
      }
      return simple(
        `把架号和本号直接连写：第${n}架第${n + 10}本，与第${n * 10 + 1}架第${n}本，都会得到${n}${n + 10}。请用分隔符、固定两位字段两种规则，分别改写并说明范围。`,
        `${n}-${n + 10}与${n * 10 + 1}-${n}；${String(n).padStart(2, "0")}${n + 10}与${n * 10 + 1}${String(n).padStart(2, "0")}。`,
        ["架号、本号均为1到99；旧规则不固定字段长度"],
        "分隔符标出边界；每个字段两位时不足补0，超过99必须改规则。",
      );
    case "G3-U05-TH1":
      if(index>4) {
        const straight=index%2===0;
        return simple(`图中的整个角${straight?'由一条直线组成':'是一个直角'}。内部的射线把它分成两个非零角；左角是直角的1/${index-2}，右角比左角大。右边一定是钝角吗？用直角纸片解释，并检查把两个角换个大小后是否仍成立。`,
          straight?'一定是；若两边都不超过直角且合成一条直线，就只能都等于直角，与右边更大矛盾。':'不可能是；它只是直角的一部分，所以小于直角。',
          [`整体${straight?'是直线形成的角':'是直角'}；右角比左角大；射线位于内部`],
          straight?'直线形成的角由两个直角组成；较大的部分超过直角。交换大小后，右角反而小于直角。':'整体只有一个直角，两部分都比整体小；交换大小后仍是两个锐角。');
      }
      return simple(
        `${["窗框", "桌面", "方形卡纸", "积木底面"][index - 1]}的一个直角内画一条射线，得到两个非零角。右边角比左边大。右边一定是钝角吗？用直角纸片作参照说明。`,
        "不是；两个角都小于直角，都是锐角。",
        ["整个角是直角；射线严格在内部；右边比左边大"],
        "判断钝角要和直角比较，不能只和另一个小角比较。",
      );
    case "G3-U06-TH1":
      return simple(
        `黄带长${red}厘米，取1/2；绿带长${blue}厘米，取1/3。分别取几厘米？1/2较大，是否保证取出的实际长度较大？`,
        `都取${red / 2}厘米；不保证。`,
        [`黄带整体${red}厘米；绿带整体${blue}厘米`],
        "分数描述各自整体的份数；不同整体必须先算实际量再比较。",
      );
    case "G3-U07-TH1": {
      const limit = bread1 + drink2;
      const combos = [bread1, bread2]
        .flatMap((x) => [drink1, drink2].map((y) => [x, y]))
        .filter(([x, y]) => x + y <= limit);
      return simple(
        `点心${bread1}元或${bread2}元，果汁${drink1}元或${drink2}元。各选一种，最多花${limit}元。找出所有套餐，恰好预算能否购买？`,
        combos.map(([x, y]) => `${x}+${y}=${x + y}`).join("；") +
          "。恰好预算可以。",
        [
          `点心：${bread1}／${bread2}元；果汁：${drink1}／${drink2}元；预算${limit}元`,
        ],
        "先列完整2×2表，逐格筛选；相同总价不表示相同搭配。",
      );
    }
    case "G3-L01-TH1":
      if(index>4) {
        const folds=1+(index-5)%4, holes=index<9?1:2;
        return simple(`方形纸依次沿${folds===1?'竖直中线':folds===2?'竖直、水平中线':folds===3?'竖直、水平中线，再把小方形沿对角线':'竖直、水平中线、小方形对角线，再把小三角形沿对称轴'}对折${folds}次。在叠好的纸上打${holes}个小圆孔，每孔穿透所有层，远离折痕和纸边；不同孔及它们展开后的位置也不重合。展开共有几个孔？解释每次展开怎样改变数量。`,
          `${2**folds*holes}个孔。`, [`${folds}次对折；打${holes}个孔；穿透全部层；展开后孔位互不重合`],
          `一开始${holes}个孔，每次展开增加一份对应孔；依次乘2，共${2**folds*holes}个。`);
      }
      return simple(
        `方形纸先沿${index % 2 ? "水平" : "竖直"}中线折，再沿${index % 2 ? "竖直" : "水平"}中线折。一次穿透全部四层打一个${["小三角", "小圆", "小方", "小菱形"][index - 1]}孔，孔离折痕和边都足够远。展开有几个孔？标出对应位置并解释。`,
        "4个孔，关于两条中线成对对应。",
        ["两次垂直对折；穿透4层；孔不接触折痕和纸边"],
        "每展开一次出现原孔的一个对称对应，2×2=4；孔靠折痕会是另一种情况。",
      );
    case "G3-L02-TH1": {
      const lo = hi - 2;
      return simple(
        `纽扣每${bag}颗装满一袋，余${rem}颗。满袋最少${lo}袋、最多${hi}袋。找全总数，并检验${lo * bag + rem + 1}颗是否符合。`,
        Array.from({ length: 3 }, (_, i) => (lo + i) * bag + rem).join("、") +
          "；检验数不符合。",
        [`每袋${bag}颗；余${rem}颗；满袋${lo}到${hi}袋`],
        "枚举满袋数，再加固定余数；除数必须大于余数，不能再装一满袋。",
      );
    }
    case "G3-L03-TH1": {
      const half = per / 2;
      return simple(
        `用${per}厘米绳围长方形，接头忽略，边长正整数，允许正方形；长宽交换只算一种。列出所有长宽，并解释不遗漏。`,
        Array.from(
          { length: Math.floor(half / 2) },
          (_, i) => `${half - i - 1}和${i + 1}`,
        ).join("、") + "厘米。",
        [`周长${per}厘米；长≥宽≥1；整数边长`],
        "长加宽为周长的一半；短边从1增加到长宽相等之前，之后只会重复旋转。",
      );
    }
    case "G3-L04-TH1":
      return simple(
        `长${w}厘米、宽${h}厘米的卡纸沿对角线剪开。两块能否转动后重合？每块面积是多少？用原纸解释，不直接套三角形公式。`,
        `能，每块${(w * h) / 2}平方厘米。`,
        [`长方形${w}×${h}厘米；沿对角线分成两块`],
        "两块转动可重合，且恰好无重叠拼回整个长方形，所以每块是总面积的一半。",
      );
    case "G3-L05-TH1":
      return simple(
        `甲队${people1}人、乙队${people2}人，每人只选苹果或香蕉一种。苹果分别${apple1}、${apple2}人。补出香蕉各几人、合计几人，比苹果多多少？验回总人数。`,
        `香蕉${people1 - apple1}、${people2 - apple2}，共${people1 + people2 - apple1 - apple2}；比苹果多${people1 + people2 - 2 * (apple1 + apple2)}。`,
        [
          `甲：${people1}人，苹果${apple1}人；乙：${people2}人，苹果${apple2}人`,
        ],
        "先按行补出另一类，再按列合并；行总数和列总数应一致。",
      );
    case "G3-LP01-TH1": {
      const extra = days % 7;
      return simple(
        `某月${days}天，1日是${weekdays[start]}。哪些星期出现5次，哪些4次？用完整周加余天解释。`,
        `出现5次：${Array.from({ length: extra }, (_, i) => weekdays[(start + i) % 7]).join("、")}；其他各4次。`,
        [`本月${days}天，起点${weekdays[start]}`],
        `28天是4个完整周；余${extra}天从${weekdays[start]}依次增加。`,
      );
    }
    case "G3-L06-TH1": {
      const pairs = prices.flatMap((x, i) =>
        prices
          .slice(i + 1)
          .filter((y) => x + y === 40)
          .map((y) => `${(x / 10).toFixed(1)}与${(y / 10).toFixed(1)}元`),
      );
      return simple(
        `四种小礼物价格${prices.map((x) => (x / 10).toFixed(1)).join("、")}元。只能买两种不同礼物各1件，正好4元，列全不重复买法。`,
        pairs.join("；"),
        [
          `价格：${prices.map((x) => (x / 10).toFixed(1)).join("、")}元；预算4元`,
        ],
        "固定第一件，找互补价；交换购买顺序不会产生新组合。",
      );
    }
    case "G3-L07-TH1": {
      const both = swim + draw - (all - neither);
      return simple(
        `社团${all}人，喜欢足球${swim}人，喜欢音乐${draw}人，${neither}人两种都不喜欢。求都喜欢、只足球、只音乐人数，用四个不重叠区域验回总数。`,
        `都喜欢${both}、只足球${swim - both}、只音乐${draw - both}、都不喜欢${neither}。`,
        [`总数${all}；足球${swim}；音乐${draw}；都不喜欢${neither}`],
        "先减去圈外人数得并集；两类人数相加多计一次交集，再求各自独有部分。",
      );
    }
    default:
      throw Error("未审核的卡没有复习变式");
  }
}
export function thinkingVariant(id, index) {
  const deeper=deeperThinkingVariant(id,index);
  if(deeper)return deeper;
  const v = buildThinkingVariant(id, index),
    [
      n,
      total,
      given,
      div,
      a,
      b,
      weight,
      heavy,
      num,
      mult,
      red,
      blue,
      bread1,
      bread2,
      drink1,
      drink2,
      beads,
      bag,
      rem,
      hi,
      per,
      w,
      h,
      people1,
      people2,
      apple1,
      apple2,
      days,
      start,
      prices,
      all,
      swim,
      draw,
      neither,
    ] = rows[index - 1];
  const known = {
    "G3-U01-TH1": [n + 1, 1],
    "G3-U02-TH1": [total, given, div],
    "G3-U03-TH1": [a, b],
    "G3-UP01-TH1": [3, weight, 2, heavy],
    "G3-U04-TH1": [num, mult],
    "G3-UP02-TH1": index>4?[index-4,24+index%5,(index-4)*10+Math.floor((24+index%5)/10),(24+index%5)%10]:[n, n + 10, n * 10 + 1, n],
    "G3-U05-TH1": index>4?[index%2===0?180:90,90/(index-2)]:[90],
    "G3-U06-TH1": [red, blue, 2, 3],
    "G3-U07-TH1": [bread1, bread2, drink1, drink2, bread1 + drink2],
    "G3-L01-TH1": index>4?[1+(index-5)%4,index<9?1:2]:[index],
    "G3-L02-TH1": [bag, rem, hi - 2, hi],
    "G3-L03-TH1": [per],
    "G3-L04-TH1": [w, h],
    "G3-L05-TH1": [people1, people2, apple1, apple2],
    "G3-LP01-TH1": [days, start],
    "G3-L06-TH1": prices,
    "G3-L07-TH1": [all, swim, draw, neither],
  };
  return { ...v, figure: { unit: id.split("-")[1]+(id==="G3-L01-TH1"&&index>4?"-fold":""), values: known[id] } };
}
export const publicVariant = (v) => ({
  id: v.id,
  index: v.index,
  question: v.question,
  conditions: v.conditions,
  figure: v.figure,
});
