"""Render the optional thinking bank for review, not for student answer presentation."""
def render_thinking(bank, heading_level=1):
    h='#'*heading_level
    lines=[h+' 三年级：本章提升与奥数思维收尾题','',
      f'2026-09-24；{len(bank["tasks"])}张思维题卡。按教材单元与方法联系选题，不是新增必修课。尚未接入网站。',
      bank['sourceBoundary'],bank['use'],'',
      '本稿供家长审核，所以同时列答案与提示；学生端必须先隐藏，按需逐级展开。不同正确表达可接受，开放证明由成人确认，不能仅按结果或参考文字判满分。','',
      h+'# 题目索引','','| 单元 | 提升 | 奥数思想选学 |','|---|---|---|']
    units=list(dict.fromkeys(q['unitId'] for q in bank['tasks']))
    for uid in units:
        groups=[]
        for layer in ['本章提升','奥数思想选学']:
            groups.append('；'.join(f'[{q["title"]}](#{q["id"].lower()})' for q in bank['tasks'] if q['unitId']==uid and q['layer']==layer))
        lines.append(f'| {uid} | '+ ' | '.join(groups)+' |')
    lines += ['',h+'# 方法连接与选择顺序','']
    for chain in bank.get('learningChains',[]):
        lines += ['**'+chain['title']+'：**'+' → '.join(f'[{tid}](#{tid.lower()})' for tid in chain['tasks']),chain['note'],'']
    for q in bank['tasks']:
        lines += ['',f'<a id="{q["id"].lower()}"></a>',h+'# '+q['id']+' '+q['title'],'',
          f'**层级：**{q["layer"]}；建议{q["minutes"]}分钟；先修/挂靠{q["parentLessonId"]}；思想{q["conceptId"]}。',
          f'**教材连接：**{q["source"]["sourceId"]}印刷{q["source"]["printedPages"]}；{q["source"]["note"]}',
          '**为什么接在这里：**'+q['bridgeFromCore'],'',
          '**题目：**'+q['question'],'']
        if q.get('source',{}).get('summerReference'):
            ref=q['source']['summerReference']
            lines += [f'**暑假来源：**20天专项第{ref["day"]}天，本文件PDF第{ref["pdfPage"]}页；{ref["scope"]}。','']
        if q.get('diagram'):
            pic=q['diagram']
            lines += [f'![{pic["alt"]}](../../{pic["path"]})','',
                '**配图文字备份（仅上传Markdown也可理解）：**'+pic['fallback'],
                '**图的显示与操作：**'+pic['interactionSpec'],'']
        lines += ['**先独立尝试；以下提示与答案供家长审核。**','']
        for hint in q['hints']:lines.append(f'提示{hint["level"]}：{hint["text"]}')
        lines += ['','**参考答案：**'+q['answer'],'','**为什么：**','']
        lines += [f'{i}. {s}' for i,s in enumerate(q['solutionSteps'],1)]
        lines += ['','**适用边界：**'+q['applicability'],
          '**怎样看出确实在思考：**'+q['thinkingEvidence'],
          '**审核状态：**'+q.get('audit',{}).get('status','unreviewed')+'；AI编辑复核不等于人类教师确认。',
          '**选题与帮助：**'+q['selectionRule'],'']
    return '\n'.join(lines)+'\n'

def render_preview(bank, output):
    """Portable local HTML, embedded SVG; not a deployed student page."""
    import html
    from pathlib import Path
    root=Path(__file__).resolve().parents[2]
    esc=html.escape
    content=[]
    for q in bank['tasks']:
        if not ('diagram' in q or q['id'].split('-')[-1].startswith('S')):continue
        diagram=(root/q['diagram']['path']).read_text() if q.get('diagram') else ''
        if diagram:
            diagram=diagram.replace('id="title"',f'id="{q["id"]}-title"').replace('id="desc"',f'id="{q["id"]}-desc"').replace('aria-labelledby="title desc"',f'aria-labelledby="{q["id"]}-title {q["id"]}-desc"')
        steps=''.join('<li>'+esc(s)+'</li>' for s in q['solutionSteps'])
        hints=''.join(f'<details><summary>需要一点提示 {h["level"]}</summary><p>{esc(h["text"])}</p></details>' for h in q['hints'])
        content.append(f'<article id="{q["id"]}"><p class="tag">{q["id"]} · {q["layer"]}</p><h2>{esc(q["title"])}</h2><p>{esc(q["question"])}</p>{diagram}{hints}<details><summary>家长查看答案与思路</summary><p><b>{esc(q["answer"])}</b></p><ol>{steps}</ol><p>适用条件：{esc(q["applicability"])}</p><p>观察：{esc(q["thinkingEvidence"])}</p></details></article>')
    nav=' · '.join(f'<a href="#{q["id"]}">{esc(q["title"])}</a>' for q in bank['tasks'] if q['id'].startswith('G3-U03-TH') and int(q['id'].split('TH')[1])>=3)
    output.write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kevin 三年级提升题图文审阅</title><style>body{margin:0;background:#edf3f5;color:#203c50;font:18px/1.8 "PingFang SC",sans-serif}main{max-width:900px;margin:40px auto;padding:0 20px}article{background:white;padding:28px 36px;margin:28px 0;border-radius:18px;border:1px solid #d3e1e7}h1{font-size:32px}h2{font-size:25px}svg{display:block;width:100%;height:auto;margin:24px 0}details{border-top:1px solid #dbe6e9;padding:12px 0}summary{cursor:pointer;color:#286f91}.tag{font-size:14px;color:#5d7180}a{color:#286f91}li{margin:10px 0}</style><main><h1>三年级：从基础走向思维</h1><p>本页是内容审阅样张，图片与文字均可离线查看。正式网站尚未接入；此处不记录答题或积分。先读题看图，提示与解答默认收起。</p><nav>'+nav+'</nav>'+''.join(content)+'</main></html>')
