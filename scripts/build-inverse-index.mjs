import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {lessons} from '../content/pilot/source.mjs';
import {inverseEntries,inverseClassroomId} from '../shared/inverse-index.mjs';
export function renderInverseIndex(){
 const rows=inverseEntries(lessons);let text='# 现有逆向练习索引（2026-10-19）\n\n显式核对的11个专项任务＋1节逆推课堂；不是对849题的全量逆向语义分类，不声称只有这些题涉及逆向。所有入口引用原题组和原任务ID，不复制题目、不新增奖励。本轮不增新题，先把现有题找得到、代得回。\n\n在网站“复习站”展开“反过来想”，可直接打开原题；先保存首答，仍按三项自查和原评分／家长批阅流程进行。学生索引只显示方向和未知量，不展示下表的具体代回关系；具体提示仍在原题里按原有辅助留痕查看。\n\n|任务ID|课程|原题组|思考方向|要求的未知量|正向代回检查|\n|---|---|---|---|---|---|\n';
 for(const r of rows)text+=`|${r.taskId}|${r.title}|${r.set}|${r.direction}|${r.unknown}|${r.forwardCheck}|\n`;
 text+=`\n独立逆推课堂：${inverseClassroomId}，先沿错误路径(7＋□)×4＝44逆推，再按原正确路径7＋□×4检验。课堂入口不凭操作发掌握积分。\n\n分数重分组与星期逆推为解释题，需要家长核对；其余题维持已有数值／选择判定。链环、木板、周长逆向图仍使用未知量问号与关系图，不把未知答案用于真实比例绘图。图与判分由现有专项浏览器检查；本轮新增索引的直接定位、重复打开和不发额外积分回归。\n\n来源：shared/inverse-index.mjs、content/pilot/inverse-revisions.mjs、content/pilot/source.mjs；正向数学验回：tests/remaining-visuals.test.mjs；正式答题：scripts/verify-chain-growth-browser.js。\n`;
 return text;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const path=new URL('../docs/review/三年级现有逆向练习索引_20261019.md',import.meta.url),text=renderInverseIndex();
 if(process.argv.includes('--check')){if(await readFile(path,'utf8')!==text)throw Error('逆向索引已过期');}else await writeFile(path,text);
 console.log('已有11道逆向任务与1节课堂索引已'+(process.argv.includes('--check')?'查新':'生成')+'；不新增任务或积分。');
}
