import {useState} from 'react';
import {ChevronRight,Search} from 'lucide-react';
import methods from '../content/pilot/methods.json';
import type {Data} from './types';
import {learningEntries,type OpenLearning} from './learningMap';
import './methods.css';

export default function MethodsView({data,onOpen}:{data:Data;onOpen:OpenLearning}){
  const [query,setQuery]=useState(''),[readyOnly,setReadyOnly]=useState(false);
  const entries=learningEntries(data);
  const visible=methods.filter(m=>(!readyOnly||m.guide)&&[m.title,m.observableAction,...m.applicationStructures].join(' ').includes(query.trim()));
  return <div className="page methods-page"><section className="page-intro"><div><p className="eyebrow">方法工具箱</p><h2>遇到新问题，也能找到熟悉的办法</h2><p>先看什么情况下能用，再试着解释为什么。这里收录28种方法，6张方法卡已有例子和反例，其余会随课程逐步补齐。</p></div></section><div className="course-search"><Search size={19}/><label>找一种方法<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="例如：整体、反推、配对"/></label><label className="methods-filter"><input type="checkbox" checked={readyOnly} onChange={e=>setReadyOnly(e.target.checked)}/>只看已有详细讲解</label></div>
    <div className="method-grid">{visible.map(m=>{const guide=m.guide;const related=guide?entries.filter(e=>guide.lessonIds.includes(e.id)):[];return <details className="method-card" key={m.thinkingSkillId}><summary><small>{m.thinkingSkillId} · {guide?'有例子和反例':'讲解待补充'}</small><h3>{m.title}</h3><p>{m.observableAction}</p><span>展开看看 <ChevronRight size={16}/></span></summary>{guide?<div className="method-body"><h4>{guide.question}</h4><dl><dt>什么时候能用？</dt><dd>{guide.condition}</dd><dt>为什么成立？</dt><dd>{guide.why}</dd><dt>用一个例子想清楚</dt><dd>{guide.example}</dd><dt>这样用就不对了</dt><dd>{guide.counterexample}</dd></dl><h4>到课程里亲手试试</h4>{related.map(e=><button key={e.id} onClick={()=>onOpen(e)}>{e.title}<ChevronRight size={17}/></button>)}<p className="muted">课末可以写下自己的例子，保存在这节课的记录中。这张卡不会自动判定你已经掌握。</p></div>:<div className="method-body"><p>以后会在这些问题里用到：{m.applicationStructures.join('、')}。</p><p>详细的成立条件、例子、反例和独立练习正在按课程计划补充。</p></div>}</details>})}</div>{!visible.length&&<p>没有找到，可以换个词，或取消筛选。</p>}
  </div>;
}
