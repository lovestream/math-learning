import type {MathScene,WidgetState} from '../src/studio/types';
import type {TextbookModel} from './textbook-models.mjs';
export function mixedSceneContext(scenes:MathScene[],sceneId?:string):{scene:MathScene;index:number;label:string;mission:string}|null;
export function coreSceneMission(model:TextbookModel,state?:WidgetState):string|undefined;
