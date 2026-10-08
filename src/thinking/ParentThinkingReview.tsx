import { useEffect, useState } from "react";
import type { ParentThinkingCard, Progress } from "../types";
import { api } from "../api";
import "./thinking.css";
const verdicts = [
  ["independent-mastered", "独立掌握"],
  ["corrected-with-help", "辅助订正"],
  ["needs-remediation", "需要回补"],
  ["deferred", "暂缓判断"],
];
const causes = [
  ["symbol", "看错符号"],
  ["calculation", "口算错误"],
  ["steps", "步骤不完整"],
  ["concept", "概念不理解"],
  ["checking", "缺少检验"],
];
export default function ParentThinkingReview({
  onProgress,
}: {
  onProgress: (p: Progress) => void;
}) {
  const [access, setAccess] = useState<{
      configured: boolean;
      unlocked: boolean;
    } | null>(null),
    [pin, setPin] = useState(""),
    [confirm, setConfirm] = useState(""),
    [cards, setCards] = useState<ParentThinkingCard[]>([]),
    [selected, setSelected] = useState(""),
    [verdict, setVerdict] = useState("needs-remediation"),
    [comment, setComment] = useState(""),
    [reviewer, setReviewer] = useState("家长"),
    [errors, setErrors] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = async () => {
    const out = await api.parentThinking();
    setCards(out.cards);
  };
  useEffect(() => {
    const leave = () => {
      void api.lockParent().catch(() => {});
    };
    window.addEventListener("pagehide", leave);
    api
      .parentAccess()
      .then((a) => {
        setAccess(a);
        if (a.unlocked) void load().catch((e) => setError(e.message));
      })
      .catch((e) => setError(e.message));
    return () => {
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, []);
  const card = cards.find((c) => c.id === selected),
    record = card?.record;
  const unlock = async () => {
    if (!access) return;
    setBusy(true);
    setError("");
    try {
      if (!access.configured && pin !== confirm)
        throw Error("两次家长密码不一致。");
      setAccess(await api.unlockParent(pin, !access.configured));
      setPin("");
      setConfirm("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "没有解锁");
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!card) return;
    setBusy(true);
    setError("");
    try {
      const out = await api.thinkingReview({
        taskId: card.id,
        revision: card.record.revision,
        eventId: crypto.randomUUID(),
        verdict,
        comment,
        reviewer,
        causes: errors,
      });
      onProgress(out.progress);
      await load();
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "没有保存");
      await load().catch(() => {});
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="parent-panel thinking-parent-queue parent-thinking-workbench">
      <header>
        <div>
          <small>真实证据 · 家长核对</small>
          <h3>思维迁移批阅工作台</h3>
          <p>
            核对Kevin的第一次想法、帮助记录和最终解释，再决定怎样复习。系统不凭提交、勾选或阅读答案判为掌握。
          </p>
        </div>
      </header>
      {!access ? (
        <p>正在读取本机家长工作台…</p>
      ) : !access.unlocked ? (
        <div className="parent-unlock">
          <p>
            {access.configured
              ? "输入家长密码查看核对依据。"
              : "请由家长设置6到12位数字密码，学生课堂不会收到核对依据。密码仅保存在本机，不随学习进度导出。"}
          </p>
          <label>
            家长密码
            <input
              type="password"
              inputMode="numeric"
              autoComplete={
                access.configured ? "current-password" : "new-password"
              }
              maxLength={12}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </label>
          {!access.configured && (
            <label>
              再次输入密码
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={12}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          )}
          <button
            disabled={busy || !/^\d{6,12}$/.test(pin)}
            onClick={() => void unlock()}
          >
            {access.configured ? "解锁批阅" : "设置密码并进入批阅"}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={async () => {
              setAccess(await api.lockParent());
              setCards([]);
              setSelected("");
            }}
          >
            锁定家长工作台
          </button>
          <p>
            离开家长中心会锁定；解锁最多有效30分钟。同一台电脑的线下提示仍需家长如实核对。
          </p>
          <div className="parent-thinking-layout">
            <nav aria-label="迁移批阅队列">
              {cards.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={c.id === selected}
                  onClick={() => {
                    setSelected(c.id);
                    setComment("");
                    setErrors([]);
                    setVerdict(
                      c.record.help.length
                        ? "corrected-with-help"
                        : "needs-remediation",
                    );
                  }}
                >
                  {c.title}
                  <small>
                    {c.record.phase === "pendingReview"
                      ? "等待批阅"
                      : c.record.phase === "reviewed"
                        ? "已批阅，可更正"
                        : "尚未提交"}
                  </small>
                </button>
              ))}
              {!cards.length && <p>Kevin保存首答后，记录会出现在这里。</p>}
            </nav>
            {card && record && (
              <article className="parent-thinking-evidence">
                <h4>
                  {card.title}
                  {record.variantIndex
                    ? ` · 复习变式${record.variantIndex}`
                    : ""}
                </h4>
                <p>{card.variant?.question ?? card.question}</p>
                <dl>
                  <dt>第一次想法（不可覆盖）</dt>
                  <dd>{record.firstAnswer ?? "尚未保存首答"}</dd>
                  <dt>首答前辅助</dt>
                  <dd>
                    {record.firstAssisted
                      ? "有系统辅助记录"
                      : "系统未记录；请同时核对线下帮助"}
                  </dd>
                  <dt>自查发现</dt>
                  <dd>{record.reflection ?? "尚未自查"}</dd>
                  <dt>最终解释</dt>
                  <dd>{record.finalAnswer ?? "尚未提交"}</dd>
                </dl>
                <h4>自主教具操作</h4>
                <p>
                  {record.toolHistory
                    ?.map((h) => `${h.stage} · ${h.command}`)
                    .join("；") || "无教具操作记录"}
                  。教具探索与调用提示分别记录，家长仍应核对解释。
                </p>
                <h4>辅助历史</h4>
                {record.help.map((h) => (
                  <p key={h.kind + h.level}>
                    <b>
                      {h.stage === "before-first"
                        ? "首答前"
                        : h.stage === "after-submission"
                          ? "提交后"
                          : "首答后"}
                    </b>{" "}
                    · {h.kind} · {new Date(h.at).toLocaleString("zh-CN")}
                    <br />
                    {h.text}
                  </p>
                ))}
                {!record.help.length && <p>无系统辅助记录。</p>}
                <details>
                  <summary>家长核对依据与适用范围</summary>
                  <p>{card.applicability}</p>
                  <p>需要Kevin讲清：{card.thinkingEvidence}</p>
                  <p>{card.variant?.answer ?? card.answer}</p>
                  <p>{card.variant?.reason ?? card.reason}</p>
                </details>
                {["pendingReview", "reviewed"].includes(record.phase) && (
                  <div className="parent-review-form">
                    <label>
                      批阅结论
                      <select
                        value={verdict}
                        onChange={(e) => setVerdict(e.target.value)}
                      >
                        {verdicts.map(([value, label]) => (
                          <option
                            key={value}
                            value={value}
                            disabled={
                              value === "independent-mastered" &&
                              record.help.length > 0
                            }
                          >
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <fieldset>
                      <legend>回补重点（可以多选）</legend>
                      {causes.map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="checkbox"
                            checked={errors.includes(value)}
                            onChange={(e) =>
                              setErrors(
                                e.target.checked
                                  ? [...errors, value]
                                  : errors.filter((x) => x !== value),
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </fieldset>
                    <label>
                      审核人
                      <input
                        maxLength={40}
                        value={reviewer}
                        onChange={(e) => setReviewer(e.target.value)}
                      />
                    </label>
                    <label>
                      批阅依据 / 更正原因
                      <textarea
                        maxLength={1200}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="哪一步理解了？哪里还需要图示回补？有无额外的线下帮助？"
                      />
                    </label>
                    <button
                      disabled={
                        busy || comment.trim().length < 2 || !reviewer.trim()
                      }
                      onClick={() => void save()}
                    >
                      {record.phase === "reviewed"
                        ? "更正批阅，保留历史"
                        : "保存批阅与复习安排"}
                    </button>
                    <p>
                      辅助订正或需要回补：1天后换情境；独立复习通过：进入3、7、21天间隔；暂缓：等待重新核对。批阅不发积分。
                    </p>
                  </div>
                )}
                <h4>批阅历史</h4>
                {record.reviews?.map((r, i) => (
                  <p key={i}>
                    {new Date(r.at).toLocaleString("zh-CN")} · {r.reviewer} ·{" "}
                    {verdicts.find((v) => v[0] === r.verdict)?.[1]}
                    <br />
                    {r.comment}
                  </p>
                ))}
                {record.attempts?.map((a, i) => (
                  <details key={a.attemptId}>
                    <summary>历史第{i + 1}次作答与批阅</summary>
                    <p>首答：{a.firstAnswer}</p>
                    <p>最终：{a.finalAnswer}</p>
                    <p>
                      辅助：
                      {a.help
                        .map((h) => `${h.kind}（${h.stage}）`)
                        .join("；") || "无"}
                    </p>
                    {a.reviews?.map((r, j) => (
                      <p key={j}>
                        {r.verdict} · {r.comment}
                      </p>
                    ))}
                  </details>
                ))}
              </article>
            )}
          </div>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
