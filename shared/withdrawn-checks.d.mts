import type {PilotLesson,Task} from '../src/studio/types';
export const withdrawnLessons:string[];
export function withdrawnTaskIds(id:string):string[];
export function withdrawnTasks(lesson:PilotLesson):Task[];
