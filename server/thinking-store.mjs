import {
  thinkingToolSpec,
  initialThinkingTool,
  validateThinkingTool,
  moveThinkingTool,
  measureThinkingTool,
} from "../shared/thinking-tools.mjs";
import { thinkingCards } from "../content/pilot/thinking-source.mjs";
import {
  thinkingVariant,
  publicVariant,
} from "../content/pilot/thinking-variants.mjs";
const check = (ok, text, code = "INVALID_INPUT") => {
  if (!ok)
    throw Object.assign(new Error(text), {
      status: code === "STALE_REVISION" ? 409 : 400,
      code,
    });
};
const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const text = (v, min = 1, max = 1200) =>
  typeof v === "string" && v.trim().length >= min && v.length <= max;
const date = (v) => typeof v === "string" && Number.isFinite(Date.parse(v));
export const reviewVerdicts = [
  "independent-mastered",
  "model-supported",
  "corrected-with-help",
  "needs-remediation",
  "deferred",
];
export const errorCauses = [
  "symbol",
  "calculation",
  "steps",
  "concept",
  "checking",
];
const delays = [1, 3, 7, 21],
  DAY = 86400000;
export function scaffoldEvidence(r) {
  const history = r.toolHistory ?? [];
  return r.scaffold ?? {usedManipulative:Boolean(r.tool), usedAnswerValidation:Boolean(r.tool), validationAttempts:history.length, matchedAttempts:0, withVisualScaffold:true, legacyEstimate:Boolean(r.tool)};
}
export function hasStrongDelayedChain(r) {
  const attempts=[...(r.attempts??[]),r];
  let previous=attempts[0]?.reviews?.at(-1);
  if(!previous)return false;
  for(let stage=1;stage<=4;stage++){
    const eligible=attempts.filter(a=>a.reviewStage===stage && a.phase==='reviewed' && a.reviews?.at(-1)?.verdict==='independent-mastered' && a.reviews.at(-1).evidence?.mode==='challenge' && !a.reviews.at(-1).evidence.scaffold.usedAnswerValidation && a.reviews.at(-1).evidence.help.length===0);
    const current=eligible.find(a=>Date.parse(a.firstAt)>=Date.parse(previous.scheduleAt)+delays[stage-1]*DAY);
    if(!current)return false;
    previous=current.reviews.at(-1);
  }
  return true;
}
function validateAttempt(r) {
  if(r.seenVariantIds) check(Array.isArray(r.seenVariantIds) && r.seenVariantIds.length<=12 && new Set(r.seenVariantIds).size===r.seenVariantIds.length && r.seenVariantIds.every(id=>Array.from({length:12},(_,i)=>`${r.taskId}-R${i+1}`).includes(id)), "已见复习题目记录无效。");
  check(r.recordSchemaVersion === undefined || [1,2].includes(r.recordSchemaVersion), "此学习证据格式暂不支持，请使用匹配版本的程序。");
  if (r.mode !== undefined) check(["explore", "challenge"].includes(r.mode), "作答模式无效。");
  if(r.scaffold) check(object(r.scaffold) && ["usedManipulative","usedAnswerValidation","withVisualScaffold"].every(k=>typeof r.scaffold[k] === "boolean") && Number.isSafeInteger(r.scaffold.validationAttempts) && r.scaffold.validationAttempts >= 0 && Number.isSafeInteger(r.scaffold.matchedAttempts) && r.scaffold.matchedAttempts >= 0 && r.scaffold.matchedAttempts <= r.scaffold.validationAttempts, "教具支架证据无效。");
  if(r.postReviewStudy) check(Array.isArray(r.postReviewStudy) && r.postReviewStudy.length <= 100 && r.postReviewStudy.every(h=>["hint","solution","reference"].includes(h.kind) && date(h.at) && Number.isInteger(h.level) && h.level>=0 && h.level<=3 && text(h.text,1,4000) && h.stage === "post-review"), "批阅后复盘记录无效。");
  check(
    object(r) &&
      ["first", "self-checked", "pendingReview", "reviewed"].includes(r.phase),
    "思维卡阶段无效。",
  );
  check(
    (r.firstAnswer === null || text(r.firstAnswer)) &&
      Array.isArray(r.help) &&
      r.help.length <= 5 &&
      r.help.every(
        (h) =>
          object(h) &&
          ["hint", "solution", "reference"].includes(h.kind) &&
          Number.isInteger(h.level) &&
          h.level >= 0 &&
          h.level <= 3 &&
          text(h.text, 1, 4000) &&
          date(h.at) &&
          (!h.stage ||
            ["before-first", "after-first", "after-submission"].includes(
              h.stage,
            )),
      ),
    "思维卡首答或提示无效。",
  );
  if (r.firstAnswer !== null) {
    check(
      date(r.firstAt) && typeof r.firstAssisted === "boolean",
      "思维卡首答证据无效。",
    );
    check(
      r.firstAssisted ===
        r.help.some(
          (h) =>
            h.stage === "before-first" ||
            (!h.stage &&
              (Date.parse(h.at) < Date.parse(r.firstAt) ||
                (h.at === r.firstAt && r.firstAssisted))),
        ),
      "首答辅助证据与帮助历史不一致。",
    );
  }
  if (r.phase !== "first")
    check(
      text(r.firstAnswer) &&
        text(r.reflection, 2, 600) &&
        Array.isArray(r.checks) &&
        r.checks.length === 3 &&
        r.checks.every((v) => v === true),
      "思维卡自查证据无效。",
    );
  if (["pendingReview", "reviewed"].includes(r.phase))
    check(
      text(r.finalAnswer) && date(r.submittedAt) && r.status === r.phase,
      "思维卡提交记录无效。",
    );
  if (r.variantIndex !== undefined)
    check(
      Number.isInteger(r.variantIndex) &&
        r.variantIndex >= 0 &&
        r.variantIndex <= 12 &&
        text(r.attemptId, 1, 180),
      "复习情境无效。",
    );
  if (r.reviewStage !== undefined)
    check(
      Number.isInteger(r.reviewStage) &&
        r.reviewStage >= 1 &&
        r.reviewStage <= 4,
      "复习轮次无效。",
    );
  if (r.variantIndex > 0)
    check(
      JSON.stringify(r.variant) ===
        JSON.stringify(
          publicVariant(thinkingVariant(r.taskId, r.variantIndex)),
        ),
      "复习题目条件与版本不一致。",
    );
  if (r.reviews !== undefined) {
    check(
      Array.isArray(r.reviews) && r.reviews.length <= 100,
      "批阅历史无效。",
    );
    for (const v of r.reviews) {
      check(
        object(v) &&
          reviewVerdicts.includes(v.verdict) &&
          text(v.comment, 2, 1200) &&
          text(v.reviewer, 1, 40) &&
          v.source === "parent-workbench" &&
          date(v.at) &&
          date(v.scheduleAt) &&
          Array.isArray(v.causes) &&
          new Set(v.causes).size === v.causes.length &&
          v.causes.every((c) => errorCauses.includes(c)),
        "批阅证据无效。",
      );
      check(
        Number.isInteger(v.helpCount) &&
          v.helpCount >= 0 &&
          v.helpCount <= r.help.length,
        "审核帮助快照无效。",
      );
      if(v.evidence) {
        check(object(v.evidence) && v.evidence.firstAnswer===r.firstAnswer && v.evidence.firstAt===r.firstAt && v.evidence.finalAnswer===r.finalAnswer && v.evidence.reflection===r.reflection && v.evidence.submittedAt===r.submittedAt && Array.isArray(v.evidence.help) && v.evidence.help.length===v.helpCount && object(v.evidence.scaffold), "批阅时的证据快照与原作答不一致。");
        if(v.verdict === "independent-mastered")check(!v.evidence.scaffold.usedAnswerValidation, "有模型验证的快照不能作为无反馈独立作答。");
      }
      if (v.verdict === "independent-mastered")
        check(
          !r.firstAssisted && v.helpCount === 0,
          "有辅助的作答不能批为独立掌握。",
        );
    }
  }
  if (r.tool) {
    const spec = thinkingToolSpec(r.taskId, r.variant);
    validateThinkingTool(spec, r.tool);
    check(
      Array.isArray(r.toolHistory) && r.toolHistory.length <= 30,
      "教具记录无效。",
    );
    for (const h of r.toolHistory) {
      check(
        text(h.command, 1, 40) &&
          date(h.at) &&
          ["before-first", "after-first", "after-submission"].includes(h.stage),
        "教具时间无效。",
      );
      validateThinkingTool(spec, h.before);
      validateThinkingTool(spec, h.after);
    }
  }
  if (r.phase === "reviewed")
    check(r.reviews?.length > 0, "缺少家长批阅证据。");
}
export function validateThinking(records) {
  if (records === undefined) return;
  check(object(records), "思维卡记录不完整。");
  for (const [id, r] of Object.entries(records)) {
    check(
      thinkingCards.some(
        (t) => t.id === id && t.publicationStatus === "guided-study",
      ) &&
        object(r) &&
        r.taskId === id &&
        r.contentVersion === "thinking.2026-10-08.1" &&
        Number.isInteger(r.revision) &&
        r.revision >= 1 &&
        date(r.savedAt),
      "思维卡版本或进度无效。",
    );
    validateAttempt(r);
    if (r.attempts !== undefined) {
      check(
        Array.isArray(r.attempts) && r.attempts.length <= 64,
        "复习记录过多，请导出归档。",
      );
      for (const a of r.attempts) {
        check(
          a.taskId === id &&
            a.phase === "reviewed" &&
            a.attempts === undefined &&
            a.review === undefined,
          "历史作答无效。",
        );
        validateAttempt(a);
      }
      check(
        new Set([...r.attempts.map((a) => a.attemptId), r.attemptId]).size ===
          r.attempts.length + 1,
        "作答编号重复。",
      );
    }
    if (r.review !== undefined) {
      const v = r.review;
      if(v.strongEvidence !== undefined) check(typeof v.strongEvidence === "boolean" && v.strongEvidence === (v.completed && hasStrongDelayedChain(r)), "四轮无自动验证的延迟证据链不一致。");
      check(
        object(v) &&
          reviewVerdicts.includes(v.verdict) &&
          Number.isInteger(v.stage) &&
          v.stage >= 0 &&
          v.stage <= 4 &&
          typeof v.completed === "boolean" &&
          (v.dueAt === null || date(v.dueAt)) &&
          date(v.anchorAt),
        "思维复习调度无效。",
      );
      check(
        v.completed ===
          (v.stage === 4 && v.verdict === "independent-mastered") &&
          v.dueAt ===
            (v.completed || v.verdict === "deferred"
              ? null
              : new Date(
                  Date.parse(v.anchorAt) + delays[Math.min(v.stage, 3)] * DAY,
                ).toISOString()),
        "思维复习日期与批阅结论不一致。",
      );
    }
  }
}
function context(p, input) {
  const t = thinkingCards.find(
    (t) => t.id === input.taskId && t.publicationStatus === "guided-study",
  );
  check(t, "这张思维卡尚未开放。");
  check(
    typeof input.eventId === "string" &&
      /^[a-zA-Z0-9._:-]{1,180}$/.test(input.eventId),
    "保存编号无效。",
  );
  const st = (p.studio ??= {
    version: 1,
    reading: {},
    sessions: {},
    notes: [],
    events: [],
    entitlements: {},
    daily: {},
    review: {},
  });
  st.thinking ??= {};
  return { t, st };
}
const thinkingResult = (r) => ({
  record: structuredClone(r),
  paid: 0,
  status: r.phase === "pendingReview" ? "pendingReview" : "saved",
});
function replay(st, input, kind) {
  const signature = JSON.stringify({ kind, ...input }),
    old = st.events.find((e) => e.id === input.eventId);
  if (old) {
    check(
      old.signature === signature ||
        (kind === "thinking" &&
          old.signature === JSON.stringify({ action: "thinking", ...input })),
      "相同保存编号不能用于不同操作。",
    );
    return { result: thinkingResult(st.thinking[input.taskId]), signature };
  }
  return { signature };
}
function finish(st, t, r, input, signature, now) {
  r.revision++;
  r.savedAt = new Date(now).toISOString();
  validateThinking({ [t.id]: r });
  // Receipts remember the operation, not another copy of all past attempts. Replay
  // returns the current record and cannot overwrite it with an old response snapshot.
  const event = {
    id: input.eventId,
    signature,
    result: {
      paid: 0,
      status: r.phase === "pendingReview" ? "pendingReview" : "saved",
      revision: r.revision,
    },
  };
  check(
    Buffer.byteLength(
      JSON.stringify({
        ...st,
        thinking: { ...st.thinking, [t.id]: r },
        events: [...st.events, event],
      }),
    ) <
      6 * 1024 * 1024,
    "学习记录接近本地备份上限，请先导出归档。",
  );
  st.thinking[t.id] = r;
  st.events.push(event);
  return thinkingResult(r);
}
export function applyThinking(p, input, now = Date.now()) {
  const { t, st } = context(p, input),
    receipt = replay(st, input, "thinking");
  if (receipt.result) return receipt.result;
  const at = new Date(now).toISOString(),
    old = st.thinking[t.id] ?? {
      taskId: t.id,
      contentVersion: t.contentVersion,
      revision: 0,
      phase: "first",
      firstAnswer: null,
      help: [],
      attemptId: input.eventId,
      variantIndex: 0,
      recordSchemaVersion: 2,
      mode: "explore",
    };
  check(
    input.revision === old.revision,
    "另一个页面已更新这张卡，请重新载入。",
    "STALE_REVISION",
  );
  let r = structuredClone(old);
  check(r.recordSchemaVersion === undefined || [1,2].includes(r.recordSchemaVersion), "此学习证据来自更新版本，请升级程序后再打开。");
  if(r.tool && !r.scaffold) r.scaffold=scaffoldEvidence(r);
  r.recordSchemaVersion = 2;
  r.seenVariantIds ??= [...new Set([...(r.attempts??[]).map(a=>a.variant?.id),r.variant?.id].filter(Boolean))];
  if (input.action === "review-start") {
    check(
      r.phase === "reviewed" &&
        r.review?.dueAt &&
        Date.parse(r.review.dueAt) <= now,
      "复习还未到期，或家长尚未完成核对。",
    );
    check((r.attempts?.length ?? 0) < 64, "请先导出长期学习记录。");
    const { attempts = [], review, revision, savedAt, ...archived } = r,
      seen = new Set([...attempts, archived].map(a => a.variantIndex ?? 0)),
      index = Array.from({length: 12}, (_, i) => i + 1).find(i => !seen.has(i));
    check(index, "当前审定的新题已用完。请先做针对性回补，由家长核对；重复题不会算作新的独立迁移。", "REVIEW_BANK_EXHAUSTED");
    r = {
      taskId: t.id,
      contentVersion: t.contentVersion,
      revision,
      phase: "first",
      firstAnswer: null,
      help: [],
      attemptId: input.eventId,
      variantIndex: index,
      recordSchemaVersion: 2,
      mode: "challenge",
      reviewStage: review.stage + 1,
      variant: publicVariant(thinkingVariant(t.id, index)),
      seenVariantIds: [...new Set([...(archived.seenVariantIds??[]), `${t.id}-R${index}`])],
      attempts: [
        ...attempts,
        {
          ...archived,
          attemptId: archived.attemptId ?? `${t.id}-original`,
          variantIndex: archived.variantIndex ?? 0,
        },
      ],
      review,
    };
  } else if (["tool", "tool-open"].includes(input.action)) {
    check(r.mode !== "challenge", "独立新题不显示教具的自动验证；可以使用纸笔，提示会如实留痕。");
    check(r.phase !== "reviewed", "已批阅的操作证据已归档，请回基础课继续探索。");
    const spec = thinkingToolSpec(t.id, r.variant);
    check(spec, "本卡没有专用操作模型。");
    const before = r.tool ?? initialThinkingTool(spec);
    r.toolHistory ??= [];
    const next =
      input.action === "tool-open" ? initialThinkingTool(spec) : input.command === "undo"
        ? r.toolHistory.at(-1)?.before
        : moveThinkingTool(
            spec,
            before,
            input.command,
            input.index,
            input.value,
          );
    check(next, "没有可撤销的操作。");
    r.tool = next;
    const feedback = measureThinkingTool(spec, next);
    r.scaffold ??= {usedManipulative:false, usedAnswerValidation:false, validationAttempts:0, withVisualScaffold:true, matchedAttempts:0};
    r.scaffold.usedManipulative = true;
    r.scaffold.usedAnswerValidation = true;
    r.scaffold.validationAttempts++;
    if (feedback.matches || feedback.balanced) r.scaffold.matchedAttempts++;
    // Cumulative evidence survives undo/reset and the bounded operation history.
    if (input.command === "undo") r.toolHistory.pop();
    else
      r.toolHistory = [
        ...r.toolHistory.slice(-29),
        {
          command: input.action === "tool-open" ? "open-model" : input.command,
          before,
          after: next,
          at,
          stage:
            r.firstAnswer === null
              ? "before-first"
              : r.submittedAt
                ? "after-submission"
                : "after-first",
        },
      ];
  } else if (input.action === "first") {
    check(
      r.phase === "first" && r.firstAnswer === null && text(input.answer),
      "请写下自己的首答；保存后会保留原来的想法。",
    );
    r.firstAnswer = input.answer.trim();
    r.firstAt = at;
    r.firstAssisted = r.help.length > 0;
    r.firstScaffold = structuredClone(scaffoldEvidence(r));
  } else if (input.action === "check") {
    check(
      r.firstAnswer !== null &&
        r.phase === "first" &&
        Array.isArray(input.checks) &&
        input.checks.length === 3 &&
        input.checks.every((v) => v === true) &&
        text(input.reflection, 2, 600),
      "请先保存首答，再逐项自查并写下发现。",
    );
    r.checks = [true, true, true];
    r.reflection = input.reflection.trim();
    r.phase = "self-checked";
  } else if (input.action === "final") {
    check(
      r.phase === "self-checked" && text(input.answer),
      "请先完成自查，再提交最终解释。",
    );
    r.finalAnswer = input.answer.trim();
    r.phase = "pendingReview";
    r.status = "pendingReview";
    r.submittedAt = at;
    r.submittedScaffold = structuredClone(scaffoldEvidence(r));
  } else if (["hint", "solution", "reference"].includes(input.action)) {
    const level = input.action === "hint" ? input.level : 0;
    check(
      Number.isInteger(level) && level >= 0 && level <= 3,
      "提示层级无效。",
    );
    const source = r.variantIndex ? thinkingVariant(t.id, r.variantIndex) : t,
      hint = source.hints.find((h) => h.level === level);
    check(input.action !== "hint" || hint, "提示尚未整理。");
    check(
      input.action !== "solution" || r.firstAnswer !== null,
      "先保存自己的想法，再看参考解释。",
    );
    const event = {
      kind: input.action, level,
      text: input.action === "hint" ? hint.text : input.action === "solution"
        ? `${source.answer}\n${source.reason}\n${source.solutionSteps.join("\n")}`
        : "已回看本章基础讲解。", at,
      stage: r.firstAnswer === null ? "before-first" : r.submittedAt ? "after-submission" : "after-first",
    };
    if (r.phase === "reviewed") {
      r.postReviewStudy ??= [];
      check(r.postReviewStudy.length < 100, "复盘记录较多，请先导出归档。");
      r.postReviewStudy.push({...event, stage:"post-review"});
      // Studying after a verdict never rewrites the evidence of the graded attempt.
    } else if (!r.help.some(h => h.kind === event.kind && h.level === level)) r.help.push(event);
  } else check(false, "未知思维卡操作。");
  return finish(st, t, r, input, receipt.signature, now);
}
export function applyThinkingReview(p, input, now = Date.now()) {
  const { t, st } = context(p, input),
    receipt = replay(st, input, "parent-thinking-review");
  if (receipt.result) return receipt.result;
  const r = structuredClone(st.thinking[t.id]);
  check(
    r && input.revision === r.revision,
    "作答已在其他页面更新，请重新载入证据后批阅。",
    "STALE_REVISION",
  );
  check(
    ["pendingReview", "reviewed"].includes(r.phase) &&
      reviewVerdicts.includes(input.verdict) &&
      text(input.comment, 2, 1200) &&
      text(input.reviewer, 1, 40) &&
      Array.isArray(input.causes) &&
      input.causes.every((c) => errorCauses.includes(c)),
    "请核对最终解释，填写批阅结论、依据与审核人。",
  );
  if (input.verdict === "independent-mastered")
    check(
      !r.firstAssisted && r.help.length === 0 && !scaffoldEvidence(r).usedAnswerValidation,
      "本次使用过提示或教具自动验证，请选操作支持下理解／辅助订正，下一轮撤去验证再独立做。",
    );
  const at = new Date(now).toISOString();
  r.reviews ??= [];
  check(r.reviews.length < 100, "批阅次数过多，请导出归档。");
  const last = r.reviews.at(-1),
    lastHelp = Math.max(0, ...r.help.map((h) => Date.parse(h.at)));
  const anchorAt =
    last?.verdict === input.verdict && Date.parse(last.scheduleAt) >= lastHelp
      ? last.scheduleAt
      : at;
  r.reviews.push({
    verdict: input.verdict,
    comment: input.comment.trim(),
    reviewer: input.reviewer.trim(),
    source: "parent-workbench",
    helpCount: r.help.length,
    evidence: {firstAnswer:r.firstAnswer, firstAt:r.firstAt, finalAnswer:r.finalAnswer, reflection:r.reflection, submittedAt:r.submittedAt, scaffold:structuredClone(scaffoldEvidence(r)), help:structuredClone(r.help), mode:r.mode ?? "legacy"},
    causes: [...new Set(input.causes)],
    at,
    scheduleAt: anchorAt,
  });
  r.phase = "reviewed";
  r.status = "reviewed";
  const stage =
      input.verdict === "independent-mastered" ? (r.reviewStage ?? 0) : 0,
    completed = stage === 4 && input.verdict === "independent-mastered";
  r.review = {
    verdict: input.verdict,
    stage,
    completed,
    strongEvidence: completed && hasStrongDelayedChain(r),
    anchorAt,
    dueAt:
      completed || input.verdict === "deferred"
        ? null
        : new Date(
            Date.parse(anchorAt) + delays[Math.min(stage, 3)] * DAY,
          ).toISOString(),
  };
  return finish(st, t, r, input, receipt.signature, now);
}
export const parentThinkingCards = (p) =>
  thinkingCards
    .filter(
      (t) =>
        t.publicationStatus === "guided-study" && p.studio?.thinking?.[t.id],
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      applicability: t.applicability,
      thinkingEvidence: t.thinkingEvidence,
      question: t.question,
      answer: t.answer,
      reason: t.reason,
      solutionSteps: t.solutionSteps,
      record: p.studio.thinking[t.id],
      variant: p.studio.thinking[t.id].variantIndex
        ? thinkingVariant(t.id, p.studio.thinking[t.id].variantIndex)
        : null,
    }));
