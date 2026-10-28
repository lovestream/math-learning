import type {ConceptScene,ConceptTaskDiagram} from '../types';
import './concept.css';

// Quantitative graphics belong to registered model components. This fallback
// preserves authored conditions without inventing quantities or a simulation.
export function ConceptVisual({data}:{data:{labels?:string[]};step?:number;compact?:boolean}){
  return <div className="concept-reading-card task-relationship-card" role="group" aria-label="题目关系整理卡"><b>先整理问题中的关系</b><p>{data.labels?.[0]??'请回到题目，读清对象、关系和要找的量。'}</p><div className="relationship-prompts"><span>有哪些对象或数量？</span><span>它们怎样变化或联系？</span><span>最后要知道什么？</span></div><small>可以圈出关键词、画草图或摆实物；这里不替你计算，也不把示意卡当成实际模型。</small></div>;
}

export function ConceptPreview({scene}:{scene:ConceptScene}){
  return <figure className="concept-preview"><div className="concept-reading-preview"><b>{scene.modelSpec?'先预测，再亲手选择、切分或倒推':'真实问题中的对象 → 数量或位置关系 → 需要找的量'}</b><p>{scene.initialState}</p></div><figcaption>{scene.modelSpec?'先读场景，在实验中自己作出选择。':'先读条件，再用关系卡、草图或实物分析。'}</figcaption></figure>;
}

export default function ConceptTaskDiagram({diagram}:{diagram:ConceptTaskDiagram}){
  return <figure className="concept-question"><ConceptVisual data={diagram}/><figcaption>{diagram.caption??'先从题目条件找到对象、单位和关系，再决定怎样计算。'}</figcaption></figure>;
}
