"""Build the active grade-3 route and a five-lesson interaction specification."""
from pathlib import Path
from collections import defaultdict
import json

ROOT=Path(__file__).resolve().parents[3]; BASE=ROOT/'content/course-plan-v2'; OUT=ROOT/'docs/review'
d=json.loads((BASE/'grade-3.json').read_text());by={l['id']:l for l in d['lessons']}

# Textbook original headings stay visible. An extension may be a task inside a B lesson,
# not a duplicate course with a new ID. Every row explains the link rather than listing topics.
raw='''
U01|观察物体|看清正面、侧面、上面；区分看见部分与完整物体；追踪纸盒六面。|U01-B02:P07,U01-B03:P06|同一视图能来自不同物体；用另一方向或实折补证据。|信息是否足够、反例与实际验证|U01-B02,U01-B03
U02|混合运算|B01同级→B02先乘除→B03括号→B04/B05两步建模。只要求算对、讲清第一步和中间量。|U02-E01,U02-E03,U02-E02,U02-E04,U02-E05|由课本章末比较题进入等值添去括号与连续除，再用点阵体验运算律。|逆向推理、整体替换、不变量|U02-O01,U02-O02
U03|毫米、分米和千米|用尺读起终点；掌握毫米/厘米/分米/米/千米换算与路程估计。|U03-B01:P08,U03-B02:P05|从断尺量长度和标准段估计，追问换的是单位还是实物长度。|参照与不变量|U03-B01,U03-B02
UP01|曹冲称象的故事|克、千克、吨与读秤；固定条件下用可称的小物替代大物。|UP01-B02:P03,UP01-B02:P11|加入乘客破坏相等条件；比较不同质量砝码但总质量相同。|等量替换、控制条件|UP01-B02,U02-O02
U04|多位数乘一位数|口算拆分→一次进位→连续进位→0占位→估算与应用。|U04-B01:P06,U04-B05:P04,U02-E05|从19×4借20×4补偿，解释每组多算1；估大超过预算不能直接判不足。|分配、拆补、上下界|U02-E05,U04-B05
UP02|数字编码|理解编码各字段；按同一规则读位置、生成唯一编号。|UP02-B01:P05,UP02-B01:P06|每一层选择对应一个字段，从编码容量转向搭配计数与冲突核对。|有序枚举、分类|UP02-B01,U07-B01
U05|线和角|有限端点与延伸；比较线段；对齐顶点一边比较角；用直角分类。|U05-B03:P06,U05-B02:P06|系统列出三条射线两两成角；旋转整体与拉长边不改变角的大小。|有序枚举、不变量|U05-B03,U05-B02
U06|分数的初步认识|整体与等分→数小份→同分母加减→一组物品的分数→先一份后几份。|U06-E01,U06-B05:P06|原涂色不动只换分格；已知一份反推整体，连接倍数与逆向。|单位改变而量不变、逆向|U06-E01,U02-O01
U07|复习与关联|按错因选择计算、测量、分数的诊断；教材册末数学广角单独显示为子入口。|U07-B01:P06,U07-B01:P11|先完整枚举再排除受限搭配；前后两段路线分步相乘。|分类计数、有序枚举|U07-B01
L01|生活中的运动现象|整图对折重合；辨别平移与绕点旋转；实际剪纸体验。|L01-B01:P06,L01-B02:P06|枚举不同折痕；末位置相同不等于中途没运动。|完整验证、变与不变|L01-B01,L01-B02
L02|除数是一位数的除法|按计数单位除→高位余量换单位→余数验算→商0→连乘连除→归一归总。|L02-B03:P05,L02-B03:P06,L02-B06:P06|相同余数在坐车与整盒销售中决策不同；单价不变与总量不变决定路线。|归一归总、边界与不变量|L02-B06,U02-E02
L03|长方形和正方形|用边角判形；走完整外边界求周长；长方形和正方形的包含关系。|L03-E01|拼接处原计两次、现在不外露；有限候选拼法逐一比较。|分类、系统比较、补偿|L03-E01
L04|图形的面积|统一单位铺内部→按行列推出面积→平方单位进率；区分周长与面积。|L04-B03:P04,L04-B03:P05,L04-B03:P06|同面积不同周长，同周长不同面积；角部剪拼分别追踪边和面。|分割拼补、守恒、有限枚举|L04-B03,L03-E01
L05|数据的收集与整理|明确对象规则→不重不漏记录→单/复式表→分组边界→有范围的结论。|L05-B01:P06,L05-B02:P05|局部样本不能替代全体；不同组人数不同，不能只比达标人数。|分类、证据与反例|L05-B02,L07-B01
LP01|年、月、日的秘密|读年历、大小月与平闰年；24时计时和时长；端点与间隔分开。|LP01-E01|星期每7天复现，先算日期差，再取整周与余天；制作月历验证。|周期、余数、间隔计数|LP01-E01
L06|小数的初步认识|测量货币中的小数→同单位比较→一位小数加减，0占位不可漏。|L06-B01:P06,L06-B02:P06,L06-B03:P06|0.5米和0.50米是同量；数轴寻找中间数；进位仍沿用十进位。|单位迁移、不变量|L06-B01,U06-E01
L07|复习与关联|综合活动按需求、费用、时间、面积分别列量；册末重叠问题设子入口。|L07-B01:P05,L07-B01:P08|从正向扣重复到已知总人数反求交集；共同者最后必须保留一次。|容斥、逆向、建模检查|L07-B01,U02-O01
'''
routes=[]
for row in raw.strip().splitlines():
    short,title,core,links,connection,methods,methodlinks=row.split('|')
    unit=next(u for u in d['units'] if u['id']=='G3-'+short)
    ids=unit['sequence']
    route=dict(unitId=unit['id'],term=unit['term'],textbookTitle=title,
        sourceId=unit['sourceId'],printedPages=unit['printedPages'],
        textbookCore=core,coreLessonIds=[i for i in ids if by[i]['learningRole']=='textbook-core'],
        reviewLessonIds=[i for i in ids if by[i]['tier']=='R'],
        optionalExtensionRefs=['G3-'+x for x in links.split(',')],connection=connection,
        methods=methods,methodLessonIds=['G3-'+x for x in methodlinks.split(',')],
        entryRule='可直接进入任何节点；基础目标独立达标，不要求完成提升或方法专题。')
    if short in ['U07','L07']:
        route['textbookSubsection']={'title':'数学广角：'+('搭配问题' if short=='U07' else '重叠问题'),
            'printedPages':'101–102' if short=='U07' else '102–104','lessonIds':['G3-'+short+'-B01'],
            'note':'实际册末内容子入口，不冒充目录上的新编号单元；不另复制一份O课。'}
    routes.append(route)

gate=[
 ('D01','同级与第二步','计算36÷6×2，写出第一步和最终结果。','36÷6=6，再6×2=12。','不把6×2先算；不能只停在6。',['G3-U02-B01']),
 ('D02','先乘除与自查','计算40−4×6，保留首答，检查后再确认最终答。','先4×6=24，再40−24=16。','运算顺序按约定；不把36×6作为原式。',['G3-U02-B02']),
 ('D03','按题意列括号','红纸14张、蓝纸10张，把所有纸平均分给4人。每人几张？写一个综合算式，说明括号中的量。','(14+10)÷4=6张。','括号表示要平均分的总张数24。',['G3-U02-B03']),
 ('D04','两步中间量','每盒彩笔8支，买3盒后送出5支。还剩多少支？先说明每一步求什么。','先8×3=24支，再24−5=19支。','乘积是总支数，减的是同一种支数。',['G3-U02-B05']),
 ('D05','逆过程验算','盒中原有50张贴纸，取走16张又放回6张。剩多少？从结果倒着检查能否回到50。','40张；40−6+16=50。','依次撤销放回和取走，不把逆算和新题的规则混淆。',['G3-U02-B01','G3-U02-B04'])
]
diagnostics=[dict(id='G3-U02-'+i,label=label,question=q,answer=a,reason=r,lessonIds=lessons,
    phase='unit-diagnostic',scoring='adult_review',role='independent_unseen',
    exposureRule='讲解与常规练习不展示；仅单元检查发题。已看过答案的重做不能作为独立样本。') for i,label,q,a,r,lessons in gate]
concepts=defaultdict(list)
for l in d['lessons']:
    for c in l['concepts']:concepts[c['conceptId']].append({'lessonId':l['id'],'exposure':c['exposure'],'scope':c['scope']})
vertical=[
 dict(conceptId='arithmetic.parentheses.equivalent',grade3=['G3-U02-E01','G3-U02-E03'],laterReference=['G4-L03-E01'],boundary='三上两项、具体钱物、非负中间量；四下三项与字母。仅记录以后连接，不修改四年级。'),
 dict(conceptId='arithmetic.divide.product',grade3=['G3-U02-E02','G3-L02-B05'],laterReference=['G4-L03-E02'],boundary='三上选学体验；三下如未学提升则首次建立分组模型，已会则迁移；四下推广边界。'),
 dict(conceptId='arithmetic.laws.commute-associate',grade3=['G3-U02-E04'],laterReference=['G4-L03-B01','G4-L03-B02'],boundary='三上实物与具体数，分两小次；四下一般化。'),
 dict(conceptId='arithmetic.law.distribution',grade3=['G3-U02-E05','G3-U04-B01'],laterReference=['G4-L03-B03'],boundary='三上可选阵列解释，多位数乘法必要拆分另有完整模型，不依赖选学；四下字母通式。'),
 dict(conceptId='reasoning.whole-substitution',grade3=['G3-U02-O02'],laterReference=[],boundary='仅方框命名和代入；五六年级方程/分数迁移是规划方向，本轮不修改或声称已完成节点映射。')
]
pathway=dict(schemaVersion=1,scope='grade3-only',revision='2026-09-24',routes=routes,concepts=dict(concepts),verticalLinks=vertical,
  unitDiagnostics=diagnostics,
  releasePolicy={'firstPilot':['G3-U02-B01','G3-U02-B02','G3-U02-B03','G3-U02-E01','G3-U02-O01'],
    'firstCodeBatch':['G3-U02-B01','G3-U02-B03'],
    'note':'先写五课规格，先编码两课；B04/B05基础未学时用诊断决定是否补，不强推E01/O01。'},
  foundationGate={'taskIds':[q['id'] for q in diagnostics],
    'criterion':'独立完成5道代表题，至少包括括号列式解释和一次逆过程验算；自查改对与首答正确分别保留。未达标只标明目标和建议回补，不禁止进入提升。',
    'limit':'这五题只支持混合运算基础本次判断，不证明完整三年级或长期掌握。'},
  trial={'lessonMinutes':30,'optionalMaximumMinutes':60,'record':['questionUnderstood','modelPrediction','explanationInOwnWords','independentTransfer','selfCorrection','helpLevel','durationForPlanningOnly'],
    'success':'Kevin能不看动画解释关系、完成未曝光的独立题；家长观察和原话作为证据，不以速度奖励。',
    'failureAction':'读不懂则改写题干；只会操作则减操作并增联系；提示后会但独立题失败则回补；E/O过难可结束。'})
(BASE/'grade-3-pathway.json').write_text(json.dumps(pathway,ensure_ascii=False,indent=2)+'\n')

lines=['# Kevin 三年级：教材主线与分层实施路线','','修订：2026-09-24。仅修订三年级；四至六年级课程文件冻结。本文件是教案与实施规约，不表示网站已上线。','',
 '## 采用的课程组织','',
 '**年级 → 上/下册 → 实际教材单元 → 先学基础 → 本章提升 → 方法专题 → 诊断回顾**。本章提升可以是一节独立课，也可以引用已有基础课中的一组挑战题；不为了凑层级而复制内容。',
 '教材是主线，基础是完成教材核心任务所需的最低目标；提升解释等值、变式、反例或更有效的方法。方法工具箱索引到同一lessonId和taskId，不另外生一套题和积分。',
 '60个内容节点不等于60次必修课：包含诊断和选学。有的节点分两次；同一基础已经有独立证据，可诊断后跳过。','',
 '## 按实际教材目录逐章安排','','| 册别/教材目录项 | 基础主线 | 从本章长出的提升（具体入口） | 数学思想与连接 |','|---|---|---|---|']
for r in routes:
    term='三上' if r['term']=='upper' else '三下'
    lines.append(f'| {term}·{r["textbookTitle"]}（印刷{r["printedPages"]}） | {r["textbookCore"]} | {r["connection"]}；入口：'+ '、'.join(r['optionalExtensionRefs'])+f' | {r["methods"]}；'+ '、'.join(r['methodLessonIds'])+' |')
lines += ['', 'Pxx表示该课内的题目，不是额外新课。B/E/O/R是教研标签；孩子界面显示“基础/提升/思想/回顾”，不要求理解代码。上、下册的数学广角显示为册末对应子入口，不杜撰教材编号单元。','',
 '## 混合运算：三种任务必须分开','','| 类型 | 要求 | 正例 | 反例或边界 | 对应课 |','|---|---|---|---|',
 '| A 按题意改变顺序 | 可以改变原式的值 | (12+8)÷4表示先合并再分 | 12+8÷4=14，表示另一个数量结构 | B03 |',
 '| B 等值添去括号 | 值与原数量关系都要保持 | 20−(8−3)=20−8+3 | 20−8−3=9，与原式15不同 | E01/E03；E02处理除法 |',
 '| C 用运算律改写 | 先说明重排/分组/分割依据 | 7×(5+3)=7×5+7×3 | 7×5+3漏18；除以和不能照套 | E04/E05 |',
 '', '数学约定规定怎样读写运算顺序；生活情境解释怎样列式；运算律用数量守恒或完整阵列说明。三种说明不能混用。','',
 '## 三年级混合运算的基础检查（独立保留的5题）','',
 '这5题在课内720题之外，讲解时不预先展示。参考答案仅供家长审核，学生提交最终答后才显示。']
for q in diagnostics:lines += ['',f'### {q["id"]} {q["label"]}',q['question'],'',f'参考：{q["answer"]} 理由：{q["reason"]}；回补：'+ '、'.join(q['lessonIds'])+'。']
lines += ['', '## 概念复用与后续边界','','同一conceptId表示同一类关系；exposure记录本节点的教学意图，实际是否跳过仍需Kevin的目标级证据。first=本课程首教，deepen=深化，transfer=迁移，review=复习；已在低年级学过的概念不宣称人类或Kevin第一次接触。','',
 '| 稳定概念 | 三年级位置 | 以后参考位置（冻结，不作本轮修订） | 边界 |','|---|---|---|---|']
for v in vertical:lines.append('| '+ ' | '.join([v['conceptId'],'、'.join(v['grade3']),'、'.join(v['laterReference']) or '规划方向',v['boundary']])+' |')
lines += ['', '## 本次任务与退出','',
 '每课教案给出3道最低代表题、其他备选题及具体复述问题。首答后先自查，再提交最终答；孩子可以随时结束，下一课始终可选。基础“本次达标”、提升挑战、迁移、隔日保持分开记录。',
 '推荐30分钟：到期回顾最多3题约5分钟、阅读/操作约12分钟、目标题约10分钟、自查复述约3分钟。分两次的课分摊模型和题目；60分钟是家庭可设上限，不是系统要填满的时长。超额回顾保留原dueDate顺延，不生成一堆必须当天清空的任务。',
 'P09–P12在核心完成后的第1/3/7/21天开放。若回顾用了帮助，保留该事实，次日从未曝光的同目标备选题选修复题；不能用原题看过答案后的重做冒充独立保持。当前每课四道预约题不是无限自适应题库，备用题用尽就进入成人确认或后续补题，不自动刷同题。','',
 '## 首批实施与试学','',
 '五课规格：B01/B02/B03/E01/O01。第一批只编码B01与B03，验证连续课堂、先后步骤、首答自查、保存恢复及独立任务。接着B02，基础有证据再选E01，O01可选；同时按教材补B04/B05基础建模。新提升E03/E02/E04/E05/O02随准备程度逐个进入，不要求本周做完。',
 '每次试学记录题意是否听懂、预测、原话解释、无提示迁移、自查、帮助等级。所需时间只用于缩减负担。先看证据是否表明理解，再决定扩展其他三年级单元。四至六年级本轮不修、不批量迁移。']
(OUT/'Kevin三年级_教材主线与分层实施路线.md').write_text('\n'.join(lines)+'\n')

# Finite state transitions for five priority lessons. This is implementable design data.
flows={
 'B01':[
 ('ready','select(6×2)','wrong-order','保留首选，显示“同级从左向右”；原式不变，不提前给8。'),
 ('ready / wrong-order','select(24÷6), enter(4)','step-one','把原片段替换成4，保留×2；记录firstOperation。'),
 ('step-one','enter(4) as final','missing-step','显示目标“整个算式的值”，高亮尚未处理×2。'),
 ('step-one / missing-step','enter(8)','explain','显示完整等值链24÷6×2=4×2=8，提问谁先谁后。'),
 ('explain','save explanation, hide model','independent','独立题P05，必须未曝光；保存原话，不按关键词自动通过。')],
 'B02':[
 ('ready','select(4+3)','quantity-mismatch','记录选中支数与盒数，问这两个数是否同种量；不永久诊断。'),
 ('ready / quantity-mismatch','select(3×6), enter(18)','step-one','展示4+18，标18只为盒内支数。'),
 ('step-one','submit final 18','missing-step','高亮盒外4支，要求自行检查余下运算。'),
 ('step-one / missing-step','enter(22)','explain','要求分别说明通用顺序约定和本情境列式理由。'),
 ('explain','hide model','independent','另题P08改为先除再加；不能继续沿用乘法动画。')],
 'B03':[
 ('ready','select mode A','combine-first','标题“按题意添括号，可改变值”；初态两堆12和8枚。'),
 ('combine-first','group(12+8), pack(size=4)','modeled','20枚分5袋，式子(12+8)÷4；每个袋恰4枚。'),
 ('combine-first','divide only 8, add remaining12','units-conflict','保留12枚与2袋两类标签，不能合成14袋。'),
 ('modeled','switch comparison','contrast','12个已装袋加8枚，每4枚1袋，得到14袋；显式换了情境。'),
 ('contrast','save explanation, hide model','independent','P05从“合并再分”换成“剩余再分”；无需使用E层符号变换。')],
 'E01':[
 ('ready','select mode B','net-cost','标题“等值去括号：余额不变”，20枚余额，标价8优惠3。'),
 ('net-cost','return 3 from tentative8','net-known','待扣区剩5，原余额仍20；还未实际付款。'),
 ('net-known','pay5','first-path','余额15，记录20−(8−3)；保留拟扣区与余额区分。'),
 ('first-path','reset comparison; pay8; refund3','same-value','20→12→15，与一次扣5相等；显示20−8+3。'),
 ('first-path','reset comparison; pay8; pay3','changed-value','20→12→9，清楚标“另一个过程”；不以错误操作取消原答案。'),
 ('same-value / changed-value','explain refund; hide model','independent','纸笔专用T01：30−(12−4)，改无括号并解释+4；答案22。')],
 'O01':[
 ('ready','read error process','reverse-last','错流程□→加7→乘4→44；正确原式始终另外显示7+□×4。'),
 ('reverse-last','subtract7 first','wrong-inverse-order','请指出实际最后一步；不把37当中间的正确值。'),
 ('reverse-last / wrong-inverse-order','divide4, enter11','reverse-first','44÷4=11，撤销最后一次乘4。'),
 ('reverse-first','subtract7, enter4','verify-both','□=4；需沿错误流程得到44，再算正确原式23。'),
 ('verify-both','record both results, hide flow','independent','P05换成3+□×6的错流程，不显示逆向箭头。')]
}
repair={
 'B01':('只交第一步结果','48÷8×2中，6表示第一步结果还是整式结果？整式还剩哪一步？','第一步6，还需×2得12。','能选对步骤但漏末步→自查支持；步骤也不清→回到同级读取。'),
 'B02':('先做加减','先不计算，指出18−12÷3第一步该选哪一段。','12÷3。','若选对但原题错，查计算/抄符号；仍选错才建议回看顺序约定。'),
 'B03':('漏写括号','18枚与6枚合并，每4枚一袋；要分的是6枚，还是全部24枚？','全部24枚，应(18+6)÷4。','能说整体但漏符号→记录表达支持；整体也错→回合并实物。'),
 'E01':('退款也用减','先付12元又退4元，退款让钱包的钱增加还是减少？','增加；净付8元。','能解释却写错→检查符号；说减少→回余额动作。'),
 'O01':('倒推顺序未倒转','原过程先加3再乘2，撤销时先撤哪一步？','先撤最后乘2，用除2。','分清动作但算错→算术检查；仍从第一步撤→回放流程。')
}
for short in flows:
    l=by['G3-U02-'+short]
    l['interaction']['stateMachine']={'initial':'ready','transitions':[dict(state=s,event=e,next=n,feedback=f) for s,e,n,f in flows[short]],
       'finalStates':['independent'],'resetRule':'重置只清教具临时状态，不覆盖作答证据；切换任务类型重新载入数据与标题，不继承上一模式通过状态。'}
    obs,q,a,r=repair[short]
    l['diagnosticFollowup']={'observation':obs,'question':q,'answer':a,'interpretation':r,'confidence':'possible_not_certain','adultOverride':True}
    if short=='E01':
        l['interaction']['withdrawal']={'action':'隐藏所有代币、箭头与前题解答。','taskId':l['id']+'-T01','question':'计算30−(12−4)，写成一个等值的无括号算式，并解释为什么出现+4。','answer':'30−12+4=22。','reason':'若先扣12，相比实扣8多扣4，需要加回。','role':'unseen_transfer','scoring':'adult_review'}

for l in by.values():
    l['interaction']['withdrawal']['exposureRule']='本题预留到教具撤除后，早先选题跳过它；若已曝光则只记练习，改选未曝光且经审核的同目标题，题库耗尽时成人确认，不伪造独立证据。'
    l['contentVersion']='g3-review-20260924.1'
(BASE/'grade-3.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

story=['# Kevin 三年级混合运算：五课交互与试学规格','','2026-09-24。状态：规格已写，尚未编码/试学。所有“显示、点击、反馈”均为待实现行为。复用现有连续阅读课堂，下面是同一页面的五段阅读/操作状态，不改成强制逐屏播放。','',
 '## 共用课堂顺序与状态','',
 '①读清任务、作预测 → ②操作并观察数与图同步 → ③比较错误/边界 → ④自己解释 → ⑤收起帮助做独立题。可回看正文；一旦回看提示，独立性记录随之变化。',
 '始终显示任务目标A改变顺序/B保持值/C运算律。括号实验室有“按题意改变顺序”和“保持值不变”两个显式按钮；切换后重置模型、标题、题目，清楚说明正在做不同任务。C为独立运算律页签，避免一个按钮把三者混起来。',
 '点击与拖拽等价，键盘可操作。每个数值状态由受限算式树计算，同步更新表达式和图形；禁止eval任意字符串。错动作可见且可撤销，永不修改题目参考答案。',
 '操作事件只证明做过动作；独立求解、解释、迁移、间隔保持分别记录。首答提交后出现“自己检查一下”而不透露对错；最终提交再反馈。保存firstAnswer/finalAnswer/selfCorrection/helpLevel/modelStateVersion；帮助事件必须在揭示前持久化或标本次有帮助。','']
for short in flows:
    l=by['G3-U02-'+short];spec=l['interaction'];r=l['diagnosticFollowup'];w=spec['withdrawal']
    story += [f'## {l["id"]} {l["title"]}','',
        f'教材印刷{l["anchor"]["printedPages"]} / PDF {l["anchor"]["pdfPages"]}；{l["anchor"]["note"]}',
        '**孩子看见的任务：**'+l['realProblem'],'**初始状态：**'+spec['initialState'],'**动作：**'+spec['learnerAction'],
        '**可观察变化：**'+spec['observableChange'],'**解释问题：**'+spec['question'],'**预期理由：**'+spec['expectedExplanation'],'',
        '| 当前状态 | Kevin事件 | 下一状态 | 画面与教学反馈 |','|---|---|---|---|']
    for t in spec['stateMachine']['transitions']:story.append('| '+ ' | '.join(t[k] for k in ['state','event','next','feedback'])+' |')
    story += ['',f'**撤除帮助后的独立题 {w["taskId"]}：**{w["question"]}',f'参考：{w["answer"]}；{w["reason"]}',w['exposureRule'],'',
        f'**观察到“{r["observation"]}”之后的区分性补问：**{r["question"]}',f'参考：{r["answer"]}；{r["interpretation"]}。家长可改判断，系统只写“可能需要……”而非能力定论。','',
        '**本次退出：**'+l['teachingContract']['exitRule'],'**回补：**'+l['teachingContract']['pauseRule'],'']
story += ['## 试学记录与验收','',
 '| 观察项 | 留什么证据 | 失败时改什么 |','|---|---|---|',
 '| 题意 | Kevin原话复述谁有什么、问什么 | 先改题干，不用更多动画掩盖含混 |',
 '| 操作 | 操作前预测、事件、操作后解释 | 会点但说不清时，强化图与数量对应 |',
 '| 独立迁移 | 未曝光题的首答/自查/最终答与帮助 | 不把照抄模型答案记成会；回补再换题 |',
 '| 括号边界 | 能区分改变值与等值改写，指出一个反例 | 回到两个明确任务按钮 |',
 '| 保持 | 后续预约题是否独立 | 错误只定位到目标，不抹去已有成绩 |',
 '| 实际体验 | 宠物无覆盖、按钮可键盘操作、退出后恢复 | 修具体阻碍，不以文章稿推断视觉已验收 |','',
 'E01专用T01是额外1道独立迁移检验；与720道课内题及5道单元诊断分开统计，均须审核并按版本保存。P05等预留题不是额外题，不能重复计数。']
(OUT/'Kevin三年级_混合运算五课交互规格.md').write_text('\n'.join(story)+'\n')
print('Wrote 17 textbook routes, concept registry, 5 diagnostics and five state-machine storyboards')
