import {createHash} from 'node:crypto';
import {ensureInbox,getDetectiveSyncStatus,importVerifiedBundle} from './detective-inbox-store.mjs';
import {parseInboxBundle,needsOracleRecheck,ORACLE_VERSION,INBOX_PATH,inboxFilename} from '../shared/detective-inbox.mjs';
import {insist} from '../shared/detective-model.mjs';
import {validateStored} from './detective-store.mjs';
const API='https://api.github.com/repos/lovestream/math-learning';
const RAW='https://raw.githubusercontent.com/lovestream/math-learning/detective-inbox/';
const BRANCH='detective-inbox', INTERVAL=15*60000;
const sha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
async function boundedBytes(r,limit){
 const reader=r.body.getReader();let bytes=0;const parts=[];try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;insist(bytes<=limit,'GitHub响应超过收件上限。');parts.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});}return Buffer.concat(parts);
}
async function boundedJson(r,limit){const bytes=await boundedBytes(r,limit);try{return JSON.parse(bytes.toString('utf8'));}catch{throw Error('GitHub没有返回有效JSON。');}}

export function createDetectiveInboxSync({store,fetcher=fetch,clock=Date.now}){
 let flight=null,timer=null,stopped=false,transientError=null;
 const status=()=>({...getDetectiveSyncStatus(store.get()),syncing:!!flight,...(transientError?{lastError:transientError}:{})});
 const save=fn=>store.mutate(p=>{const x=ensureInbox(p);fn(x);validateStored(p);});
 const request=async(url,headers={})=>{const r=await fetcher(url,{headers:{Accept:'application/vnd.github+json','User-Agent':'Kevin-Math-Lab-Inbox',...headers},redirect:'error',signal:AbortSignal.timeout(12000)});if(!r.ok&&r.status!==304){const error=Error(r.status===404?'GitHub收件分支尚不可读取，保留本地训练。':`GitHub暂不可用（${r.status}），保留本地训练，稍后重试。`);error.retryAt=r.headers.get('x-ratelimit-reset');error.status=r.status;throw error;}return r;};
 async function run(force){
  const before=status(),now=clock();if(!force&&before.nextAttemptAt&&Date.parse(before.nextAttemptAt)>now)return status();
  try{
   const r=await request(`${API}/contents/${INBOX_PATH.slice(0,-1)}?ref=${BRANCH}`,!force&&before.etag&&!Object.values(before.files).some(needsOracleRecheck)?{'If-None-Match':before.etag}:{});
   if(r.status!==304){
    const files=await boundedJson(r,512*1024);insist(Array.isArray(files)&&files.length<=400,'收件目录内容无效或超过400文件。');
    const errors=[];
    for(const file of files){
     try{
     if(file.name==='README.md')continue;
     insist(file.type==='file'&&inboxFilename(file.name)&&file.path===INBOX_PATH+file.name&&sha(file.sha)&&Number.isInteger(file.size)&&file.size>0&&file.size<=192*1024,'收件目录含不支持的文件、路径或过大JSON。');
     const previous=status().files[file.path];if(previous?.sourceBlobSha===file.sha&&!needsOracleRecheck(previous))continue;
     let buffer;
     try{
      const blob=await boundedJson(await request(`${API}/git/blobs/${file.sha}`),300*1024);
      insist(blob.encoding==='base64'&&typeof blob.content==='string'&&blob.content.length<=280*1024,'收件blob格式无效。');buffer=Buffer.from(blob.content,'base64');
     }catch(e){
      if(![403,429].includes(e.status))throw e;
      // Raw fallback is fixed to the same repository/branch/path and MUST match
      // the directory's blob SHA. A race with a newer branch fails closed.
      buffer=await boundedBytes(await request(RAW+file.path),192*1024);
     }
     insist(buffer.length===file.size&&createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex')===file.sha,'GitHub文件内容与blob SHA不一致。');
     const bundle=parseInboxBundle(buffer.toString('utf8'));
     store.mutate(p=>importVerifiedBundle(p,bundle,{branch:BRANCH,path:file.path,sha:file.sha},clock()));
     }catch(e){
      const previous=status().files[file.path];
      if(e.status===409&&previous?.sourceBlobSha===file.sha&&needsOracleRecheck(previous)){
       save(x=>{const r=x.files[file.path];r.mathOracleVersion=ORACLE_VERSION;r.reason='本机已编辑或审核：保留原案，不自动覆盖；请家长在案卷柜核对。';});
      }else errors.push(`${inboxFilename(file.name)?file.name:'不合规收件项'}：${e.message}`);
     }
    }
    if(errors.length)throw Error(errors.slice(0,3).join('；').slice(0,500));
    save(x=>{x.etag=r.headers.get('etag');});
   }
   save(x=>{x.lastCheckedAt=new Date(clock()).toISOString();x.lastSuccessAt=x.lastCheckedAt;x.lastError=null;x.failures=0;x.nextAttemptAt=new Date(clock()+INTERVAL).toISOString();});
  }catch(e){
   // No payload or remote text is logged. Never remove an imported case on failure.
   save(x=>{x.lastCheckedAt=new Date(clock()).toISOString();x.lastError=e.name==='TimeoutError'?'GitHub同步超时；本地案件仍可继续。':String(e.message).slice(0,500);x.failures=Math.min(10000,x.failures+1);const delay=Math.min(6*3600000,60000*2**Math.min(x.failures-1,9));const rate=Number(e.retryAt)*1000;x.nextAttemptAt=new Date(Math.max(clock()+delay,Number.isFinite(rate)?rate:0)).toISOString();x.etag=null;});
  }
  return status();
 }
 function sync({force=false}={}){if(stopped)return Promise.resolve(status());if(flight)return flight;transientError=null;flight=run(force).catch(()=>{transientError='同步未能安全保存，请先导出备份并检查本机存储容量。本地进度未改变。';return status();}).finally(()=>{flight=null;});return flight;}
 return {status,sync,touch(){const s=status();if(!s.lastCheckedAt||clock()-Date.parse(s.lastCheckedAt)>2*60000)void sync({force:!s.failures});},start(){void sync();timer=setInterval(()=>void sync(),60000);timer.unref();},stop(){stopped=true;clearInterval(timer);return flight??Promise.resolve();},setAutoPublish(value){insist(typeof value==='boolean','自动发布设置必须是开或关。');save(x=>{x.autoPublish=value;});return status();}};
}
