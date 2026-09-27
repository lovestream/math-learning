"""Finite solution sets, model invariants, chapter coverage, and source links.

These checks complement editorial review; they do not certify every sentence.
"""
from pathlib import Path
from itertools import product,permutations
from fractions import Fraction as F
from datetime import date,timedelta
from collections import Counter,deque
import json,hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'content/course-plan-v2';HERE=Path(__file__).parent
d=json.loads((BASE/'grade-3.json').read_text());qs={q['id']:q for l in d['lessons'] for q in l['practice']}
quality=json.loads((BASE/'grade-3-quality-map.json').read_text());changes=json.loads((HERE/'all-units-revision-20260925.json').read_text())['changes']
model_checks=[]
def check(name,ok):assert ok,name;model_checks.append(name)
check('front marks identical, back marks discriminate',len({'circle','circle'})==1 and len({'star','triangle'})==2)
check('hidden pile complete solution set',[2+h for h in range(1,5) if h<=2]==[3,4])
# Fold the six-square net in 3D. Local right/down axes propagate by a quarter turn.
positions={(0,-1):1,(-1,0):2,(0,0):3,(1,0):4,(0,1):5,(0,2):6}
def neg(v):return tuple(-x for x in v)
orient={(0,0):((1,0,0),(0,1,0),(0,0,1))};queue=deque([(0,0)])
while queue:
    x,y=queue.popleft();r,v,n=orient[(x,y)]
    for (dx,dy),frame in [((1,0),(neg(n),v,r)),((-1,0),(n,v,neg(r))),((0,1),(r,neg(n),v)),((0,-1),(r,n,neg(v)))]:
        p=(x+dx,y+dy)
        if p not in positions:continue
        if p in orient:assert orient[p]==frame
        else:orient[p]=frame;queue.append(p)
normals={positions[p]:f[2] for p,f in orient.items()}
check('net folds into six unique faces with specified opposites',len(set(normals.values()))==6 and normals[2]==neg(normals[4]) and normals[3]==neg(normals[6]))
check('different allocations have same total',60-10-25==60-15-20==25)
check('unequal row sizes defeat row subtraction',5*6-3*8==6 and (5-3)*6!=6)
check('road segments cover route once',300+500==800 and 800+300+500==1600)
check('tare removed before dividing',(950-200)//5==150)
check('two weighing equations unique',[(box,ball) for box,ball in product(range(171),repeat=2) if box+5*ball==170 and box+2*ball==110]==[(70,20)])
check('change one part versus every part',(4*21-1,4*(21-1))==(83,80))
check('carry inversion complete solutions',[n for n in range(10) if n*3//10==2]==[7,8,9])
check('product digit bound complete solutions',[h for h in range(1,10) if 100<=3*(100*h+57)<1000]==[1,2])
check('input place difference scales by four',250*4-205*4==180)
check('budget directional bounds',398*6<400*6==2400<402*6)
check('fixed-field code boundaries',f'3{12:02d}{7:02d}'=='31207' and f'3{1:02d}{27:02d}'=='30127')
check('collinear distances two point orders',sorted({abs(c) for c in range(-10,11) if abs(c-3)==5 and c not in [0,3]})==[2,8])
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def rotate(v):return (-v[1],v[0])
check('whole rotation preserves dot product, single edge may not',dot((1,0),(1,1))==dot(rotate((1,0)),rotate((1,1))) and dot((1,0),rotate((1,1)))!=dot((1,0),(1,1)))
check('two acute quarters form only half a right angle',F(1,4)+F(1,4)==F(1,2)<1)
check('three of four equal areas',3*F(1,4)==F(3,4))
check('fraction union count',set([1,2,3])|set([3,4,5])==set(range(1,6)))
check('fraction whole changed gives different residual',1-F(2,7)-F(3,7)==F(2,7) and (1-F(2,7))*(1-F(3,7))!=F(2,7))
check('same fraction different sets',(12//4,20//4,20//4-12//4)==(3,5,2))
check('inverse several parts to whole',18//3*4==24)
check('length equality does not fill an original large cell',F(2,6)==F(1,3) and all(not group.issubset({1,3}) for group in [{1,2},{3,4},{5,6}]))
check('ribbons full segments, not combined remainders',[sum(x//10 for x in lengths) for lengths in [[90]*3,[85]*3,[79,79,90]]]==[27,24,23] and sum([79,79,90])>240)
check('restricted combinations complete set',[(a,p) for a,p in product(['红','蓝'],['黑','白','灰']) if (a,p) not in [('红','白'),('蓝','黑')]]==[('红','黑'),('红','灰'),('蓝','白'),('蓝','灰')])
L={(0,0),(0,1),(0,2),(1,0)}
check('translation commutes, half-turn changes L', {(x+3,y+2) for x,y in L}=={(3+x,2+y) for x,y in L} and {(1-x,2-y) for x,y in L}!=L)
check('two exact decompositions of division',80//4+16//4==40//4+56//4==96//4==24)
check('division remainder retains tens unit',84-3*20==24 and 22*3==66 and 28*3==84)
check('zero in quotient positional check',612//6==102 and 12*6==72)
check('nested packaging same boxes different bags',96//4//3==96//3//4==8 and (96//4,96//3)==(24,32))
check('equal sides need not be orthogonal',sum(x*x for x in (5,0))==sum(x*x for x in (3,4))==25 and dot((5,0),(3,4))!=0)
check('wall omits the actual chosen side',(8+5+5,8+8+5)==(18,21))
check('point contact hides no positive length',2*4*3-2*3==18 and 2*4*3==24)
check('partial squares preserve area',8+8*F(1,2)==12)
check('simultaneous dimension changes',6*4==8*3==24 and 8*4==32)
check('corner removed: area decreases boundary unchanged',8*5-3*2==34 and 2*(8+5)-3-2+3+2==26)
check('unobserved votes reverse ranking',5+3+12==20 and 3+12>5)
def bins(xs):return [sum(x<10 for x in xs),sum(10<=x<=19 for x in xs),sum(x>=20 for x in xs)]
a=[5,5,10,10,10,20];z=[9,9,19,19,19,25]
check('grouping loses totals',bins(a)==bins(z)==[2,3,1] and sum(a)==60 and sum(z)==100)
check('leap crossing exact durations',date(2028,2,28)+timedelta(days=3)==date(2028,3,2) and date(2027,2,28)+timedelta(days=3)==date(2027,3,3))
arrive=13*60+40+25;depart=min(t for t in [14*60,14*60+20] if t>=arrive)
check('timetable includes waiting',arrive==14*60+5 and depart-arrive==15 and depart+15==14*60+35)
week=Counter(i%7 for i in range(30))
check('month cycle remainder and next day',[week[i] for i in range(7)]==[5,5,4,4,4,4,4] and 30%7==2)
check('decimal place values in cents',(F('2.5')-F('2.05'))*100==45)
vals=[F(p[0]+'.'+p[1]+p[2]) for p in permutations('045') if F(p[0]+'.'+p[1]+p[2])<1]
check('decimal constrained maximum',sorted(vals)==[F('0.45'),F('0.54')])
check('unchanged summand cancels',(F('3.6')+28)-(F('3.6')+F('2.8'))==F('25.2'))
check('whole-pack buying tie with different leftovers',6*4==8*3==24 and 6*10-60==0 and 8*8-60==4 and 7*8<60)
unions=[8+7-common for common in range(8)]
check('overlap extremes complete range',min(unions)==8 and max(unions)==15 and min(20-u for u in unions)==5 and max(20-u for u in unions)==12)

assert len(quality['units'])==17 and len(quality['lessons'])==60 and len(changes)==48
assert {u['unitId'] for u in quality['units']}=={u['id'] for u in d['units']}
assert len({q['question'].strip() for q in qs.values()})==len(qs),'duplicate core prompt'
for c in changes:
    q=qs[c['taskId']]
    assert all(q[k]==c['after'][k] for k in ['question','answer','reason']),c['taskId']+' stale change record'
    assert len(q['hints'])==2
    assert q['level']=='选学提升'
for r in quality['lessons']:
    assert all(tid in qs for tid in r['extensionTaskIds']+r['reviewTaskIds'])
    assert not set(r['extensionTaskIds'])&set(r['coreExitTaskIds']),r['lessonId']+' optional/base evidence overlap'
for q in qs.values():
    if q.get('diagram'):
        ET.parse(ROOT/q['diagram']['path'])
        assert q['diagram']['display'] in ['question','hint-1']
RESULT=dict(modelChecks=len(model_checks),rewrittenElectiveTasks=len(changes),units=len(quality['units']),lessons=len(quality['lessons']),lessonDiagrams=sum('diagram' in q for q in qs.values()))
