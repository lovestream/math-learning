"""Exact, local SVG diagrams; no generated artwork or external assets."""
from pathlib import Path
import json, html
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'content/course-plan-v2';OUT=BASE/'figures'
OUT.mkdir(exist_ok=True)
b=json.loads((BASE/'grade-3-thinking.json').read_text());by={q['id']:q for q in b['tasks']}
blue='#377db4';orange='#ce7433';green='#288878';ink='#203c50'
def t(x,y,s,size=18,color=ink):return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}">{html.escape(s)}</text>'
def line(x1,y1,x2,y2,color=ink,dash=''):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="2" '+(f'stroke-dasharray="{dash}"' if dash else '')+'/>'
def rect(x,y,w,h,color=blue,fill=None):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill or color}" fill-opacity=".18" stroke="{color}" stroke-width="2" rx="3"/>'
def dim(x1,x2,y,label):return line(x1,y,x2,y)+line(x1,y-5,x1,y+5)+line(x2,y-5,x2,y+5)+t((x1+x2)/2-30,y-10,label,16)
def save(tid,body,alt,height=380):
    name=tid.lower()+'.svg'
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="{height}" viewBox="0 0 800 {height}" role="img" aria-labelledby="title desc"><title id="title">{html.escape(by[tid]["title"])}</title><desc id="desc">{html.escape(alt)}</desc><rect width="800" height="{height}" fill="#f8fbfc"/><g font-family="PingFang SC, Microsoft YaHei, sans-serif">'+t(28,35,by[tid]['title'],23)+body+t(28,height-20,'示意图；按标注推理，不测量屏幕。',14,'#5d7180')+'</g></svg>'
    (OUT/name).write_text(svg)
    by[tid]['diagram']={'path':'content/course-plan-v2/figures/'+name,'alt':alt,'display':'question','kind':'authored-svg',
        'interactionSpec':'先显示静态条件图；允许圈画、标接头或写份数。提示层才显示重复次数/分解；不能把答案作为初始标注。',
        'fallback':alt,'status':'static_asset_ready_interaction_not_implemented'}

save('G3-U03-TH3',
    rect(85,110,360,44,blue)+t(95,139,'甲：30厘米')+rect(349,177,300,44,orange)+t(455,206,'乙：25厘米')+
    line(349,100,349,254,orange,'5 4')+line(445,100,445,254,orange,'5 4')+dim(349,445,255,'8厘米')+dim(85,649,306,'总长？'),
    '甲板从共同起点向右长30厘米。乙板从甲右端左移8厘米处起，长25厘米；两板在8厘米投影段重叠，求覆盖总长。')
body=''
for i,(start,c) in enumerate([(0,blue),(17,orange),(32,green),(50,blue)]):
    body+=rect(80+start*8,80+i*65,160,30,c)+t(88+start*8,102+i*65,f'{i+1}号：20厘米',14)
for a,z,y,label in [(17,20,133,'3厘米'),(32,37,198,'5厘米'),(50,52,263,'2厘米')]:
    body+=dim(80+a*8,80+z*8,y,label)
body+=dim(80,640,359,'总长？')
save('G3-U03-TH4',body,'4块各20厘米的木板沿直线顺次搭接，三处从左到右重叠3、5、2厘米，没有三重重叠。',425)
body=''
for i,c in enumerate([blue,orange,green]):
    x=70+i*192;body+=rect(x,88+i*55,240,35,c)+t(x+55,113+i*55,'30厘米',16)
for x,y in [(262,140),(454,195)]:body+=dim(x,x+48,y,'？厘米')
body+=dim(70,694,291,'78厘米')+t(85,334,'两个接头重叠得一样长；没有三块同时重叠。',17)
save('G3-U03-TH5',body,'三板各30厘米，两处相等搭接，没有三重重叠，端到端78厘米，求每处重叠。',400)
body=t(30,72,'沿拉伸方向的投影模型（不是链环立体画）',18)
for i,c in enumerate([blue,orange,green,blue]):
    x=68+i*144;y=100+(i%2)*18
    body+=rect(x,y,192,55,c)+rect(x,y,24,55,c)+rect(x+168,y,24,55,c)+t(x+52,y+35,f'环{i+1}',16)
body+=dim(68,260,206,'外长4厘米')+t(38,250,'一处接头的放大图：前后两个端部的长度接在一起',18)
body+=rect(190,273,95,50,blue)+rect(285,273,95,50,orange)+t(202,306,'前环端部',16)+t(298,306,'后环端部',16)
body+=dim(190,285,355,'5毫米')+dim(285,380,355,'5毫米')+t(425,310,'这一处共重叠多少毫米？',18)
body+=t(38,400,'每个接头均为这一结构；两端未连接的部分不扣除。',17)
save('G3-U03-TH6',body,'4环拉紧的轴向投影；每环外长40毫米，端部厚5毫米，每处接头的重叠由两个5毫米端部相接组成。只与相邻环重叠，求链条外端总长。',465)
save('G3-U03-TH7',rect(95,100,340,42,blue)+t(205,128,'20厘米')+rect(270,210,340,42,orange)+t(380,238,'20厘米')+t(70,300,'这里只给出两根未搭接的纸条，请自己画两种搭法。',18),
    '两根纸条各20厘米；图只展示材料，不给定接头位置或重叠长度。')
body=''
for i,(start,c) in enumerate([(0,blue),(10,orange),(20,green)]):
    body+=rect(95+start*11,85+i*48,330,30,c)+t(104+start*11,107+i*48,['甲','乙','丙'][i],16)
for n in range(0,51,10):body+=line(95+n*11,75,95+n*11,270,'#889ca8','4 4')+t(86+n*11,295,str(n),16)
body+=t(675,295,'厘米',16)+t(85,333,'把每个10厘米小段分别检查：实际应计几次？',17)
save('G3-U03-TH8',body,'共同厘米轴：甲覆盖0到30、乙10到40、丙20到50。虚线每10厘米分段，三条纸带均长30厘米。',390)

save('G3-U07-TH2',''.join(line(240+i*110,90,240+i*110,310) for i in range(3))+''.join(line(240,90+i*110,460,90+i*110) for i in range(3))+t(165,326,'起点')+t(475,100,'终点')+t(540,185,'只向右或向上',18),
    '2行2列格路，起点左下，终点右上；只沿格线向右或向上，每次一格。')
body=''
for r in range(4):
 for c in range(4):
    x=230+c*60;y=70+r*60
    if (r,c) in [(0,0),(3,3)]:body+=line(x+10,y+10,x+50,y+50,orange)+line(x+10,y+50,x+50,y+10,orange)
    else:body+=rect(x,y,60,60,'#49606c', '#203c50' if (r+c)%2==0 else '#ffffff')
body+=t(525,175,'× 表示剪去',18)+t(525,212,'1张纸片盖相邻2格',16)
save('G3-L01-TH2',body,'4×4黑白棋盘，左上与右下两个同色角格剪去，拟用七张1×2相邻格纸片铺满。')
body='<path d="M180 100 H360 V145 H460 V100 H640 V330 H180 Z" fill="#dceff0" stroke="#288878" stroke-width="3"/>'
body+=dim(180,640,76,'8厘米')+t(660,215,'5厘米',17)+dim(360,460,183,'2厘米')+t(480,133,'深1厘米',16)
save('G3-L03-TH2',body,'8×5厘米长方形，在上方8厘米边的中部剪去宽2厘米、深1厘米的矩形缺口；两侧角保留。',410)
save('G3-L04-TH1',rect(200,105,360,240,green)+line(200,345,560,105,orange)+dim(200,560,78,'6厘米')+t(585,230,'4厘米',18),
    '长6厘米、宽4厘米的长方形，从左下到右上画一条对角线，拟沿线剪开。',410)
save('G3-L04-TH2',''.join(line(220+i*80,80,220+i*80,320) for i in range(4))+''.join(line(220,80+i*80,460,80+i*80) for i in range(4))+t(505,193,'不同大小都要数',18),
    '3行3列完整方格图，所有横竖边界线均画出；数边沿格线的所有正方形。')
body=t(45,88,'每一格代表一支记号笔的价格；不是物品个数。',18)
for i in range(4):body+=rect(80+i*63,115,50,40,blue)
body+=t(380,142,'4支记号笔的总价',17)
for k in range(2):
 for i in range(3):body+=rect(80+i*50,190+k*60,50,40,orange)
body+=t(260,217,'1支钢笔的价格',17)+t(260,277,'另1支钢笔的价格',17)+t(80,325,'这些价格合起来是50元。',19)
save('G3-U02-S06',body,'4支记号笔各占1格价格，两支钢笔分别占3格价格；全部合计50元，每格同价。')
body=t(42,79,'每一格代表科普书的本数；下图先画出4份。',17)
for i in range(4):body+=rect(100+i*130,125,130,46,blue)
body+=dim(490,576.667,209,'多8本')+dim(576.667,620,252,'少4本')
body+=line(576.667,112,576.667,275,orange,'5 4')+t(455,300,'虚线处：绘本本数',17)+t(115,331,'3份到绘本：8本；绘本到4份：4本。',18)
save('G3-U02-S07',body,'科普书4个等长份并排，从3份末端到绘本点有8本，从绘本点到4份末端有4本；绘本点在两者之间。')
# The gap diagram is schematic, not a scale drawing; 8 and 4 labels remain authoritative.
body=t(42,86,'开始：球在1号；开始持球不计接球次数。',18)
for i in range(6):body+=f'<circle cx="{95+i*115}" cy="165" r="30" fill="#e6f1f7" stroke="{blue}"/>'+t(85+i*115,172,str(i+1),21)
body+=line(95,228,670,228,blue)+t(330,218,'先向右传 →',19)+line(670,294,95,294,orange)+t(330,283,'← 再向左传',19)
save('G3-LP01-S12',body,'六人直线站位从左到右1至6，球从1依次到6再依次回1，每次只传给相邻一人，端点立即反向。')
body=t(45,85,'同一个顶点，四条不同射线都在小于直角的范围内。',17)
for name,x,y in [('A',645,285),('B',625,230),('C',580,155),('D',505,80)]:
    body+=line(170,310,x,y,blue)+t(x+10,y,name,20)
body+=t(145,336,'O',19)
save('G3-U05-TH2',body,'顶点O出发四条不同射线按A、B、C、D顺序排列，全部在小于直角的扇形内；数任取两条夹出的较小角。')
(BASE/'grade-3-thinking.json').write_text(json.dumps(b,ensure_ascii=False,indent=2)+'\n')
print('Authored diagrams:',sum('diagram' in q for q in b['tasks']))
