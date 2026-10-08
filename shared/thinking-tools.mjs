const check = (ok, msg) => {
    if (!ok) throw Error(msg);
  },
  int = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
export function thinkingToolSpec(id, variant) {
  const values = variant?.figure?.values;
  if (id === "G3-UP01-TH1")
    return {
      type: "balance",
      conditions: values ?? [3, 20, 2, 170],
      names: [variant ? "袋" : "盒"],
    };
  if (id === "G3-U01-TH1")
    return { type: "views", conditions: values ?? [2, 1] };
  if (id === "G3-L07-TH1")
    return {
      type: "venn",
      conditions: values ?? [20, 12, 10, 4],
      names: variant ? ["足球", "音乐"] : ["游泳", "画画"],
    };
  return null;
}
export function initialThinkingTool(spec) {
  return {
    version: "thinking-tools.v1",
    values:
      spec.type === "balance"
        ? [...spec.conditions]
        : spec.type === "views"
          ? [1, 1, 1]
          : Array(spec.conditions[0]).fill(0),
    view: 0,
  };
}
export function validateThinkingTool(spec, s) {
  check(
    spec &&
      s &&
      s.version === "thinking-tools.v1" &&
      Object.keys(s).every((k) => ["version", "values", "view"].includes(k)) &&
      Array.isArray(s.values) &&
      s.values.every((n) => int(n, 0, 1000)) &&
      int(s.view, 0, 2),
    "思维教具状态无效",
  );
  if (spec.type === "balance")
    check(
      s.values.length === 4 &&
        s.values.every((n, i) => n <= spec.conditions[i]),
      "不能取走超过原有材料的数量",
    );
  if (spec.type === "views")
    check(
      s.values.length === 3 &&
        s.values.every((n) => int(n, 1, spec.conditions[0] + 1)),
      "三个已知有堆的位置必须至少一块",
    );
  if (spec.type === "venn")
    check(
      s.values.length === spec.conditions[0] &&
        s.values.every((n) => int(n, 0, 4)),
      "每张姓名卡只能放在一个区域",
    );
  return s;
}
export function moveThinkingTool(spec, s, command, index, value) {
  validateThinkingTool(spec, s);
  const next = structuredClone(s);
  if (command === "reset") return initialThinkingTool(spec);
  if (spec.type === "balance") {
    const changes = {
      "remove-both-box": [-1, 0, -1, 0],
      "remove-both-weight": [0, -20, 0, -20],
      "remove-both-weight-ten": [0, -10, 0, -10],
      "remove-left-box": [-1, 0, 0, 0],
    };
    check(changes[command], "未知天平操作");
    next.values = next.values.map((n, i) => n + changes[command][i]);
  } else if (spec.type === "views") {
    if (command === "view") {
      check(int(value, 0, 2), "视角无效");
      next.view = value;
    } else {
      check(
        command === "height" &&
          int(index, 0, 2) &&
          int(value, 1, spec.conditions[0] + 1),
        "积木高度无效",
      );
      next.values[index] = value;
    }
  } else {
    check(
      command === "place" &&
        int(index, 0, spec.conditions[0] - 1) &&
        int(value, 0, 4),
      "区域或姓名无效",
    );
    next.values[index] = value;
  }
  return validateThinkingTool(spec, next);
}
export function measureThinkingTool(spec, s) {
  validateThinkingTool(spec, s);
  if (spec.type === "balance") {
    const c = spec.conditions,
      mass = (c[3] - c[1]) / (c[0] - c[2]),
      difference =
        s.values[0] * mass + s.values[1] - s.values[2] * mass - s.values[3];
    return {
      balanced: difference === 0,
      tilt: difference === 0 ? 0 : difference > 0 ? 10 : -10,
    };
  }
  if (spec.type === "views") {
    const front = [Math.max(s.values[0], s.values[2]), s.values[1]],
      right = [Math.max(s.values[0], s.values[1]), s.values[2]];
    return {
      front,
      right,
      matches:
        front[0] === spec.conditions[0] &&
        front[1] === spec.conditions[1] &&
        right[0] === spec.conditions[0] &&
        right[1] === spec.conditions[1],
    };
  }
  const counts = [1, 2, 3, 4].map(
      (zone) => s.values.filter((v) => v === zone).length,
    ),
    left = counts[0] + counts[1],
    right = counts[1] + counts[2],
    assigned = counts.reduce((a, b) => a + b, 0),
    c = spec.conditions;
  return {
    counts,
    left,
    right,
    assigned,
    matches:
      assigned === c[0] &&
      left === c[1] &&
      right === c[2] &&
      counts[3] === c[3],
  };
}
