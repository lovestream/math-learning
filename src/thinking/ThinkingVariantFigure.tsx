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
                  y={230 - (n + 1) * Math.min(36,200/height)}
                  width="50"
                  height={Math.min(36,200/height)}
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
  else if(unit === "U01-single") {
    const cell=Math.min(40,180/v[0]);
    picture=<><text x="55" y="35">只有正面照片：最高 {v[0]}、1 块</text>{[v[0],1].map((height,col)=>Array.from({length:height},(_,i)=><rect key={col+'-'+i} x={90+col*65} y={230-(i+1)*cell} width="50" height={cell} fill={blue} fillOpacity=".3" stroke={blue}/>))}<text x="345" y="45">地面已知位置（高度未知）</text>{['后左？','后右空','前左？','前右？'].map((label,i)=><g key={label}><rect x={345+i%2*115} y={75+Math.floor(i/2)*80} width="110" height="75" fill="#e3ebde" stroke={green}/><text x={360+i%2*115} y={120+Math.floor(i/2)*80}>{label}</text></g>)}</>;
  }
  else if(unit === "U03-reverse") {
    picture=<>{v.map((len,i)=><g key={i}><text x="55" y={55+i*110}>{i?'拼接后目标线段':'已知短纸条'}：{len}厘米</text><rect x="55" y={70+i*110} width={450*len/Math.max(...v)} height="35" fill={i?blue:gold}/></g>)}<text x="55" y="290">原来长纸条：？厘米</text></>;
  }
  else if(unit === "UP01-reverse") {
    picture=<><path d="M100 190H540M320 190V265M265 265H375" stroke={green} strokeWidth="5"/>{[v[0],v[2]].map((count,side)=>Array.from({length:count},(_,i)=><g key={side+'-'+i}><rect x={95+side*275+i*40} y="130" width="32" height="50" fill={gold}/><text x={111+side*275+i*40} y="160" textAnchor="middle">袋</text></g>))}<text x="70" y="65">左：{v[0]}袋＋{v[1]}克</text><text x="365" y="65">右：{v[2]}袋＋？克</text><text x="95" y="225">{v[1]}克砝码</text><text x="380" y="225">未知砝码重量</text><text x="215" y="300">每袋已知 {v[3]} 克</text></>;
  }
  else if(unit === "U06-reverse" || unit === "U06-unknown") {
    const unknownBoth=unit==='U06-unknown';
    picture=<>{[0,1].map(i=><g key={i}><text x="55" y={45+i*115}>{i?'绿带':'黄带'}：{!unknownBoth&&i===0?`整体${v[0]}厘米，取1/2`:`整体未知，取1/${unknownBoth?v[i]:3}`}</text><rect x="55" y={65+i*115} width="475" height="40" fill={i?green:gold} fillOpacity={(unknownBoth||i===1)?0.12:0.5} stroke={i?green:gold} strokeDasharray={unknownBoth||i===1?'8 5':undefined}/></g>)}<text x="55" y="295">未知长度的虚线条不表示实际比例。</text></>;
  }
  else if(unit === "L01-reverse") {
    picture=<><rect x="70" y="55" width="220" height="220" fill="#ead8ae" stroke={gold}/><path d="M180 55V275M70 165H290" stroke={blue} strokeDasharray="7 5"/><text x="70" y="35">展开共 {v[1]} 个孔</text><path d="M325 170H365" stroke={green} strokeWidth="4"/><rect x="415" y="100" width="115" height="115" fill="#d8b9a6" stroke={green}/><text x="438" y="165">？个孔</text><text x="360" y="265">倒回两次对折后</text></>;
  }
  else if(unit === "L03-reverse") {
    picture=<><rect x="90" y="75" width="310" height={310*v[1]/v[0]} fill="#e3ebde" stroke={green} strokeWidth="4"/><text x="180" y="65">原长 {v[0]} 厘米</text><text x="415" y={75+155*v[1]/v[0]}>原宽 {v[1]} 厘米</text><text x="65" y="305">新长增加 {v[2]} 厘米；同一根绳子，新宽？</text></>;
  }
  else if(unit === "L04-reverse") {
    picture=<><rect x="90" y="75" width="310" height="175" fill="#e3ebde" stroke={green} strokeWidth="4"/><path d="M90 250L400 75" stroke={blue} strokeWidth="4"/><text x="180" y="50">长 {v[0]} 厘米</text><text x="425" y="165">宽？厘米</text><text x="215" y="215">一块 {v[1]} 平方厘米</text><text x="65" y="290">示意结构，未知宽度不由图的比例决定。</text></>;
  }
  else if(unit === "LP01-reverse") {
    picture=<>{['一','二','三','四','五','六','日'].map((label,i)=>{const extra=Array.from({length:v[0]},(_,n)=>(v[1]+n)%7).includes(i);return <g key={label}><text x={60+i*78} y="75">周{label}</text><rect x={48+i*78} y="105" width="64" height="95" fill={extra?gold:blue} fillOpacity=".25"/><text x={60+i*78} y="160">{extra?5:4}次</text></g>})}<text x="70" y="260">这个月的总天数和1日的星期：？</text></>;
  }
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
  else if (unit === "U05") {
    const straight=v[0]===180, small=v[1]??20;
    const ray=straight?180-small:90-small;
    const x=260+170*Math.cos(ray*Math.PI/180), y=245-170*Math.sin(ray*Math.PI/180);
    picture=<><path d={straight?"M65 245H525":"M260 55V245H500"} fill="none" stroke={green} strokeWidth="5"/><path d={`M260 245L${x} ${y}`} stroke={blue} strokeWidth="4"/>{!straight&&<path d="M260 215H290V245" fill="none" stroke={gold} strokeWidth="3"/>}<text x="65" y="35">整个角：{straight?'一条直线形成的角':'直角'}</text><text x="170" y="160">左（较小）</text><text x="355" y="180">右（较大）</text></>;
  }
  else if (unit === "L01-fold") {
    picture=<><rect x="45" y="50" width="205" height="205" fill="#ead8ae" stroke={gold}/><path d="M148 50V255" stroke={blue} strokeDasharray="6 4"/>{v[0]>1&&<path d="M45 153H250" stroke={blue} strokeDasharray="6 4"/>}{v[0]>2&&<path d="M148 153L250 255" stroke={blue} strokeDasharray="6 4"/>}{v[0]>3&&<path d="M148 153L250 204" stroke={blue} strokeDasharray="6 4"/>}<text x="45" y="30">依次对折 {v[0]} 次</text><path d="M280 155H335" stroke={green} strokeWidth="4"/><path d={v[0]<3?'M365 100H505V235H365Z':v[0]===3?'M365 100H505V235Z':'M365 100H505L505 170Z'} fill="#d8b9a6" stroke={green}/>{Array.from({length:v[1]},(_,i)=><circle key={i} cx={465+i*20} cy={v[0]===4?135:155} r="5" fill="white"/>)}<text x="330" y="275">在折好的纸上打 {v[1]} 个孔</text></>;
  }
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
  } else if (unit === "L07" || unit === "L07-reverse")
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
          足球{unit==='L07'?v[1]:v[0]}人
        </text>
        <text x="400" y="65">
          音乐{unit==='L07'?v[2]:v[1]}人
        </text>
        <text x="70" y="275">
          共{unit==='L07'?v[0]:'？'}人；都不喜欢{v[3]}人
        </text>
        <text x="175" y="165">
          只足球？
        </text>
        <text x="300" y="165">
          {unit==='L07'?'都喜欢？':`都喜欢${v[2]}人`}
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
                <g key={i} transform={`translate(${90 + i * Math.min(47,380/v[3])} 0)`}>
                  <rect width={Math.min(40,380/v[3]*.82)} height="48" rx="10" fill="#e4d09e" />
                  <text x={Math.min(40,380/v[3]*.82)/2} y="30" textAnchor="middle" fontSize="13">
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
