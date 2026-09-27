import {useState} from 'react';
import {ArrowLeft,BookOpenCheck,ChevronRight} from 'lucide-react';
import type {Lesson,Progress} from '../types';
import PetPortrait from '../PetPortrait';
import MathLab from '../MathLab';
import {Checkpoint} from './LessonArticle';
import type {ArticleBlock} from './types';

export const cleanPrompt=(text:string)=>text.replace(/^【[^】]*】\s*/,'');
export function articleQuestions(lesson:Lesson){
  return {example:lesson.questions.find(q=>!q.choices),checkpoint:lesson.questions.find(q=>q.choices&&q.level==='core')??lesson.questions.find(q=>q.choices)};
}
function CountingStones(){
  const [counted,setCounted]=useState<number[]>([]),[spread,setSpread]=useState(false);
  return <div className="hands-on counting-stones"><div className="experiment-directions"><b>每点一颗星石，就数一个数</b><p>点过的星石会留下数数的顺序。每颗只数一次，看看最后数到几。</p></div><div className={'stone-tray '+(spread?'spread':'')}>{Array.from({length:7},(_,i)=><button key={i} disabled={counted.includes(i)} aria-label={'数第 '+(i+1)+' 颗星石'} onClick={()=>setCounted(v=>[...v,i])}><span aria-hidden="true">★</span><b>{counted.includes(i)?counted.indexOf(i)+1:'还没数'}</b></button>)}</div><p className="discovery-line" aria-live="polite">{counted.length===7?'最后数到 7，说明这里一共有 7 颗星石。这个 7 说的是整堆星石的数量。':'你已经数了 '+counted.length+' 颗，继续点还没有数过的星石。'}</p><div className="experiment-actions"><button onClick={()=>setSpread(v=>!v)}>{spread?'把星石摆近一点':'把星石摆远一点'}</button><button onClick={()=>setCounted([])}>重新数一次</button></div><p>只改变星石之间的距离，没有添进来，也没有拿走。星石的总数会变吗？</p></div>;
}
type Props={lesson:Lesson;progress:Progress;onBack:()=>void;onPractice:()=>void;reflection:React.ReactNode;onExplain:(questionId:string)=>void};
export default function LegacyLessonArticle({lesson,progress,onBack,onPractice,reflection,onExplain}:Props){
  const [choice,setChoice]=useState<Record<string,unknown>>({});
  const {example,checkpoint}=articleQuestions(lesson),counting=lesson.id==='counting-quantities';
  const questionBlock:ArticleBlock|undefined=checkpoint?{blockId:'check',type:'checkpoint',title:'轮到你来试',prompt:cleanPrompt(checkpoint.prompt),revisit:'try',options:checkpoint.choices!.map((text,i)=>({text,correct:i+1===checkpoint.answer,reason:i+1===checkpoint.answer?checkpoint.explanation:'再想一想：'+(checkpoint.hints[0]??lesson.takeaway)}))}:undefined;
  return <div className="studio-lesson child-lesson legacy-article">
    <div className="studio-breadcrumb"><button onClick={onBack}><ArrowLeft size={17}/>返回学习地图</button><span>{lesson.title}</span><button onClick={onPractice}>直接做练习 <ChevronRight size={16}/></button></div>
    <article className="lesson-article">
      <header className="article-hero"><p className="eyebrow">{lesson.title} · 一起弄明白</p><h1>{lesson.title}</h1><p className="article-question">{lesson.whyQuestion??lesson.subtitle}</p></header>
      <section className="story-opening companion-story" id="lesson-start"><aside className="story-companion" aria-label="陪你学习的伙伴"><PetPortrait pet={progress.pets.active} size="small"/></aside><div className="story-words"><h2>把问题放进一个故事</h2>{counting?<><p>泡泡要给 7 只小羊每只分一颗星石。篮子里的星石够不够？只说“有一些”，可没法知道。</p><p>它拿起一颗星石，就说“1”；再拿起一颗，就说“2”……一直数到篮子里的星石都数完。最后说到的数，告诉它这一篮子一共有多少颗。</p></>:<p>{lesson.story.replace(/^为什么要研究它？/,'').trim()}</p>}</div></section>
      <nav className="lesson-jumps" aria-label="跳到本课内容"><a href="#lesson-try">动手试试</a><a href="#lesson-meaning">认识数学名字</a><a href="#lesson-example">一起做一道</a><a href="#lesson-check">轮到你来试</a><a href="#lesson-retell">讲给家人听</a></nav>
      <section className="article-block" id="lesson-why"><div className="block-content"><h2>为什么需要这个办法？</h2><p className="block-text">{counting?'我们要分东西、买东西，得先弄清楚有多少。给每件东西配一个数，一个也不漏，一个也不重复，就能把“有一些”说成准确的数量。':lesson.humanNeed??lesson.origin??lesson.subtitle}</p><p className="discovery-line">{lesson.essence??lesson.takeaway}</p></div></section>
      <section className="article-block" id="lesson-try"><div className="block-content"><h2>动手试试，看见数量怎样变化</h2>{counting?<CountingStones/>:<><p className="block-text">{lesson.discovery.replace(/^数学思想：/,'')}</p><MathLab lesson={lesson}/></>}</div></section>
      <section className="article-block" id="lesson-meaning"><div className="block-content"><h2>给刚才的发现起一个数学名字</h2><p className="block-text">{lesson.concept}</p><p className="block-text">{counting?'数第 7 颗时说出的“7”，既告诉我们数到了哪里，也告诉我们前面所有数过的星石加在一起共有 7 颗。换个顺序数，只要不漏、不重复，仍然数到 7。':lesson.takeaway}</p></div></section>
      <section className="article-block block-example" id="lesson-example"><div className="block-content"><h2>一起做一道，说清楚为什么</h2>{example&&<div className="example-card"><h3>{cleanPrompt(example.prompt)}</h3><p><strong>先想一想</strong><span>{example.hints[0]??lesson.takeaway}</span></p><details className="worked-answer" onToggle={e=>{if(e.currentTarget.open)onExplain(example.id)}}><summary>展开解答，看看每一步</summary>{example.hints.slice(1).map(h=><p key={h}>{h}</p>)}<p><strong>{example.answer}{example.unit}</strong><span>{example.explanation}</span></p></details></div>}{!example&&lesson.steps.map((s,i)=><p className="block-text" key={s}>{i+1}. {s}</p>)}</div></section>
      {questionBlock&&checkpoint&&<section className="article-block block-checkpoint" id="lesson-check"><div className="block-content"><h2>轮到你来试</h2><Checkpoint block={questionBlock} value={choice} onChange={v=>{setChoice(v);onExplain(checkpoint.id)}}/></div></section>}
      <section className="article-block" id="lesson-further"><div className="block-content"><h2>这个办法，还能帮我们想什么？</h2><p className="block-text">{lesson.mathIdea??lesson.takeaway}</p><div className="idea-trail">{(lesson.extensionChain??lesson.thinkingSkills).map((item,i)=><span key={item}>{i>0&&<ChevronRight size={15}/>}<b>{item}</b></span>)}</div></div></section>
      <section className="article-block block-practice"><div className="block-content"><h2>换成自己的办法，再练一练</h2><p className="block-text">这节课共有 {lesson.questions.length} 道练习。可以从简单的开始，也可以选“换个故事”或“再难一点”。</p><button className="studio-primary" onClick={onPractice}><BookOpenCheck size={18}/>去做这节课的练习 <ChevronRight size={16}/></button></div></section>
      {reflection}
    </article>
  </div>;
}
