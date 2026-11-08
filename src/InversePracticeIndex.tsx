import './InversePracticeIndex.css';
import type {SetName} from './studio/types';
import {inverseEntries,inverseClassroomId} from '../shared/inverse-index.mjs';
import {learningEntries,type OpenLearning} from './learningMap';
import type {Data} from './types';
export default function InversePracticeIndex({data,onOpen}:{data:Data;onOpen:OpenLearning}){
 const rows=inverseEntries(data.articleCourses??[]),entries=learningEntries(data),course=entries.find(e=>e.id===inverseClassroomId);
 return <details className="inverse-practice-index"><summary>反过来想：从结果找条件 · {rows.length}道已有练习</summary><p>先把要求的条件遮成问号，求出来以后，再代回原来的关系核对。这里打开原题组，不增加题目、积分或掌握记录。</p>{course&&<button className="studio-ghost" onClick={()=>onOpen(course)}>先看逆推课堂：从算错的结果倒着找</button>}<ul>{rows.map(row=>{const entry=entries.find(e=>e.id===row.lessonId);return <li key={row.taskId}><div><b>{row.title} · 求{row.unknown}</b><small>思考方向：{row.direction} · {row.taskId}</small><p>先留首答；具体提示与参考过程在原题里按需查看。</p></div><button disabled={!entry} onClick={()=>entry&&onOpen(entry,'learn',{set:row.set as SetName,id:row.taskId})}>打开原题</button></li>})}</ul></details>;
}
