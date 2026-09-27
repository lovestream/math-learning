"""Recompute all 60 source thinking answers with finite/integer models.

Scope excludes the 300 routine oral calculations. Independent trials on day 9
follow the supplied answer key; the source wording ambiguity is recorded.
"""
from pathlib import Path
from itertools import product
import json, re, hashlib
ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).parent
text=(HERE/'summer-practice.txt').read_text()
snapshot=json.loads((HERE/'summer-extraction-snapshot.json').read_text())
assert hashlib.sha256((ROOT/snapshot['sourcePath']).read_bytes()).hexdigest()==snapshot['sourceSHA256'],'PDF changed: re-extract and review the new edition first'
assert hashlib.sha256((HERE/'summer-practice.txt').read_bytes()).hexdigest()==snapshot['textSHA256'],'Extracted text changed: inspect before reusing source answer checks'
pages={int(n):s for n,s in re.findall(r'=== PDF (\d+) ===\n(.*?)(?=\n=== PDF |\Z)',text,re.S)}
rows=[]
def check(day,computed,expected,note=''):
    assert computed==expected,(day,computed,expected)
    section=pages[day+1].split('二、思维训练')[1]
    answerpage=22+(day-1)//4
    # Tie this reviewed source snapshot to actual problem/answer text.
    rows.append(dict(day=day,pdfPage=day+1,answerPdfPage=answerpage,
        recomputedAnswers=computed,expectedAnswers=expected,status='computed_matches_manually_read_key',
        questionDigest=hashlib.sha256(section.encode()).hexdigest(),
        answerPageDigest=hashlib.sha256(pages[answerpage].encode()).hexdigest(),note=note))
check(1,[[n for n in range(1000,10000) if (ds:=[int(x) for x in str(n)])[0]==a and ds[2]==a+gap and sum(ds[:3])==s and sum(ds[1:])==s] for a,gap,s in [(3,4,15),(5,2,18),(2,5,13)]],[[3573],[5675],[2472]])
check(2,[d-a-b for d,a,b in [(580,30,20),(725,50,40),(640,60,25)]],[530,635,555])
check(3,[min(n for n in range(lo+1,hi) if sum(map(int,str(n)))==s) for lo,hi,s in [(1500,1700,9),(2300,2500,12),(3100,3300,10)]],[1503,2307,3106])
check(4,[sum(sorted([n for n in range(100,1000) if sum(map(int,str(n)))==k],reverse=True)[:2]) for k in [7,9,6]],[1310,1710,1110], '每次用同一批珠拨数，再收回重拨；不是分配给两个计数器。')
check(5,[a+b-total for total,a,b in [(420,250,300),(360,215,245),(500,310,360)]],[130,100,170])
check(6,[[total//(a+3*b),3*(total//(a+3*b))] for a,b,total in [(4,2,50),(5,3,56),(2,4,84)]],[[5,15],[4,12],[6,18]])
check(7,[[x,m*x+a] for m,a,b in [(3,8,4),(5,6,3),(4,7,2)] for x in range(1,100) if m*x+a==(m+1)*x-b],[[12,44],[9,51],[9,43]])
check(8,[min([[total-4*x,x] for x in range(total//4+1) if total-4*x>x]) for total in [34,41,47]],[[10,6],[9,8],[11,9]])
check(9,[[[a,b] for a,b in product(range(1,100),repeat=2) if a+plusA==b and b+plusB==m*a] for plusA,plusB,m in [(4,8,3),(6,10,3),(3,9,2)]],[[[6,10]],[[8,14]],[[12,15]]], '原题两次操作时序含糊。按答案应分别从原状开始；新卡S09已明说恢复原状。')
check(10,[[m*(diff//(m-1)),diff//(m-1)] for m,diff in [(4,27),(3,18),(5,32)]],[[36,9],[27,9],[40,8]])
check(11,[min(n for n in range(1,1000) if all(n%d==r for d,r in cond)) for cond in [[(3,1),(5,1),(4,2)],[(4,3),(6,3),(5,1)],[(5,2),(7,2),(6,5)]]],[46,51,107], '最小数枚举从1开始，原解列举未写出1/3/2等初始候选；它们虽不满足末条件，教学时仍解释为何排除。')
def passes(n,count,targets):
    pos=1;direction=1;hit={x:0 for x in targets}
    for _ in range(count):
        pos+=direction
        if pos in hit:hit[pos]+=1
        if pos in [1,n]:direction*=-1
    return list(hit.values())
check(12,[passes(n,k,ts) for n,k,ts in [(6,35,[2,4]),(7,50,[2,5]),(8,45,[3,7])]],[[7,7],[9,8],[7,6]], '开始1号持球不计接球，端点不重复停留；新卡写明。')
check(13,[[n for n in range(lo+1,hi) if n%a==r and n%b==r] for lo,hi,a,b,r in [(30,50,5,7,2),(50,70,6,8,4),(70,100,8,9,5)]],[[37],[52],[77]])
check(14,[[[div*q+r,div] for div in range(r+1,total) if div*q+r+div+q+r==total] for q,r,total in [(6,3,68),(5,2,51),(8,4,97)]],[[[51,8]],[[37,7]],[[76,9]]])
check(15,[(m+1)*(diff//(m-1)) for m,diff in [(4,36),(3,30),(5,48)]],[60,60,72])
check(16,[[n for n in range(lo+1,hi) if n%a==r and n%b==s] for lo,hi,a,r,b,s in [(25,40,4,3,3,2),(20,40,6,5,5,4),(40,60,7,6,4,3)]],[[35],[29],[55]])
check(17,[((first-gift)//m)-gift for first,gift,m in [(26,2,3),(35,3,4),(30,2,2)]],[6,5,12])
check(18,[[2*x for x in range(1,100) if x-gift>0 and x+gift==m*(x-gift)] for gift,m in [(5,3),(9,2),(8,5)]],[[20],[54],[24]], '比较现金；新卡改用转移，避开借款债务的歧义。')
check(19,[h*2**(n-1) for n,h in [(3,6),(4,5),(2,12)]],[24,40,24], '只求第1次反弹高，不求初始落高或总路程；不是经验物理定律。')
check(20,[4//2*3,3*2,2*(6//3)],[6,6,4], '新卡换成同种等重的模型砝码，不把虚构真实动物重量当常识。')
assert len(rows)==20
source=ROOT/'docs/review/Kevin_数学20天专项练习_指定页码版.pdf'
report=dict(source=str(source.relative_to(ROOT)),sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    scope='60道思维题的数学模型与参考答案；不包含300道口算。数值吻合不消除语句歧义。',
    verifiedThinkingProblems=60,sourcePages=26,days=rows)
(HERE/'summer-source-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Summer source: 60 thinking answers recomputed; wording issues recorded.')
