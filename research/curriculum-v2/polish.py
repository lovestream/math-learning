from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'content/course-plan-v2'
data=[json.loads((BASE/f'grade-{g}.json').read_text()) for g in (3,4,5,6)]
all_l={l['id']:l for d in data for l in d['lessons']}
def q(id,i,text,answer=None,reason=None):
 p=all_l[id]['practice'][i];p['question']=text
 if answer is not None:p['answer']=answer
 if reason is not None:p['reason']=reason
q('G3-U01-B03',5,'把6个相同正方形一字排成长条，能只沿格线折成封闭正方体吗？','不能。','一字长条围过四个侧面后会重叠，不能同时补出上下两个面；可以用纸试折验证。')
all_l['G3-L02-B01']['misconception']['wrong']='把被除数里每个数字分别除，再直接拼成答案。'
q('G3-U06-B04',1,'8支笔平均分成4组，每组有几支？')
q('G3-U06-E01',1,'同一纸带涂了4小格，每2个相邻小格合成1大格，涂色成为几大格？')
q('G3-U06-E01',2,'同一条纸带原来平均分8小格，涂了4格；每2小格合为1大格。涂色占整条的分数从4/8改写成多少？')
q('G3-L05-B02',1,'阅读时长按0–9、10–19、20及以上分组，人数依次为2、4、2人，一共几人？')
q('G5-U10-O01',1,'x+y=10，x+2y=14。求x。')
l=all_l['G5-L07-E01'];l['example']['question']='1至4月，两班每月借书数依次为甲20、30、25、40本，乙25、25、30、35本。哪个月相差最大？'
q('G5-L07-E01',0,'两株植物第1周高度分别是A株4厘米、B株5厘米，谁高，高多少？')
q('G5-L07-E01',1,'两株植物第4周高度分别是A株10厘米、B株8厘米，谁高，高多少？')
q('G5-L07-E01',3,'A株连续四周高度依次为4、6、8、10厘米，能保证下一周必定12厘米吗？')
q('G5-L07-E01',4,'同一坐标系中，两株植物的高度折线在某次记录时相交，说明什么？')
q('G6-U01-E01',0,'从A先向东到B，再从B向北到C，描述第二段起点应选A还是B？','B。','第二段从当前位置B开始。')
q('G6-U01-E01',2,'从同一起点先向东走200米，再向西走50米，实际一共走了多少米？')
q('G6-U01-E01',4,'从A先向东到B，再向北到C。返回时若先向西再向南到A，是否沿原路返回？','不是。','原路返回应先从C向南到B，再向西到A。')
q('G6-U07-B03',1,'教学假设：本金500元，单利年利率2%，无费用，存两年利息多少？')
q('G6-U08-R01',1,'同样人数和天数，用水从500升降到400升，以原用水量为基准，节水率多少？')
q('G6-L04-B02',1,'圆柱半径2厘米、高5厘米，π取3.14。做无盖笔筒需计算侧面和一个底面，共多少平方厘米？')
q('G6-L04-B02',2,'圆柱半径2厘米、高5厘米，π取3.14。封闭圆柱的全部表面积是多少？')
q('G6-L06-B01',3,'比例3:4=6:8的内项积和外项积各是多少？')
q('G6-L06-B06',1,'正方形按3:1放大，每条边变成原来的3倍，面积是原来的几倍？')
v=all_l['G6-L04-E01'];v['example']['question']='直壁圆柱容器底面积30平方厘米，水深8厘米。水不洒漏地全部倒入底面积48平方厘米且足够高的直壁圆柱杯，水深多少？'
v['prerequisites']+=['本课容器均为直壁圆柱，液体不压缩；若无另外说明则不洒漏、不溢出']
q('G6-L04-E01',0,'直壁圆柱容器底面积10平方厘米，水深6厘米，水量多少立方厘米？')
q('G6-L04-E01',1,'60立方厘米水全部倒入底面积15平方厘米、足够高的直壁圆柱杯，水深多少厘米？')
q('G6-L04-E01',2,'同样体积的水放入直壁圆柱容器，底面积扩大为2倍，水深怎样变？')
q('G6-L04-E01',5,'直壁圆柱容器底面积40平方厘米。物体完全浸没、不吸水且无水溢出，水面升1.5厘米，物体体积多少？')
all_l['G4-L03-B02']['dependsOn']=['G4-U04-B01']
all_l['G4-L03-B02']['prerequisites']=['多位数乘法的点阵与分组模型；积变化选学课不是必经门槛']
l=all_l['G4-L03-E01'];l['title']='从两项到多项：把去添括号的理由写完整'
l['objective']='在三上具体两项变形基础上，推广到三项括号和字母记录；已会两项者直接做诊断，不重复整课。'
l['explanation']=['先诊断a−(b+c)与a−(b−c)的数量意义；未掌握者回补G3-U02-E01。',
'再看150−(48−12+9)：先扣48、退回12、再扣9，去括号后150−48+12−9。',
'概括a−(b−c+d)=a−b+c−d；加号前括号内加减不变。字母只是记录同一规律，本课数值题选取中间量非负的自然数。']
l['example']={'question':'150元，要支付48元的物品，优惠12元，再支付9元包装费。余款怎样写成含括号与不含括号的等值式？','steps':['实际支付48−12+9=45元，所以余款150−(48−12+9)。','展开为150−48+12−9，得105元；核对150−45=105。'],'answer':'105元；150−(48−12+9)=150−48+12−9。'}
q('G4-L03-E01',4,'把150−48+12−9的后三项放到一个减号后的括号里，怎样写？','150−(48−12+9)。','添加括号必须保留净扣除45元。')
q('G4-L03-E01',5,'a−(b−c+d)去括号后怎样写？用a=150、b=48、c=12、d=9核对。','a−b+c−d；代入得105。','括号前减号作用于整个净数量，不能只改变第一项。')
q('G4-L03-E02',5,'96÷(8÷2)与96÷8÷2相等吗？','不相等，前者24、后者6。','除以商与连续除不同；这两个例子各步均可整除。')
all_l['G6-L09-R04']['dependsOn']=['G6-L04-B02','G6-L04-B03','G6-L04-B04']
all_l['G6-L09-R06']['dependsOn']=['G6-U07-E02']
all_l['G4-U03-B01']['tier']='R'
all_l['G4-U03-B01']['title']='线和角的诊断衔接：进入度量之前先核对对象'
all_l['G4-U03-B01']['objective']='诊断三上已经学习的线和角；能解释者直接进入角度测量，不重复新授。'
all_l['G4-U03-B01']['prerequisites']=['三上G3-U05-B01、B02、B03；诊断后按需要回补']
all_l['G4-U05-E02']['tier']='R'
all_l['G4-U05-E02']['title']='归一归总的迁移诊断：先检查不变量'
all_l['G4-U05-E02']['objective']='承接三下归一归总，诊断在促销、速度和机器效率条件中能否识别每份量与总量是否不变。'
all_l['G4-U05-E02']['prerequisites']=['三下G3-L02-B06；基础已会者直接做条件辨析']
all_l['G6-U07-E02']['tier']='B'
aliases={'G4-U03-B01':'G4-U03-R01','G4-U05-E02':'G4-U05-R01','G6-U07-E02':'G6-U07-B07'}
def transform(obj):
 if isinstance(obj,str):
  for a,b in aliases.items():obj=obj.replace(a,b)
  obj=re.sub(r'÷(\d+(?:\.\d+)?/\d+(?:\.\d+)?)',r'÷(\1)',obj)
  return obj
 if isinstance(obj,list):return [transform(x) for x in obj]
 if isinstance(obj,dict):return {k:transform(v) for k,v in obj.items()}
 return obj
data=transform(data)
# 将缺失的“复习段落”理解为覆盖到已有课，而不再增加同内容的新课。
for d in data:
 for u in d['units']:
  ls=[l for l in d['lessons'] if l['unitId']==u['id']]
  if d['grade'] in (4,6):
   u['textbookSections']=[c.get('section',c.get('textbookContent','')) for c in u['coverage']]
   u['coverage']=[{'topic':l['title'],'lessonIds':[l['id']],'anchor':l['anchor']['printedPages']} for l in ls]
 for src in d['sources']:
  if src['id']=='G4-MIX':
   src['path']='content/course-plan-v2/sources-grade-4.md';src['type']='curriculum-audit'
 for l in d['lessons']:
  l['prerequisites']=[s.replace('place的数位与计数单位','大数的数位与计数单位') for s in l['prerequisites']]
  if l['id']=='G4-U01-B02':
   l['example']['steps']=['亿级写2，万级写0003，个级写0009。','按亿级、万级、个级接成200030009，再回读核对。']
 d['status']='教案初稿已完成，待外部内容审核及Kevin试学；未接入网站'
 (BASE/f'grade-{d["grade"]}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Polished four grade plans. Run render-plans.py after any content edit.')

