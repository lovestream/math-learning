// Reviewed finite domains: examples are explicit, not arbitrary user-entered operands.
const make = (type, title, cases, mode) => ({
  type,
  title,
  cases,
  mode,
  version: "textbook.core.v1",
});
export const coreModels = {
  "G3-U04-B01": make(
    "product-place",
    "每增加一盒，就增加同样的计数单位",
    [
      [12, 3],
      [21, 4],
      [112, 4],
      [230, 3],
      [102, 4],
      [32, 3],
    ],
    "no-carry",
  ),
  "G3-U04-B03": make(
    "product-place",
    "从个位开始，连续把十个换成一个",
    [
      [147, 8],
      [68, 7],
      [186, 6],
      [249, 4],
      [375, 3],
      [158, 6],
    ],
    "carry",
  ),
  "G3-U04-B04": make(
    "product-place",
    "0保留数位，进来的十仍要接住",
    [
      [604, 8],
      [305, 6],
      [240, 4],
      [508, 7],
      [700, 9],
      [406, 5],
    ],
    "zero",
  ),
  "G3-U04-B05": make(
    "estimate-product",
    "估计能保证什么，什么时候还要精算",
    [
      [398, 8, 3200, 390, 400],
      [203, 4, 800, 200, 210],
      [296, 3, 900, 290, 300],
      [402, 6, 2400, 400, 410],
      [487, 5, 2450, 480, 490],
      [198, 7, 1400, 190, 200],
    ],
    "estimate",
  ),
  "G3-L02-B01": make(
    "share-place",
    "把计数单位平均分，分错可以退回",
    [
      [90, 3],
      [96, 3],
      [600, 3],
      [840, 4],
      [1000, 5],
      [168, 4],
    ],
    "share",
  ),
  "G3-L02-B03": make(
    "pack-remainder",
    "剩下的还能装一满袋吗",
    [
      [53, 4],
      [38, 5],
      [47, 6],
      [60, 7],
      [29, 3],
      [71, 8],
    ],
    "remainder",
  ),
  "G3-L02-B05": make(
    "nested-groups",
    "箱、盒、个：让分组层级看得见",
    [
      [2, 4, 6],
      [3, 2, 5],
      [2, 3, 8],
      [4, 2, 4],
      [3, 3, 3],
      [2, 5, 4],
    ],
    "nested",
  ),
  "G3-L02-B06": make(
    "invariant-table",
    "数量变了，先找表里哪一项不变",
    [
      [4, 24, 7, 6, 8],
      [3, 18, 5, 6, 9],
      [5, 40, 3, 8, 10],
      [6, 30, 9, 5, 10],
      [4, 28, 8, 7, 14],
      [3, 27, 5, 9, 3],
    ],
    "invariant",
  ),
  "G3-U06-B03": make(
    "fraction-core",
    "同一块饼，两次拿走的份不能重叠",
    [
      [8, 2, 3],
      [6, 1, 2],
      [10, 3, 4],
      [4, 1, 2],
      [8, 3, 5],
      [6, 2, 3],
    ],
    "add",
  ),
  "G3-U06-B04": make(
    "fraction-core",
    "大圈里全部物品是一个整体",
    [
      [12, 3, 1],
      [16, 4, 1],
      [20, 5, 1],
      [18, 6, 1],
      [24, 8, 1],
      [15, 3, 1],
    ],
    "unit",
  ),
  "G3-U06-B05": make(
    "fraction-core",
    "先圈平均的一小组，再选几组",
    [
      [24, 8, 3],
      [18, 6, 2],
      [20, 5, 3],
      [28, 7, 4],
      [16, 4, 3],
      [30, 6, 5],
    ],
    "quantity",
  ),
};
export const placeWeights = [1000, 100, 10, 1];
export const digits4 = (n) => placeWeights.map((w) => Math.floor(n / w) % 10);
export const value4 = (bank) =>
  bank.reduce((sum, n, i) => sum + n * placeWeights[i], 0);
export function initialCoreState(model, choice = 0) {
  const c = model.cases[choice];
  if (!c) throw Error("未审核的例题参数");
  if (model.type === "product-place")
    return { choice, bank: [0, 0, 0, 0], placed: 0 };
  if (model.type === "share-place")
    return { choice, bank: digits4(c[0]), alloc: Array(c[1] * 4).fill(0) };
  if (model.type === "estimate-product")
    return { choice, take: 0, checked: false };
  if (model.type === "pack-remainder") return { choice, placed: 0 };
  if (model.type === "nested-groups")
    return { choice, marked: [], mode: "group" };
  if (model.type === "invariant-table")
    return { choice, take: 0, mode: "price" };
  if (model.type === "fraction-core")
    return {
      choice,
      parts: c[model.mode === "add" ? 0 : 1],
      marked: [],
      filled: [],
    };
  throw Error("未注册核心模型");
}
const check = (v, m) => {
    if (!v) throw Error(m);
  },
  integer = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
export function validateCoreState(model, s) {
  check(integer(s.choice, 0, model.cases.length - 1), "不支持这组例题");
  const c = model.cases[s.choice],
    base = initialCoreState(model, s.choice);
  check(
    Object.keys(s).every(
      (k) => k in base || ["error", "checked"].includes(k),
    ) && Object.keys(base).every((k) => k in s),
    "核心教具状态字段无效",
  );
  if (s.error !== undefined)
    check(typeof s.error === "string" && s.error.length <= 240, "反馈无效");
  if (s.checked !== undefined)
    check(typeof s.checked === "boolean", "核对状态无效");
  for (const key of ["bank", "alloc", "marked", "filled"])
    if (s[key])
      check(
        Array.isArray(s[key]) &&
          s[key].length <= 120 &&
          s[key].every((n) => integer(n, 0, 10000)),
        "无效数学材料",
      );
  switch (model.type) {
    case "product-place":
      check(
        integer(s.placed, 0, c[1]) &&
          s.bank.length === 4 &&
          value4(s.bank) === c[0] * s.placed,
        "每增加一组，材料应增加相同数量",
      );
      break;
    case "share-place":
      check(
        s.bank.length === 4 &&
          s.alloc.length === c[1] * 4 &&
          value4(s.bank) +
            s.alloc.reduce((v, n, i) => v + n * placeWeights[i % 4], 0) ===
            c[0],
        "分配和拆换必须守恒",
      );
      break;
    case "estimate-product":
      check(integer(s.take, 0, 2), "估计参照无效");
      break;
    case "pack-remainder":
      check(
        integer(s.placed, 0, Math.floor(c[0] / c[1])),
        "不能装超过总数的满袋",
      );
      break;
    case "nested-groups":
      check(
        ["group", "ungroup"].includes(s.mode) &&
          new Set(s.marked).size === s.marked.length &&
          s.marked.every((n) => integer(n, 0, c[0] * c[1] - 1)),
        "盒子登记无效",
      );
      break;
    case "invariant-table":
      check(
        ["price", "total"].includes(s.mode) && integer(s.take, 0, 2),
        "不变量选择无效",
      );
      break;
    case "fraction-core": {
      const parts = c[model.mode === "add" ? 0 : 1];
      check(
        integer(s.parts, 2, 10) &&
          new Set(s.marked).size === s.marked.length &&
          new Set(s.filled).size === s.filled.length &&
          s.marked.every((n) => integer(n, 0, parts - 1)) &&
          s.filled.every((n) => integer(n, 0, parts - 1)) &&
          s.filled.every((n) => !s.marked.includes(n)),
        "同一份不能被两次取走",
      );
      break;
    }
  }
  return s;
}
export function measureCore(model, s) {
  validateCoreState(model, s);
  const c = model.cases[s.choice];
  switch (model.type) {
    case "product-place":
      return {
        total: value4(s.bank),
        target: c[0] * c[1],
        normalized: s.placed === c[1] && s.bank.every((n) => n < 10),
      };
    case "share-place": {
      const shares = Array.from({ length: c[1] }, (_, i) =>
        value4(s.alloc.slice(i * 4, i * 4 + 4)),
      );
      return {
        shares,
        pending: value4(s.bank),
        equal: shares.every((n) => n === shares[0]) && value4(s.bank) === 0,
        quotient: Math.floor(c[0] / c[1]),
      };
    }
    case "estimate-product": {
      const [a, b, budget, lo, hi] = c;
      return {
        exact: a * b,
        low: lo * b,
        high: hi * b,
        budget,
        reference: s.take === 1 ? lo * b : s.take === 2 ? hi * b : null,
        guarantee:
          hi * b <= budget
            ? "sure-enough"
            : lo * b > budget
              ? "sure-short"
              : "need-exact",
      };
    }
    case "pack-remainder":
      return {
        bags: s.placed,
        remainder: c[0] - s.placed * c[1],
        complete: c[0] - s.placed * c[1] < c[1],
        total: c[0],
      };
    case "nested-groups":
      return {
        boxes: s.marked.length,
        count: s.marked.length * c[2],
        total: c[0] * c[1] * c[2],
        complete: s.marked.length === c[0] * c[1],
      };
    case "invariant-table":
      return {
        price: c[1] / c[0],
        newCost: (c[1] / c[0]) * c[2],
        total: c[3] * c[0],
        newBoxes: (c[3] * c[0]) / c[4],
        correct: s.mode === "price" ? s.take === 1 : s.take === 2,
      };
    case "fraction-core": {
      const parts = c[model.mode === "add" ? 0 : 1],
        unit = model.mode === "add" ? 1 : c[0] / parts;
      return {
        equal: s.parts === parts,
        parts,
        unit,
        taken: s.marked.length + s.filled.length,
        takenQuantity: (s.marked.length + s.filled.length) * unit,
        rest: parts - s.marked.length - s.filled.length,
        target: model.mode === "add" ? c[1] + c[2] : c[2],
        complete:
          s.parts === parts &&
          (model.mode === "add"
            ? s.marked.length === c[1] && s.filled.length === c[2]
            : s.marked.length === c[2]),
      };
    }
  }
}
// The sixth task changes the situation and representation, not just the operands.
const contexts = {
  "G3-U04-B01": (c) => ({
    story: `每盒${c[0]}支笔，买${c[1]}盒，一共有多少支？`,
    unit: "支",
    group: "盒",
  }),
  "G3-U04-B03": (c) => ({
    story: `${c[1]}箱饮料，每箱${c[0]}瓶，一共多少瓶？`,
    unit: "瓶",
    group: "箱",
  }),
  "G3-U04-B04": (c) => ({
    story: `每区${c[0]}个座位，共${c[1]}区，一共有多少座位？`,
    unit: "个",
    group: "区",
  }),
  "G3-U04-B05": (c) => ({
    story: `${c[0]}名同学每人票价${c[1]}元，准备${c[2]}元够不够？`,
    unit: "元",
  }),
  "G3-L02-B01": (c) => ({
    story: `${c[0]}张纸平均分给${c[1]}人，每人多少张？`,
    unit: "张",
    group: "人",
  }),
  "G3-L02-B03": (c) => ({
    story: `${c[0]}颗糖，每袋装${c[1]}颗，能装几满袋，还余几颗？`,
    unit: "颗",
    group: "袋",
    kind: "bags",
  }),
  "G3-L02-B05": (c) => ({
    story: `${c[0]}箱杯子，每箱${c[1]}盒，每盒${c[2]}个，一共多少个？`,
    unit: "个",
    outer: "箱",
    inner: "盒",
  }),
  "G3-L02-B06": (c) => ({
    story: `${c[0]}本同价本子${c[1]}元，买${c[2]}本多少钱？`,
    alternate: `同一批书每箱${c[3]}本装${c[0]}箱，改每箱${c[4]}本，要几箱？`,
    unit: "本",
    outer: "箱",
    quantity: "本",
  }),
  "G3-U06-B03": (c) => ({
    story: `同一块饼先吃${c[1]}/${c[0]}，后来吃${c[2]}/${c[0]}；一共吃多少，还剩多少？`,
    unit: "份",
    kind: "strip",
  }),
  "G3-U06-B04": (c) => ({
    story: `一盒${c[0]}颗糖，拿走整盒的${c[2]}/${c[1]}，是多少颗？`,
    unit: "颗",
  }),
  "G3-U06-B05": (c) => ({
    story: `${c[0]}张贴纸的${c[2]}/${c[1]}要送朋友，应拿出多少张？`,
    unit: "张",
  }),
};
const transfers = {
  "G3-U04-B01": (c) => ({
    story: `操场搭座位，每排${c[0]}个，共${c[1]}排。换成排数与每排数，还能按同一位值关系求总数吗？`,
    unit: "个",
    group: "排",
  }),
  "G3-U04-B03": (c) => ({
    story: `${c[1]}条纸带各长${c[0]}毫米，首尾相接，不重叠、不留缝。总长多少毫米？每次满十换一是什么意思？`,
    unit: "毫米",
    group: "条",
  }),
  "G3-U04-B04": (c) => ({
    story: `${c[1]}袋米，每袋${c[0]}克。总质量多少克？袋数变了，中间0的数位能不能省掉？`,
    unit: "克",
    group: "袋",
  }),
  "G3-U04-B05": (c) => ({
    story: `食堂买${c[0]}千克米，每千克${c[1]}元，预算${c[2]}元。选择费用上界或下界，说明它能保证什么。`,
    unit: "元",
  }),
  "G3-L02-B01": (c) => ({
    story: `${c[0]}厘米丝带要平均剪成${c[1]}段，不计剪口损耗，每段多长？把计数单位当厘米，平均分的关系还一样吗？`,
    unit: "厘米",
    group: "段",
  }),
  "G3-L02-B03": (c) => ({
    story: `${c[0]}厘米胶带，每段剪${c[1]}厘米，不计剪口损耗。能剪几段？余下为什么不能再算一段？`,
    unit: "厘米",
    group: "段",
    kind: "strip",
  }),
  "G3-L02-B05": (c) => ({
    story: `图书角有${c[0]}个书架，每架${c[1]}层，每层${c[2]}本书。先登记各层，再把总数按架、层分回去。`,
    unit: "本",
    outer: "架",
    inner: "层",
  }),
  "G3-L02-B06": (c) => ({
    story: `${c[0]}包同价饼干${c[1]}元，买${c[2]}包多少钱？先找不变的量。`,
    alternate: `${c[0]}桶米，每桶${c[3]}千克，改每桶${c[4]}千克，要几桶？与买饼干的“不变”一样吗？`,
    unit: "包",
    outer: "桶",
    quantity: "千克",
  }),
  "G3-U06-B03": (c) => ({
    story: `同一根木条，先锯下全长的${c[1]}/${c[0]}，再锯下原来全长的${c[2]}/${c[0]}。总共锯去几分之几？第二次仍以原来的整根为整体。`,
    unit: "份",
    kind: "strip",
  }),
  "G3-U06-B04": (c) => ({
    story: `${c[0]}名乘客平均坐${c[1]}辆车，一辆车里是全体乘客的${c[2]}/${c[1]}。一辆有几人？这里的整体是什么？`,
    unit: "人",
  }),
  "G3-U06-B05": (c) => ({
    story: `${c[0]}支笔平均放入${c[1]}盒，带走其中${c[2]}盒。带走的是全部的几分之几，共多少支？`,
    unit: "支",
  }),
};
for (const [id, model] of Object.entries(coreModels))
  model.contexts = model.cases.map((c, i) =>
    (i === 5 ? transfers[id] : contexts[id])(c),
  );
