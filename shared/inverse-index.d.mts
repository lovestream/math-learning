import type {PilotLesson,SetName} from '../src/studio/types';
export type InverseIndexEntry={taskId:string;lessonId:string;direction:string;unknown:string;forwardCheck:string};
export const inverseTaskIndex:InverseIndexEntry[];
export const inverseClassroomId:string;
export function inverseEntries(lessons:PilotLesson[]):(InverseIndexEntry&{title:string;set:SetName})[];
