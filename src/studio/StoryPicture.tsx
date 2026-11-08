import type {PilotLesson,MeasurementTaskDiagram} from './types';
import IntroVisual from './IntroVisual';
import MathSceneVisual from './MathSceneVisual';
import MeasurementPicture from './measurement/TaskDiagram';
import {introVisuals} from '../../content/pilot/intro-visuals.mjs';

// Shared scenes carry the exact known quantities from the later experiment.
// Do not reuse worked examples: their values and answer state may differ.
export default function StoryPicture({lesson}:{lesson:PilotLesson}){
 const spec=lesson.introVisual??introVisuals[lesson.lessonId];
 if(spec)return <IntroVisual spec={spec}/>;
 if(lesson.mathScenes?.[0])return <figure className="intro-source-visual" data-intro-visual="math-scene" data-intro-stage="story"><MathSceneVisual scene={lesson.mathScenes[0]} step={0}/><figcaption>图中只摆出题目给出的物品；计算过程与结果留给你来完成。</figcaption></figure>;
 const s=lesson.lengthScenes?.[0];
 if(s){const diagram:MeasurementTaskDiagram={type:'measurement',mode:s.mode,pieceLengthMm:s.pieceLengthsMm?.[0],pieceLengthsMm:s.pieceLengthsMm,overlapsMm:s.overlapsMm,thicknessMm:s.thicknessMm,count:s.count,startMm:s.startMm,endMm:s.endMm,lengthMm:s.endMm,spacingMm:s.spacingMm,closed:s.closed,caption:s.prompt};
  if(s.mode==='route'&&s.spacingMm&&s.endMm)diagram.sectionLengthsMm=Array.from({length:s.endMm/s.spacingMm},()=>s.spacingMm!);
  return <div className="intro-source-visual" data-intro-visual={`length-${s.mode}`} data-intro-stage="story"><MeasurementPicture diagram={diagram} intro/></div>;
 }
 return null;
}
