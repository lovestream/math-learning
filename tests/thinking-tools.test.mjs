import test from "node:test";
import assert from "node:assert/strict";
import {
  thinkingToolSpec,
  initialThinkingTool,
  moveThinkingTool,
  measureThinkingTool,
  validateThinkingTool,
} from "../shared/thinking-tools.mjs";
import { thinkingVariant } from "../content/pilot/thinking-variants.mjs";
import { applyThinking } from "../server/thinking-store.mjs";
import {
  freshProgress,
  validateEnvelope,
  exportEnvelope,
} from "../server/store.mjs";
test("同时取走相同盒子或砝码保持平衡，单边操作倾斜；多组参数一致", () => {
  for (let i = 0; i <= 8; i++) {
    const spec = thinkingToolSpec(
      "G3-UP01-TH1",
      i ? thinkingVariant("G3-UP01-TH1", i) : undefined,
    );
    let s = initialThinkingTool(spec);
    assert.throws(()=>validateThinkingTool(spec,{...s,values:[s.values[0],5,s.values[2],s.values[3]]}));
    assert(measureThinkingTool(spec, s).balanced);
    s = moveThinkingTool(spec, s, "remove-both-box");
    assert(measureThinkingTool(spec, s).balanced);
    s = moveThinkingTool(spec, s, "remove-both-weight");
    assert(measureThinkingTool(spec, s).balanced);
    assert(
      !measureThinkingTool(spec, moveThinkingTool(spec, s, "remove-left-box"))
        .balanced,
    );
    assert.throws(() =>
      validateThinkingTool(spec, { ...s, values: [-1, 0, 0, 10] }),
    );
  }
});
test("多视角最高数约束唯一确定三堆，正面单张照片不能排除后排高度", () => {
  for (let i = 0; i <= 8; i++) {
    const spec = thinkingToolSpec(
        "G3-U01-TH1",
        i ? thinkingVariant("G3-U01-TH1", i) : undefined,
      ),
      s = initialThinkingTool(spec),
      solutions = [];
    for (let a = 1; a <= spec.conditions[0] + 1; a++)
      for (let b = 1; b <= spec.conditions[0] + 1; b++)
        for (let c = 1; c <= spec.conditions[0] + 1; c++)
          if (measureThinkingTool(spec, { ...s, values: [a, b, c] }).matches)
            solutions.push([a, b, c]);
    assert.deepEqual(solutions, [[spec.conditions[0], 1, 1]]);
    const front = measureThinkingTool(spec, {
      ...s,
      values: [spec.conditions[0], 1, 2],
    }).front;
    assert.deepEqual(front, [spec.conditions[0], 1]);
    assert.throws(() => moveThinkingTool(spec, s, "height", 2, 0));
  }
});
test("Venn四区每人只能一处、移动不复制；求出的四区验回三项已知总数", () => {
  for (let i = 0; i <= 8; i++) {
    const spec = thinkingToolSpec(
        "G3-L07-TH1",
        i ? thinkingVariant("G3-L07-TH1", i) : undefined,
      ),
      c = spec.conditions,
      both = c[1] + c[2] - (c[0] - c[3]),
      counts = [c[1] - both, both, c[2] - both, c[3]],
      s = initialThinkingTool(spec);
    let n = 0;
    for (let zone = 0; zone < 4; zone++)
      for (let k = 0; k < counts[zone]; k++) s.values[n++] = zone + 1;
    assert(measureThinkingTool(spec, s).matches);
    const moved = moveThinkingTool(spec, s, "place", 0, 4);
    assert.equal(measureThinkingTool(spec, moved).assigned, c[0]);
    assert(!measureThinkingTool(spec, moved).matches);
    assert.throws(() => moveThinkingTool(spec, s, "place", c[0], 1));
  }
});
test("教具操作保留支架维度；撤销、刷新不清记录，也不产生掌握积分", () => {
  const p = freshProgress(),
    id = "G3-UP01-TH1";
  const send = (extra) =>
    applyThinking(p, {
      taskId: id,
      revision: p.studio.thinking?.[id]?.revision ?? 0,
      eventId: crypto.randomUUID(),
      action: "tool",
      ...extra,
    });
  send({ command: "remove-both-box" });
  send({ command: "remove-left-box" });
  send({ command: "undo" });
  assert.deepEqual(p.studio.thinking[id].tool.values, [2, 20, 1, 170]);
  assert.equal(p.studio.thinking[id].toolHistory.length, 1);
  assert.equal(p.studio.thinking[id].help.length, 0);
  assert.equal(p.wallet.coins, 0);
  assert.deepEqual(validateEnvelope(exportEnvelope(p), []), p);
});

test("长会话回执不复制全部历史；旧请求回放返回最新证据而不倒退版本", () => {
  const p = freshProgress(),
    id = "G3-UP01-TH1",
    first = {
      taskId: id,
      revision: 0,
      eventId: "tool:first",
      action: "tool",
      command: "reset",
    };
  applyThinking(p, first);
  for (let n = 0; n < 160; n++)
    applyThinking(p, {
      ...first,
      revision: p.studio.thinking[id].revision,
      eventId: "tool:" + n,
      command: n % 2 ? "reset" : "remove-both-box",
    });
  const latest = p.studio.thinking[id].revision;
  const repeated = applyThinking(p, first);
  assert.equal(repeated.record.revision, latest);
  assert.equal(p.studio.thinking[id].toolHistory.length, 30);
  assert(!p.studio.events.at(-1).result.record);
  assert(Buffer.byteLength(JSON.stringify(p.studio)) < 80000);
  assert.doesNotThrow(() => validateEnvelope(exportEnvelope(p), []));
});
