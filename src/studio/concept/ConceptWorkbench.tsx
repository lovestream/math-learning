import {Check,Lightbulb,MousePointer2,RotateCcw,Sparkles} from 'lucide-react';
import type {ConceptScene,WidgetState} from '../types';
import {ConceptVisual} from './ConceptVisual';
import './concept.css';

export default function ConceptWorkbench({value,onChange,scenes=[]}:{value:WidgetState;onChange:(s:WidgetState)=>void;scenes?:ConceptScene[]}){
  const state=value.conceptVersion===1?value:{};
  const scene=scenes.find(s=>s.sceneId===state.sceneId)??scenes[0];
  if(!scene)return <p>没有找到本课的实验场景，请返回课程地图后重新打开。</p>;
  const step=Math.max(0,Math.min(scene.steps.length,Number(state.step)||0)),prediction=typeof state.prediction==='string'?state.prediction:'',checked=Boolean(state.checked),finished=step>=scene.steps.length;
  const update=(patch:WidgetState)=>onChange({...state,...patch,sceneId:scene.sceneId,conceptVersion:1});
  const perform=(index:number)=>{if(index===step&&prediction.trim())update({step:Math.min(scene.steps.length,step+1),checked:false})};
  const reset=()=>onChange({sceneId:scene.sceneId,conceptVersion:1,step:0,prediction:'',checked:false});
  return <div className={`concept-lab family-${scene.family}`}>
    <header className="concept-lab-heading"><div><p>数学模型实验室</p><h3>{scene.title}</h3></div><span>先预测 · 再操作 · 讲出理由</span></header>
    <div className="concept-mission"><Lightbulb size={19}/><p><b>这次要弄清：</b>{scene.prompt}</p></div>
    <div className="concept-layout">
      <section className="concept-stage-panel"><div className="concept-stage-top"><span>实验台</span><small>{step}/{scene.steps.length} 步</small></div><div className="concept-initial"><small>开始时</small><p>{scene.initialState}</p></div><div className="concept-canvas"><ConceptVisual data={scene} step={step}/></div><p className="concept-card-instruction"><MousePointer2 size={15}/>{prediction.trim()?'按顺序点击当前亮起的操作卡，观察图里哪里发生了变化。':'先在右边写一句预测，第一张操作卡就会亮起。'}</p><ol className="concept-step-list">{scene.steps.map((item,i)=><li key={i} className={i<step?'done':i===step?'current':''}><button type="button" disabled={i!==step||!prediction.trim()} onClick={()=>perform(i)} aria-label={`${i<step?'已完成':i===step?'执行':'尚未解锁'}第${i+1}步：${item.label}`}><i>{i<step?<Check size={14}/>:i+1}</i><span><b>{item.label}</b>{i<step&&<small>{item.explanation}</small>}{i===step&&<small>{prediction.trim()?'点击执行这一步':'写完预测后可操作'}</small>}</span></button></li>)}</ol><div className="concept-actions"><button onClick={reset}><RotateCcw size={16}/>重新做这次实验</button>{finished&&<strong><Check size={16}/>三步操作完成，可以对照结果了</strong>}</div></section>
      <aside className={`concept-notebook ${checked?'checked':''}`}><div className="concept-notebook-title"><span>我的发现单</span><small>写下自己的想法</small></div><label>操作前，我猜会发生什么<textarea maxLength={240} value={prediction} placeholder="例如：我觉得总数不会变，因为……" onChange={e=>update({prediction:e.target.value,checked:false})}/></label><div className="concept-progress"><b>现实中的操作目标</b><p>{scene.learnerAction}</p><small>网页上请依次点击左侧三张操作卡，图会立刻把这件事演示出来。</small></div><button className="studio-primary" disabled={!finished||!prediction.trim()} onClick={()=>update({checked:true})}>和实验结果对照</button>{!finished&&<p className="concept-note">完成左边全部步骤后，才能打开结果。</p>}{checked&&<div className="concept-discovery" role="status"><Sparkles size={23}/><div><b>实验中真正发生了什么</b><p>{scene.observableChange}</p><strong>为什么？</strong><p>{scene.expectedExplanation}</p></div></div>}<p className="concept-note">预测不同也没关系。重要的是能用图里的对象、单位或关系解释原因。</p></aside>
    </div>
  </div>;
}
