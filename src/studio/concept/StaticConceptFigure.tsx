// Six deliberately static relationship diagrams, tied to their authored lesson conditions.
export default function StaticConceptFigure({ id }: { id: string }) {
  const ink = "#37524e",
    blue = "#527eab",
    green = "#4b917e",
    gold = "#dfb351";
  let picture;
  if (id === "G3-U05-B01")
    picture = (
      <>
        {[
          "线段：两个端点，可以量全长",
          "射线：一个端点，一端一直延伸",
          "直线：没有端点，两端一直延伸",
        ].map((label, i) => (
          <g key={i}>
            <text x="40" y={42 + i * 95}>
              {label}
            </text>
            <line
              x1="130"
              y1={68 + i * 95}
              x2="530"
              y2={68 + i * 95}
              stroke={blue}
              strokeWidth="5"
            />
            {i < 2 && <circle cx="130" cy={68 + i * 95} r="6" fill={ink} />}
            <path
              d={`M515 ${58 + i * 95}L530 ${68 + i * 95}L515 ${78 + i * 95}`}
              fill="none"
              stroke={blue}
              strokeWidth="4"
            />
            {i === 0 ? (
              <>
                <circle cx="530" cy="68" r="6" fill={ink} />
                <rect x="511" y="53" width="22" height="30" fill="#f4f5eb" />
                <line
                  x1="508"
                  y1="68"
                  x2="530"
                  y2="68"
                  stroke={blue}
                  strokeWidth="5"
                />
                <circle cx="530" cy="68" r="6" fill={ink} />
                <text x="112" y="95">
                  A
                </text>
                <text x="525" y="95">
                  B
                </text>
              </>
            ) : (
              i === 2 && (
                <path
                  d="M145 248L130 258L145 268"
                  fill="none"
                  stroke={blue}
                  strokeWidth="4"
                />
              )
            )}
          </g>
        ))}
      </>
    );
  else if (id === "G3-L03-B01")
    picture = (
      <>
        <rect
          x="45"
          y="100"
          width="210"
          height="120"
          fill="#dfeadf"
          stroke={green}
          strokeWidth="4"
        />
        <rect
          x="290"
          y="100"
          width="120"
          height="120"
          fill="#e8ddb7"
          stroke={gold}
          strokeWidth="4"
        />
        <path
          d="M520 80L590 170L520 260L450 170Z"
          fill="#dee8ee"
          stroke={blue}
          strokeWidth="4"
        />
        <text x="85" y="65">
          长7，宽4
        </text>
        <text x="290" y="65">
          边长都是4
        </text>
        <text x="438" y="65">
          斜角菱形
        </text>
        {[
          [45, 100],
          [255, 100],
          [45, 220],
          [255, 220],
          [290, 100],
          [410, 100],
          [290, 220],
          [410, 220],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={`M${x + (i % 2 ? -15 : 15)} ${y}v${i % 4 < 2 ? 15 : -15}H${x}`}
            fill="none"
            stroke={ink}
            strokeWidth="2"
          />
        ))}
        <text x="50" y="282">
          分类依据是边与直角；四边相等还不够判为正方形。
        </text>
      </>
    );
  else if (id === "G3-L04-B01")
    picture = (
      <>
        <rect
          x="90"
          y="55"
          width="280"
          height="210"
          fill="#dce7d9"
          stroke="#d8765f"
          strokeWidth="7"
        />
        {Array.from({ length: 12 }, (_, n) => (
          <rect
            key={n}
            x={90 + (n % 4) * 70}
            y={55 + Math.floor(n / 4) * 70}
            width="70"
            height="70"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
        <text x="470" y="105">
          外边一圈
        </text>
        <text x="470" y="135">
          围栏
        </text>
        <text x="175" y="30">
          每小格1平方厘米
        </text>
        <text x="175" y="300">
          里面铺满：3行，每行4格
        </text>
      </>
    );
  else if (id === "G3-L06-B03")
    picture = (
      <>
        {["金额", "元", "角"].map((label, i) => (
          <text key={label} x={80 + i * 175} y="50">
            {label}
          </text>
        ))}
        {[
          ["3.8元", "3", "8"],
          ["2.5元", "2", "5"],
        ].map((row, r) =>
          row.map((item, i) => (
            <g key={r + "-" + i}>
              <rect
                x={60 + i * 175}
                y={80 + r * 75}
                width="160"
                height="65"
                fill="#e3ebdd"
              />
              <text x={85 + i * 175} y={120 + r * 75}>
                {item}
              </text>
            </g>
          )),
        )}
        <text x="65" y="275">
          同列对应同一种单位；10角可以换成1元。
        </text>
      </>
    );
  else if (id === "G3-U07-R01" || id === "G3-L07-R01") {
    const upper = id === "G3-U07-R01",
      rows = upper
        ? [
            ["人数／份数", "36份"],
            ["每份用量", "2张贴纸"],
            ["已有材料", "20张贴纸"],
            ["需要再买", "？张贴纸"],
          ]
        : [
            ["活动人数", "24人，每人2张纸"],
            ["包装", "每包12张，6元"],
            ["库存", "本题不另给库存，求总需求"],
            ["活动时间", "15:10—15:50"],
          ];
    picture = rows.map(([label, value], i) => (
      <g key={label}>
        <rect
          x="40"
          y={20 + i * 75}
          width="560"
          height="65"
          rx="10"
          fill="#e7ecdf"
        />
        <text x="60" y={60 + i * 75}>
          {label}
        </text>
        <text x="250" y={60 + i * 75}>
          {value}
        </text>
      </g>
    ));
  } else return null;
  return (
    <figure className="static-concept-figure">
      <svg
        viewBox="0 0 640 330"
        role="img"
        aria-label="本课的静态数学关系图"
        style={{ fill: ink, fontSize: 18, width: "100%" }}
      >
        {picture}
      </svg>
      <figcaption>
        这是关系图，可以指图解释、画在纸上或摆实物；这里没有拖动操作。
      </figcaption>
    </figure>
  );
}
