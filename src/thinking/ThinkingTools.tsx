import { useState } from "react";
import type { ThinkingRecord } from "../types";
import {
  thinkingToolSpec,
  initialThinkingTool,
  measureThinkingTool,
} from "../../shared/thinking-tools.mjs";
import { boxFaces } from "../../shared/hands-on-models.mjs";
import SolidView from "../studio/concept/SolidView";
import { useMotionAngle, useMotionValue } from "../studio/useMotionValue";
export default function ThinkingTools({
  id,
  record,
  busy,
  onAction,
}: {
  id: string;
  record?: ThinkingRecord;
  busy: boolean;
  onAction: (command: string, index?: number, value?: number) => void;
}) {
  const cameraA = useMotionAngle([0, 90, 35][record?.tool?.view ?? 0], 650),
    cameraE = useMotionValue([0, 0, 35][record?.tool?.view ?? 0], 650);
  const [selected, setSelected] = useState(0),
    spec = thinkingToolSpec(id, record?.variant);
  if (!spec) return null;
  const state = record?.tool ?? initialThinkingTool(spec),
    m = measureThinkingTool(spec, state),
    values = state.values;
  return (
    <section className="thinking-tool">
      <h3>用教具检验自己的想法</h3>
      <p>
        这里可以自主探索、试错和撤销。操作另有记录；请在下面保存你自己的推理，教具不会自动判你掌握。
      </p>
      {spec.type === "balance" ? (
        <>
          <svg
            role="group"
            aria-label="左右可同时取走物品的天平"
            viewBox="0 0 640 300"
          >
            <path
              d="M320 150V265M260 265H380"
              stroke="#668c77"
              strokeWidth="7"
            />
            <g transform={`rotate(${m.tilt} 320 150)`}>
              <path d="M95 150H545" stroke="#668c77" strokeWidth="7" />
              {[0, 2].map((side, i) => (
                <g key={side} transform={`translate(${100 + i * 270} 0)`}>
                  <path
                    d="M0 150v55h165v-55"
                    fill="none"
                    stroke="#547ead"
                    strokeWidth="3"
                  />
                  {Array.from({ length: values[side] }, (_, n) => (
                    <g key={n}>
                      <rect
                        x={n * 40 + 5}
                        y="100"
                        width="35"
                        height="50"
                        fill="#dbb665"
                      />
                      <text x={n * 40 + 22} y="132" textAnchor="middle">
                        ?
                      </text>
                    </g>
                  ))}
                  {Array.from({length:values[side+1]/10},(_,n)=><rect data-weight-grams="10" key={'weight-'+n} x={values[side]*40+5+(n%5)*7} y={150-(Math.floor(n/5)+1)*7} width="6" height="6" fill="#8a9394" stroke="#606c6e" strokeWidth=".5"><title>10克小砝码</title></rect>)}
                  <text x="10" y="75">
                    {values[side]}
                    {spec.names![0]}＋{values[side + 1]}克
                  </text>
                </g>
              ))}
            </g>
          </svg>
          <p>黄色是待称的{spec.names![0]}；每个灰色小砝码10克。拿走20克，就是两边各拿走2个灰色小块。</p>
          <div className="thinking-help">
            <button
              disabled={busy || Math.min(values[0], values[2]) === 0}
              onClick={() => onAction("remove-both-box")}
            >
              两边各拿走1{spec.names![0]}
            </button>
            <button
              disabled={busy || Math.min(values[1], values[3]) < 20}
              onClick={() => onAction("remove-both-weight")}
            >
              两边各拿走20克
            </button>
            <button
              disabled={busy || Math.min(values[1], values[3]) < 10}
              onClick={() => onAction("remove-both-weight-ten")}
            >
              两边各拿走10克
            </button>
            <button
              disabled={busy || !values[0]}
              onClick={() => onAction("remove-left-box")}
            >
              试错：只拿走左边1{spec.names![0]}
            </button>
          </div>
          <p role="status">
            {m.balanced
              ? "天平仍平衡。两边这一次拿走的质量相同吗？"
              : "天平倾斜了，只动一边不能保留等量关系。可以撤销修复。"}
          </p>
        </>
      ) : spec.type === "views" ? (
        <>
          <SolidView
            solid={[
              [-0.5, -0.5],
              [0.5, -0.5],
              [-0.5, 0.5],
            ].flatMap(([x, z], pile) =>
              Array.from({ length: values[pile] }, (_, n) =>
                boxFaces(1, 1, 1, [x, -n - 0.5, z]),
              ).flat(),
            )}
            azimuth={cameraA}
            elevation={cameraE}
            title="三堆积木的可切换立体视角"
          />
          <div className="thinking-help">
            {["正面", "右侧", "斜上方"].map((label, i) => (
              <button
                key={label}
                disabled={busy}
                aria-pressed={state.view === i}
                onClick={() => onAction("view", undefined, i)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="thinking-heights">
            {["前左", "前右", "后左"].map((label, i) => (
              <label key={label}>
                {label}堆高
                <select
                  disabled={busy}
                  value={values[i]}
                  onChange={(e) =>
                    onAction("height", i, Number(e.target.value))
                  }
                >
                  {Array.from({ length: spec.conditions[0] + 1 }, (_, n) => (
                    <option key={n} value={n + 1}>
                      {n + 1}块
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p role="status">
            这次正面最高：{m.front.join("、")}；右侧最高：{m.right.join("、")}。
            {m.matches
              ? "两幅图都符合条件。请说明为什么另外的高度不可能。"
              : "还不满足所有条件，切换视角逐个排除。"}
          </p>
        </>
      ) : (
        <>
          <p>
            每个“人{1}
            ”都是人数占位卡，不额外给出个人爱好。请自己安排四个区域，核对是否满足题目总人数。
          </p>
          <div className="thinking-name-bank" aria-label="尚未分组的人数占位卡">
            {values.map(
              (zone, i) =>
                !zone && (
                  <button
                    key={i}
                    disabled={busy}
                    draggable
                    aria-pressed={selected === i}
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", String(i))
                    }
                    onClick={() => setSelected(i)}
                  >
                    人{i + 1}
                  </button>
                ),
            )}
          </div>
          <div className="thinking-venn-zones">
            {[
              `只${spec.names![0]}`,
              `两种都喜欢`,
              `只${spec.names![1]}`,
              `两种都不喜欢`,
            ].map((label, i) => (
              <article
                key={i}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const raw = e.dataTransfer.getData("text/plain");
                  if (/^\d+$/.test(raw)) onAction("place", Number(raw), i + 1);
                }}
              >
                <h4>
                  {label} · {m.counts[i]}人
                </h4>
                {values.map(
                  (zone, n) =>
                    zone === i + 1 && (
                      <button
                        key={n}
                        disabled={busy}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", String(n))
                        }
                        onClick={() => setSelected(n)}
                      >
                        人{n + 1}
                      </button>
                    ),
                )}
                <button
                  disabled={busy}
                  onClick={() => onAction("place", selected, i + 1)}
                >
                  把人{selected + 1}放这里
                </button>
              </article>
            ))}
          </div>
          <p role="status">
            已放{m.assigned}/{spec.conditions[0]}人；{spec.names![0]}共{m.left}
            ，{spec.names![1]}共{m.right}，圈外{m.counts[3]}。
            {m.matches
              ? "四个区域符合全部人数条件。姓名安排可不同，人数关系一样。"
              : "请逐一核对题目的三项人数条件。"}
          </p>
        </>
      )}
      <div className="thinking-help">
        <button
          disabled={busy || !record?.toolHistory?.length}
          onClick={() => onAction("undo")}
        >
          撤销教具操作
        </button>
        <button disabled={busy} onClick={() => onAction("reset")}>
          重置教具
        </button>
      </div>
    </section>
  );
}
