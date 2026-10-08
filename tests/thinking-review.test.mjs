import test from "node:test";
import assert from "node:assert/strict";
import {
  thinkingCards,
  publicThinkingCard,
} from "../content/pilot/thinking-source.mjs";
import {
  publicationManifest,
  isApprovedThinkingCard,
} from "../content/pilot/thinking-publication.mjs";
import {
  thinkingVariant,
  publicVariant,
} from "../content/pilot/thinking-variants.mjs";
import {
  applyThinking,
  applyThinkingReview,
  validateThinking,
} from "../server/thinking-store.mjs";
import {
  freshProgress,
  exportEnvelope,
  validateEnvelope,
} from "../server/store.mjs";
const id = "G3-U02-TH1",
  DAY = 86400000,
  base = Date.parse("2026-10-01T08:00:00Z");
const input = (p, action, extra = {}) => ({
  taskId: id,
  revision: p.studio?.thinking?.[id]?.revision ?? 0,
  eventId: crypto.randomUUID(),
  action,
  ...extra,
});
const finish = (p, now = base) => {
  applyThinking(
    p,
    input(p, "first", { answer: "先送走一些，剩下的卡片作为整体再平均分。" }),
    now,
  );
  applyThinking(
    p,
    input(p, "check", {
      checks: [true, true, true],
      reflection: "括号表示先减，乘法可以验回剩余总数。",
    }),
    now + 1,
  );
  applyThinking(
    p,
    input(p, "final", {
      answer: p.studio.thinking[id].variantIndex
        ? thinkingVariant(id, p.studio.thinking[id].variantIndex).answer
        : "(36-12)÷3=8，原式32，这里不是等值改写。",
    }),
    now + 2,
  );
};
const grade = (p, verdict = "independent-mastered", now = base + 3) =>
  applyThinkingReview(
    p,
    input(p, "review", {
      verdict,
      comment: "已核对解释、图示与线下帮助情况。",
      reviewer: "自动化测试夹具",
      causes: [],
    }),
    now,
  );
test("发布必须逐ID批准，新卡即使TH1后缀也不会发布；公开结构无家长提示", () => {
  assert.equal(publicationManifest.length, 17);
  assert.equal(new Set(publicationManifest.map((r) => r.id)).size, 17);
  assert(!isApprovedThinkingCard("G3-NEW-TH1"));
  const t = thinkingCards.find((t) => t.id === id);
  assert(isApprovedThinkingCard(id, t));
  assert(
    !isApprovedThinkingCard(id, { ...t, question: t.question + "改变条件" }),
  );
  assert(!isApprovedThinkingCard(id, { ...t, answer: "未审核的新答案" }));
  assert(
    !isApprovedThinkingCard(id, { ...t, thinkingEvidence: "未审核的新依据" }),
  );
  for (const row of publicationManifest) {
    assert.equal(row.mathReview, "checked");
    assert(row.version);
    assert(row.batch);
    assert(row.publishedAt);
    assert.equal(row.studentMastery, "not-assessed");
  }
  for (const card of thinkingCards)
    for (const key of [
      "applicability",
      "thinkingEvidence",
      "answer",
      "solutionSteps",
      "reason",
      "hints",
    ])
      assert(!(key in publicThinkingCard(card)));
  assert.equal(thinkingCards.filter((t) => t.recommended).length, 17);
  assert.equal(thinkingCards.filter((t) => !t.recommended).length, 43);
});
test("17张卡各有4组已知条件一致的复习变式，公开题干不发送参考解释", () => {
  for (const t of thinkingCards.filter((t) => t.recommended))
    for (let i = 1; i <= 4; i++) {
      const v = thinkingVariant(t.id, i);
      assert.notEqual(v.question, t.question);
      assert(
        v.answer.length > 0 && v.reason.length > 0 && v.conditions.length > 0,
      );
      for (const k of ["answer", "reason", "hints", "solutionSteps"])
        assert(!(k in publicVariant(v)));
    }
  assert.match(thinkingVariant("G3-U02-TH1", 1).answer, /=8/);
  assert.match(thinkingVariant("G3-UP01-TH1", 4).answer, /280/);
  assert.match(thinkingVariant("G3-U01-TH1", 3).answer, /共6块/);
  assert.match(thinkingVariant("G3-L07-TH1", 1).answer, /都喜欢8/);
  assert.throws(() => thinkingVariant("G3-U01-TH2", 1));
  assert.throws(() => thinkingVariant(id, 5));
});
test("家长更正保留历史、版本保护与幂等；有辅助不允许批成独立", () => {
  const p = freshProgress();
  finish(p);
  const q = input(p, "review", {
    verdict: "needs-remediation",
    comment: "概念需回补",
    reviewer: "测试家长",
    causes: ["concept"],
  });
  const a = applyThinkingReview(p, q, base + 3),
    b = applyThinkingReview(p, q, base + 4);
  assert.deepEqual(a, b);
  assert.equal(a.record.reviews.length, 1);
  assert.throws(
    () => applyThinkingReview(p, { ...q, eventId: "stale-review" }, base + 5),
    /重新载入/,
  );
  const corrected = grade(p, "independent-mastered", base + 6);
  assert.equal(corrected.record.reviews.length, 2);
  assert.equal(
    corrected.record.review.dueAt,
    new Date(base + 6 + DAY).toISOString(),
  );
  assert.equal(p.wallet.coins, 0);
  applyThinking(p, input(p, "solution"), base + 7);
  assert.equal(p.studio.thinking[id].phase, "pendingReview");
  assert.throws(() => grade(p, "independent-mastered", base + 8), /辅助/);
  grade(p, "corrected-with-help", base + 9);
  assert.equal(p.studio.thinking[id].reviews.length, 3);
  assert.equal(p.studio.thinking[id].help[0].stage, "after-submission");
  assert.deepEqual(validateEnvelope(exportEnvelope(p), []), p);
});
test("从首答到审核到1/3/7/21天的4轮不同情境，未到期不得提前冒充复习", () => {
  const p = freshProgress();
  finish(p);
  grade(p);
  assert.throws(
    () => applyThinking(p, input(p, "review-start"), base + 100),
    /未到期/,
  );
  for (let stage = 1; stage <= 4; stage++) {
    const due = Date.parse(p.studio.thinking[id].review.dueAt);
    applyThinking(p, input(p, "review-start"), due);
    const r = p.studio.thinking[id];
    assert.equal(r.firstAnswer, null);
    assert.equal(r.variantIndex, stage);
    assert.equal(r.attempts.length, stage);
    assert.equal(r.variant.id, id + "-R" + stage);
    finish(p, due + 1);
    grade(p, "independent-mastered", due + 10);
    assert.equal(p.studio.thinking[id].review.stage, stage);
  }
  assert.equal(p.studio.thinking[id].review.completed, true);
  assert.equal(p.studio.thinking[id].review.dueAt, null);
  assert.equal(p.wallet.coins, 0);
  assert.doesNotThrow(() => validateThinking(p.studio.thinking));
  const tampered = structuredClone(p.studio.thinking);
  tampered[id].variant.question = "改动条件";
  assert.throws(() => validateThinking(tampered), /条件/);
});
test("辅助订正下一次换新题，不重复当日题；暂缓不触发复习，误批可以更正", () => {
  const p = freshProgress();
  finish(p);
  grade(p, "deferred");
  assert.equal(p.studio.thinking[id].review.dueAt, null);
  assert.throws(
    () => applyThinking(p, input(p, "review-start"), base + 2 * DAY),
    /未到期/,
  );
  grade(p, "needs-remediation");
  let now = Date.parse(p.studio.thinking[id].review.dueAt);
  applyThinking(p, input(p, "review-start"), now);
  applyThinking(p, input(p, "hint", { level: 1 }), now + 1);
  finish(p, now + 2);
  assert.equal(p.studio.thinking[id].firstAssisted, true);
  grade(p, "corrected-with-help", now + 5);
  now = Date.parse(p.studio.thinking[id].review.dueAt);
  applyThinking(p, input(p, "review-start"), now);
  assert.equal(p.studio.thinking[id].variantIndex, 2);
  assert.equal(p.studio.thinking[id].reviewStage, 1);
  assert.equal(p.studio.thinking[id].help.length, 0);
  finish(p, now + 1);
  grade(p, "independent-mastered", now + 5);
  assert.equal(p.studio.thinking[id].review.stage, 1);
});
