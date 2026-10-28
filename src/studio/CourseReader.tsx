import {withdrawnLessons} from "../../shared/withdrawn-checks.mjs";
import {useState} from 'react';
import type {Progress} from '../types';
import type {PilotLesson,SetName} from './types';
import LessonArticle from './LessonArticle';
import Practice from './Practice';
import './studio.css';
import './teaching.css';

export type ReadingCourse={lesson:PilotLesson;initialSet?:SetName;initialTaskId?:string};
export default function CourseReader({lesson,initialSet,initialTaskId,progress,setProgress,notify,onBack}:ReadingCourse&{progress:Progress;setProgress:(p:Progress)=>void;notify:(m:string)=>void;onBack:()=>void}){
  const [requestedTask,setRequestedTask]=useState(initialTaskId),[practice,setPractice]=useState(Boolean(initialSet)),[withdrawn,setWithdrawn]=useState(new URLSearchParams(location.search).get('assessment')==='withdrawn-v1');
  const change=(value:boolean,blind=false)=>{const url=new URL(location.href);url.searchParams.set('lesson',lesson.lessonId);url.searchParams.delete('task');setRequestedTask(undefined);if(value){url.searchParams.set('practice','1');if(blind){url.searchParams.set('assessment','withdrawn-v1');url.searchParams.set('set','core')}else url.searchParams.delete('assessment')}else{url.searchParams.delete('assessment');url.searchParams.delete('practice');url.searchParams.delete('set');url.searchParams.delete('task')}history.replaceState(null,'',url);setWithdrawn(blind);setPractice(value)};
  return practice?<Practice lesson={lesson} assessment={withdrawn?"withdrawn-v1":undefined} initialSet={withdrawn?'core':initialSet??(lesson.childClassroom?'core':undefined)} initialTaskId={requestedTask} progress={progress} setProgress={setProgress} notify={notify} onBack={()=>change(false)}/>:<LessonArticle lesson={lesson} progress={progress} setProgress={setProgress} notify={notify} onBack={onBack} onPractice={blind=>change(true,blind??withdrawnLessons.includes(lesson.lessonId))}/>;
}
