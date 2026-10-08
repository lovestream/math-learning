import type { ThinkingRecord } from "../types";
export default function ThinkingVariantFigure({
  variant,
}: {
  variant: NonNullable<ThinkingRecord["variant"]>;
}) {
  const { unit, values: v } = variant.figure;
  let picture;
  const blue = "#537eab",
    green = "#4b917e",
    gold = "#e0b254";
  if (unit === "U01")
    picture = (
      <>
        {["正面", "右侧"].map((label, r) => (
          <g key={label} transform={`translate(${80 + r * 300} 25)`}>
            <text x="0" y="20">
              {label}：最高{v[0]}、{v[1]}块
            </text>
            {[v[0], v[1]].map((height, col) =>
              Array.from({ length: height }, (_, n) => (
                <rect
                  key={col + "-" + n}
                  x={col * 65}
                  y={230 - (n + 1) * 36}
                  width="50"
                  height="36"
                  fill={blue}
                  fillOpacity=".3"
                  stroke={blue}
                />
              )),
            )}
          </g>
        ))}
      </>
    );
  else if (unit === "U03")
    picture = (
      <>
        {v.map((len, i) => (
          <g key={i}>
            <rect
              x="65"
              y={75 + i * 110}
              width={(len / Math.max(...v)) * 480}
              height="40"
              fill={i ? blue : gold}
            />
            <text x="65" y={60 + i * 110}>
              {len}厘米（没有中间刻度）
            </text>
          </g>
        ))}
      </>
    );
  else if (unit === "UP01")
    picture = (
      <>
        <path
          d="M100 160H540M320 160V260M255 260H385"
          stroke={green}
          strokeWidth="6"
        />
        <path
          d="M110 160v35h160v-35M370 160v35h160v-35"
          fill="none"
          stroke={blue}
          strokeWidth="3"
        />
        {[v[0], v[2]].map((count, side) =>
          Array.from({ length: count }, (_, i) => (
            <g key={side + "-" + i}>
              <rect
                x={115 + side * 260 + i * 38}
                y="112"
                width="32"
                height="44"
                fill={gold}
              />
              <text x={131 + side * 260 + i * 38} y="140" textAnchor="middle">
                ?
              </text>
            </g>
          )),
        )}
        <text x="110" y="65">
          左：{v[0]}袋＋{v[1]}克
        </text>
        <text x="355" y="65">
          右：{v[2]}袋＋{v[3]}克
        </text>
      </>
    );
  else if (unit === "U05")
    picture = (
      <>
        <path
          d="M215 45V250H465"
          fill="#e8eddc"
          stroke={green}
          strokeWidth="5"
        />
        <path d="M215 250L270 75" stroke={blue} strokeWidth="4" />
        <path d="M215 220H245V250" fill="none" stroke={gold} strokeWidth="3" />
        <text x="65" y="55">
          整个角是直角
        </text>
        <text x="165" y="140">
          左
        </text>
        <text x="320" y="180">
          右（更大）
        </text>
      </>
    );
  else if (unit === "U06")
    picture = (
      <>
        {[v[0], v[1]].map((len, i) => (
          <g key={i}>
            <text x="55" y={55 + i * 120}>
              {i ? "绿带" : "黄带"}：整体{len}厘米，取1/{v[i + 2]}
            </text>
            <rect
              x="55"
              y={75 + i * 120}
              width={(len / Math.max(v[0], v[1])) * 500}
              height="45"
              fill={i ? green : gold}
            />
          </g>
        ))}
      </>
    );
  else if (unit === "L01")
    picture = (
      <>
        <rect
          x="80"
          y="30"
          width="250"
          height="250"
          fill="#ead8ae"
          stroke={gold}
        />
        <path
          d="M205 30V280M80 155H330"
          stroke={blue}
          strokeDasharray="8 5"
          strokeWidth="3"
        />
        <rect
          x="400"
          y="60"
          width="100"
          height="100"
          fill="#d8b9a6"
          stroke={green}
        />
        {v[0] === 1 ? (
          <path d="M450 86l9 18h-18z" fill="#fff" />
        ) : v[0] === 2 ? (
          <circle cx="450" cy="98" r="8" fill="#fff" />
        ) : v[0] === 3 ? (
          <rect x="442" y="90" width="16" height="16" fill="#fff" />
        ) : (
          <path d="M450 85l10 12-10 12-10-12z" fill="#fff" />
        )}
        <text x="365" y="205">
          两次垂直对折
        </text>
        <text x="365" y="235">
          穿透4层的小孔
        </text>
      </>
    );
  else if (unit === "L03" || unit === "L04") {
    const scale = unit === "L04" ? Math.min(360 / v[0], 200 / v[1]) : 1,
      w = unit === "L04" ? v[0] * scale : 330,
      h = unit === "L04" ? v[1] * scale : 175;
    picture = (
      <>
        <rect
          x="120"
          y="65"
          width={w}
          height={h}
          fill="#e3ebde"
          stroke={green}
          strokeWidth="5"
        />
        {unit === "L04" ? (
          <>
            <path
              d={`M120 ${65 + h}L${120 + w} 65`}
              stroke={blue}
              strokeWidth="4"
              strokeDasharray="7 5"
            />
            <text x={120 + w / 2} y="45">
              {v[0]}厘米
            </text>
            <text x={138 + w} y={65 + h / 2}>
              {v[1]}厘米
            </text>
          </>
        ) : (
          <>
            <text x="175" y="45">
              绳子共{v[0]}厘米
            </text>
            <text x="150" y="280">
              只示意结构；待找边长的比例不由图决定。
            </text>
          </>
        )}
      </>
    );
  } else if (unit === "L07")
    picture = (
      <>
        <rect
          x="30"
          y="30"
          width="580"
          height="260"
          rx="15"
          fill="#faf6e8"
          stroke={gold}
        />
        <ellipse
          cx="245"
          cy="160"
          rx="145"
          ry="95"
          fill={blue}
          fillOpacity=".17"
          stroke={blue}
          strokeWidth="3"
        />
        <ellipse
          cx="395"
          cy="160"
          rx="145"
          ry="95"
          fill={green}
          fillOpacity=".17"
          stroke={green}
          strokeWidth="3"
        />
        <text x="100" y="65">
          足球{v[1]}人
        </text>
        <text x="400" y="65">
          音乐{v[2]}人
        </text>
        <text x="70" y="275">
          共{v[0]}人；都不喜欢{v[3]}人
        </text>
        <text x="175" y="165">
          只足球？
        </text>
        <text x="300" y="165">
          都喜欢？
        </text>
        <text x="445" y="165">
          只音乐？
        </text>
      </>
    );
  else if (unit === "LP01")
    picture = (
      <>
        {["一", "二", "三", "四", "五", "六", "日"].map((day, i) => (
          <text key={day} x={80 + i * 72} y="30">
            周{day}
          </text>
        ))}
        {Array.from({ length: v[0] }, (_, i) => {
          const pos = i + v[1];
          return (
            <g key={i}>
              <rect
                x={65 + (pos % 7) * 72}
                y={48 + Math.floor(pos / 7) * 43}
                width="62"
                height="37"
                rx="4"
                fill={i === 0 ? "#e1c38a" : "#e7ecdf"}
              />
              <text
                x={96 + (pos % 7) * 72}
                y={73 + Math.floor(pos / 7) * 43}
                textAnchor="middle"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </>
    );
  else if (unit === "L05")
    picture = (
      <>
        {["组别", "总人数", "苹果", "香蕉"].map((t, i) => (
          <text key={t} x={55 + i * 145} y="50">
            {t}
          </text>
        ))}
        {[
          ["甲", v[0], v[2], "?"],
          ["乙", v[1], v[3], "?"],
        ].map((row, r) =>
          row.map((text, i) => (
            <g key={r + "-" + i}>
              <rect
                x={40 + i * 145}
                y={85 + r * 75}
                width="135"
                height="65"
                fill="#e6ebdc"
              />
              <text x={55 + i * 145} y={125 + r * 75}>
                {text}
              </text>
            </g>
          )),
        )}
      </>
    );
  else if (unit === "L02")
    picture = (
      <>
        {Array.from({ length: v[3] - v[2] + 1 }, (_, n) => n + v[2]).map(
          (bags, row) => (
            <g key={bags} transform={`translate(45 ${35 + row * 85})`}>
              <text x="0" y="32">
                {bags}满袋
              </text>
              {Array.from({ length: bags }, (_, i) => (
                <g key={i} transform={`translate(${90 + i * 47} 0)`}>
                  <rect width="40" height="48" rx="10" fill="#e4d09e" />
                  <text x="20" y="30" textAnchor="middle" fontSize="13">
                    {v[0]}
                  </text>
                </g>
              ))}
              <text x="495" y="32">
                余{v[1]}颗
              </text>
            </g>
          ),
        )}
      </>
    );
  else
    picture = variant.conditions.map((row, i) => (
      <g key={row}>
        <rect
          x="45"
          y={30 + i * 90}
          width="550"
          height="75"
          rx="12"
          fill="#e8ecd9"
        />
        <text x="65" y={60 + i * 90} fontSize="16">
          {Array.from({ length: Math.ceil(row.length / 28) }, (_, n) => (
            <tspan key={n} x="65" dy={n ? 23 : 0}>
              {row.slice(n * 28, (n + 1) * 28)}
            </tspan>
          ))}
        </text>
      </g>
    ));
  return (
    <figure className="thinking-figure">
      <svg
        role="img"
        aria-label="复习题的已知条件图"
        viewBox="0 0 640 320"
        style={{ fill: "#354c46", fontSize: 17 }}
      >
        {picture}
      </svg>
      <figcaption>这一轮换了情境；图中只给已知条件，请重新推理。</figcaption>
    </figure>
  );
}
