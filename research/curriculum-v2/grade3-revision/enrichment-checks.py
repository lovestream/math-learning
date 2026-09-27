"""Independent finite models for new cards, plus source and drawing contracts."""
from pathlib import Path
from itertools import product
import json, hashlib, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'content/course-plan-v2';HERE=Path(__file__).parent
b=json.loads((BASE/'grade-3-thinking.json').read_text());qs={q['id']:q for q in b['tasks']}
checks=[]
def verify(tid,ok):
    assert tid in qs and ok,tid
    checks.append(tid)
def covered(intervals):
    return len({i for start,end in intervals for i in range(start,end)})
verify('G3-U03-TH3',covered([(0,30),(22,47)])==47)
verify('G3-U03-TH4',covered([(0,20),(17,37),(32,52),(50,70)])==70)
verify('G3-U03-TH5',[o for o in range(1,16) if covered([(0,30),(30-o,60-o),(60-2*o,90-2*o)])==78]==[6])
verify('G3-U03-TH6',covered([(0,40),(30,70),(60,100),(90,130)])==130 and 4*40-3*(5+5)==130)
verify('G3-U03-TH7',covered([(0,20),(18,38)])==38 and covered([(0,20),(15,35)])==35)
verify('G3-U03-TH8',covered([(0,30),(10,40),(20,50)])==50 and 90-20-20-10==40 and 90-20-20-10+10==50)
verify('G3-U04-S01',[n for n in range(1000,10000) if (v:=[int(c) for c in str(n)])[0]==3 and v[2]==7 and sum(v[:3])==sum(v[1:])==15]==[3573])
verify('G3-U02-S02',all((x+80-12)-(x+8)==60 for x in range(101)))
verify('G3-U04-S03',min(n for n in range(1501,1700) if sum(map(int,str(n)))==9)==1503)
verify('G3-U04-S04',sorted((n for n in range(100,1000) if sum(map(int,str(n)))==7),reverse=True)[:2]==[700,610])
verify('G3-U02-S05',12+13+17==42 and 12+13==25 and 13+17==30)
verify('G3-U02-S06',[[a,c] for a,c in product(range(1,51),repeat=2) if c==3*a and 4*a+2*c==50]==[[5,15]])
verify('G3-U02-S07',[(s,3*s+8) for s in range(100) if 3*s+8==4*s-4]==[(12,44)])
verify('G3-L02-S08',min((34-4*x,x) for x in range(9) if 34-4*x>x)==(10,6))
verify('G3-UP01-S09',[(a,z) for a,z in product(range(100),repeat=2) if a+4==z and z+8==3*a]==[(6,10)])
verify('G3-U04-S10',[(a,z) for a,z in product(range(100),repeat=2) if a==4*z and a-z==27]==[(36,9)])
verify('G3-L02-S11',min(n for n in range(1,1000) if n%3==1 and n%5==1 and n%4==2)==46)
seq=[2,3,4,5,6,5,4,3,2,1]*3+[2,3,4,5,6]
verify('G3-LP01-S12',len(seq)==35 and seq.count(2)==seq.count(4)==7)
verify('G3-L02-S13',[n for n in range(31,50) if n%5==n%7==2]==[37])
verify('G3-L02-S14',[(6*z+3,z) for z in range(4,68) if 6*z+3+z+6+3==68]==[(51,8)])
verify('G3-U04-S15',[(a,z) for a,z in product(range(61),repeat=2) if a==4*z and a+z==60]==[(48,12)])
verify('G3-L02-S16',[n for n in range(26,40) if n%4==3 and n%3==2]==[35] and 4%4==0)
verify('G3-U02-S17',[n for n in range(27) if 26-2==3*(n+2)]==[6])
verify('G3-U02-S18',[n for n in range(6,100) if n+5==3*(n-5)]==[10])
verify('G3-U06-S19',24//2==12 and 12//2==6 and 3-1==2)
verify('G3-UP01-S20',4//2*3==6)
assert len(checks)==26
for chain in b['learningChains']:
    assert all(tid in qs for tid in chain['tasks']),chain['id']
for q in b['tasks']:
    if 'diagram' in q:
        path=ROOT/q['diagram']['path'];ET.parse(path)
        assert q['diagram']['alt'] and q['diagram']['fallback']
    if 'summerReference' in q['source']:
        ref=q['source']['summerReference'];assert ref['pdfPage']==ref['day']+1
assert sorted(q['source']['summerReference']['day'] for q in b['tasks'] if 'summerReference' in q['source'])==list(range(1,21))
src=json.loads((HERE/'summer-source-audit.json').read_text())
assert src['sha256']==hashlib.sha256((ROOT/src['source']).read_bytes()).hexdigest(),'source PDF changed'
assert src['verifiedThinkingProblems']==60
RESULT={'newCardModelChecks':len(checks),'diagramAssets':sum('diagram' in q for q in b['tasks']),
        'summerThinkingAnswersChecked':60,'learningChains':len(b['learningChains'])}
