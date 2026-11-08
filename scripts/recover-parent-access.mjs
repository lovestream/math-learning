// Explicit OS-local recovery for pre-recovery-code installations. This script
// never opens or removes progress.sqlite, JSON learning exports, or pet data.
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export function resetParentAccess(dir,confirmed=false){
 if(!confirmed)throw Error('需要明确的 --confirm-parent-reset；只重置家长凭据。');
 const file=path.join(dir,'parent-access.json');
 if(!fs.existsSync(file))return null;
 const backup=file+`.backup-reset-${Date.now()}-${randomBytes(4).toString('hex')}`;
 fs.renameSync(file,backup);fs.chmodSync(backup,0o600);return backup;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=process.argv.find(a=>a.startsWith('--data-dir='));
 const dir=arg?path.resolve(arg.slice(11)):fileURLToPath(new URL('../data/',import.meta.url));
 const backup=resetParentAccess(dir,process.argv.includes('--confirm-parent-reset'));
 console.log(backup?'家长凭据已单独备份。回到家长中心重新设置密码；学习进度未删除。':'尚未设置家长密码；可以回到家长中心设置。');
}
