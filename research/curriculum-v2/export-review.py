"""Export active grade 3 and preserve frozen grade 4–6 text; never writes frozen sources."""
from collections import Counter
from pathlib import Path
import json,re,hashlib
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'content/course-plan-v2';OUT=ROOT/'docs/review'
plans=[json.loads((BASE/f'grade-{g}.json').read_text()) for g in (3,4,5,6)]
g3=plans[0];by={l['id']:l for p in plans for l in p['lessons']}
audit=json.loads((BASE/'audit-results.json').read_text())
g3audit=json.loads((BASE/'grade-3-audit.json').read_text())['summary']
pathway=json.loads((BASE/'grade-3-pathway.json').read_text())
thinking=json.loads((BASE/'grade-3-thinking.json').read_text())
assert not audit['errors'] and not audit['warnings'] and not audit['arithmeticFlags']
assert not g3audit['errors']
assert g3audit.get('AIPending',0)==0,'AI editorial review stale; review changed questions before export'
assert g3audit['taskAuditStatusCounts'].get('needs_revision',0)==0,'Unresolved task revisions'
for p,h in json.loads((ROOT/'research/curriculum-v2/grade3-revision/frozen-grades.json').read_text()).items():
    assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h,p

DESIGN='Kevin数学学习网站_设计与实现审核稿.md'
FULL='Kevin三至六年级课程_完整教案审核稿.md'
THREE='Kevin三年级课程_完整教案审核稿.md'
DATE='2026-09-25'
def cell(s):return str(s).replace('|','／').replace('\n',' ')
def shift(text,n=1):return re.sub(r'^(#{1,5}) ',lambda m:m[1]+'#'*n+' ',text,flags=re.M)
def lesson_md(lid):
    s=(BASE/f'grade-{lid[1]}.md').read_text();a=f'<a id="{lid.lower()}"></a>';start=s.index(a)
    ends=[i for i in [s.find('\n<a id="',start+len(a)),s.find('\n## ',start+len(a))] if i!=-1]
    return s[start:min(ends) if ends else len(s)].strip()
def counts(items):
    lines=['| 年级 | 课数 | B | E | O | R | 课内题 | 分日回顾题 | 本轮状态 |','|---|---:|---:|---:|---:|---:|---:|---:|---|']
    for p in items:
        c=Counter(l['tier'] for l in p['lessons']);n=len(p['lessons'])
        lines.append('| '+' | '.join(map(str,[p['grade'],n,c['B'],c['E'],c['O'],c['R'],sum(len(l['practice']) for l in p['lessons']),n*4,'已修订，待编码/试学' if p['grade']==3 else '冻结旧稿，未修改']))+' |')
    return '\n'.join(lines)

index=[]
for u in g3['units']:
    term='上册' if u['term']=='upper' else '下册'
    index += ['',f'### {u["id"]} · {term} · {u["title"]}','',f'教材印刷{u["printedPages"]}；来源{u["sourceId"]}。',u['notes'],'',
     '| 课程ID | 层级 | 课题 | 最低证据/范围 |','|---|---|---|---|']
    for lid in u['sequence']:
        l=by[lid];index.append('| '+' | '.join(cell(v) for v in [lid,l['tier'],l['title'],l['teachingContract']['minimumEvidence']])+' |')
samples=['G3-U02-'+s for s in ['B01','B02','B03','E01','O01']]
design=(OUT/'design-review-template.md').read_text().replace('{{COURSE_INDEX}}',counts([g3])+'\n'+'\n'.join(index)).replace('{{SAMPLE_LESSONS}}','\n\n'.join(lesson_md(i) for i in samples))
assert not re.search(r'\{\{[A-Z_]+\}\}',design)
(OUT/DESIGN).write_text(design)

intro=['# Kevin 三年级课程：完整教案审核稿','',f'> {DATE}根据外审修订。本轮仅三年级；四至六年级不改。本稿不含Kevin真实学习档案。',
 '> 60课、720道课内题，其中240道分日回顾；另5道单元诊断、1道专用独立迁移检验，再有60道思维收尾题，共786个任务。教案与操作规约已写，未接入网站或经过Kevin试学。','',
 '## 阅读与审核边界','',
 '教材单元是主入口。B先完成必要基础，E解释变式与边界，O整理复用方法，R独立诊断。E/O不锁B，不因积分开关内容。课题旁保留教材印刷页与PDF页，常规题由项目原创；思维附录含参考暑假专项方法后改写的题，逐题标来源。',
 '每课给出最低证据、3道代表题、可选题、复杂课分次、七环节模型与撤除教具后的完整独立题。前8题为当堂备选；P09–P12分别第1/3/7/21天，不是当天任务。预留的独立题先不展示，避免把刚讲过的题拿来证明迁移。',
 'audit=auto_checked只说明结构筛查；另有AI题意和答案复核，不等于human_checked。当前786题具名成人确认0题，真实试学0课；开放解释只给参考和关键数量关系，不强行自动判分。首批实际发出的题先审核，再试学两课，不要求一口气人工审完全年级。思维题每次最多一道，按兴趣与准备程度选。',
 f'具体网站设计见《{DESIGN}》，章节连接见《Kevin三年级_教材主线与分层实施路线.md》，五课状态机见《Kevin三年级_混合运算五课交互规格.md》。','',
 '## 内容与检查数量','',counts([g3]),'',
 f'专门数值断言{g3audit["automatedArithmeticFixtures"]}组通过，结构引用错误{len(g3audit["errors"])}；这不替代语义/年龄适配和课堂验证。first/deepen/transfer/review是概念节点的教学角色，不依据角色自动判Kevin已经会了。','']
three='\n'.join(intro)+'\n'+shift((BASE/'grade-3.md').read_text())+'\n## 附录：混合运算基础的独立诊断\n\n'
for q in pathway['unitDiagnostics']:
    three += f'### {q["id"]} {q["label"]}\n\n{q["question"]}\n\n参考：{q["answer"]} 理由：{q["reason"]}\n\n审核：{q["audit"]["status"]}；{q["exposureRule"]}\n\n'
three += '## 附录：三年级教材核对\n\n'+shift((BASE/'sources-grade-3.md').read_text(),2)
(OUT/THREE).write_text(three)

full=['# Kevin 三至六年级课程：完整教案审核稿','',f'> {DATE}合订更新：只更新三年级；四至六年级章节与来源原文冻结保留。优先审核三年级独立文件，不把其他年级视为本轮已修订。',
 '> 全部教案尚未接入网站。四至六年级的旧状态、页码和课堂建议是上次稿件快照，本轮未重新验证。','',counts(plans),'',
 '三年级新增5道诊断、1道专用迁移题及60道思维收尾题不计入表中课内题；其他年级没有增加任务。合订共281课、3372道课内题，不能用总量代表审核通过。','',
 '<a id="grade-3"></a>','',shift(three),'']
for p in plans[1:]:
    g=p['grade'];full += [f'<a id="grade-{g}"></a>','',f'> {g}年级冻结原稿：以下内容本轮不修改。','',shift((BASE/f'grade-{g}.md').read_text()),'']
full += ['## 附录：冻结的四至六年级来源记录','']
for g in (4,5,6):full += [shift((BASE/f'sources-grade-{g}.md').read_text(),2),'']
fulltext='\n'.join(full)
(OUT/FULL).write_text(fulltext)

readme=f'''# 给ChatGPT审核的材料（本轮仅三年级）

修订日期：{DATE}。用户提供的审计原文《Kevin数学课程与网站_教材对照审计及修改意见_20260923.md》保持不动。

建议先上传《{DESIGN}》和《{THREE}》。需要检查交互再加《Kevin三年级_混合运算五课交互规格.md》；全单元修订先看《Kevin三年级_全单元质量复查与改写记录.md》及《Kevin三年级_全单元提升题预览.html》。新增图文预览可打开《Kevin三年级_提升题图文预览.html》，暑假20天对应关系与修订原因见《Kevin三年级_暑假提升题对照与修订说明.md》。想快速看全年主线则看《Kevin三年级_教材主线与分层实施路线.md》。提升与奥数60题可单独看《Kevin三年级_提升与奥数思维题.md》。审计回应、检查数量和待实现边界见《Kevin三年级_审计回应与核验记录.md》。

原《{FULL}》也已同步三年级部分；四至六年级原稿冻结，不作为本轮修订范围。不要同时上传三年级独立稿与合订稿，让相同内容重复占用上下文。

建议审核提示：

> 只审核三年级。请沿实际教材单元检查基础是否完整、最低代表题是否匹配、提升是否从本章自然延伸、A改变顺序/B等值改写/C运算律是否分清。同时检查2026-09-25全单元改写记录中的48道题：是不是增加了关系、条件、反例、枚举或优化，而不是仅多算几步；图与题干是否一致。优先逐题检查五课B01/B02/B03/E01/O01及新增E03/E04/E05/O02。指出具体lessonId/taskId、原句、问题、反例或正确答案、建议替换文本。不要把auto_checked当教师审核，也不要把规格当已上线。开放题请说明可接受的其他回答，教学效果请说明要从Kevin试学观察什么。

## 维护与再生成

权威内容为content/course-plan-v2/grade-3.json、grade-3-pathway.json、grade-3-thinking.json；design-review-template.md为设计模板。四至六年级保持冻结。

~~~sh
python3 research/curriculum-v2/grade3-revision/build-quality-map.py
python3 research/curriculum-v2/grade3-revision/render-unit-preview.py
python3 research/curriculum-v2/grade3-revision/check-summer.py
python3 research/curriculum-v2/grade3-revision/check.py
python3 research/curriculum-v2/render-plans.py --grade 3
python3 research/curriculum-v2/audit.py
python3 research/curriculum-v2/export-review.py
~~~

check.py核对静态AI审核摘要与当前题文；改过的题不能靠重新运行脚本自动获得AI/人类语义审核。grade3-revision中的revise.py/specifications.py/pathway.py/update-design.py是本次编辑迁移的过程记录，不是以后每次导出的前置步骤；不要重跑来覆盖后续逐题修订。若改路径图或状态机，需同步对应Markdown，再导出主稿。
'''
(OUT/'README.md').write_text(readme)

# Export completeness is not a test of pedagogical effectiveness.
for l in g3['lessons']:
    assert f'| {l["id"]} |' in design,l['id']
    assert three.count(f'<a id="{l["id"].lower()}"></a>')==1,l['id']
for lid in by:assert fulltext.count(f'<a id="{lid.lower()}"></a>')==1,lid
for q in [q for l in g3['lessons'] for q in l['practice']]:assert q['id'] in three,q['id']
for q in pathway['unitDiagnostics']:assert q['id'] in three,q['id']
assert 'G3-U02-E01-T01' in three
for q in thinking['tasks']:
    assert three.count(f'<a id="{q["id"].lower()}"></a>')==1,q['id']
for name in [DESIGN,THREE,FULL]:
    s=(OUT/name).read_text();assert len(re.findall(r'^~~~',s,re.M))%2==0
    print(f'{name}: {(OUT/name).stat().st_size:,} bytes')
print('Verified active 60 lessons / 786 tasks; combined 281 lessons; frozen grades untouched.')
