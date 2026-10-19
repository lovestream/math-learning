import test from "node:test";
import assert from "node:assert/strict";
import {
  coreModels,
  initialCoreState,
  measureCore,
  validateCoreState,
  digits4,
  value4,
  placeWeights,
} from "../shared/core-models.mjs";
import { validateWidgetState } from "../shared/widget-state.mjs";
import { saveReading } from "../server/pilot-store.mjs";
import {
  freshProgress,
  validateEnvelope,
  exportEnvelope,
} from "../server/store.mjs";
import { lessons } from "../content/pilot/source.mjs";
test("11课×6情境均限定参数域、守恒、分组和正确复原，含连续进位、商中0、千位", () => {
  assert.equal(Object.keys(coreModels).length, 11);
  for (const [id, model] of Object.entries(coreModels)) {
    assert.equal(model.cases.length, 6);
    assert.equal(model.contexts.length, 6);
    assert.notEqual(model.contexts[5].story, model.contexts[0].story);
    assert(model.contexts[5].unit);
    for (let choice = 0; choice < 6; choice++) {
      const c = model.cases[choice],
        s = initialCoreState(model, choice);
      assert.doesNotThrow(() => measureCore(model, s));
      if (model.type === "product-place") {
        for (let group = 1; group <= c[1]; group++) {
          s.placed++;
          s.bank = s.bank.map((n, i) => n + digits4(c[0])[i]);
          assert.equal(measureCore(model, s).total, c[0] * group);
        }
        for (let i = 3; i >= 1; i--)
          while (s.bank[i] >= 10) {
            s.bank[i] -= 10;
            s.bank[i - 1]++;
            assert.equal(measureCore(model, s).total, c[0] * c[1]);
          }
        assert.deepEqual(s.bank, digits4(c[0] * c[1]));
        assert(measureCore(model, s).normalized);
        assert.throws(() =>
          validateCoreState(model, {
            ...s,
            bank: s.bank.map((n, i) => n + (i === 3 ? 1 : 0)),
          }),
        );
      } else if (model.type === "share-place") {
        const quotient = c[0] / c[1];
        assert(Number.isInteger(quotient));
        s.bank = [0, 0, 0, 0];
        s.alloc = Array.from({ length: c[1] }, () => digits4(quotient)).flat();
        assert(measureCore(model, s).equal);
        const wrong = [...s.alloc];
        const digit=digits4(quotient).findIndex(n=>n>0);
        wrong[digit]--;wrong[digit+4]++;
        assert(!measureCore(model,{...s,alloc:wrong}).equal);
        assert.throws(() =>
          validateCoreState(model, { ...s, bank: [0, 0, 0, 1] }),
        );
      } else if (model.type === "pack-remainder") {
        for (; s.placed < Math.floor(c[0] / c[1]); s.placed++) {
          const m = measureCore(model, s);
          assert(!m.complete);
          assert.equal(m.bags * c[1] + m.remainder, c[0]);
        }
        const m = measureCore(model, s);
        assert(m.complete && m.remainder < c[1]);
        assert.throws(() =>
          validateCoreState(model, { ...s, placed: s.placed + 1 }),
        );
      } else if (model.type === "fraction-core") {
        const parts = c[model.mode === "add" ? 0 : 1];
        if (model.mode === "add") {
          s.marked = Array.from({ length: c[1] }, (_, i) => i);
          s.filled = Array.from({ length: c[2] }, (_, i) => i + c[1]);
          assert.equal(measureCore(model, s).rest, parts - c[1] - c[2]);
          assert.throws(() => validateCoreState(model, { ...s, filled: [0] }));
        } else {
          assert.equal(c[0] % parts, 0);
          s.marked = Array.from({ length: c[2] }, (_, i) => i);
          assert.equal(
            measureCore(model, s).takenQuantity,
            (c[0] / parts) * c[2],
          );
        }
        assert(measureCore(model, s).complete);
        if(model.mode === "add"){
          const returned={...s,filled:s.filled.slice(0,-1)};
          assert.equal(measureCore(model,returned).taken, c[1]+c[2]-1);
          assert.equal(measureCore(model,returned).rest, parts-c[1]-c[2]+1);
          assert(!measureCore(model,returned).complete);
        }
        assert(
          !measureCore(model, { ...s, parts: parts === 10 ? 9 : parts + 1 })
            .complete,
        );
      } else if (model.type === "estimate-product") {
        const m = measureCore(model, s);
        assert(m.low <= m.exact && m.exact <= m.high);
        assert.equal(m.exact, c[0] * c[1]);
        if (m.guarantee === "sure-enough") assert(m.exact <= c[2]);
        if (m.guarantee === "sure-short") assert(m.exact > c[2]);
      } else if (model.type === "nested-groups") {
        s.marked = Array.from({ length: c[0] * c[1] }, (_, i) => i);
        assert.equal(measureCore(model, s).count, c[0] * c[1] * c[2]);
        assert(measureCore(model, s).complete);
        assert.throws(() => validateCoreState(model, { ...s, marked: [0, 0] }));
      } else if (model.type === "invariant-table") {
        s.take = 1;
        assert(measureCore(model, s).correct);
        s.mode = "total";
        assert(!measureCore(model, s).correct);
        s.take = 2;
        assert(measureCore(model, s).correct);
        assert(Number.isInteger(measureCore(model, s).newBoxes));
      }
      assert.doesNotThrow(() =>
        validateWidgetState(
          {
            ...s,
            stateKind: "textbook",
            textbookVersion: 1,
            sceneId: id + "-MODEL1",
            modelStateVersion: model.version,
            actions: [],
          },
          id,
        ),
      );
    }
  }
  assert.equal(value4([1, 1, 7, 6]), 1176);
  assert.equal(
    measureCore(coreModels["G3-U04-B03"], {
      choice: 0,
      placed: 8,
      bank: [1, 1, 7, 6],
    }).target,
    1176,
  );
});
test("长会话30条操作、导入导出、并发冲突和重复保存不改变数学状态与奖励", () => {
  const p = freshProgress(),
    id = "G3-U04-B03",
    model = coreModels[id],
    s = initialCoreState(model);
  s.placed = 8;
  s.bank = [0, 8, 32, 56];
  const states = [];
  for (let n = 0; n < 40; n++) {
    const before = JSON.stringify(s);
    if (n % 2 === 0) {
      s.bank[3] -= 10;
      s.bank[2]++;
    } else {
      s.bank[2]--;
      s.bank[3] += 10;
    }
    validateCoreState(model, s);
    states.push({
      action: "exchange",
      before,
      after: JSON.stringify(s),
      valid: true,
      at: new Date().toISOString(),
    });
  }
  const widgets = {
    try: {
      ...s,
      stateKind: "textbook",
      textbookVersion: 1,
      sceneId: id + "-MODEL1",
      modelStateVersion: model.version,
      actions: states.slice(-30),
    },
  };
  saveReading(
    p,
    { lessonId: id, revision: 0, blockId: "try", widgets },
    lessons,
  );
  assert.throws(
    () =>
      saveReading(
        p,
        { lessonId: id, revision: 0, blockId: "try", widgets },
        lessons,
      ),
    /另一|更新|载入/,
  );
  const restored = validateEnvelope(exportEnvelope(p), []);
  assert.deepEqual(restored.studio.reading[id].widgets, widgets);
  assert.equal(p.wallet.coins, 0);
  assert(Buffer.byteLength(JSON.stringify(widgets)) < 30000);
});
