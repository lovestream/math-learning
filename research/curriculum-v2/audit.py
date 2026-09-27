"""Read-only structural checks for the curriculum drafts; arithmetic flags need human review."""
from pathlib import Path
from collections import Counter,defaultdict
from fractions import Fraction
import json,re,ast
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'content/course-plan-v2'
errors=[];warnings=[];stats=[];lessons={};sources={};grades=[];task_ids=set()
required=['id','title','unitId','tier','anchor','prerequisites','dependsOn','objective','realProblem','why','model','explanation','example','practice','misconception','retell','next']
for grade in (3,4,5,6):
    p=BASE/f'grade-{grade}.json'
    if not p.exists():errors.append(f'G{grade}: missing file');continue
    d=json.loads(p.read_text());grades.append(d)
    stats.append(dict(grade=grade,units=len(d['units']),lessons=len(d['lessons']),practice=sum(len(x['practice']) for x in d['lessons']),tiers=dict(Counter(x['tier'] for x in d['lessons']))))
    for src in d['sources']:
        sources[src['id']]=src
        if not (ROOT/src['path']).exists():errors.append(f'{src["id"]}: source file missing')
    uids={u['id'] for u in d['units']}
    for l in d['lessons']:
        lid=l['id']
        if lid in lessons:errors.append(f'{lid}: duplicate id')
        lessons[lid]=l
        for k in required:
            if k not in l or l[k] in ('',None):errors.append(f'{lid}: missing {k}')
        if l['unitId'] not in uids:errors.append(f'{lid}: unknown unit')
        if len(l['practice'])!=12:errors.append(f'{lid}: expected 12 exercises')
        for n,q in enumerate(l['practice'],1):
            for k in ('level','question','answer','reason'):
                if not q.get(k):errors.append(f'{lid} question{n}: missing {k}')
            expected_task_id=f'{lid}-P{n:02d}'
            if q.get('id')!=expected_task_id:errors.append(f'{lid} question{n}: wrong task ID')
            if expected_task_id in task_ids:errors.append(f'{expected_task_id}: duplicate task ID')
            task_ids.add(expected_task_id)
            if q.get('objectiveIds')!=[f'{lid}-OBJ1']:errors.append(f'{expected_task_id}: objective link mismatch')
            if re.search(r'上题|上一题|上述|同盒|同上|前题',q['question']):
                warnings.append(f'{expected_task_id}: may depend on earlier question')
            if n<=8:
                if q.get('phase')!='lesson':errors.append(f'{expected_task_id}: should be lesson practice')
            else:
                expected_day={9:1,10:3,11:7,12:21}[n]
                if q.get('phase')!='spaced-review' or q.get('reviewAfterDays')!=expected_day:
                    errors.append(f'{expected_task_id}: wrong spaced-review day')
                if not q.get('evidenceRule'):errors.append(f'{expected_task_id}: missing independence rule')
        if l.get('objectives')!=[dict(id=f'{lid}-OBJ1',description=l['objective'])]:
            errors.append(f'{lid}: objective identity mismatch')
        if [r.get('afterDays') for r in l.get('reviewPlan',[])]!=[1,3,7,21]:
            errors.append(f'{lid}: review plan missing one or more intervals')
        if [r.get('taskIds') for r in l.get('reviewPlan',[])]!=[[f'{lid}-P{n:02d}'] for n in (9,10,11,12)]:
            errors.append(f'{lid}: review plan task mapping mismatch')
        if len(l['explanation'])<3:warnings.append(f'{lid}: fewer than 3 explanation steps')
        for k in ('question','steps','answer'):
            if not l['example'].get(k):errors.append(f'{lid}: missing example {k}')
        if l['anchor']['sourceId'] not in sources:errors.append(f'{lid}: unknown anchor source')
    for u in d['units']:
        seq=u.get('sequence',[])
        if not seq:errors.append(f'{u["id"]}: empty unit')
        for id in seq:
            if not any(l['id']==id for l in d['lessons']):errors.append(f'{u["id"]}: unknown sequence {id}')
        if not u.get('coverage'):errors.append(f'{u["id"]}: no coverage mapping')
        mapped={id for item in u.get('coverage',[]) for id in item.get('lessonIds',item.get('lessons',[]))}
        for id in set(seq)-mapped:errors.append(f'{u["id"]}: lesson {id} absent from coverage map')
        for id in mapped-set(seq):
            if id not in lessons or lessons[id]['tier']!='R':
                errors.append(f'{u["id"]}: cross-unit coverage {id} must be an existing review lesson')

active=set();done=set()
def visit(id):
    if id in active:errors.append(f'{id}: dependency cycle');return
    if id in done:return
    active.add(id)
    l=lessons[id]
    for parent in l['dependsOn']:
        if parent not in lessons:errors.append(f'{id}: unknown prerequisite {parent}');continue
        if l['tier']=='B' and lessons[parent]['tier'] in ('E','O'):
            warnings.append(f'{id}: core depends on elective {parent}')
        visit(parent)
    active.remove(id);done.add(id)
for id in lessons:visit(id)

def calc(s):
    s=s.replace('×','*').replace('÷','/').replace('−','-').replace('（','(').replace('）',')')
    def ev(n):
        if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):return Fraction(str(n.value))
        if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -ev(n.operand)
        if isinstance(n,ast.BinOp):
            a,b=ev(n.left),ev(n.right)
            if isinstance(n.op,ast.Add):return a+b
            if isinstance(n.op,ast.Sub):return a-b
            if isinstance(n.op,ast.Mult):return a*b
            if isinstance(n.op,ast.Div):return a/b
        raise ValueError('unsupported')
    return ev(ast.parse(s.strip(),mode='eval').body)
flags=[];checked=0;context_skips=[]
pat=re.compile(r'([\d][\d.\s+\-−×÷*/()（）]*[+\-−×÷*/][\d.\s+\-−×÷*/()（）]*)\s*[=＝]\s*([\d][\d.\s+\-−×÷*/()（）]*)')
for id,l in lessons.items():
    texts=[('explanation',x) for x in l['explanation']]+[('example',x) for x in l['example']['steps']]+[('example-answer',l['example']['answer'])]
    texts += [('answer-reason',q['answer']+' '+q['reason']) for q in l['practice']]
    for field,text in texts:
        for m in pat.finditer(text):
            a,b=m.groups()
            before=text[:m.start()].rstrip()
            after=text[m.end():]
            if after.startswith(('余','又','…')) or (before and before[-1] in '×÷*/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'):
                context_skips.append(dict(id=id,field=field,text=text,reason='余数、带分数、循环小数或符号表达；需人工语境核对'))
                continue
            try:
                left,right=calc(a),calc(b)
                if after.startswith('%'):right/=100
                checked+=1
                if left!=right:flags.append(dict(id=id,field=field,equation=m[0].strip(),context=text))
            except (SyntaxError,ValueError,ZeroDivisionError):pass
dupes=defaultdict(list)
for id,l in lessons.items():
    for i,q in enumerate(l['practice'],1):dupes[q['question'].strip()].append(f'{id}:Q{i}')
duplicates=[dict(question=q,locations=ls) for q,ls in dupes.items() if len(ls)>1]
report=dict(stats=stats,errors=errors,warnings=warnings,arithmeticEqualitiesChecked=checked,arithmeticFlags=flags,duplicatePrompts=duplicates,
 arithmeticContextSkips=context_skips,
 limitation='Equality extraction is a screening aid, not a proof of every exercise. Wrong worked statements, units, rounding and context require human review. Complete semantic and classroom validation is not implied.')
(BASE/'audit-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(stats=stats,errors=errors[:20],warnings=warnings[:25],arithmeticChecked=checked,arithmeticFlags=flags[:12],duplicatePrompts=len(duplicates)),ensure_ascii=False,indent=2))
