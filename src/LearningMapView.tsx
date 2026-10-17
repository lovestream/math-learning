import {useState} from 'react';
import {Check,ChevronRight,Search} from 'lucide-react';
import type {Data} from './types';
import {learningEntries,type OpenLearning} from './learningMap';
import './methods.css';
import UnitLearningMap from './UnitLearningMap';

export const WORLD_META:Record<string,{title:string;tag:string;icon:string;color:string}>={numbers:{title:'数与运算港',tag:'为什么需要数，怎样合并、分开与分组',icon:'123',color:'#1B8E86'},relations:{title:'关系天平岛',tag:'从数量关系走向未知数、替换与消元',icon:'＝',color:'#EC7658'},geometry:{title:'几何工坊',tag:'剪、拼、围、铺',icon:'△',color:'#3769B1'},patterns:{title:'规律星轨',tag:'寻找不变与循环',icon:'✦',color:'#8A65B7'},logic:{title:'逻辑侦探社',tag:'有顺序地试与推',icon:'?',color:'#D98624'},fractions:{title:'分数湖',tag:'把整体公平地分开',icon:'½',color:'#397DA4'}};
const TRACK_NAME={foundation:'课本主线',enhancement:'本章提升',olympiad:'思维挑战'} as const;
export default function LearningMapView({data,onOpen,onGrade,onThinking}:{data:Data;onOpen:OpenLearning;onGrade:(grade:number)=>void;onThinking:(id:string)=>void}){
  const [filter,setFilter]=useState<'all'|'foundation'|'thinking'>('all');
  const [query,setQuery]=useState('');
  const grade=data.progress.profile.selectedGrade??data.progress.profile.grade??3;
  const entries=learningEntries(data,grade).filter(e=>(filter==='all'||e.kind===filter)&&[e.title,e.subtitle,...e.skills,e.source==='legacy'?e.lesson.concept:e.lesson.question].join(' ').includes(query.trim()));
  return <div className="page"><section className="page-intro"><div><p className="eyebrow">知识地图 · 可自由选年级</p><h2>一个基础知识，向外长出更深的数学思想</h2><p>选一个年级，再找想弄明白的问题。可以从数数开始，也可以直接跳到感兴趣的课；学过的内容还能换个故事再练。</p></div><div className="grade-switcher" aria-label="选择年级">{[1,2,3,4,5,6].map(g=><button key={g} aria-pressed={grade===g} className={grade===g?'active':''} onClick={()=>onGrade(g)}>{g}年级</button>)}</div><div className="segmented"><button onClick={()=>setFilter('all')} className={filter==='all'?'active':''}>全部</button><button onClick={()=>setFilter('foundation')} className={filter==='foundation'?'active':''}>基础主干</button><button onClick={()=>setFilter('thinking')} className={filter==='thinking'?'active':''}>思维延展</button></div></section>
    <div className="course-search"><Search size={19}/><label>搜索当前年级的课程<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="输入想学的知识或方法，例如：分数、等量、逆向"/></label><span>{entries.length} 节</span></div>
    {grade===3?<UnitLearningMap data={data} entries={entries} onOpen={onOpen} onThinking={onThinking}/>:<div className="map-worlds">{Object.entries(WORLD_META).map(([world,meta])=>{const lessons=entries.filter(e=>e.world===world);if(!lessons.length)return null;return <section className="world-section" key={world} style={{'--world':meta.color} as React.CSSProperties}><header><span>{meta.icon}</span><div><h3>{meta.title}</h3><p>{meta.tag}</p></div></header><div className="lesson-path">{lessons.map((entry,index)=><div className={`lesson-stop track-${entry.track}`} key={entry.id}><button className={entry.completed?'complete':''} onClick={()=>onOpen(entry)}><span className="lesson-number">{entry.completed?<Check/>:index+1}</span><div><em>{TRACK_NAME[entry.track]} · {entry.minutes} 分钟 · {entry.questionCount} 道练习{entry.completed?(entry.source==='article'?' · 核心练习已完成':' · 已完成'):''}</em><b>{entry.title}</b><small>{entry.subtitle}</small>{entry.track!=='foundation'&&<span className="lesson-branch">↳ 从本章基础继续追问规律和结构</span>}<div className="skill-chips">{entry.skills.slice(0,2).map(s=><i key={s}>{s}</i>)}{!entry.recommended&&<i>可跳过前置</i>}</div></div><ChevronRight/></button>{index<lessons.length-1&&<i className="path-dash"/>}</div>)}</div></section>})}</div>}
    {!entries.length&&<div className="empty"><h3>这个筛选下暂时没有课程</h3><p>可以选择“全部”或切换年级。课程会逐批补充，已有进度继续保留。</p></div>}
  </div>;
}
