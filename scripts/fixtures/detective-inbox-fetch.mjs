// Explicit node --import fixture, only used with OS temporary data directories.
// No production URL override or test HTTP endpoint is installed in the application.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const dir=process.env.DETECTIVE_MOCK_INBOX_DIR;if(!dir)throw Error('Missing isolated inbox fixture');
const realNow=Date.now.bind(Date),realInterval=globalThis.setInterval;
Date.now=()=>realNow()+Number(fs.existsSync(path.join(dir,'.clock-offset'))?fs.readFileSync(path.join(dir,'.clock-offset'),'utf8'):0);
globalThis.setInterval=(fn,delay,...args)=>realInterval(fn,delay===60000?100:delay,...args);
const nativeFetch=globalThis.fetch;globalThis.fetch=async(url,options={})=>{
 if(!String(url).startsWith('https://api.github.com/repos/lovestream/math-learning/'))return nativeFetch(url,options);
 const files=fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort().map(name=>{const bytes=fs.readFileSync(path.join(dir,name));return {name,path:'content/detective/inbox/'+name,type:'file',size:bytes.length,sha:createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),bytes};});
 const etag='"'+createHash('sha256').update(files.map(x=>x.sha).join()).digest('hex')+'"';
 if(String(url).includes('/contents/')){if(options.headers?.['If-None-Match']===etag)return new Response(null,{status:304});return Response.json(files.map(({bytes,...rest})=>rest),{headers:{etag}});}
 const file=files.find(x=>String(url).endsWith('/git/blobs/'+x.sha));return file?Response.json({encoding:'base64',content:file.bytes.toString('base64')}):new Response('{}',{status:404});
};
