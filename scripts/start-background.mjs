import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverArgs=process.argv.slice(2);
if(serverArgs.some(arg=>!/^--(?:port=\d{1,5}|data-dir=.+)$/.test(arg)))throw Error('只支持 --port 和 --data-dir。');
const portArg=serverArgs.find(arg=>arg.startsWith('--port='));
if(portArg&&!(Number(portArg.slice(7))>=1&&Number(portArg.slice(7))<=65535))throw Error('端口必须在1至65535之间。');
const dataArg=serverArgs.find(arg=>arg.startsWith('--data-dir='));
const dataDir=dataArg?path.resolve(dataArg.slice(11)):path.join(root,'data');
fs.mkdirSync(dataDir,{recursive:true});
const fd=fs.openSync(path.join(dataDir,'kevin-math-lab.log'),'a');
// A separate process group survives the terminal/caller's process-group cleanup.
const child=spawn(process.execPath,[path.join(root,'server/index.mjs'),...serverArgs],{
  cwd:root,detached:true,stdio:['ignore',fd,fd]
});
child.on('error',error=>{console.error('后台进程未能启动：'+error.message);process.exitCode=1});
child.on('spawn',()=>{fs.writeFileSync(path.join(dataDir,'kevin-math-lab.pid'),String(child.pid)+'\n');child.unref();fs.closeSync(fd)});
