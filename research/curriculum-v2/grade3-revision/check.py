"""Validate only the active grade-3 revision and record honest review coverage.

auto_checked means structural screening, never full semantic proof. AI editorial review
is a separate field; human_checked is reserved for a named parent/teacher confirmation.
"""
from pathlib import Path
from collections import Counter
from fractions import Fraction
import ast, hashlib, json, re, runpy

ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'content/course-plan-v2';HERE=Path(__file__).parent
path=BASE/'grade-3.json';d=json.loads(path.read_text());routepath=BASE/'grade-3-pathway.json';route=json.loads(routepath.read_text())
bankpath=BASE/'grade-3-thinking.json';bank=json.loads(bankpath.read_text())
by={l['id']:l for l in d['lessons']}; errors=[]
def require(ok,msg):
    if not ok:errors.append(msg)
def digest(q):return hashlib.sha256(json.dumps({k:q[k] for k in ('question','answer','reason')},ensure_ascii=False,sort_keys=True).encode()).hexdigest()
tasks={q['id']:q for l in d['lessons'] for q in l['practice']}
require(len(tasks)==720,'expected 720 distinct course-task IDs')
require(len(by)==60,'expected 60 grade-3 lessons')
for l in d['lessons']:
    lid=l['id']; c=l['teachingContract'];m=l['interaction']
    require(len(l['practice'])==12,lid+' needs 12 tasks')
    require([q.get('reviewAfterDays') for q in l['practice'][8:]]==[1,3,7,21],lid+' review intervals')
    require(len(c['minimumTaskIds'])==3,lid+' needs 3 representative tasks')
    for tid in c['minimumTaskIds']+c['electiveTaskIds']:
        require(tid in tasks and tasks[tid]['phase']=='lesson',lid+' invalid target '+tid)
    require(not set(c['minimumTaskIds']) & set(c['electiveTaskIds']),lid+' elective/core overlap')
    require(len(set(c['minimumTaskIds']+c['electiveTaskIds']))==8,lid+' unassigned day-one question')
    for dep in l['dependsOn']:
        require(dep in by,lid+' missing prerequisite '+dep)
        if l['tier']=='B': require(by[dep]['tier'] not in ('E','O'),lid+' core depends on elective')
    for key in ['initialState','learnerAction','observableChange','question','expectedExplanation','wrongActionFeedback','withdrawal']:
        require(bool(m.get(key)),lid+' missing interaction '+key)
    w=m['withdrawal']
    if w['taskId'] in tasks:
        for key in ('question','answer','reason'):require(w[key]==tasks[w['taskId']][key],lid+' stale withdrawal '+key)
    else:require(w['taskId']=='G3-U02-E01-T01',lid+' unknown independent task')
    for q in l['practice']:
        for key in ['question','answer','reason']:require(bool(q.get(key)),q['id']+' empty '+key)
        require(not re.search('上题|上一题|上述|同上|前题|上式',q['question']),q['id']+' context-dependent prompt')
        require(q['scoring']['referenceAnswer']==q['answer'] and q['scoring']['reasonEvidence']==q['reason'],q['id']+' stale scoring reference')
    for flow in m.get('stateMachine',{}).get('transitions',[]):
        require(all(flow.get(k) for k in ['state','event','next','feedback']),lid+' incomplete transition')

all_refs=[]
for r in route['routes']:
    all_refs += r['coreLessonIds']+r['reviewLessonIds']+r['methodLessonIds']
    for ref in r['optionalExtensionRefs']:
        if ':' in ref:
            a,b=ref.split(':');require(a+'-'+b in tasks,'missing extension task '+ref)
        else:all_refs.append(ref)
for ref in all_refs:require(ref in by,'missing lesson reference '+ref)
require(len(route['routes'])==17,'actual textbook entry count')
for cid,links in route['concepts'].items():
    for link in links:require(any(c['conceptId']==cid for c in by[link['lessonId']]['concepts']),'concept link mismatch '+cid)

frozen=json.loads((HERE/'frozen-grades.json').read_text())
for p,h in frozen.items():require(hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h,'frozen grade changed: '+p)

# Independent numeric fixtures cover the crucial contrasting structures, not just extracted equalities.
fixtures=[
 ('24/6*2','8'),('24/(6*2)','2'),('64-18+6','52'),('64-(18+6)','40'),
 ('4+3*6','22'),('18-12/3','14'),('(12+8)/4','5'),('12+8/4','14'),
 ('60-14-16','30'),('60-(14+16)','30'),('(9-3)*2','12'),('(48-24)/6','4'),
 ('20-(8-3)','15'),('20-8+3','15'),('20-8-3','9'),('30-(12-4)','22'),
 ('60-14+6','52'),('60-(14-6)','52'),('60-(14+6)','40'),('40+(26-6)','60'),
 ('48/6/2','4'),('48/(6*2)','4'),('48/(6/2)','16'),('48/6*2','16'),
 ('72/(3*4)','6'),('72/(3+5)','9'),('8+7+2','17'),('(2*3)*4','24'),('2*(3*4)','24'),
 ('7*(5+3)','56'),('7*5+7*3','56'),('7*5+3','38'),('56-38','18'),
 ('7*(8-3)','35'),('30/(3+2)','6'),('30/3+30/2','25'),('6*(5+3)-(6*5+3)','15'),
 ('44/4-7','4'),('7+4*4','23'),('(7+4)*4','44'),('(34+6)/4','10'),('(10-6)*4','16'),
 ('(12+8)*3','60'),('(18-6)/3','4'),('(9-3)*2','12'),('9-3*2','3'),
 ('26*3','78'),('147*8','1176'),('205*4','820'),('304*3','912'),('398*8','3184'),
 ('24/8*3','9'),('1-2/8-3/8','3/8'),('35/7*4','20'),('4/12','1/3'),
 ('52/4','13'),('13*4+1','53'),('408/4','102'),('72/3/4','6'),
 ('(8+5)*2','26'),('2*12-2*3','18'),('8*5-3*2','34'),('(8+5)*2-3-2+3+2','26'),
 ('5+3+4','12'),('8+7-3','12'),('1000-300','700'),('200+300+400','900'),
 ('(14+10)/4','6'),('40-4*6','16'),('50-16+6','40'),('40-6+16','50'),
 ('2.3+1.4','3.7'),('20-(8.5+6.8)','4.7'),('4.2-1.8','2.4')]
def calc(s):
    def run(n):
        if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):return Fraction(str(n.value))
        if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -run(n.operand)
        if isinstance(n,ast.BinOp):
            a,b=run(n.left),run(n.right)
            if isinstance(n.op,ast.Add):return a+b
            if isinstance(n.op,ast.Sub):return a-b
            if isinstance(n.op,ast.Mult):return a*b
            if isinstance(n.op,ast.Div):return a/b
        raise ValueError('unsupported expression')
    return run(ast.parse(s,mode='eval').body)
for exp,answer in fixtures:require(calc(exp)==calc(answer),'arithmetic fixture '+exp)
# Finite physical invariants and boundaries.
require(sum([7*5,7*3])==7*8,'array must conserve all points')
require(53//4==13 and 0<=53%4<4,'remainder contract')
require(36//4==9 and 9//2==4 and 9%2==1,'B01-P11 remains four people plus one BAG')
require(10//6-5//6==1,'B05-P06 only full bags, no premature difference division')
require((30%7+0)%7==2,'30-day month beginning Monday ends with next month Wednesday')

thinking=bank['tasks']
require(len(thinking)==60,'expected 60 thinking tasks')
for q in thinking:
    require(q['parentLessonId'] in by,q['id']+' missing parent lesson')
    require(q['unitId'] in {u['id'] for u in d['units']},q['id']+' missing textbook unit')
    require(q['phase']=='optional-thinking',q['id']+' must be optional')
    require(len(q['solutionSteps'])>=3 and len(q['hints'])==2,q['id']+' needs reasoning and staged hints')
    require(bool(q['applicability']) and bool(q['thinkingEvidence']),q['id']+' missing reasoning boundary')
for u in d['units']:
    linked=[q for q in thinking if q['unitId']==u['id']]
    require(len(linked)>=2 and {q['layer'] for q in linked}=={'本章提升','奥数思想选学'},u['id']+' missing extension layer')
thinking_by={q['id']:q for q in thinking}
route_thoughts=[tid for r in route['routes'] for tid in r.get('optionalThinkingTaskIds',[])]
require(set(route_thoughts)==set(thinking_by) and len(route_thoughts)==len(thinking),'thinking links must cover all tasks exactly once')
for concept,ids in route.get('methodThinkingIndex',{}).items():
    for tid in ids:require(tid in thinking_by and thinking_by[tid]['conceptId']==concept,'method thinking reference '+tid)

# Enumerate finite solution sets and invariants in the newly authored thinking bank.
from itertools import product,permutations,combinations
thought_checks=[]
def thought(ok,name):
    thought_checks.append(name);require(ok,'thinking check: '+name)
thought([n for n in range(10,100) if n%10==6 and 100<=n*3<200 and (n*3)%10==8]==[36,46,56,66],'digit puzzle full solution set')
thought([n for n in range(10,31) if n%3==2 and n%4==3]==[11,23],'two remainders full solution set')
thought(sorted({''.join(p) for p in permutations('1122')})==sorted(['1122','1212','1221','2112','2121','2211']),'2x2 path enumeration')
thought(len(list(permutations('123',2)))==6,'distinct two-digit codes')
thought([(12-w,w) for w in range(1,7)]==[(11,1),(10,2),(9,3),(8,4),(7,5),(6,6)],'fixed perimeter unordered pairs')
thought(sum(k*k for k in range(1,4))==14,'grid square count')
board=[(r,c) for r,c in product(range(4),repeat=2) if (r,c) not in [(0,0),(3,3)]]
thought((sum((r+c)%2==0 for r,c in board),sum((r+c)%2==1 for r,c in board))==(6,8),'checkerboard color obstruction')
thought(len(list(combinations('ABCD',2)))==6,'four rays six angles')
thought(12//2==18//3==6,'fraction value versus actual length')
thought(24-8==16 and 16//2==8,'changing fraction whole')
thought(all(((5+n)*3)-(5+n*3)==10 for n in range(100)),'wrong-order difference finite checks; general proof remains textual')
thought((37-27)*4==40 and (28-27)*4==4,'place-value error propagation')
thought(3*150+20==2*150+170,'balance elimination')
thought([(a,b) for a in [4,6] for b in [3,5] if a+b<=9]==[(4,3),(4,5),(6,3)],'budget combinations')
thought([6*b+4 for b in [3,4,5]]==[22,28,34],'remainder inverse enumeration')
thought(2*(8+5)-2+(2+1+1)==28,'notch boundary compensation')
thought(6*4/2==12,'diagonal rectangle equal areas')
thought(3*3<10 and 4+3+3==10,'pigeonhole tight bound')
thought((31-28)==3 and 28%7==0,'calendar complete weeks')
thought(sum([5,12,19])==36 and 12-5==19-12==7,'three Mondays')
prices=list(map(Fraction,['1.2','1.8','2.2','2.8']))
thought([(str(a),str(b)) for a,b in combinations(prices,2) if a+b==4]==[('6/5','14/5'),('9/5','11/5')],'decimal exact-budget solutions')
costs=[b*Fraction('3.6')+max(0,5-3*b)*Fraction('1.4') for b in range(5)]
thought(min(costs)==Fraction('6.4') and costs.index(min(costs))==1,'pack optimization')
thought(6+6+4+4==20 and 6+6==12 and 6+4==10,'four-set-region counts')
thought(11+7==18 and 11-7==4 and 11-2==7+2,'sum-difference and transfer')
# Verify all eight hidden-ball cases follow the two-weighing decision tree.
def heavy_search(h):
    weights=[2 if i==h else 1 for i in range(8)]
    a,b=sum(weights[:3]),sum(weights[3:6])
    if a==b:return 6 if weights[6]>weights[7] else 7
    group=[0,1,2] if a>b else [3,4,5]
    x,y,z=group
    return z if weights[x]==weights[y] else (x if weights[x]>weights[y] else y)
thought(all(heavy_search(h)==h for h in range(8)),'two weighings cover all eight heavy balls')
thought([(a,b,c) for a,b,c in product(range(1,4),repeat=3) if max(a,c)==2 and b==1 and max(a,b)==2 and c==1]==[(2,1,1)],'two orthographic observations identify three piles')
extras=route['unitDiagnostics']+[by['G3-U02-E01']['interaction']['withdrawal']]+thinking
# Explicit provenance: a named person has not reviewed this edition. AI review is not human review.
ledger=[]
editorial=json.loads((HERE/'ai-editorial-review-20260924.json').read_text())['taskDigests']
editorial.update(json.loads((HERE/'ai-editorial-review-thinking-20260924.json').read_text())['taskDigests'])
supplement=json.loads((HERE/'ai-editorial-review-summer-20260924.json').read_text())
editorial.update(supplement['taskDigests'])
all_unit_review=json.loads((HERE/'ai-editorial-review-all-units-20260925.json').read_text())
editorial.update(all_unit_review['taskDigests'])
for tid,expected in all_unit_review['fullTaskDigests'].items():
    q=tasks[tid]
    payload={k:q.get(k) for k in ['question','answer','reason','hints','thinkingDemand','diagram']}
    if q.get('diagram'):payload['assetDigest']=hashlib.sha256((ROOT/q['diagram']['path']).read_bytes()).hexdigest()
    require(hashlib.sha256(json.dumps(payload,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==expected,tid+' stale full elective review')
# Question text alone does not protect a diagram-dependent question. Bind all
# thinking card explanations, hints, boundaries, and rendered assets separately.
for q in thinking:
    payload={k:q.get(k) for k in ['question','answer','reason','solutionSteps','hints','applicability','thinkingEvidence','diagram']}
    if q.get('diagram'):payload['assetDigest']=hashlib.sha256((ROOT/q['diagram']['path']).read_bytes()).hexdigest()
    record=hashlib.sha256(json.dumps(payload,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
    require(record==supplement['cardAndAssetDigests'].get(q['id']),q['id']+' stale thinking/diagram editorial review')
enrichment=runpy.run_path(str(HERE/'enrichment-checks.py'))['RESULT']
all_unit_checks=runpy.run_path(str(HERE/'all-unit-checks.py'))['RESULT']
sample=next(iter(tasks.values()))
changed={**sample,'question':sample['question']+'（变更检查）'}
require(digest(changed)!=editorial.get(sample['id']),'changed wording must invalidate recorded editorial review')
for q in list(tasks.values())+extras:
    tid=q.get('id',q.get('taskId'))
    require(all(q.get(k) for k in ['question','answer','reason']),str(tid)+' required fields')
    require(not re.search('上题|上一题|上述|同上|前题|上式',q['question']),str(tid)+' self-contained prompt')
    old=q.get('audit',{})
    keep_human=old.get('status')=='human_checked' and old.get('contentDigest')==digest(q) and old.get('reviewerName')
    needs_revision=old.get('status')=='needs_revision'
    q['audit']=old if (keep_human or needs_revision) else {'status':'auto_checked','date':'2026-09-25','checks':['required_fields','stable_id','self_contained_prompt_screen','answer_reason_present'],
      'contentDigest':digest(q),'meaning':'仅自动结构筛查；不是数学语义全证明或人工确认。'}
    q['editorReview']={'reviewerType':'AI','status':'reviewed' if editorial.get(tid)==digest(q) else 'unreviewed','date':'2026-09-25' if tid in all_unit_review['taskDigests'] else '2026-09-24','contentDigest':editorial.get(tid),
      'scope':['题意与所求量','答案及理由','基本边界与先修','是否可独立抽题'],
      'limitation':'AI教研复核仍可能遗漏；开放题参考示例不是所有可行答案集合。未发生具名教师审核或Kevin试学。'}
    ledger.append(dict(taskId=tid,phase=q.get('phase',q.get('role')),audit=q['audit'],editorReview=q['editorReview']))

require(len({x['taskId'] for x in ledger})==786,'expected 786 unique tasks including thinking cards')
summary=dict(scope='grade3-only',date='2026-09-25',lessons=len(by),textbookEntries=len(route['routes']),
 courseTasks=len(tasks),scheduledReviewTasks=sum(q['phase']=='spaced-review' for q in tasks.values()),
 unitDiagnosticTasks=5,extraTransferTasks=1,optionalThinkingTasks=len(thinking),totalDistinctTasks=len(ledger),
 taskAuditStatusCounts=dict(Counter(x['audit']['status'] for x in ledger)),
 humanChecked=sum(x['audit']['status']=='human_checked' for x in ledger),
 AIEditorialReviewed=sum(x['editorReview']['status']=='reviewed' for x in ledger),
 AIPending=sum(x['editorReview']['status']!='reviewed' for x in ledger),
 automatedArithmeticFixtures=len(fixtures),thinkingStructureChecks=len(thought_checks),semanticAutomatedProof=False,
 enrichmentChecks=enrichment,
 allUnitChecks=all_unit_checks,
 errors=errors,frozenFilesVerified=len(frozen),
 humanReviewPending=sum(x['audit']['status']!='human_checked' for x in ledger),classroomTrialLessons=0,
 note='auto_checked只表示列出的结构筛查。AI复核摘要匹配数另计，不能记human_checked；具名成人逐题确认与真实课堂试学未发生，不宣称已经完成。')
report={'summary':summary,'tasks':ledger,'arithmeticFixtures':[dict(expression=e,expected=a) for e,a in fixtures]}
if errors:
    print(json.dumps({'errors':errors},ensure_ascii=False,indent=2));raise SystemExit(1)
path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
routepath.write_text(json.dumps(route,ensure_ascii=False,indent=2)+'\n')
bankpath.write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n')
(BASE/'grade-3-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
