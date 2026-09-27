"""Self-contained, offline reviewer preview; no student persistence or scoring."""
from pathlib import Path
import json,html
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'content/course-plan-v2'
d=json.loads((BASE/'grade-3.json').read_text());by={l['id']:l for l in d['lessons']}
changes=json.loads((Path(__file__).parent/'all-units-revision-20260925.json').read_text())['changes'];ids={c['taskId'] for c in changes};e=html.escape
parts=[];nav=[]
for unit in d['units']:
    nav.append(f'<a href="#{unit["id"]}">{e(unit["title"])}</a>')
    parts.append(f'<section id="{unit["id"]}"><h2>{e(unit["title"])}</h2>')
    for lid in unit['sequence']:
        l=by[lid]
        for q in l['practice']:
            if q['id'] not in ids:continue
            picture=(ROOT/q['diagram']['path']).read_text() if q.get('diagram') else ''
            parts.append(f'<article id="{q["id"]}"><p class="tag">{q["id"]} · 选学提升</p><h3>{e(l["title"])}</h3><p>{e(q["question"])}</p>')
            if q.get('diagram',{}).get('display')=='question':parts.append(picture)
            for hint in q.get('hints',[]):
                pic=picture if q.get('diagram',{}).get('display')=='hint-1' and hint['level']==1 else ''
                parts.append(f'<details><summary>提示 {hint["level"]}</summary><p>{e(hint["text"])}</p>{pic}</details>')
            parts.append(f'<details><summary>家长查看答案与思考证据</summary><p><b>{e(q["answer"])}</b></p><p>{e(q["reason"])}</p><p>重点观察：{e(q["thinkingDemand"])}</p></details></article>')
    parts.append('</section>')
style='body{margin:0;background:#edf3f5;color:#203c50;font:18px/1.85 "PingFang SC",sans-serif}main{max-width:940px;margin:35px auto;padding:0 22px}nav{display:flex;flex-wrap:wrap;gap:8px 20px}a{color:#276e90}h1{font-size:32px}h2{padding-top:25px;font-size:28px}h3{font-size:23px}article{background:white;border:1px solid #d0e0e6;padding:25px 32px;border-radius:16px;margin:20px 0}.tag{font-size:14px;color:#627a88}svg{display:block;width:100%;height:auto;margin:24px 0}details{padding:12px 0;border-top:1px solid #dce5e9}summary{cursor:pointer;color:#276e90}'
out=ROOT/'docs/review/Kevin三年级_全单元提升题预览.html'
out.write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kevin三年级全单元提升题预览</title><style>'+style+'</style><main><h1>每个单元，都从基础走向思考</h1><p>这是48道已改写课内提升题的离线审阅样张，按17个教材入口组织。提示和答案默认收起。正式网站尚未接入，本页不判分、不记录进度。基础完成后每天最多选一道，不需要一次做完。</p><nav>'+''.join(nav)+'</nav>'+''.join(parts)+'</main></html>')
print('Rendered 17-unit / 48-task offline preview.')
