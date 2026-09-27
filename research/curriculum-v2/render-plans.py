from pathlib import Path
import json
import argparse
from render_thinking import render_thinking, render_preview
ROOT=Path(__file__).resolve().parents[2];B=ROOT/'content/course-plan-v2'
parser=argparse.ArgumentParser()
parser.add_argument('--grade',type=int,choices=(3,4,5,6),nargs='+',default=[3,4,5,6])
args=parser.parse_args()
for g in args.grade:
 d=json.loads((B/f'grade-{g}.json').read_text());by={l['id']:l for l in d['lessons']}
 lines=[f'# {g}年级逐课备课方案','',d.get('status','内容初稿，未接入网站'),'',d['editionNote'],'',
 f'共 {len(d["lessons"])} 课，{sum(len(l["practice"]) for l in d["lessons"])} 道练习，每题附答案和理由。B为基础或必要衔接，E为提升，O为思想专题，R为复习诊断。教材中的数学广角按基础成熟程度选学，不作为升级门槛。','',
 '每课有12道练习：前8题是当堂或下一次学习的备选题，另4题分别安排在完成核心学习后的第1、3、7、21天独立回顾。一次通常选3—5题，复杂课可分两次；不能同一天把12题全部做完并声称长期掌握。日程是教案设计，网站调度尚未接入。','',
 '页码是原教材印刷页与PDF序号，原创题并非教材原题。先修关系提供建议，不锁定入口。所有无图文字题应能独立理解。','',
 '## 目录','', '| 单元 | 原教材页 | 课程顺序 |','|---|---|---|']
 for u in d['units']:
  links=' → '.join(f'[{id.split("-")[-1]}](#{id.lower()})' for id in u['sequence'])
  lines.append(f'|{u["id"]} {u["title"]}|{u["printedPages"]}|{links}|')
 for u in d['units']:
  lines+=['',f'## {u["id"]} {u["title"]}','',u.get('notes',''),'']
  if g==3:
   bank=json.loads((B/'grade-3-thinking.json').read_text())
   linked=[q for q in bank['tasks'] if q['unitId']==u['id']]
   lines += ['**本章思维收尾（选学，每次最多一道）：**'+'；'.join(f'[{q["layer"]}：{q["title"]}](#{q["id"].lower()})' for q in linked),'']
  for id in u['sequence']:
   l=by[id];a=l['anchor'];lines += [f'<a id="{id.lower()}"></a>',f'### {id} {l["title"]}','',
    f'**定位：** {l["tier"]}；建议{l["minutes"]}分钟。来源{a["sourceId"]}：印刷{a["printedPages"]} / PDF {a["pdfPages"]}。',a['note'],'',
    '**先修：**'+'；'.join(l['prerequisites']),'**关联课程：**'+('、'.join(l['dependsOn']) or '依已有能力直接进入'),'',
    '**目标：**'+l['objective'],'','**真实问题：**'+l['realProblem'],'','**为什么：**'+l['why'],'','**模型操作：**'+l['model'],'','**讲解：**','']
   lines += [f'{i}. {s}' for i,s in enumerate(l['explanation'],1)]
   if l.get('teachingContract'):
    c=l['teachingContract'];m=l['interaction'];w=m['withdrawal']
    lines += ['','**学习层级与本次目标：**'+('教材基础' if c['requiredForTextbookCore'] else '选学或诊断，不作教材基础门槛'),
     '**最低证据：**'+c['minimumEvidence'],
     '**最低代表题：**'+'、'.join(c['minimumTaskIds']),
     '**其他当堂备选：**'+'、'.join(c['electiveTaskIds']),
     '**退出规则：**'+c['exitRule'],
     '**暂停与回补：**'+c['pauseRule']+' 回补位置：'+('、'.join(c['repairLessonIds']) or '本课模型与已列先修'),
     '**课次安排：**'+' '.join(c['sessionPlan']),
     '**共享概念：**'+'；'.join(x['conceptId']+'（'+x['exposure']+'）'+x.get('note','') for x in l['concepts']),
     '', '**教具行为规约（尚未实现）：**','',
     '| 环节 | 具体行为与证据 |','|---|---|']
    for label,key in [('初始状态','initialState'),('Kevin动作','learnerAction'),('可观察变化','observableChange'),('追问','question'),('预期解释','expectedExplanation'),('错误动作反馈','wrongActionFeedback')]:
     lines.append(f'| {label} | {m[key].replace("|", "／")} |')
    lines += [f'| 撤除教具后 | {w["action"]} 独立题{w["taskId"]}：{w["question"]} |',
     f'| 独立题参考 | {w["answer"]}；{w["reason"]} |',
     '',w['exposureRule'],m['fallback'],
     '**自查动作：**'+l['selfCheck']['prompt'],
     '**记录：**'+l['selfCheck']['timing']]
    if l.get('diagnosticFollowup'):
     f=l['diagnosticFollowup'];lines += ['', '**错后区分性补问：**'+f['question'],
      '参考：'+f['answer']+'；'+f['interpretation']+'；允许家长修正，仅标可能原因。']
   lines += ['','**原创例题：**'+l['example']['question'],'']+[f'{i}. {s}' for i,s in enumerate(l['example']['steps'],1)]+['','答案：'+l['example']['answer'],'','**练习与讲评：**','']
   for i,p in enumerate(l['practice'],1):
    schedule=f'〔第{p["reviewAfterDays"]}天独立回顾〕' if p.get('phase')=='spaced-review' else ''
    identity=f'〔{p["id"]}；{p["audit"]["status"]}〕' if p.get('audit') else ''
    lines += [f'{i}. 【{p["level"]}】{identity}{schedule}{p["question"]}']
    if p.get('diagram'):
     pic=p['diagram'];display='题面配图' if pic['display']=='question' else '提示1配图（学生初始不展示）'
     lines += ['',f'   {display}：','',f'   ![{pic["alt"]}](../../{pic["path"]})','',f'   图的文字备份：{pic["fallback"]}','']
    if p.get('hints'):
     lines += [f'   提示{h["level"]}（按需展开）：{h["text"]}' for h in p['hints']]
    lines += [f'   答案：{p["answer"]} 理由：{p["reason"]}']
   if l.get('practiceUse'):
    lines += ['','**练习安排：**'+l['practiceUse']]
   if l.get('extensionContract'):
    c=l['extensionContract']
    lines += ['','**本课基础怎样走向提升：**'+c['selectionRule'],
      '**实际提升题：**'+'、'.join(c['extensionTaskIds']),
      '**要观察的思考：**'+'；'.join(c['extensionEvidence']),
      '**关联思维卡：**'+('、'.join(c['optionalThinkingTaskIds']) or '先使用本课列出的提升题，不额外开重复专题'),
      '**掌握证据边界：**'+c['evidenceBoundary']]
   if l.get('assessmentNotes'):
    lines += ['','**证据边界：**'+l['assessmentNotes']]
   lines += ['','**易错：**'+l['misconception']['wrong']+' → '+l['misconception']['correction'],'',
    '**Kevin复述：**'+l['retell'],'','**后续联系：**'+l['next'],'']
 if g==3:
  bank=json.loads((B/'grade-3-thinking.json').read_text())
  lines += ['',render_thinking(bank,heading_level=2)]
  (ROOT/'docs/review/Kevin三年级_提升与奥数思维题.md').write_text(render_thinking(bank))
  render_preview(bank,ROOT/'docs/review/Kevin三年级_提升题图文预览.html')
 (B/f'grade-{g}.md').write_text('\n'.join(lines)+'\n')
 if g in (4,6):
  text=[f'# {g}年级教材核对记录','','本记录区分实际教材内容、必要衔接、原创提升以及重复内容的迁移。','',
   '## 教材来源','']
  for s in d['sources']:
   if not s['path'].endswith('.pdf'):continue
   text += [f'- **{s["id"]}**：{s["path"]}；共{s["pdfPages"]}个PDF页；{s["edition"]}。正文印刷页加6为PDF序号。']
  text += ['','## 实际目录与课程安排','', '| 实际单元或衔接位置 | 印刷页 | 对应教案 |','|---|---|---|']
  for u in d['units']:text.append(f'|{u["title"]}|{u["printedPages"]}|'+ '、'.join(u['sequence'])+'|')
  text += ['','## 重复与缺口处理','']
  if g==4:
   text+=['四上为所供新版目录，四下为另一套目录结构。两位数除法在所供两册中缺少完整单元，X01显式补齐；来源是目录缺口分析，不伪造一个教材页码。',
    '三上已经学习线和角，四上G4-U03-R01改为诊断衔接。三下已经学习归一归总，四上G4-U05-R01改为条件迁移。混合运算在四下深化到互逆、三步与中括号，不从两步算式从头重讲。',
    '去括号提升从三上两项数值理解深化到四下三项括号和字母规律；连续除法进一步区分除以积、除以和。两处都出现时不计作两个全新知识。',
    '鸡兔同笼在四上复习附段（印刷118–119）和四下99–102均出现；完整主教案只放G4-L10，四上通过说明链接，不另复制一套。',
    '四上平行四边形与梯形章研究性质和底高，面积公式首教留在五年级。不能沿用旧底稿把相关面积公式当四年级基础。']
  else:
   text+=['六上后记印刷119页写明依据2022课标；六下后记印刷115页说明在2014版、2011课标教材基础上修订。未从文件时间推断具体印次。',
    '六上确定位置实际包括有序数对、方向距离和路线。因此本方案不按另一套版本把数对假定为五年级已经正式学过。',
    '负数首教六上44–47，六下2–7用于数线比较的复习深化。折扣、单利在六上已出现，六下补成数、税率和条件优惠，不复制完整首教。',
    '比在所供六上无独立单元，但六下比例38–64直接需要比。G6-L05三节基础桥接补齐比、化简比、按比分配；不伪造教材原章。',
    '扇形统计图在六下95–98复习出现，而所供六上缺独立单元。G6-U07-B07明确作为原创必要桥接，来源锚定该缺口。',
    '六上116–117与六下67–70都含鸽巢。上册首教，六下进行抽取和自建分类迁移；不重复讲相同鸽笼故事。',
    '六下71–103整理为7节诊断整合，104–109三项综合实践各有教案。阅读完全部课不作为独立掌握或保持的证据。']
  text += ['','## 来源边界','',
    '目录、关键正文与后记已用扫描页面及本地文字识别核对。单课来源为知识或单元范围锚点，不表示逐题出处。计算题与情境原创。OCR可能误读分数与符号，引用须以原PDF为准。','',
    '当前检查包含结构、依赖、来源路径、重复题干筛查与部分算式核算；不等于所有题目已经经过第二位教师逐题审定，亦不等于Kevin试学验证。']
  (B/f'sources-grade-{g}.md').write_text('\n'.join(text)+'\n')
print('Rendered grades: '+', '.join(map(str,args.grade))+'. Other grades were not written.')
