import StaticConceptFigure from './StaticConceptFigure';
import type {ConceptScene,WidgetState} from '../types';
import './concept.css';
import OperationExtensionLab from './OperationExtensionLab';
import SpatialWorkbench from './SpatialWorkbench';
import MassWorkbench from './MassWorkbench';
import TextbookWorkbench from '../textbook/TextbookWorkbench';

export default function ConceptWorkbench({value,onChange,scenes=[]}:{value:WidgetState;onChange:(s:WidgetState)=>void;scenes?:ConceptScene[]}){
  const state=value.conceptVersion===1?value:{};
  const scene=scenes.find(s=>s.sceneId===state.sceneId)??scenes[0];
  if(!scene)return <p>没有找到本课的实验场景，请返回课程地图后重新打开。</p>;
  if(scene.textbookSpec)return <TextbookWorkbench model={scene.textbookSpec} sceneId={scene.sceneId} value={value} onChange={onChange}/>;
  if(scene.handsOnSpec)return scene.handsOnSpec.type==='spatial'?<SpatialWorkbench model={scene.handsOnSpec} sceneId={scene.sceneId} value={value} onChange={onChange}/>:<MassWorkbench model={scene.handsOnSpec} sceneId={scene.sceneId} value={value} onChange={onChange}/>;
  if(scene.modelSpec)return <OperationExtensionLab model={scene.modelSpec} value={value} onChange={onChange}/>;
  return <div className="concept-reading-card"><StaticConceptFigure id={scene.sceneId.replace(/-MODEL1$/,'')}/><h3>先用关系卡想清楚</h3><p>{scene.initialState}</p><p><b>要弄清的问题：</b>{scene.question}</p><p>指着图口头说说关键关系，也可以在纸上画。这里不要求填写说明。</p><details onToggle={e=>{if(e.currentTarget.open&&!value.compared)onChange({...value,compared:true})}}><summary>需要时展开：核对图中的关系</summary><div className="model-result"><p>{scene.expectedExplanation}</p><p>{scene.observableChange}</p></div></details><p className="muted">这节保留静态关系图，适合指认、画草图或摆实物核对。这次只记录读课与探索，不自动判为掌握。</p></div>;
}
