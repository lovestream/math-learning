import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fd=fs.openSync(path.join(root,'data/kevin-math-lab.log'),'a');
// A separate process group survives the terminal/caller's process-group cleanup.
const child=spawn(process.execPath,[path.join(root,'server/index.mjs')],{
  cwd:root,detached:true,stdio:['ignore',fd,fd]
});
child.on('error',error=>{console.error('后台进程未能启动：'+error.message);process.exitCode=1});
child.on('spawn',()=>{fs.writeFileSync(path.join(root,'data/kevin-math-lab.pid'),String(child.pid)+'\n');child.unref();fs.closeSync(fd)});
