import type { Data, Progress, PetMission,ThinkingRecord } from './types';

async function request<T>(url:string, init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,headers:{...(init?.body?{'Content-Type':'application/json'}:{}),...init?.headers}});
  const payload=await response.json().catch(()=>({error:'本地服务没有返回可读内容。'}));
  if(!response.ok)throw new Error(payload.error??'操作没有完成。');
  return payload;
}
export const api={
  thinking:(body:Record<string,unknown>)=>request<{result:{record:ThinkingRecord;paid:number;status:string};progress:Progress}>('/api/studio/thinking',{method:'POST',body:JSON.stringify(body)}),
  data:()=>request<Data>('/api/data'),
  attempt:(body:Record<string,unknown>)=>request<{correct:boolean;earned:number;completed?:boolean;explanation:string;progress:Progress}>('/api/attempt',{method:'POST',body:JSON.stringify(body)}),
  retell:(body:{id:string;lessonId:string;text:string})=>request<{earned:number;completed:boolean;duplicate?:boolean;progress:Progress}>('/api/retell',{method:'POST',body:JSON.stringify(body)}),
  purchase:(body:Record<string,unknown>)=>request<{progress:Progress}>('/api/purchase',{method:'POST',body:JSON.stringify(body)}),
  pet:(pet:string)=>request<{progress:Progress}>('/api/pet',{method:'POST',body:JSON.stringify({pet})}),
  feed:(item:string,id:string)=>request<{progress:Progress;xp:number;bond:number;favorite:boolean}>('/api/feed',{method:'POST',body:JSON.stringify({item,id})}),
  interact:(action:'touch'|'play',id:string)=>request<{progress:Progress;bond:number}>('/api/pet/interact',{method:'POST',body:JSON.stringify({action,id})}),
  petMissions:()=>request<{missions:PetMission[];serverTime:string}>('/api/pet/missions'),
  petReward:(type:'mission'|'growth',reward:string|number)=>request<{progress:Progress}>('/api/pet/reward',{method:'POST',body:JSON.stringify({type,reward})}),
  petHome:(body:{scene?:string;item?:string;placed?:boolean})=>request<{progress:Progress}>('/api/pet/home',{method:'POST',body:JSON.stringify(body)}),
  accessory:(item:string|null)=>request<{progress:Progress}>('/api/accessory',{method:'POST',body:JSON.stringify({item})}),
  settings:(body:Record<string,unknown>)=>request<{progress:Progress}>('/api/settings',{method:'POST',body:JSON.stringify(body)}),
  previewImport:(body:unknown)=>request<{summary:Record<string,number|string>;catalogVersion:string}>('/api/import/preview',{method:'POST',body:JSON.stringify(body)}),
  importProgress:(body:unknown)=>request<{progress:Progress;backup:string}>('/api/import',{method:'POST',body:JSON.stringify(body)}),
  backups:()=>request<{backups:{name:string;bytes:number}[]}>('/api/backups'),
  restore:(name:string)=>request<{progress:Progress;backup:string}>(`/api/backups/${encodeURIComponent(name)}/restore`,{method:'POST',body:'{}'})
};
