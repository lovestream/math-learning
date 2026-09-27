from pathlib import Path
import runpy,json,re
HERE=Path(__file__).resolve().parent
ns=runpy.run_path(str(HERE/'build.py'))
for p in sorted(HERE.glob('part*.py')):
    exec(compile(p.read_text(),str(p),'exec'),ns)
units=ns['units'];lessons=ns['lessons'];out=ns['OUT']
by={l['id']:l for l in lessons}

# 纸面教案中的推荐顺序与知识依赖不同：选学课不得成为基础课必经门槛。
for u in units:
    previous=None
    for id in u['sequence']:
        l=by[id];l['dependsOn']=[previous] if previous else []
        if l['tier'] in ('B','R'):previous=id
for id,deps in {
 'G3-U04-B01':[], 'G3-U05-B01':['G3-U03-B01'],
 'G3-U06-B01':[], 'G3-U07-R01':['G3-U04-B05','G3-U06-B05'],
 'G3-U07-B01':['G3-U04-B01'], 'G3-L01-B01':['G3-U05-B03'],
 'G3-L02-B01':['G3-U04-B01'], 'G3-L03-B01':['G3-U05-B03'],
 'G3-L04-B01':['G3-L03-B02'], 'G3-L05-B01':[],
 'G3-LP01-B01':[], 'G3-L06-B01':['G3-U06-B01','G3-U03-B01'],
 'G3-L07-R01':['G3-L02-B06','G3-L04-B03','G3-L06-B03'],
 'G3-L07-B01':['G3-L05-B01'],
 'G3-U02-E01':['G3-U02-B04'], 'G3-U02-E02':['G3-U02-B03'],
 'G3-U02-O01':['G3-U02-B03'], 'G3-U06-E01':['G3-U06-B02'],
 'G3-L03-E01':['G3-L03-B02'], 'G3-LP01-E01':['G3-LP01-B01','G3-L02-B03']
}.items():by[id]['dependsOn']=deps
e=by['G3-U02-E02'];e['anchor']['printedPages']='19';e['anchor']['pdfPages']='25'
e['anchor']['note']='三上印刷19页有连续除、括号内除法的等值比较；三下印刷28–30页（PDF34–36）为连除分组迁移。此课只作为三上选学提升，基础路径在三下通过分组掌握。'
e['practice'][3]=dict(level='变式',question='96÷8×2应添成96÷(8×2)吗？',answer='不应，等值写法为96÷(8÷2)。',reason='原式24；除以积得6，除以商得24。此处所有计算都在正整数整除范围。')
by['G3-L05-B01']['practice'][4]['answer']='一样多，苹果和香蕉各9票。'
by['G3-UP02-B01']['next']='三上搭配计数继续解释乘法原理；所供六上教材再正式用数对描述位置。'

sources=[]
for term,name in [('upper','义务教育教科书数学三年级上册.pdf'),('lower','义务教育教科书 数学 三年级下册.pdf')]:
    sources.append(dict(id='G3-'+term,path=f'research/source-textbooks/grade-3/{name}',pdfPages=114,edition='所供2022课标编写结构版本；不据文件时间推断版次',printedPageOffset=6))
data=dict(grade=3,status='内容初稿，待教学试用；未接入网站',editionNote='上下册均以所供实际目录为准；教材正文印刷页+6=PDF序号。先修低年级内容按诊断回补，不从数数强制重学。',sources=sources,units=units,lessons=lessons)
out.mkdir(parents=True,exist_ok=True)
(out/'grade-3.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
lines=['# 三年级逐课备课方案','',f'共 {len(lessons)} 课，{sum(len(l["practice"]) for l in lessons)} 道带答案和理由的练习。以本地上下册教材为主线；课时是家庭补充学习建议，不能代替学校课时量。','',
'B＝基础或教材原有拓展，E＝选学提升，O＝思想专题，R＝整理诊断。数学广角即使标 B，也可在该章基础掌握后选学。依赖只用于说明需要哪些知识，不锁定课程。','',
'每课建议 35 分钟：约 5 分钟检查先修、15 分钟情境与模型、10 分钟练习、5 分钟复述。前 4 题可当堂，后 2 题选做或间隔回顾；不要求一次做完。首次困难可拆为两次，不以计时判定掌握。','',
'页码均为印刷页；PDF序号另列。提升课引用附近教材作为来源锚点，不表示原创题目就是教材原题。','', '## 课程目录','', '| 单元 | 教材页 | 逐课顺序 |','|---|---|---|']
for u in units: lines.append('|'+u['id']+' '+u['title']+'|'+u['printedPages']+'|'+' → '.join(lid.split('-')[-1]+' '+by[lid]['title'] for lid in u['sequence'])+'|')
for u in units:
    lines += ['', '## '+u['id']+' '+u['title'],'',u['notes'],'']
    for id in u['sequence']:
        l=by[id];a=l['anchor'];lines += ['### '+l['id']+' '+l['title'],'',f'**定位：**{l["tier"]}；建议 {l["minutes"]} 分钟。教材{a["sourceId"]}印刷 {a["printedPages"]} 页 / PDF {a["pdfPages"]}。',a['note'],'', '**先修：**'+'；'.join(l['prerequisites'])+'；关联课：'+('、'.join(l['dependsOn']) or '可依诊断直接进入。'),'', '**目标：**'+l['objective'],'', '**真实问题：**'+l['realProblem'],'', '**为什么：**'+l['why'],'', '**模型操作：**'+l['model'],'','**讲解：**','']
        lines += [f'{i}. {s}' for i,s in enumerate(l['explanation'],1)]
        lines += ['', '**例题：**'+l['example']['question'],'']+[f'{i}. {s}' for i,s in enumerate(l['example']['steps'],1)]+['','答案：'+l['example']['answer'],'','**练习与讲评：**','']
        for i,q in enumerate(l['practice'],1):lines += [f'{i}. 【{q["level"]}】{q["question"]}',f'   答案：{q["answer"]} 理由：{q["reason"]}']
        lines += ['', '**易错：**'+l['misconception']['wrong']+' → '+l['misconception']['correction'],'', '**Kevin复述：**'+l['retell'],'', '**联系与去向：**'+l['next'],'']
(out/'grade-3.md').write_text('\n'.join(lines))
print(json.dumps(dict(grade=3,units=len(units),lessons=len(lessons),practice=sum(len(l['practice']) for l in lessons)),ensure_ascii=False))
