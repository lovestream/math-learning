import {selfCheckTask} from '../../server/pilot-store.mjs';
export const evidence={checks:['读清对象与单位','核对第一步','核对最终量'],reflection:'先用关系求中间量，再计算最终量。',firstOperation:'9÷3',intermediate:'3',finalConfirmed:true};
export function completeSelfCheck(progress,input,now){
  const first=selfCheckTask(progress,input,now);
  if(first.status==='invalidInput')return first;
  const session=progress.studio.sessions[input.sessionId];
  const checked=selfCheckTask(progress,{sessionId:session.id,revision:session.revision,taskId:input.taskId,phase:'evidence',evidence,eventId:`evidence:${input.eventId}`},now);
  return {...first,revision:checked.revision};
}
