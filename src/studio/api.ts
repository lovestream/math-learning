import type {Progress} from '../types';
import type {PilotLesson, PilotSession, SelfCheckEvidence, SetName, StudioData, WidgetState} from './types';

type Envelope<T>={result:T;progress:Progress};
async function request<T>(url:string, body?:Record<string,unknown>):Promise<T>{
  const response=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
  const payload=await response.json().catch(()=>({error:'本地服务没有返回可读内容。'}));
  if(!response.ok)throw Object.assign(new Error(payload.error??'操作没有完成。'),{code:payload.code,status:response.status});
  return payload;
}
export const studioApi={
  data:()=>request<StudioData>('/api/studio'),
  reading:(lessonId:string,revision:number,blockId:string,widgets:Record<string,WidgetState>)=>request<Envelope<{revision:number}>>('/api/studio/reading',{lessonId,revision,blockId,widgets}),
  session:(lessonId:string,setName:SetName,assessment?:string)=>request<Envelope<PilotSession>>('/api/studio/sessions',{lessonId,setName,...(assessment?{assessment}:{})}),
  draft:(sessionId:string,revision:number,index:number,answers:Record<string,Record<string,string>>)=>request<Envelope<PilotSession>>('/api/studio/draft',{sessionId,revision,index,answers}),
  help:(sessionId:string,revision:number,taskId:string,kind:'hint'|'solution'|'article',eventId:string)=>request<Envelope<{text:string;revision:number}>>('/api/studio/help',{sessionId,revision,taskId,kind,eventId}),
  selfCheck:(sessionId:string,revision:number,taskId:string,answer:Record<string,string>,modelStateVersion:string,eventId:string)=>request<Envelope<{status:'selfCheck'|'invalidInput';message:string;revision:number}>>('/api/studio/self-check',{sessionId,revision,taskId,answer,modelStateVersion,eventId}),
  selfCheckEvidence:(sessionId:string,revision:number,taskId:string,evidence:SelfCheckEvidence,eventId:string)=>request<Envelope<{status:'selfCheckComplete';message:string;revision:number}>>('/api/studio/self-check',{sessionId,revision,taskId,phase:'evidence',evidence,eventId}),
  attempt:(sessionId:string,revision:number,taskId:string,answer:Record<string,string>,eventId:string)=>request<Envelope<{status:'correct'|'incorrect'|'invalidInput'|'pendingReview';message:string;paid:number;revision:number;completed:boolean;completionPaid:number;solution?:string}>>('/api/studio/attempt',{sessionId,revision,taskId,answer,eventId}),
  note:(lessonId:string,id:string,text:string)=>request<Envelope<{id:string;status:'ungraded'}>>('/api/studio/note',{lessonId,id,text})
};
export type StudioLesson=PilotLesson;
