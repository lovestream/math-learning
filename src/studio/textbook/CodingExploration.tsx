import {useState} from 'react';
import './coding-exploration.css';

type Topic='identity'|'postal'|'student'|'challenge';
type Segment={digits:string;name:string;detail:string;tip?:string};
const idParts:Segment[]=[
 {digits:'44',name:'第1—2位：省级',detail:'身份证地址码前两位表示省、自治区、直辖市等省级行政区划。此处44用作广东省的教学示意。'},
 {digits:'01',name:'第3—4位：中间层级',detail:'一般表示市、地区、自治州等行政区划层级；直辖市等存在特殊划分，不能机械理解为普通地级市。'},
 {digits:'06',name:'第5—6位：区县级',detail:'与前四位一起构成6位行政区划代码，指县、市辖区、县级市等行政单元。'},
 {digits:'2015',name:'第7—10位：出生年',detail:'四位年份，必须连同月日理解。例如这里只用2015作示范，不对应任何真实证件。'},
 {digits:'05',name:'第11—12位：出生月',detail:'月份占两位，5月写05，不能省去前导0，否则后面所有位置就会改变。'},
 {digits:'16',name:'第13—14位：出生日',detail:'日期占两位，示例16表示当月16日。年月日合起来是8位。'},
 {digits:'003',name:'第15—17位：顺序码',detail:'这三位用于区分同一地址码及同年同月同日出生的人员。第17位（整个身份证倒数第二位）是3，奇数对应男性；若为004，末位4是偶数，对应女性。'},
 {digits:'?',name:'第18位：校验码',detail:'最后一位按前17位算出。结果若是10，就用一个字母X代表10；不能随便写X。此处问号表示没有提供真实校验码，本演示不是完整身份证号码。'}
];
const postalParts:Segment[]=[
 {digits:'10',name:'前2位：省级邮政范围',detail:'邮政编码首两位体现省、自治区、直辖市等邮政区域。邮编与身份证行政区划码是不同体系，不能互相照抄。'},
 {digits:'0',name:'第3位：邮区',detail:'继续细分邮政分拣范围，方便邮件按区域流转。'},
 {digits:'0',name:'第4位：县、市等投递层级',detail:'用来进一步细分邮政区域。具体区划和实际投递组织以邮政部门公布的信息为准。'},
 {digits:'31',name:'最后2位：投递局（所）',detail:'进一步标识投递局所/投递区域。一个邮编下仍可以有许多街道和住户，寄信还需要完整的地址。'}
];
const quiz=[
 {q:'身份证的出生年份占哪几位？',options:['第1—4位','第7—10位','第15—18位'],correct:1,why:'第7—14位是日期，分成4位年＋2位月＋2位日。'},
 {q:'身份证顺序码是002，哪一位用于区分男女？',options:['第16位2','第17位2（偶数）','最后第18位'],correct:1,why:'顺序码第15—17位，最后一位就是全号第17位；偶数按该规则对应女性。'},
 {q:'身份证校验码位置计算出10，为什么写X？',options:['系统可随机挑字母','X占一个字符位置表示10','X表示身份证无效'],correct:1,why:'校验值10以X表示，仅占一位；其他校验值仍按规则填写。'},
 {q:'邮政编码和详细地址，哪句正确？',options:['同一邮编只能对应一个人','邮编用于邮件分拣，仍要详细地址','邮编末位可表示性别'],correct:1,why:'邮编面向投递区域，身份信息与邮编无关。'},
 {q:'3年级1班7号和3年级2班7号，都记“307”，有什么风险？',options:['不会有任何问题','两人会撞号，编码要加足班级信息','数字总和改变了'],correct:1,why:'编码要能区分不同对象；要规定各段含义和位数。'}
];
function SegmentButton({part,selected,onClick}:{part:Segment;selected:boolean;onClick:()=>void}){
 return <button className={'coding-segment'+(selected?' coding-segment-active':'')} type="button" aria-pressed={selected} onClick={onClick}><strong>{part.digits}</strong><span>{part.name}</span></button>;
}
export default function CodingExploration(){
 const [topic,setTopic]=useState<Topic>('identity');
 const [idIndex,setIdIndex]=useState(0);
 const [postIndex,setPostIndex]=useState(0);
 const [sequence,setSequence]=useState(3);
 const [grade,setGrade]=useState(3);
 const [classNo,setClassNo]=useState(2);
 const [serial,setSerial]=useState(7);
 const [year,setYear]=useState(2024);
 const [rule,setRule]=useState<'class'|'stable'>('class');
 const [attempt,setAttempt]=useState<number[]>(Array(quiz.length).fill(-1));
 const [notes,setNotes]=useState('');
 const p2=(n:number)=>String(n).padStart(2,'0');
 const classCode=`${p2(grade)}-${p2(classNo)}-${p2(serial)}`;
 const stableCode=`${year}-${String(serial).padStart(4,'0')}`;
 const selectTopic=(t:Topic)=>{setTopic(t)};
 return <div className="coding-exploration" aria-label="数字编码主题实验室">
  <div className="coding-exploration-intro">
   <h3>不只是书架：打开数字编码实验室</h3>
   <p>四种编码，各有用途。先读懂字段，再找出重号、漏位和错误理解。</p>
   <p className="coding-privacy">本实验全部使用虚构示意数据。不要输入自己或家人的真实身份证号码、完整生日、住址或正式学籍号。</p>
  </div>
  <div className="coding-tabs" role="group" aria-label="选择编码主题">
   <button type="button" aria-pressed={topic==='identity'} onClick={()=>selectTopic('identity')}>身份证18位</button>
   <button type="button" aria-pressed={topic==='postal'} onClick={()=>selectTopic('postal')}>邮政编码6位</button>
   <button type="button" aria-pressed={topic==='student'} onClick={()=>selectTopic('student')}>自己设计学号</button>
   <button type="button" aria-pressed={topic==='challenge'} onClick={()=>selectTopic('challenge')}>综合辨错</button>
  </div>
  {topic==='identity'&&<section className="coding-topic" aria-label="身份证结构学习">
   <h4>身份证号码：从左到右，按6＋8＋3＋1分组</h4>
   <p>点下面的任意一段，看看它代表什么。这里只展示17位本体码和一个问号，不是任何人的完整证件号码。</p>
   <div className="coding-groups" aria-label="身份证18位结构示意（非真实号码）">
    {idParts.map((part,i)=><SegmentButton key={i} part={part} selected={idIndex===i} onClick={()=>setIdIndex(i)}/>)}
   </div>
   <div className="coding-detail" role="status"><strong>{idParts[idIndex].name}</strong><p>{idParts[idIndex].detail}</p></div>
   <div className="coding-example"><span>第15—17位顺序码试验</span>
    <div className="coding-selectors"><button type="button" onClick={()=>setSequence(3)} aria-pressed={sequence===3}>003</button><button type="button" onClick={()=>setSequence(4)} aria-pressed={sequence===4}>004</button></div>
    <p>当前顺序码：<strong>00{sequence}</strong>。第17位是 <strong>{sequence}</strong>（{sequence%2?'奇数，按规则对应男性':'偶数，按规则对应女性'}）。**注意是第17位，不是最后的校验码。**</p>
   </div>
   <div className="coding-caveat">第1—6位是行政区划代码，不等于现在住的地址；第18位校验码符合公式，也不能单独证明一个人身份真实。<strong>计算结果是10时，才用X代替。</strong></div>
  </section>}
  {topic==='postal'&&<section className="coding-topic" aria-label="邮政编码结构学习">
   <h4>邮政编码：六位数字帮信件找到投递范围</h4>
   <p>下面用六位数字的分段示意解释邮区层次；它不代替官方邮编查询。</p>
   <div className="coding-groups coding-postal">{postalParts.map((part,i)=><SegmentButton key={i} part={part} selected={postIndex===i} onClick={()=>setPostIndex(i)}/>)}</div>
   <div className="coding-detail" role="status"><strong>{postalParts[postIndex].name}</strong><p>{postalParts[postIndex].detail}</p></div>
   <div className="coding-two-cards"><div><b>邮政编码</b><p>用于邮政分拣、确定投递范围。</p><strong>6位</strong></div><div><b>身份证地址码</b><p>用于身份号码中的行政区划信息。</p><strong>6位，但不是同一套规则</strong></div></div>
   <p className="coding-caveat">想象两个人住在同一个小区：他们可能使用相同的邮编，但不应有相同的公民身份号码。寄信还需写收件人、街道及门牌等信息。</p>
  </section>}
  {topic==='student'&&<section className="coding-topic" aria-label="模拟学号设计">
   <h4>给Kevin所在的模拟班级设计学号</h4>
   <p>先决定要标记的是<strong>当前班级位置</strong>，还是<strong>跨年级都不变的学校内部身份</strong>。两种用途需要不同规则。</p>
   <div className="coding-selectors"><button type="button" aria-pressed={rule==='class'} onClick={()=>setRule('class')}>当前班级标签</button><button type="button" aria-pressed={rule==='stable'} onClick={()=>setRule('stable')}>长期校内编号</button></div>
   <div className="coding-input-grid">
    {rule==='class'&&<label>年级<select value={grade} onChange={e=>setGrade(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}年级</option>)}</select></label>}
    {rule==='class'&&<label>班级<select value={classNo} onChange={e=>setClassNo(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}班</option>)}</select></label>}
    {rule==='stable'&&<label>入学年份<select value={year} onChange={e=>setYear(Number(e.target.value))}>{[2023,2024,2025,2026].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
    <label>学生序号<select value={serial} onChange={e=>setSerial(Number(e.target.value))}>{Array.from({length:45},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label>
   </div>
   <p className="coding-code-preview" aria-live="polite">{rule==='class'?classCode:stableCode}</p>
   {rule==='class'?<div className="coding-detail"><strong>规则：年级2位—班级2位—班内序号2位</strong><p>三年级2班7号写03-02-07；另一个班的7号要换班级字段，不能只写07。升年级以后“年级”字段会变，因此不适合作为终身固定身份号。</p><p>换成下一年级：<strong>{p2(Math.min(grade+1,6))}-{p2(classNo)}-{p2(serial)}</strong>（可能变号）</p></div>:<div className="coding-detail"><strong>规则：入学年份4位—校内流水号4位</strong><p>示例{stableCode}，不随年级变化，前提是学校在同一入学年内不重复分配流水号。这只是自己设计的校内编号；全国正式学籍号由国家学籍系统生成，不是这里的编码。</p></div>}
   <div className="coding-open"><label htmlFor="coding-reflection">开放问题：如果两个班都有7号，怎样证明你的方案仍然不重号？如果转班、升年级怎么办？</label><textarea id="coding-reflection" rows={3} value={notes} onChange={e=>setNotes(e.target.value.slice(0,1200))} placeholder="先写规则，再找两个容易撞号的学生测试……"/></div>
   <p className="coding-caveat">这段想法仅用于当前页面讨论，不自动判定正确或计分；正式开放题请到本课练习中提交首答并由家长核对。</p>
  </section>}
  {topic==='challenge'&&<section className="coding-topic" aria-label="数字编码综合辨错">
   <h4>五道辨错题：先选择，再说明依据</h4>
   <p>这里是讲解前的练习试验，不计入正式849题，也不触发积分或独立掌握；正式测评在课程练习入口。</p>
   {quiz.map((item,i)=><div className="coding-quiz" key={i}><p><strong>{i+1}. {item.q}</strong></p><div className="coding-quiz-options">{item.options.map((o,j)=><button type="button" key={j} aria-pressed={attempt[i]===j} onClick={()=>setAttempt(a=>a.map((v,k)=>k===i?j:v))}>{o}</button>)}</div>{attempt[i]!==-1&&<p className={attempt[i]===item.correct?'coding-quiz-right':'coding-quiz-wrong'}>{attempt[i]===item.correct?'本题符合规则。':'这次不符合规则。'} {item.why}</p>}</div>)}
   <button type="button" className="coding-retry" onClick={()=>setAttempt(Array(quiz.length).fill(-1))}>清空本页练习，重新思考</button>
  </section>}
 </div>;
}
