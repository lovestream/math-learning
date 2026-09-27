import fs from 'node:fs';
import assert from 'node:assert/strict';
import {lessons} from '../content/pilot/source.mjs';
const root=new URL('../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const blueprint=read('content/Kevin_数学课程结构清单.json'),rollout=read('content/rollout.json');
const units=rollout.fullPrimaryPhases.flatMap(p=>p.units);
assert.equal(new Set(units).size,units.length,'完整阶段不能重复计算单元');
assert.deepEqual([...units].sort(),blueprint.units.map(u=>u.unitId).sort(),'59单元均需分配实施阶段');
const ids=rollout.batches.flatMap(b=>b.lessonIds);
assert.equal(new Set(ids).size,ids.length,'试学批次不能重复计算课程');
assert.deepEqual([...ids].sort(),blueprint.sampleLessons.map(l=>l.lessonId).sort(),'24代表课均需分配批次');
for(const b of rollout.batches.filter(b=>b.status!=='planned'))for(const id of b.lessonIds)assert(lessons.some(l=>l.lessonId===id),`${b.id}缺少${id}`);
const count=l=>Object.values(l.taskSets).flat().length;
const lines=['# 课程覆盖台账','','自动生成：`node scripts/report-implementation.mjs`。来源为用户v0.3蓝图及当前实际课程源。','','已有相关课只表示部分关联。子目标、独立核验和延迟保持证据未逐项闭合，因此这里不报告虚假的完整覆盖百分比。','','| 批次 | 状态 | 可用课 / 目标课 | 当前题量 |','|---|---|---:|---:|'];
for(const b of rollout.batches){const present=lessons.filter(l=>b.lessonIds.includes(l.lessonId));lines.push(`| ${b.id} ${b.title} | ${b.status} | ${present.length} / ${b.lessonIds.length} | ${present.reduce((n,l)=>n+count(l),0)} |`)}
lines.push('','## 全部规划项的去向','','| 规划ID | 范围 | 主单元 / 阶段 | 新版关联课 | 缺口 |','|---|---|---|---|---|');
for(const p of blueprint.coursePlans){const related=lessons.filter(l=>l.coverageIds.some(id=>p.coverageIds.includes(id)));const phase=rollout.fullPrimaryPhases.find(x=>x.units.includes(p.parentUnitId));assert(phase,`未排期${p.coursePlanId}`);lines.push(`| ${p.coursePlanId} | ${p.title.replaceAll('|','／')} | ${p.parentUnitId} / ${phase.id} | ${related.map(l=>l.shortTitle).join('、')||'暂无'} | ${related.length?'已有入门，仍需逐子项核对、补课与证据':'待拆目标、制作、核验'} |`)}
fs.writeFileSync(new URL('docs/课程覆盖台账.md',root),lines.join('\n')+'\n');
console.log(`排期核验通过：59单元、24代表课、${blueprint.coursePlans.length}规划项均有去向；当前${lessons.length}课、${lessons.reduce((n,l)=>n+count(l),0)}题。`);
