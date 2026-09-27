import {useState} from 'react';
import type {Progress} from '../types';
import type {PilotLesson,SetName} from './types';
import LessonArticle from './LessonArticle';
import Practice from './Practice';
import './studio.css';
import './teaching.css';

export type ReadingCourse={lesson:PilotLesson;initialSet?:SetName;initialTaskId?:string};
export default function CourseReader({lesson,initialSet,initialTaskId,progress,setProgress,notify,onBack}:ReadingCourse&{progress:Progress;setProgress:(p:Progress)=>void;notify:(m:string)=>void;onBack:()=>void}){
  const [practice,setPractice]=useState(Boolean(initialSet));
  const change=(value:boolean)=>{const url=new URL(location.href);url.searchParams.set('lesson',lesson.lessonId);if(value)url.searchParams.set('practice','1');else{url.searchParams.delete('practice');url.searchParams.delete('set');url.searchParams.delete('task')}history.replaceState(null,'',url);setPractice(value)};
  return practice?<Practice lesson={lesson} initialSet={initialSet} initialTaskId={initialTaskId} progress={progress} setProgress={setProgress} notify={notify} onBack={()=>change(false)}/>:<LessonArticle lesson={lesson} progress={progress} setProgress={setProgress} notify={notify} onBack={onBack} onPractice={()=>change(true)}/>;
}
