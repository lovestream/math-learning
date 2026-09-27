from pathlib import Path
import json,re,collections
HERE=Path(__file__).resolve().parent
scope={}
for filename in ['build.py','upper_tail.py','lower_number.py','lower_space.py','lower_fraction.py','lower_tail.py','supplements.py']:
    exec(compile((HERE/filename).read_text(),str(HERE/filename),'exec'),scope)
units=scope['units']; lessons=scope['lessons']; sources=scope['sources']; out=scope['BASE']

# 课程级别表示学习功能，不将必要的混版基础桥接当作选修门槛。
for obj in [*lessons,*units]:
    text=json.dumps(obj,ensure_ascii=False).replace('G5-L04P','G5-L10')
    for n in range(1,5):text=text.replace(f'G5-U10-E0{n}',f'G5-U10-B0{n}')
    text=text.replace('G5-U08-E01','G5-U08-B02').replace('G5-L07-E01','G5-L07-B02')
    obj.clear();obj.update(json.loads(text))
for l in lessons:
    l['tier']=l['id'].split('-')[-1][0]
    if l['id'] in ['G5-U08-B02','G5-L07-B02']:
        l['anchor']['type']='textbook'
        l['anchor']['note']='教材主线：可能性大小或复式折线统计图；含原创比较与判断任务。'
    if l['unitId']=='G5-U10':
        l['tier']=l['id'].split('-')[-1][0]
        l['bridge']=True
        l['anchor']['type']='extension'
    l['practiceUse']='前4题建议当堂；第5题可选挑战；第6题用于讲后复述或隔日回顾。6题为备选题库，不要求每天全部完成。'

byid={l['id']:l for l in lessons}
def canonical(s):return s.replace('U08-E01','U08-B02').replace('L07-E01','L07-B02')
def get(s):return byid['G5-'+canonical(s)]
def refs(*xs):return ['G5-'+canonical(s) for s in xs]
def order(u,*codes):
    unit=next(x for x in units if x['id']=='G5-'+u)
    unit['sequence']=refs(*codes)
order('U02','U02-B01','U02-B02','U02-B05','U02-B03','U02-E01','U02-B04')
order('U06','U06-B01','U06-B02','U06-B03','U06-B04','U06-B05','U06-B06','U06-O01','U06-R01')
next(x for x in units if x['id']=='G5-L10')['notes']='教材“探索图形”综合实践，放在长方体和正方体之后；编号L10用于与正式第四单元区分，不表示学期末才学。'
next(x for x in units if x['id']=='G5-L11')['notes']='教材“怎样通知最快”综合实践，放在分数加减后；按明确的一对一通知规则讨论，不等同现实通信速度。'
lessons=[byid[lid] for u in units for lid in u['sequence']]

deps={
'U01-E01':['U01-B01'],
'U02-B02':['U02-B01'],'U02-B05':['U02-B02'],'U02-B03':['U02-B02'],'U02-E01':['U02-B03'],'U02-B04':['U02-B05'],
'U03-B01':['U02-B01'],'U03-B02':['U03-B01'],'U03-B03':['U03-B01','U02-B02'],'U03-E01':['U03-B03'],'U03-B04':['U03-B02','U03-B03'],'U03-O01':['U03-B03'],
'U04-E01':['U04-B02'],
'U05-B02':['U05-B01'],'U05-E01':['U05-B02'],'U05-O01':['U05-B02','U05-E01'],
'U10-B01':['U05-B02'],'U10-B02':['U10-B01'],'U10-B03':['U10-B02'],'U10-B04':['U10-B03'],'U10-O01':['U10-B04'],
'U06-B01':['U04-B02'],'U06-B03':['U06-B01'],'U06-B04':['U06-B01','U06-B03'],'U06-B05':['U06-B03','U06-B04'],'U06-B06':['U06-B01'],'U06-O01':['U06-B03'],'U06-R01':['U06-B01','U06-B02','U06-B03','U06-B04','U06-B05','U06-B06'],
'U07-B01':['U04-B01','U04-B02'],
'U08-E01':['U08-B01'],
'U09-R01':['U03-B04','U05-B02','U10-B04'],'U09-R02':['U06-B05','U08-B01'],
'L01-R01':['U01-B01'],
'L02-B02':['L02-B01'],'L02-B03':['L02-B01'],'L02-E01':['L02-B03'],'L02-O01':['L02-B02'],'L02-E02':['L02-B02','L02-B03'],
'L03-B01':['U01-B01'],'L03-B02':['L03-B01'],'L03-B03':['L03-B01'],'L03-B04':['L03-B03'],'L03-B05':['L03-B04'],'L03-E01':['L03-B02','L03-B03'],'L10-O01':['L03-B02','L03-B03'],
'L04-B01':[],'L04-B02':['L04-B01','U03-B01'],'L04-B03':['L04-B01','L04-B02'],'L04-B04':['L02-B01'],'L04-B05':['L04-B03','L04-B04'],'L04-B06':['L02-B01'],'L04-B07':['L04-B03','L04-B06'],'L04-B08':['L04-B02','L04-B05','U03-B02'],'L04-E01':['L04-B01','L04-B02'],'L04-O01':['L04-B04','L04-B05'],
'L05-R01':['U04-B02'],
'L06-B01':['L04-B01','L04-B05'],'L06-B02':['L06-B01','L04-B07'],'L06-B03':['L06-B02'],'L06-E01':['L06-B03'],
'L11-O01':[],
'L07-B01':[],'L07-E01':['L07-B01'],
'L08-B01':[],'L08-O01':['L08-B01'],
'L09-R01':['L04-B05','L04-B07','L06-B03'],'L09-R02':['L03-B05','L06-B02','L07-B01']}
deps={canonical(k):v for k,v in deps.items()}
for l in lessons:l['dependsOn']=refs(*deps.get(l['id'][3:],[]))

# 题目中的时间跨度文字需与四组数据一致。
stat=get('L07-B02')['example']
stat['question']=stat['question'].replace('两班4月借书数','两班连续4个月的借书数')

# 目录覆盖用课本真实小节名，不以课程标题替代教材映射。
coverage={
'U01':[('按要求摆组合体、从不同方向观察','U01-B01'),('根据观察图复原及多种可能','U01-E01')],
'U02':[('小数乘整数','U02-B01'),('小数乘小数与积的数位','U02-B02'),('积的近似数','U02-B05'),('小数倍数关系、积与因数的大小','U02-B03'),('整数乘法运算律推广到小数','U02-E01'),('估算预算、分段收费、整理和复习','U02-B04','U09-R01')],
'U03':[('除数是整数的小数除法','U03-B01'),('循环小数、商的近似数','U03-B02'),('一个数除以小数','U03-B03'),('商与被除数的大小关系','U03-E01'),('按实际问题取近似数、整理和复习','U03-B04','U09-R01'),('多步数量关系的归一提升','U03-O01')],
'U04':[('轴对称','U04-B01'),('平移、旋转','U04-B02'),('用平移解决面积问题','U04-E01'),('整理和复习','U09-R02','L05-R01')],
'U05':[('用字母表示数与数量关系','U05-B01'),('公式、运算律、代入求值','U05-B02'),('含字母式的合并与等值表达','U05-E01'),('探秘百数表','U05-O01'),('整理和复习','U09-R01')],
'U10':[('跨版新增：等式性质与方程意义','U10-B01'),('跨版新增：一步方程','U10-B02'),('跨版新增：两步方程','U10-B03'),('跨版新增：列方程建模与检验','U10-B04'),('原创思想提升：代换与消元','U10-O01')],
'U06':[('平行四边形的面积','U06-B01'),('公顷、平方千米','U06-B02'),('三角形的面积','U06-B03'),('梯形的面积','U06-B04'),('组合图形面积','U06-B05'),('不规则图形面积估计','U06-B06'),('等底等高拓展','U06-O01'),('整理和复习','U06-R01')],
'U07':[('密铺及设计图案综合实践','U07-B01')],
'U08':[('确定与不确定事件','U08-B01'),('可能性大小与实验、整理和复习','U08-E01','U09-R02')],
'U09':[('数与运算、字母数量关系复习与关联','U09-R01'),('图形运动、面积、可能性与自我评价','U09-R02')],
'L01':[('按一幅或多幅视图搭几何体','L01-R01')],
'L02':[('因数和倍数的认识','L02-B01'),('2、5、3的倍数特征','L02-B02'),('质数和合数','L02-B03'),('奇偶规律与拓展','L02-O01'),('质因数分解提升','L02-E01'),('单元综合筛选与整理','L02-E02','L09-R01')],
'L03':[('长方体和正方体的认识','L03-B01'),('展开图、表面积与实际需要覆盖的面','L03-B02'),('体积意义、体积计算','L03-B03'),('体积单位间的进率','L03-B04'),('容积和容积单位、不规则物体体积','L03-B05'),('整理和复习、表面积变化提升','L03-E01','L09-R02')],
'L10':[('探索图形：涂色小正方体分类','L10-O01')],
'L04':[('分数的意义、单位1与分数单位','L04-B01'),('分数与除法、真分数假分数与带分数','L04-B02'),('分数的基本性质','L04-B03'),('最大公因数','L04-B04'),('约分','L04-B05'),('最小公倍数','L04-B06'),('通分与分数大小比较','L04-B07'),('分数与小数的互化','L04-B08'),('单位1的比较拓展','L04-E01'),('教材数学文化约分术的思想提升','L04-O01'),('整理和复习','L09-R01')],
'L05':[('旋转描述、作图、旋转设计','L05-R01')],
'L06':[('同分母分数加减法','L06-B01'),('异分母分数加减法','L06-B02'),('分数加减混合运算','L06-B03'),('运算律与简便计算','L06-E01')],
'L11':[('怎样通知最快综合实践','L11-O01')],
'L07':[('单式折线统计图','L07-B01'),('复式折线统计图','L07-E01')],
'L08':[('找次品的称量与分类','L08-B01'),('找次品策略、保证次数','L08-O01')],
'L09':[('因数倍数、分数和分数运算总复习','L09-R01'),('空间图形、统计及学习反思','L09-R02')]}
for u in units:u['coverage']=[dict(topic=c[0],lessonIds=refs(*c[1:])) for c in coverage[u['id'][3:]]]

# 进一步落实到已核实的小节锚点；印刷页始终与PDF序号分列。
anchor_updates={'U06-B01':'73–74','U06-B04':'83–86','L03-B04':'34–37','L04-B03':'57–59','L04-B06':'68–72'}
for code,pages in anchor_updates.items():
    l=get(code);l['anchor']['printedPages']=pages;l['anchor']['pdfPages']='–'.join(str(int(p)+6) for p in pages.split('–'))
    l['anchor']['note']='小节范围经本地PDF逐页OCR核对，相关公式和关键页面已目视复核；例题练习为原创。'

data=dict(grade=5,editionNote='严格以用户所提供两册PDF为教材证据。上册为“观察简单组合体—小数乘法—小数除法—图形运动—字母数量关系—多边形面积—可能性”的目录；下册为“观察物体（三）—因数倍数—长方体正方体—分数—图形运动（三）…”目录。两册主线存在观察/旋转重复，且没有独立简易方程章，采用诊断合并和显式方程桥接。版权页不能确认版次年份，不用PDF创建日期推断版年。',sources=sources,units=units,lessons=lessons,studyPolicy=dict(sessionMinutes='30–40分钟一课；每日30–60分钟可加10–15分钟复习或选做',selection='先做基础；E和O可按掌握情况选学，也可从数学思想索引进入；dependsOn表示先修建议，不是网站硬锁',review='错后当天讲清理由，次日选做变式；已理解内容按3天、7天、21天间隔复述或迁移；这是教学建议，不保证固定间隔适合每个孩子',duplication='观察与旋转上下册重合用R标记；整数运算律在小数和分数中为迁移；因数倍数、约分通分按用途串联；方程桥接作为必要基础且明确非PDF原章'),scopeNote='全部教材单元和综合实践均有教学位置；逐课为可审阅备课稿与首批六题题库，不声称替代课本所有练习或已经完成互动成品。')

ids=[l['id'] for l in lessons];assert len(ids)==len(set(ids))
for l in lessons:
    assert len(l['explanation'])>=3,(l['id'],'explanation')
    assert len(l['practice'])==6
    for p in l['practice']:assert p['question'] and p['answer'] and p['reason']
    for dep in l['dependsOn']:
        assert dep in ids,(l['id'],dep)
        assert ids.index(dep)<ids.index(l['id']),(l['id'],'order',dep)
        if l['tier']=='B':assert byid[dep]['tier'] in ['B','R'],(l['id'],'extension gate',dep)
for u in units:
    for c in u['coverage']:
        assert all(lid in ids for lid in c['lessonIds'])
out.mkdir(parents=True,exist_ok=True)
(out/'grade-5.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

md=['# 五年级数学逐课内容方案','',data['editionNote'],'',data['scopeNote'],'',f'共 {len(lessons)} 课，{len(lessons)*6} 道带答案与理由的备选练习；上册 {sum(l["id"].startswith("G5-U") for l in lessons)} 课，下册 {sum(l["id"].startswith("G5-L") for l in lessons)} 课。含跨版新增的 4 节方程基础桥接和 1 节代换提升。','', 'B 基础，E 本章提升，O 数学思想，R 复习迁移。E/O 是可选分支；课本中部分本身较深入的内容可标 E，仍在章节覆盖表内。建议先按主线B学会，再选择相关E/O。', '', '每课35分钟是备课参考，可按操作和复述完成情况拆为两次。前4题当堂选做，第5题挑战，第6题可留作隔日回顾。所有情境中的单位保留在答案里，不另设强制“选单位”步骤。','', '[教材证据与版本说明](sources-grade-5.md) · [机器可读同内容](grade-5.json)','', '## 教材主线与每课位置','', '| 单元 | 主线范围（印刷页） | 课程顺序 |','| --- | --- | --- |']
for u in units:md.append(f'| {u["term"]} {u["title"]} | {u["printedPages"]} | '+ ' → '.join(f'[{lid}](#{lid.lower()})' for lid in u['sequence'])+' |')
md += ['', '## 单元覆盖与逐课备课内容','']
for u in units:
    md += [f'### {u["id"]} {u["term"]}·{u["title"]}','',f'教材：{u["sourceId"]}，印刷页 {u["printedPages"]}。', '',u['notes'],'','| 教材小节／对应任务 | 教学位置 |','| --- | --- |']
    for c in u['coverage']:md.append('| '+c['topic']+' | '+ '、'.join(c['lessonIds'])+' |')
    for lid in u['sequence']:
        l=byid[lid];a=l['anchor']; e=l['example']
        md += ['',f'<a id="{lid.lower()}"></a>',f'#### {lid}　{l["title"]}','',f'**层次：{l["tier"]}｜建议 {l["minutes"]} 分钟**', '',f'教材锚点：{a["sourceId"]}，印刷页 {a["printedPages"]}，PDF第 {a["pdfPages"]} 页。类型：{a["type"]}。{a["note"]}', '', '**先修**：'+'；'.join(l['prerequisites'])+'。先修课：'+('、'.join(l['dependsOn']) or '无本年级强制先修；按上述能力诊断。'),'','**学会什么**：'+l['objective'],'','**真实问题**：'+l['realProblem'],'','**为什么研究／为什么成立**：'+l['why'],'','**操作模型**：'+l['model'],'','**讲解步骤**：','']
        md += [f'{i}. {s}' for i,s in enumerate(l['explanation'],1)]
        md += ['', '**原创例题**：'+e['question'],'']+[f'{i}. {s}' for i,s in enumerate(e['steps'],1)]+['','答案：'+e['answer'],'','**练习题库**（1–4 当堂，5 可选挑战，6 回顾）：','']
        for i,p in enumerate(l['practice'],1):md += [f'{i}. 【{p["level"]}】{p["question"]}',f'   - 答案：{p["answer"]}。理由：{p["reason"]}。']
        md += ['', '**容易误解**：'+l['misconception']['wrong']+' → '+l['misconception']['correction'],'','**Kevin自己讲回来**：'+l['retell'],'','**接下来与什么相连**：'+l['next'],'']
(out/'grade-5.md').write_text('\n'.join(md)+'\n')
print(json.dumps(dict(lessons=len(lessons),practice=sum(len(l['practice']) for l in lessons),units=len(units),tiers=dict(collections.Counter(l['tier'] for l in lessons)),upper=sum(l['id'].startswith('G5-U') for l in lessons),lower=sum(l['id'].startswith('G5-L') for l in lessons),files=['grade-5.json','grade-5.md']),ensure_ascii=False))
