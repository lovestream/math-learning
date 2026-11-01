import fs from 'node:fs';
import {fingerprint} from '../shared/detective-model.mjs';
import {deriveImportedCase,validateInboxBundle} from '../shared/detective-inbox.mjs';
export function createBundle({bundleId,bundleRevision=1,createdAt=new Date().toISOString(),cases}){
 const bundle={schemaVersion:'detective-inbox.v1',bundleId,bundleRevision,createdAt,producer:'chatgpt-github',sourceFingerprint:fingerprint(cases.map(c=>({template:c.template,parameters:c.parameters}))),privacy:'public-anonymized-math-only',policy:'auto-if-independently-verified',cases:cases.map((c,i)=>({id:c.id??`${bundleId}-`+String.fromCharCode(65+i),role:c.role,simulatedSteps:true,content:deriveImportedCase(c.template,c.parameters),verification:{template:c.template,parameters:c.parameters,firstWrongStep:deriveImportedCase(c.template,c.parameters).errorStep}}))};
 return validateInboxBundle(bundle);
}
if(process.argv[1]===import.meta.filename){
 const input=process.argv.find(x=>x.startsWith('--input='))?.slice(8),output=process.argv.find(x=>x.startsWith('--output='))?.slice(9);
 if(!input||!output)throw Error('用法：node scripts/create-detective-bundle.mjs --input=匿名参数.json --output=DT-ID.json');
 fs.writeFileSync(output,JSON.stringify(createBundle(JSON.parse(fs.readFileSync(input,'utf8'))),null,2)+'\n');console.log('已生成匿名训练包；尚未投递或同步。');
}
