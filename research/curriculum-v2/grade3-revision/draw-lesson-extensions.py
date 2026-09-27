"""Figures attached to actual lesson exercise IDs, not a separate gallery."""
from pathlib import Path
import json, html
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'content/course-plan-v2';OUT=BASE/'figures'
d=json.loads((BASE/'grade-3.json').read_text());qs={q['id']:q for l in d['lessons'] for q in l['practice']}
blue='#337cb0';orange='#ca7030';green='#238775';ink='#203c50'
def text(x,y,s,size=17):return f'<text x="{x}" y="{y}" font-size="{size}" fill="{ink}">{html.escape(s)}</text>'
def line(x,y,a,b,c=ink,dash=''):return f'<line x1="{x}" y1="{y}" x2="{a}" y2="{b}" stroke="{c}" stroke-width="2" stroke-dasharray="{dash}"/>'
def box(x,y,w,h,c=blue,opacity='.15'):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" fill-opacity="{opacity}" stroke="{c}" stroke-width="2"/>'
def save(tid,title,body,alt,height=420,display='question'):
    filename=tid.lower()+'.svg';ident=tid.lower()
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="{height}" viewBox="0 0 800 {height}" role="img" aria-labelledby="{ident}-title {ident}-desc"><title id="{ident}-title">{html.escape(title)}</title><desc id="{ident}-desc">{html.escape(alt)}</desc><rect width="800" height="{height}" fill="#f8fbfc"/><g font-family="PingFang SC,Microsoft YaHei,sans-serif">'+text(28,35,title,23)+body+text(28,height-19,'按题目条件和标注推理；示意图不可当实物尺测量。',14)+'</g></svg>'
    (OUT/filename).write_text(svg)
    qs[tid]['diagram']=dict(path='content/course-plan-v2/figures/'+filename,alt=alt,fallback=alt,display=display,status='static_ready_interaction_pending')

body=''
for n,x,y in [(1,300,65),(2,225,140),(3,300,140),(4,375,140),(5,300,215),(6,300,290)]:
    body+=box(x,y,75,75)+text(x+29,y+47,str(n),25)
body+=text(500,173,'每格大小相同',18)+text(500,207,'只沿公共边折叠',18)
save('G3-U01-B03-P08','折回纸盒：相邻还是相对',body,'展开图竖列从上到下为1、3、5、6；2在3左侧，4在3右侧。六个同样正方形沿公共边连接。')
body=text(70,85,'两次使用同一个盒子；每个球一样重。',19)
for y,count,total in [(135,5,170),(255,2,110)]:
    body+=box(70,y,100,60,green)+text(91,y+36,'盒子',19)
    for i in range(count):body+=f'<circle cx="{220+i*65}" cy="{y+30}" r="23" fill="#e1edf7" stroke="{blue}" stroke-width="2"/>'
    body+=text(585,y+38,f'共{total}克',22)
save('G3-UP01-B02-P07','两次称量，多出来的是什么',body,'同一盒子加5球共170克，加2球共110克；盒子未变，所有球同重。')
body=''
for y,points in [(145,[('A',90),('B',270),('C',570)]),(295,[('B',90),('A',270),('C',390)])]:
    body+=line(70,y,630,y)
    for label,x in points:body+=line(x,y-8,x,y+8)+text(x-6,y+32,label,20)
body+=text(135,117,'AB：3厘米')+text(352,117,'BC：5厘米')+text(124,263,'AB：3厘米')+text(275,349,'BC：5厘米')
save('G3-U05-B01-P08','提示：试着换一换中间的点',body,'上图A、B、C依次排列，AB为3、BC为5；下图B、A、C依次排列，AB为3、BC为5。只在提示后展示两种位置，AC均不标答案。',430,'hint-1')
body=''
for y,c,marked,label in [(120,blue,[0,1,2],'小乐涂的格'),(250,orange,[2,3,4],'小明涂的格')]:
    body+=text(65,y-20,label,19)
    for i in range(8):
        body+=box(65+i*80,y,80,55,c,'0.3' if i in marked else '0')+text(98+i*80,y+34,str(i+1),18)
body+=text(65,350,'上下表示同一条纸带的两次涂色；把重合位置找出来。',18)
save('G3-U06-B02-P08','两次涂色，最后涂到了多少',body,'同一条八等份纸带：小乐涂1、2、3格，小明涂3、4、5格；两行是同一纸带的操作记录，不是两个整体。')
body=''
for i in range(6):body+=box(85+i*100,155,100,80,blue,'0.35' if i in [0,2] else '0')+text(126+i*100,203,str(i+1),20)
for j in range(3):body+=box(85+j*200,148,200,94,orange,'0')+text(112+j*200,119,f'第{j+1}大格',18)
body+=text(85,295,'蓝色只在第1、3小格；橙框每两小格合为一大格。',18)
save('G3-U06-E01-P08','合并小格后，涂色部分怎样表示',body,'纸带六等份，第1和3格涂蓝。每相邻两小格合为一个大格，橙框为1–2、3–4、5–6，涂色边界不动。')
body=text(48,85,'对折后，两层一起剪；这里只画尚未展开的纸。',18)
body+=box(80,135,220,195)+line(80,130,80,335,orange,'6 4')
body+='<path d="M80 190 A45 45 0 0 1 80 280" fill="#fff" stroke="#ca7030" stroke-width="3"/>'
body+=text(93,365,'半圆的直径在折痕上',17)
body+=box(440,135,220,195)+line(440,130,440,335,orange,'6 4')+'<circle cx="550" cy="230" r="25" fill="#fff" stroke="#ca7030" stroke-width="3"/>'
body+=text(453,365,'圆孔远离折痕与纸边',17)+text(83,120,'折痕',16)+text(443,120,'折痕',16)
save('G3-L01-B01-P08','孔在折痕上，还是离开折痕',body,'两张分别对折的纸。左图在折痕边剪半圆，直径沿折痕；右图在远离折痕和纸边处打圆孔。均穿透两层，尚未展示展开结果。',440)
body=text(50,83,'选不同的一边贴墙；只围另外三边。',18)
body+=box(85,150,240,150,green)+line(70,140,340,140,orange)+text(140,125,'墙 / 8米边',19)+text(332,236,'5米',17)
body+=box(490,150,150,240,green)+line(475,140,655,140,orange)+text(496,125,'墙 / 5米边',19)+text(655,270,'8米',17)
save('G3-L03-B02-P08','菜地哪一边靠墙更省围栏',body,'同一8米×5米菜地：左图8米边贴墙，右图旋转摆放使5米边贴墙。靠墙边不围，其余三边都围。',460)
body=box(130,110,400,250,green,'0')+box(130,110,150,100,orange,'0.15')
body+='<path d="M280 110 H530 V360 H130 V210 H280 Z" fill="#dcefee" stroke="#238775" stroke-width="3"/>'
body+=text(270,89,'原长8厘米',19)+text(545,245,'原宽5厘米',17)+text(165,155,'剪去3×2',19)+text(162,185,'厘米的小块',17)
body+=line(130,110,280,110,orange,'5 4')+line(130,110,130,210,orange,'5 4')
save('G3-L04-B03-P08','剪掉一个角，面积和周长怎样变',body,'8×5厘米长方形左上角剪去3×2厘米小长方形，剪去的两条边沿原长方形两条边；橙线标出剪去的原边，绿线表示剩余形状。',440)
body=text(50,85,'每格都是1平方厘米；蓝色覆盖的是实际纸片面积。',18)
body+=text(75,121,'甲',22)+text(380,121,'乙：各部分分开画',22)
for r in range(3):
 for c in range(4):body+=box(60+c*45,140+r*45,45,45,blue,'.28')
for r in range(2):
 for c in range(4):body+=box(360+c*45,140+r*45,45,45,blue,'.28')
for r in range(2):
 for c in range(4):
    x=360+c*45;y=260+r*45
    body+=box(x,y,45,45,blue,'0')+f'<path d="M{x} {y} L{x+45} {y} L{x} {y+45} Z" fill="{blue}" fill-opacity=".28" stroke="{blue}"/>'
save('G3-L04-B01-P08','整格与半格，怎样比较两张纸',body,'甲覆盖12整格，乙覆盖8整格及8个沿对角线切出的半格；所有原方格均为1平方厘米，乙的各部分不重叠。',420)
body=text(70,86,'阅读时长均为整数分钟；表中没有保留每人的具体时长。',17)
for i,(name,count) in enumerate([('不足10分钟','2人'),('10到19分钟','3人'),('20分钟及以上','1人')]):
    y=125+i*65;body+=box(95,y,385,60,blue)+box(480,y,150,60,green)+text(120,y+38,name,19)+text(534,y+38,count,21)
body+=text(100,357,'请自己写出两组符合这张表的原始数据。',19)
save('G3-L05-B02-P06','同一张分组表，原始数据一定相同吗',body,'分组表只给出不足10分钟2人、10到19分钟3人、20分钟及以上1人，没有具体时长。')
body=text(45,85,'班次表：14:00、14:20发车；错过一班就等下一班。',18)
for x,label in [(85,'家'),(330,'公交站'),(630,'图书馆')]:body+=box(x,135,110,60,green)+text(x+20,173,label,19)
body+=line(197,163,323,163,blue)+text(217,134,'步行25分钟',15)+line(442,163,622,163,blue)+text(466,134,'乘车15分钟',16)
body+=text(60,240,'13:40出发',20)+text(300,240,'几点到站？',20)+text(590,240,'最早几点到？',20)+text(275,314,'到站后有没有一段等待？',19)
save('G3-LP01-B02-P06','最早几点能到图书馆',body,'13:40从家出发，步行25分钟到站；班次14:00和14:20；上车后15分钟到图书馆。到站、等车和到馆时刻未填答案。')
(BASE/'grade-3.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Lesson extension figures:',sum('diagram' in q for q in qs.values()))
