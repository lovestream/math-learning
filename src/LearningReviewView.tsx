import {CalendarClock,Play,ShieldCheck} from 'lucide-react';
import type {Data} from './types';
import {learningReviews,type OpenLearning} from './learningMap';
import {WORLD_META} from './LearningMapView';
const isDue=(date:string)=>Date.parse(date)<=Date.now();
const dateLabel=(date:string)=>new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric'}).format(new Date(date));
export default function LearningReviewView({data,onOpen}:{data:Data;onOpen:OpenLearning}){
  const reviews=learningReviews(data),due=reviews.filter(r=>isDue(r.review.dueAt));
  const open=(row:typeof reviews[number])=>onOpen(row.entry,isDue(row.review.dueAt)||row.entry.source==='article'?'review':'learn');
  return <div className="page"><section className="page-intro"><div><p className="eyebrow">间隔复习</p><h2>{due.length?`今天有 ${due.length} 个知识点等待唤醒`:'今天的记忆花园很清爽'}</h2><p>换个故事再试一次，看看隔了一段时间还能不能自己想起来。未到期也可以提前练习；积压多时先选2—3节，不必一次清空。</p></div>{due[0]&&<button className="primary-button" onClick={()=>open(due[0])}><Play size={18}/>开始复习</button>}</section><div className="review-list">{reviews.map(row=><article key={row.entry.id} className={isDue(row.review.dueAt)?'is-due':''}><div className="review-date"><CalendarClock/><b>{isDue(row.review.dueAt)?'现在到期':dateLabel(row.review.dueAt)}</b></div><div><span>{WORLD_META[row.entry.world]?.title}</span><h3>{row.entry.title}</h3><p>{row.review.successDates?.length?`已在 ${row.review.successDates.length} 个不同日期独立回想`:'还没有独立间隔回想记录'} · {row.entry.questionCount}道课内练习可选择</p>{row.review.firstLearnedDay&&<p>首次核心学习：{row.review.firstLearnedDay} · 按第1、3、7、21天安排</p>}</div><button onClick={()=>open(row)}>{isDue(row.review.dueAt)?'去唤醒':'先练一练'}</button></article>)}{!reviews.length&&<div className="empty"><ShieldCheck/><h3>需要回想的内容会记在这里</h3><p>完成核心练习或发现错题后，会安排下一次回顾。</p></div>}</div></div>;
}
