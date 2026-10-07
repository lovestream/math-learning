import type {ConceptScene,WidgetState} from '../types';
import './concept.css';
import OperationExtensionLab from './OperationExtensionLab';
import SpatialWorkbench from './SpatialWorkbench';
import MassWorkbench from './MassWorkbench';

export default function ConceptWorkbench({value,onChange,scenes=[]}:{value:WidgetState;onChange:(s:WidgetState)=>void;scenes?:ConceptScene[]}){
  const state=value.conceptVersion===1?value:{};
  const scene=scenes.find(s=>s.sceneId===state.sceneId)??scenes[0];
  if(!scene)return <p>没有找到本课的实验场景，请返回课程地图后重新打开。</p>;
  if(scene.handsOnSpec)return scene.handsOnSpec.type==='spatial'?<SpatialWorkbench model={scene.handsOnSpec} sceneId={scene.sceneId} value={value} onChange={onChange}/>:<MassWorkbench model={scene.handsOnSpec} sceneId={scene.sceneId} value={value} onChange={onChange}/>;
  if(scene.modelSpec)return <OperationExtensionLab model={scene.modelSpec} value={value} onChange={onChange}/>;
  return <div className="concept-reading-card"><h3>先用关系卡想清楚</h3><p>{scene.initialState}</p><p><b>要弄清的问题：</b>{scene.question}</p><label className="lab-prediction">我认为关键关系是<textarea maxLength={240} value={typeof value.explanation==='string'?value.explanation:''} onChange={e=>onChange({...value,explanation:e.target.value,compared:false})}/></label><button className="studio-primary" disabled={typeof value.explanation!=='string'||value.explanation.trim().length<2} onClick={()=>onChange({...value,compared:true})}>写好想法，核对关系</button>{value.compared&&<div className="model-result"><p>{scene.expectedExplanation}</p><p>{scene.observableChange}</p></div>}<p className="muted">这节课目前使用文字关系卡，可以画草图或摆实物核对。专用操作模型仍在逐课审核；这次记录表示读课与探索。</p></div>;
}
