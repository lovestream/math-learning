import {ensureDetective,publishImported,validateStored} from './detective-store.mjs';
import {fingerprint,insist} from '../shared/detective-model.mjs';
import {validateInboxBundle,canonicalize,verifyImportedCaseMath,ORACLE_VERSION,INBOX_PATH,inboxFilename} from '../shared/detective-inbox.mjs';
export function ensureInbox(p){const d=ensureDetective(p);return d.inbox??= {schemaVersion:1,autoPublish:true,files:{},etag:null,lastCheckedAt:null,lastSuccessAt:null,lastError:null,failures:0,nextAttemptAt:null};}
export function getDetectiveSyncStatus(p){const x=p.studio?.detective?.inbox;return x?structuredClone(x):{schemaVersion:1,autoPublish:true,files:{},lastCheckedAt:null,lastSuccessAt:null,lastError:null,nextAttemptAt:null};}
function importBundleInto(p,b,source,now){
 validateInboxBundle(b);b=canonicalize(b);const d=ensureDetective(p),x=ensureInbox(p),time=new Date(now).toISOString();
 insist(source.branch==='detective-inbox'&&source.path===INBOX_PATH+b.bundleId+'.json'&&/^[a-f0-9]{40}$/.test(source.sha),'来源分支、文件名或blob标识不合法。');
 const old=x.files[source.path],bundleHash=fingerprint(b);
 if(old?.bundleHash===bundleHash){old.sourceBlobSha=source.sha;return {status:'duplicate',caseIds:old.caseIds};}
 if(old)insist(old.bundleId===b.bundleId&&b.bundleRevision===old.bundleRevision+1,'相同包发生冲突：内容修改须递增bundleRevision，不能覆盖旧版。',409);
 else insist(b.bundleRevision===1,'首次接收须从bundleRevision 1开始。');
 insist(Object.keys(x.files).length<400||old,'收件记录已达400包上限，请先导出备份。');
 for(const c of b.cases){const existing=d.cases[c.id];insist(!existing||existing.importSource?.bundleId===b.bundleId&&existing.importSource?.sourcePath===source.path,'案卷ID与已有来源冲突，不覆盖历史。',409);}
 const results=b.cases.map(c=>verifyImportedCaseMath(c.content,c.verification));
 const invalid=results.find(r=>r.status==='rejected');
 if(invalid){x.files[source.path]={bundleId:b.bundleId,bundleRevision:b.bundleRevision,bundleHash,sourceBlobSha:source.sha,sourceBranch:source.branch,sourcePath:source.path,importedAt:time,mathOracleVersion:ORACLE_VERSION,status:'rejected',reason:invalid.reason,caseIds:[]};validateStored(p);return {status:'rejected',caseIds:[]};}
 const destinations=b.cases.map(c=>{
  if(d.cases[c.id])return c.id;
  return Object.values(d.cases).find(existing=>existing.importSource&&existing.versions.some(v=>v.id===existing.activeVersion&&v.hash===fingerprint(c.content)))?.id??c.id;
 });
 const reused=destinations.every((id,i)=>id!==b.cases[i].id);
 if(reused){
  const duplicates=destinations.map(id=>d.cases[id]);
  x.files[source.path]={bundleId:b.bundleId,bundleRevision:b.bundleRevision,bundleHash,sourceBlobSha:source.sha,sourceBranch:source.branch,sourcePath:source.path,importedAt:time,mathOracleVersion:ORACLE_VERSION,status:duplicates.every(c=>c.status==='published')?(duplicates.some(c=>c.versions.find(v=>v.id===c.activeVersion).approvalSource==='parent')?'parent-published':'auto-published'):'needs-review',reason:'这些数学案件已经收到，复用原案，不重复建立训练或奖励。',caseIds:destinations};validateStored(p);return {status:'duplicate',caseIds:destinations};
 }
 const canPublish=x.autoPublish&&results.every(r=>r.status==='verified')&&!destinations.some(id=>['withdrawn','archived'].includes(d.cases[id]?.status)),status=canPublish?'auto-published':'needs-review';
 insist(Object.keys(d.cases).length+destinations.filter(id=>!d.cases[id]).length<=200,'案卷已满200宗，本包未导入，GitHub原件保留。');
 for(const [i,c]of b.cases.entries()){
  if(destinations[i]!==c.id)continue;
  const provenance={sourceBranch:source.branch,sourcePath:source.path,sourceBlobSha:source.sha,bundleId:b.bundleId,bundleRevision:b.bundleRevision,bundleHash,caseHash:fingerprint(c.content),importedAt:time,mathOracleVersion:ORACLE_VERSION,importDisposition:status,reason:canPublish?results[i].reason:!x.autoPublish?'家长暂停了自动发布。':(results.find(r=>r.status==='needs-review')?.reason??'本机已撤回或归档，保留待核对。'),simulatedSteps:true};
  let record=d.cases[c.id];if(!record){record={id:c.id,revision:1,status:'review',draft:structuredClone(c.content),versions:[],activeVersion:null};d.cases[c.id]=record;}else {insist(fingerprint(record.draft)===record.importSource.caseHash,'本机案卷已有手工修改，请家长先核对，自动导入不覆盖。',409);record.revision++;}
  record.draft=structuredClone(c.content);record.importSource=provenance;
  if(canPublish){publishImported(record,c.content,now,provenance);delete record.pendingImport;}
  else {record.pendingImport=provenance;if(!record.activeVersion)record.status='review';}
 }
 x.files[source.path]={bundleId:b.bundleId,bundleRevision:b.bundleRevision,bundleHash,sourceBlobSha:source.sha,sourceBranch:source.branch,sourcePath:source.path,importedAt:time,mathOracleVersion:ORACLE_VERSION,status,reason:canPublish?'本机独立数学核验通过。':!x.autoPublish?'自动发布已暂停；内容保留待家长核对。':'本包尚不能自动发布，整包保留供家长核对。',caseIds:destinations};
 validateStored(p);return {status,caseIds:x.files[source.path].caseIds};
}
export function importVerifiedBundle(p,b,source,now=Date.now()){
 const next=structuredClone(p);const result=importBundleInto(next,b,source,now);p.studio=next.studio;return result;
}
