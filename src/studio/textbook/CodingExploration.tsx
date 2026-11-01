import {useState} from 'react';
import './coding-exploration.css';
import {idParts,identityGroups,postalParts,codingQuiz as quiz,classCode as makeClassCode,stableCode as makeStableCode} from '../../../shared/coding-model.mjs';

type Topic='identity'|'postal'|'student'|'challenge';
type Segment={digits:string;name:string;detail:string;tip?:string};
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
 const [schoolSerial,setSchoolSerial]=useState(7);
 const [year,setYear]=useState(2024);
 const [rule,setRule]=useState<'class'|'stable'>('class');
 const [attempt,setAttempt]=useState<number[]>(Array(quiz.length).fill(-1));
 const [notes,setNotes]=useState('');
 const classCode=makeClassCode(grade,classNo,serial);
 const stableCode=makeStableCode(year,schoolSerial);
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
   <div className="coding-groups coding-id-layout" aria-label="身份证18位结构示意（非真实号码）">
    {identityGroups.map((group,g)=><div className={`coding-id-group coding-id-group-${g}`} key={group.name}>
     <b>{group.name} · {idParts.slice(group.from,group.to).reduce((n,p)=>n+p.digits.length,0)}位</b>
     <div className="coding-id-parts">{idParts.slice(group.from,group.to).map((part,i)=><SegmentButton key={part.name} part={part} selected={idIndex===group.from+i} onClick={()=>setIdIndex(group.from+i)}/>)}</div>
    </div>)}
   </div>
   <div className="coding-detail" role="status"><strong>{idParts[idIndex].name}</strong><p>{idParts[idIndex].detail}</p></div>
   <div className="coding-example"><span>第15—17位顺序码试验</span>
    <div className="coding-selectors"><button type="button" onClick={()=>setSequence(3)} aria-pressed={sequence===3}>003</button><button type="button" onClick={()=>setSequence(4)} aria-pressed={sequence===4}>004</button></div>
    <p>当前顺序码：<strong>00{sequence}</strong>。第17位是 <strong>{sequence}</strong>（{sequence%2?'奇数，按规则对应男性':'偶数，按规则对应女性'}）。注意是第17位，不是最后的校验码。</p>
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
    {rule==='class'&&<label>年级<select aria-label="年级" value={grade} onChange={e=>setGrade(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}年级</option>)}</select></label>}
    {rule==='class'&&<label>班级<select aria-label="班级" value={classNo} onChange={e=>setClassNo(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}班</option>)}</select></label>}
    {rule==='stable'&&<label>入学年份<select aria-label="入学年份" value={year} onChange={e=>setYear(Number(e.target.value))}>{[2023,2024,2025,2026].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
    {rule==='class'?<label>班内序号<select aria-label="班内序号" value={serial} onChange={e=>setSerial(Number(e.target.value))}>{Array.from({length:45},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label>:<label>该入学年校内唯一流水号<select aria-label="该入学年校内唯一流水号" value={schoolSerial} onChange={e=>setSchoolSerial(Number(e.target.value))}>{[...Array.from({length:60},(_,i)=>i+1),810,9999].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
   </div>
   <p className="coding-code-preview" aria-live="polite">{rule==='class'?classCode:stableCode}</p>
   {rule==='class'?<div className="coding-detail"><strong>规则：年级2位—班级2位—班内序号2位</strong><p>三年级2班7号写03-02-07；另一个班的7号要换班级字段，不能只写07。升年级以后“年级”字段会变，因此不适合作为终身固定身份号。</p>{grade<6?<p>保持班级和序号不变，升到下一年级：<strong>{makeClassCode(grade+1,classNo,serial)}</strong>。年级字段变了。</p>:<p>六年级之后完成小学；这里不把六年级再次当作下一年级。若要一直识别同一个人，比较长期校内编号。</p>}<p>另一个班的同号同学：<strong>{makeClassCode(grade,classNo===1?2:1,serial)}</strong>。请比较哪一段不同。</p></div>:<div className="coding-detail"><strong>规则：入学年份4位—校内流水号4位</strong><p>示例{stableCode}，不随年级变化，前提是学校在同一入学年内不重复分配流水号。这只是自己设计的校内编号；全国正式学籍号由国家学籍系统生成，不是这里的编码。</p><p>流水号在同一入学年的全校范围分配，不能每换一个班就从0001重来。例如另一位同学可用<strong>{makeStableCode(year,schoolSerial===46?7:46)}</strong>，不同班也不能与当前号码重复。</p></div>}
   <div className="coding-open"><label htmlFor="coding-reflection">开放问题：如果两个班都有7号，怎样证明你的方案仍然不重号？如果转班、升年级怎么办？</label><textarea id="coding-reflection" rows={3} value={notes} onChange={e=>setNotes(e.target.value.slice(0,1200))} placeholder="先写规则，再找两个容易撞号的学生测试……"/></div>
   <p className="coding-caveat">这段想法仅用于当前页面讨论，不自动判定正确或计分；正式开放题请到本课练习中提交首答并由家长核对。</p>
  </section>}
  {topic==='challenge'&&<section className="coding-topic" aria-label="数字编码综合辨错">
   <h4>五道辨错题：先选择，再说明依据</h4>
   <p>这里可以反复试，不计分。请先选择，再说说理由；做完后去本课练习独立作答。</p>
   {quiz.map((item,i)=><div className="coding-quiz" key={i}><p><strong>{i+1}. {item.q}</strong></p><div className="coding-quiz-options">{item.options.map((o,j)=><button type="button" key={j} aria-pressed={attempt[i]===j} onClick={()=>setAttempt(a=>a.map((v,k)=>k===i?j:v))}>{o}</button>)}</div>{attempt[i]!==-1&&<p className={attempt[i]===item.correct?'coding-quiz-right':'coding-quiz-wrong'}>{attempt[i]===item.correct?'本题符合规则。':'这次不符合规则。'} {item.why}</p>}</div>)}
   <button type="button" className="coding-retry" onClick={()=>setAttempt(Array(quiz.length).fill(-1))}>清空本页练习，重新思考</button>
  </section>}
 </div>;
}
