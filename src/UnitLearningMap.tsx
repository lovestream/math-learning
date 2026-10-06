import {ChevronRight} from 'lucide-react';
import type {Data} from './types';
import {learningReviews,type LearningEntry,type OpenLearning} from './learningMap';
import type {PilotSession,ReadingRecord} from './studio/types';
const labels={foundation:'B 基础',enhancement:'E 提升',olympiad:'O 思想'};
const statuses={new:'还没开始',explored:'已探索',practiced:'已练习',independent:'独立迁移与复习达标'};
export default function UnitLearningMap({data,entries,onOpen}:{data:Data;entries:LearningEntry[];onOpen:OpenLearning}){
  const groups=new Map<string,LearningEntry[]>();
  for(const entry of entries){const id=entry.source==='article'?entry.lesson.textbookUnit?.id??'bridges':'bridges';groups.set(id,[...(groups.get(id)??[]),entry]);}
  const latest=(Object.values(data.progress.studio?.sessions??{}) as PilotSession[]).sort((a,b)=>Date.parse(b.savedAt)-Date.parse(a.savedAt))[0];
  const recent=[...Object.entries((data.progress.studio?.reading??{}) as Record<string,ReadingRecord>).map(([id,r])=>({id,savedAt:r.savedAt})),...(latest?[{id:latest.lessonId,savedAt:latest.savedAt}]:[])].filter(item=>entries.some(entry=>entry.id===item.id)).sort((a,b)=>Date.parse(b.savedAt)-Date.parse(a.savedAt))[0];
  const current=entries.find(e=>e.id===recent?.id),currentUnit=current?.source==='article'?current.lesson.textbookUnit?.id??'bridges':'G3-U02';
  const due=learningReviews(data).filter(row=>Date.parse(row.review.dueAt)<=Date.now());
  return <div className="textbook-unit-map">{[...groups].map(([id,rows])=>{
    const first=rows.find(e=>e.source==='article'),unit=first?.source==='article'?first.lesson.textbookUnit:undefined,unitDue=due.filter(r=>rows.some(e=>e.id===r.entry.id));
    return <details className="textbook-unit" key={id} open={id===currentUnit||entries.length<15}><summary><div><small>{unit?(unit.term==='upper'?'三年级上册':'三年级下册'):'回补与数学桥梁'}{unit?` · 参考教材印刷页 ${unit.printedPages}`:''}</small><h3>{unit?.title??'数的现实起点与数学思想'}</h3><p>{rows.filter(e=>e.track==='foundation').length}节基础 · {rows.filter(e=>e.track==='enhancement').length}节提升 · {rows.filter(e=>e.track==='olympiad').length}节思想{unitDue.length?` · ${unitDue.length}节到期复习`:''}</p></div><ChevronRight/></summary><div className="unit-learning-content"><p className="unit-path-note">先沿 B 基础理解教材问题，再按需要选择 E 提升和 O 思想。每节都可以直接进入；练完之后，R 复习会回到新的情境。</p>{(['foundation','enhancement','olympiad'] as const).map(track=>{const tracks=rows.filter(e=>e.track===track);return tracks.length>0&&<section className={`unit-track track-${track}`} key={track}><h4>{labels[track]}</h4>{tracks.map(entry=><article key={entry.id}><button onClick={()=>onOpen(entry)}><div><small>{entry.id} · 题库{entry.questionCount}题 · 每次建议3–5题</small><b>{entry.title}</b><span>{statuses[entry.evidence?.status??'new']}</span></div><ChevronRight/></button>{entry.source==='article'&&<p className="unit-prerequisites">先会：{entry.lesson.recommendedPrerequisites.join('、')||'从本课故事开始即可'}{entry.lesson.editorialStatus==='review-required'?' · 内容待逐题教学审核':''}</p>}</article>)}</section>})}{unitDue.length>0&&<section className="unit-track"><h4>R 到期复习</h4>{unitDue.slice(0,3).map(r=><button key={r.entry.id} onClick={()=>onOpen(r.entry,'review')}>{r.entry.title}<ChevronRight/></button>)}</section>}</div></details>;
  })}</div>;
}
