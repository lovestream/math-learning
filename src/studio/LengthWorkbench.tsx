import type {LengthScene,WidgetState} from './types';
import ChainExperiment from './measurement/ChainExperiment';
import {BoardExperiment,RulerExperiment} from './measurement/MeasuringExperiments';
import {IntervalExperiment,RouteExperiment} from './measurement/WalkingExperiments';
import './measurement/measurement.css';

export default function LengthWorkbench({value,onChange,scenes=[]}:{value:WidgetState;onChange:(s:WidgetState)=>void;scenes?:LengthScene[]}){
  const state=value.labVersion===2?value:{};
  const scene=scenes.find(s=>s.sceneId===state.sceneId)??scenes[0];
  if(!scene)return <p>没有找到本课的测量场景，请返回地图重新打开。</p>;
  const update=(patch:WidgetState)=>onChange({...state,...patch,sceneId:scene.sceneId,labVersion:2,stateKind:'legacy'});
  const props={scene,value:state,update};
  return <div className={`measurement-lab mode-${scene.mode}`}>
    <header className="measurement-lab-heading"><div><p>测量实验室</p><h3>{scene.title}</h3></div><span>动手发现 · 自由尝试</span></header>
    <p className="measurement-mission">{scene.prompt}</p>
    {scenes.length>1&&<div className="lab-controls">{scenes.map(s=><button key={s.sceneId} aria-pressed={s.sceneId===scene.sceneId} onClick={()=>onChange({sceneId:s.sceneId,labVersion:2})}>{s.title}</button>)}</div>}
    {scene.mode==='chain'&&<ChainExperiment {...props}/>}
    {scene.mode==='boards'&&<BoardExperiment {...props}/>}
    {scene.mode==='ruler'&&<RulerExperiment {...props}/>}
    {scene.mode==='interval'&&<IntervalExperiment {...props}/>}
    {scene.mode==='route'&&<RouteExperiment {...props}/>}
  </div>;
}
