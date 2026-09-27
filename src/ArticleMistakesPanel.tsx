import type {Data} from './types';
import {articleMistakes,type OpenLearning} from './learningMap';
export default function ArticleMistakesPanel({data,onOpen}:{data:Data;onOpen:OpenLearning}){
  const groups=articleMistakes(data);
  if(!groups.length)return null;
  return <div className="mistake-grid">{groups.map(g=><article key={g.id}><header><div className="mistake-ratio"><b>{g.wrong}</b><span>错 / {g.total} 次</span></div><span>{g.resolved?'已订正，之后再回顾':'再试一次'}</span></header><h3>{g.entry.title}</h3><div className="evidence"><b>这一组练什么</b><p>{g.objective}</p><b>上次遇到的题</b><p>{g.task.prompt}</p><p className="muted">这里记录了作答情况，具体错因还需要看你的解题过程。</p></div><footer><span>历史错答会保留</span><button onClick={()=>onOpen(g.entry,'learn',{set:g.task.set,id:g.task.taskId})}>重做这道题</button></footer></article>)}</div>;
}
