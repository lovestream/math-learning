import type { TextbookModel } from "../../../shared/textbook-models.mjs";
import {
  digits4,
  initialCoreState,
  value4,
} from "../../../shared/core-models.mjs";
import type { WidgetState } from "../types";
import { useTextbook } from "./useTextbook";
import { Board, Heading, Feedback, colors } from "./Primitives";
import "./core.css";
const names = ["千", "百", "十", "一"];

function Units({ count, place }: { count: number; place: number }) {
  return (
    <div
      className="core-units"
      role="img"
      aria-label={`${count}个${names[place]}`}
    >
      <div>
        {Array.from({ length: Math.min(count, 18) }, (_, i) => (
          <svg key={i} viewBox="0 0 44 44" aria-hidden="true">
            {place < 2 ? (
              <>
                {place === 0 && <>
                  <path d="M4 11L10 5H40L34 11Z" fill="#91ae95" stroke="#52765b" strokeWidth=".5" />
                  <path d="M34 11L40 5V35L34 41Z" fill="#658c73" stroke="#52765b" strokeWidth=".5" />
                  {Array.from({length:9},(_,n)=><g key={n} stroke="#e4ecdf" strokeWidth=".35">
                    <path d={`M${10+(n+1)*3} 5L${4+(n+1)*3} 11M34 ${14+(n+1)*3}L40 ${5+(n+1)*3}`} />
                    <path d={`M${4+(n+1)*.6} ${11-(n+1)*.6}h30M${34+(n+1)*.6} ${11-(n+1)*.6}v30`} />
                  </g>)}
                </>}
                {Array.from({ length: 100 }, (_, n) => (
                  <rect
                    key={n}
                    x={(n % 10) * 3 + 4}
                    y={Math.floor(n / 10) * 3 + 11}
                    width="2.5"
                    height="2.5"
                    fill={place === 0 ? colors.green : colors.gold}
                  />
                ))}
              </>
            ) : place === 2 ? (
              Array.from({ length: 10 }, (_, n) => (
                <rect
                  key={n}
                  x="17"
                  y={n * 3 + 6}
                  width="10"
                  height="2.5"
                  fill={colors.green}
                />
              ))
            ) : (
              <rect
                x="17"
                y="17"
                width="10"
                height="10"
                rx="2"
                fill={colors.blue}
              />
            )}
          </svg>
        ))}
      </div>
      {place === 0 && count > 0 && <small>1千块：10层，每层100。</small>}
      {count > 18 && (
        <small>
          图上先显示18个，材料共有{count}个{names[place]}；每次按钮操作1个。
        </small>
      )}
    </div>
  );
}
export default function CoreWorkbench({
  model,
  sceneId,
  value,
  onChange,
}: {
  model: TextbookModel;
  sceneId: string;
  value: WidgetState;
  onChange: (s: WidgetState) => void;
}) {
  const {
      state: s,
      act,
      toolbar,
      measured: m,
    } = useTextbook(model, sceneId, value, onChange),
    c = model.cases![s.choice ?? 0],
    context = model.contexts![s.choice ?? 0];
  const error = (text: string) => act("try-invalid", { error: text }, false);
  const exchange = (i: number, up: boolean) => {
    const bank = [...s.bank!];
    if (up) {
      if (i === 0 || bank[i] < 10) {
        error("不够10个同样的计数单位，不能换成高一位的1个。");
        return;
      }
      bank[i] -= 10;
      bank[i - 1]++;
    } else {
      if (i === 3 || !bank[i]) return;
      bank[i]--;
      bank[i + 1] += 10;
    }
    act("exchange", { bank });
  };
  const move = (group: number, i: number, back = false) => {
    const bank = [...s.bank!],
      alloc = [...s.alloc!],
      index = group * 4 + i;
    if (back) {
      if (!alloc[index]) return;
      alloc[index]--;
      bank[i]++;
    } else {
      if (!bank[i]) return;
      bank[i]--;
      alloc[index]++;
    }
    act(back ? "return-material" : "allocate", { bank, alloc });
  };
  const controls = (
    <label className="core-case-selector">
      选择操作情境
      <select
        value={s.choice}
        onChange={(e) =>
          act("choose-case", initialCoreState(model, Number(e.target.value)))
        }
      >
        {model.cases!.map((_, i) => (
          <option key={i} value={i}>
            {i === 5 ? "换情境操作" : `同类操作 ${i + 1}`}
          </option>
        ))}
      </select>
    </label>
  );
  const bank = s.bank;
  return (
    <section
      className="textbook-workbench core-workbench"
      data-textbook-model={model.type}
    >
      <Heading model={model}>
        每次只改变一个数学条件，观察数量关系，再用自己的话解释。分错、选错都可以退回或重置；操作完成不等于独立掌握。
      </Heading>
      {controls}
      <div className="core-context">
        <strong>
          {(s.choice ?? 0) === 5
            ? "换情境，找同一个结构"
            : "先读清这一次的条件"}
        </strong>
        <p>
          {s.mode === "total" && context.alternate
            ? context.alternate
            : context.story}
        </p>
        <small>
          图上的一个计数单位表示1{context.unit}
          ；计数单位可以拆换，实际总量不变。
        </small>
      </div>
      {["product-place", "share-place"].includes(model.type) && (
        <>
          <div className="core-problem">
            <b>
              {model.type === "product-place"
                ? `每${context.group}${c[0]}${context.unit}，共${c[1]}${context.group}`
                : `${c[0]}${context.unit}，平均分成${c[1]}${context.group}`}
            </b>
            <p>
              {model.type === "product-place"
                ? `已经加入${s.placed}${context.group}。每加一${context.group}，增加${c[0]}${context.unit}；中间为0的数位也要保留位置。`
                : "先分高位，剩下一捆可以拆成10个低位单位。分错的材料可以退回。"}
            </p>
            {model.type === "product-place" && (
              <button
                disabled={s.placed === c[1]}
                onClick={() =>
                  act("add-group", {
                    placed: s.placed! + 1,
                    bank: bank!.map((n, i) => n + digits4(c[0])[i]),
                  })
                }
              >
                再放入一组
              </button>
            )}
          </div>
          <div className="core-place-columns">
            {bank!.map((n, i) => (
              <article key={i}>
                <h4>
                  {names[i]}位 <strong>{n}</strong>
                </h4>
                <Units count={n} place={i} />
                <div>
                  {i < 3 && (
                    <button disabled={!n} onClick={() => exchange(i, false)}>
                      拆1个{names[i]} → 10个{names[i + 1]}
                    </button>
                  )}
                  {i > 0 && (
                    <button onClick={() => exchange(i, true)}>
                      捆10个{names[i]} → 1个{names[i - 1]}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {model.type === "share-place" && (
            <div className="core-share-groups">
              {m.shares.map((share: number, g: number) => (
                <article key={g}>
                  <h4>
                    第{g + 1}
                    {context.group} · 得到{share}
                    {context.unit}
                  </h4>
                  <div className="core-share-values">
                    {names.map((n, i) => (
                      <span key={n}>
                        {s.alloc![g * 4 + i]}个{n}
                      </span>
                    ))}
                  </div>
                  {names.map((n, i) => (
                    <div key={n}>
                      <button disabled={!bank![i]} onClick={() => move(g, i)}>
                        分1个{n}
                      </button>
                      <button
                        disabled={!s.alloc![g * 4 + i]}
                        onClick={() => move(g, i, true)}
                      >
                        退回1个{n}
                      </button>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          )}
          <Feedback error={s.error}>
            {model.type === "product-place"
              ? m.normalized
                ? `各数位已经小于10，${c[0]}×${c[1]}=${m.total}${context.unit}。请说明每一个进位来自哪里。`
                : `现有总量${m.total}，应有${s.placed}×${c[0]}；拆开或捆起只改变表示，不改变总量。`
              : m.equal
                ? `每组都是${m.shares[0]}${context.unit}，${m.shares[0]}×${c[1]}=${c[0]}。读商时，中间和末尾的0不能省，最前面的0不用写。`
                : `待分${m.pending}，各组${m.shares.join("、")}；总量始终${c[0]}。还需要分完且每组一样多。`}
          </Feedback>
        </>
      )}
      {model.type === "pack-remainder" && (
        <>
          <div className="core-problem">
            <b>
              {c[0]}
              {context.unit}，每{context.group}
              {c[1]}
              {context.unit}
            </b>
            <p>
              每做完一个完整分组，检查剩下的够不够再做一组。余数必须小于每组数量。
            </p>
          </div>
          <Board title="完整分组与剩余数量" height={260}>
            {Array.from({ length: Math.floor(c[0] / c[1]) }, (_, i) => (
              <g
                key={i}
                transform={`translate(${20 + (i % 7) * 88},${20 + Math.floor(i / 7) * 92})`}
              >
                <rect
                  width="76"
                  height={context.kind === "strip" ? 35 : 78}
                  rx={context.kind === "strip" ? 2 : 12}
                  fill={i < s.placed! ? "#dcebdc" : "#f6f4e9"}
                  stroke="#829688"
                />
                {i < s.placed! &&
                  Array.from({ length: c[1] }, (_, j) =>
                    context.kind === "strip" ? (
                      <rect
                        key={j}
                        x={5 + (j * 66) / c[1]}
                        y="6"
                        width={62 / c[1]}
                        height="22"
                        fill={colors.gold}
                      />
                    ) : (
                      <circle
                        key={j}
                        cx={18 + (j % 3) * 20}
                        cy={22 + Math.floor(j / 3) * 19}
                        r="5"
                        fill={colors.gold}
                      />
                    ),
                  )}
                <text x="38" y="73" textAnchor="middle" fontSize="11">
                  第{i + 1}
                  {context.group}
                </text>
              </g>
            ))}
          </Board>
          <div
            className="core-remainder-pile"
            role="img"
            aria-label={`还剩${m.remainder}${context.unit}`}
          >
            {Array.from({ length: m.remainder }, (_, i) => (
              <i key={i} />
            ))}
            <b>
              剩下{m.remainder}
              {context.unit}
            </b>
          </div>
          <div className="textbook-controls">
            <button
              onClick={() =>
                m.complete
                  ? error(`只剩${m.remainder}${context.unit}，不够做${c[1]}${context.unit}的一完整${context.group}。`)
                  : act("pack-bag", { placed: s.placed! + 1 })
              }
            >
              {context.kind==='strip'?'剪出一完整段':'装一满袋'}
            </button>
            <button
              disabled={!s.placed}
              onClick={() => act("unpack-bag", { placed: s.placed! - 1 })}
            >
              {context.kind==='strip'?'拼回一段':'拆回一袋'}
            </button>
            <button
              onClick={() =>
                act(
                  "check-remainder",
                  {
                    checked: true,
                    error: m.complete
                      ? ""
                      : `余${m.remainder}${context.unit}，还能做完整分组，不能算完成。`,
                  },
                  m.complete,
                )
              }
            >
              检验余数
            </button>
          </div>
          <Feedback error={s.error}>
            {m.complete
              ? `${c[0]}=${s.placed}×${c[1]}+${m.remainder}，余数${m.remainder}<${c[1]}。为什么少做一组时不能把余数写得很大？`
              : `${c[0]}=${s.placed}×${c[1]}+${m.remainder}；乘加验回总数还不够，还要检查余数范围。`}
          </Feedback>
        </>
      )}
      {model.type === "estimate-product" && (
        <>
          <div className="core-problem">
            <b>
              {c[0]}张票，每张{c[1]}元，预算{c[2]}元够吗？
            </b>
            <p>
              把人数估小与估大，给出的是不同的费用界限。预算在两界之间时，单凭估计不能下结论。
            </p>
          </div>
          <Board title="预算与费用上下界的数线" height={185}>
            <line
              x1="50"
              y1="100"
              x2="590"
              y2="100"
              stroke={colors.ink}
              strokeWidth="3"
            />
            {[
              [m.low, "估小费用"],
              [m.high, "估大费用"],
              [m.budget, "预算"],
            ].map(([num, label], i) => {
              const min = Math.min(m.low, m.budget) - 50,
                max = Math.max(m.high, m.budget) + 50,
                x = 50 + ((Number(num) - min) / (max - min)) * 540;
              return (
                <g key={label}>
                  <line
                    x1={x}
                    y1="70"
                    x2={x}
                    y2="120"
                    stroke={i === 2 ? colors.red : colors.green}
                    strokeWidth="3"
                  />
                  <text
                    x={x}
                    y={i === 2 ? 150 : 40}
                    textAnchor="middle"
                    fontSize="15"
                  >
                    {label} {num}
                  </text>
                </g>
              );
            })}
          </Board>
          <div className="textbook-controls">
            <button onClick={() => act("estimate-low", { take: 1 })}>
              把人数估成{c[3]}
            </button>
            <button onClick={() => act("estimate-high", { take: 2 })}>
              把人数估成{c[4]}
            </button>
            <button onClick={() => act("check-exact", { checked: true })}>
              精算后检验预算
            </button>
          </div>
          <Feedback>
            {s.take
              ? `选择的界限是${s.take === 1 ? "下界" : "上界"}：${s.take === 1 ? c[3] : c[4]}×${c[1]}=${m.reference}。`
              : "先选一个人数估计。"}
            {s.checked
              ? ` 精确费用${c[0]}×${c[1]}=${m.exact}元，预算${m.budget >= m.exact ? "够" : "不够"}。`
              : " 请说明：这一界限能保证够钱、保证不够，还是仍需精算？"}
          </Feedback>
        </>
      )}
      {model.type === "nested-groups" && (
        <>
          <div className="core-problem">
            <b>
              {c[0]}{context.outer}，每{context.outer}{c[1]}{context.inner}，每{context.inner}{c[2]}{context.unit}
            </b>
            <p>点击一个小组登记其中的数量。每组只能登记一次，撤销可以退回。</p>
          </div>
          <div className="core-nested-boxes">
            {Array.from({ length: c[0] }, (_, box) => (
              <article key={box}>
                <h4>
                  第{box + 1}
                  {context.outer}
                </h4>
                {Array.from({ length: c[1] }, (_, n) => {
                  const id = box * c[1] + n,
                    marked = s.marked!.includes(id);
                  return (
                    <button
                      key={n}
                      aria-label={`登记第${box + 1}${context.outer}第${n + 1}${context.inner}`}
                      aria-pressed={marked}
                      onClick={() =>
                        marked
                          ? error("这盒已经登记，不要重复计数。")
                          : act("mark-box", { marked: [...s.marked!, id] })
                      }
                    >
                      <span>
                        {Array.from({ length: c[2] }, (_, i) => (
                          <i key={i} />
                        ))}
                      </span>
                      <small>
                        第{n + 1}
                        {context.inner} · {c[2]}
                        {context.unit}
                      </small>
                    </button>
                  );
                })}
              </article>
            ))}
          </div>
          <button
            onClick={() =>
              act("toggle-grouping", {
                mode: s.mode === "group" ? "ungroup" : "group",
              })
            }
          >
            {s.mode === "group" ? `反过来：按${context.outer}、${context.inner}分回去` : `回到按${context.inner}合并`}
          </button>
          <Feedback error={s.error}>
            已登记{s.marked!.length}{context.inner}，{m.count}{context.unit}。
            {s.mode === "ungroup"
              ? `总量${m.total}${context.unit}，先分${c[0]}${context.outer}，每${context.outer}${c[1]*c[2]}${context.unit}；再分${c[1]}${context.inner}，每${context.inner}${c[2]}${context.unit}。`
              : `全部${context.inner}数是${c[0]}×${c[1]}，每${context.inner}都有${c[2]}${context.unit}。`}
            请指出每一步算式的单位。
          </Feedback>
        </>
      )}
      {model.type === "invariant-table" && (
        <>
          <div className="textbook-controls">
            <button
              onClick={() =>
                act("choose-invariant", { mode: "price", take: 0 })
              }
            >
              同价商品：单价不变
            </button>
            <button
              onClick={() =>
                act("choose-invariant", { mode: "total", take: 0 })
              }
            >
              重新分装：总量不变
            </button>
          </div>
          <div className="core-problem">
            <b>
              {s.mode === "price"
                ? `${c[0]}${context.unit}花${c[1]}元，买${c[2]}${context.unit}多少钱？`
                : `每${context.outer}${c[3]}${context.quantity}，装${c[0]}${context.outer}；改成每${context.outer}${c[4]}${context.quantity}，要几${context.outer}？`}
            </b>
          </div>
          <table className="core-relation-table">
            <thead>
              <tr>
                <th>情况</th>
                <th>份数</th>
                <th>每份</th>
                <th>总量</th>
              </tr>
            </thead>
            <tbody>
              {s.mode === "price" ? (
                <>
                  <tr>
                    <td>原来</td>
                    <td>{c[0]}{context.unit}</td>
                    <td>？元／{context.unit}</td>
                    <td>{c[1]}元</td>
                  </tr>
                  <tr>
                    <td>现在</td>
                    <td>{c[2]}{context.unit}</td>
                    <td>同一单价</td>
                    <td>？元</td>
                  </tr>
                </>
              ) : (
                <>
                  <tr>
                    <td>原来</td>
                    <td>{c[0]}{context.outer}</td>
                    <td>{c[3]}{context.quantity}／{context.outer}</td>
                    <td>？{context.quantity}</td>
                  </tr>
                  <tr>
                    <td>现在</td>
                    <td>？{context.outer}</td>
                    <td>{c[4]}{context.quantity}／{context.outer}</td>
                    <td>同一批书</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          <p>这一题什么没有变？</p>
          <div className="textbook-controls">
            <button
              onClick={() =>
                act(
                  "select-fixed",
                  {
                    take: 1,
                    error:
                      s.mode === "price"
                        ? ""
                        : "分装方式变了，每份数量并不相同。",
                  },
                  s.mode === "price",
                )
              }
            >
              每份数量不变
            </button>
            <button
              onClick={() =>
                act(
                  "select-fixed",
                  {
                    take: 2,
                    error:
                      s.mode === "total"
                        ? ""
                        : "购买数量变了，总价会随数量变化。",
                  },
                  s.mode === "total",
                )
              }
            >
              总量不变
            </button>
          </div>
          <Feedback error={s.error}>
            {m.correct
              ? s.mode === "price"
                ? `先求每${context.unit}${c[1]}÷${c[0]}=${m.price}元，再算${m.price}×${c[2]}=${m.newCost}元。`
                : `先求总共${c[3]}×${c[0]}=${m.total}${context.quantity}，再按每${context.outer}${c[4]}${context.quantity}：${m.total}÷${c[4]}=${m.newBoxes}${context.outer}。`
              : "先选出不变的量，再解释应该先归一还是先归总。"}
          </Feedback>
        </>
      )}
      {model.type === "fraction-core" && (
        <>
          <div className="core-problem">
            <b>
              {model.mode === "add"
                ? `同一整体，先取${c[1]}/${c[0]}，再取${c[2]}/${c[0]}`
                : `整体${c[0]}${context.unit}，拿走它的${c[2]}/${c[1]}`}
            </b>
            <p>
              {model.mode === "add"
                ? "黄色是第一次，蓝色是第二次。已经取走的同一份不能重复拿。"
                : "边框里的全部物品才是本题的一个整体；不是把单个物品当成整体。"}
            </p>
            <label>
              把整体平均分成几份？
              <select
                value={s.parts}
                onChange={(e) =>
                  act("partition-whole", {
                    parts: Number(e.target.value),
                    marked: [],
                    filled: [],
                  })
                }
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <option key={i} value={i + 2}>
                    {i + 2}份
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            className="core-fraction-whole"
            style={{
              gridTemplateColumns: `repeat(${model.mode === "add" ? s.parts : s.parts! > 5 ? Math.ceil(s.parts! / 2) : s.parts},minmax(0,1fr))`,
            }}
            role="group"
            aria-label="同一个整体的平均分组"
          >
            {Array.from({ length: s.parts! }, (_, i) => (
              <button
                key={i}
                aria-label={`选择第${i + 1}份`}
                aria-pressed={s.marked!.includes(i) || s.filled!.includes(i)}
                className={
                  s.marked!.includes(i)
                    ? "first-take"
                    : s.filled!.includes(i)
                      ? "second-take"
                      : ""
                }
                onClick={() => {
                  if (!m.equal) {
                    error(
                      `题目需要${m.parts}个相同小份，你现在选了${s.parts}份。`,
                    );
                    return;
                  }
                  if (s.marked!.includes(i) || s.filled!.includes(i)) {
                    error("这份已经取走，不能再重复取；可以撤销后改。");
                    return;
                  }
                  if (model.mode === "add") {
                    if (s.marked!.length < c[1])
                      act("take-first", { marked: [...s.marked!, i] });
                    else if (s.filled!.length < c[2])
                      act("take-second", { filled: [...s.filled!, i] });
                    else error("两次要取的份数已经完成。");
                  } else if (s.marked!.length < c[2])
                    act("take-fraction", { marked: [...s.marked!, i] });
                  else error("题目要取的份数已够，不要继续拿。");
                }}
              >
                {model.mode === "add" ? (
                  <span>
                    一小份
                    <br />
                    1/{s.parts}
                  </span>
                ) : (
                  <span>
                    {c[0] % s.parts! === 0
                      ? Array.from({ length: c[0] / s.parts! }, (_, n) => (
                          <i key={n} />
                        ))
                      : "无法把完整物品平均分"}
                  </span>
                )}
                <small>第{i + 1}份</small>
              </button>
            ))}
          </div>
          {model.mode === "add" && <div className="core-controls" role="group" aria-label="把取出的份放回同一整体">
            {(["marked", "filled"] as const).map((key,index)=><button key={key} disabled={!s[key]!.length} onClick={()=>act("return-fraction",{[key]:s[key]!.slice(0,-1),error:`把第${index+1}次取出的1小份放回：${m.taken}/${m.parts}－1/${m.parts}＝${m.taken-1}/${m.parts}。分母没有变，因为仍是同一个整体的相同小份。`})}>放回第{index+1}次取出的1份</button>)}
          </div>}
          <Feedback error={s.error}>
            {!m.equal
              ? `目前分为${s.parts}份，请与题目分母${m.parts}核对。`
              : model.mode === "add"
                ? `同一整体的一小份一直是1/${m.parts}；取了${s.marked!.length}/${m.parts}与${s.filled!.length}/${m.parts}，合计${m.taken}/${m.parts}，剩${m.rest}/${m.parts}。分母为什么不相加？`
                : `每小份${c[0]}÷${m.parts}=${m.unit}${context.unit}，取${s.marked!.length}份共${m.takenQuantity}${context.unit}。这里分数表示份数关系，答案表示实际数量。`}
          </Feedback>
        </>
      )}
      <p className="core-explain">
        请指着教具讲清：哪一个量没有变？这一步为什么可以这样做？把发现记在课后的“讲给爸爸妈妈听”里。
      </p>
      {toolbar}
    </section>
  );
}
