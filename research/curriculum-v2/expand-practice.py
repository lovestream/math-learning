"""Apply explicitly authored, lesson-specific practice additions. No question cloning."""
from pathlib import Path
import json
import re
import sys

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/"content/course-plan-v2"
SOURCE=Path(__file__).parent/"practice-expansion"
authored={}
for path in sorted(SOURCE.glob("grade-*.txt")):
    current=None
    for line_no,raw in enumerate(path.read_text().splitlines(),1):
        line=raw.strip()
        if not line:continue
        if re.fullmatch(r"G[3-6]-[A-Z]+\d+-[BEOR]\d+",line):
            if line in authored:raise ValueError(f"Duplicate lesson {line}")
            current=line;authored[line]=[]
        else:
            if current is None:raise ValueError(f"{path}:{line_no}: missing lesson")
            fields=line.split("§")
            if len(fields)!=3 or not all(fields):raise ValueError(f"{path}:{line_no}: malformed question")
            authored[current].append(dict(question=fields[0],answer=fields[1],reason=fields[2]))
for key,rows in authored.items():
    if len(rows)!=6:raise ValueError(f"{key}: expected 6 additions, got {len(rows)}")
requested=[int(v) for v in sys.argv[1:]] or [3,4,5,6]
for grade in requested:
    path=BASE/f"grade-{grade}.json";data=json.loads(path.read_text())
    missing=[l["id"] for l in data["lessons"] if l["id"] not in authored]
    if missing:raise ValueError(f"Grade {grade} incomplete: {missing}")
    for lesson in data["lessons"]:
        lid=lesson["id"]
        # The original six exercises remain the initial group; reruns replace this authored expansion.
        core=lesson["practice"][:6]
        for i,item in enumerate(core,1):
            item.update(id=f"{lid}-P{i:02d}",phase="lesson",objectiveIds=[f"{lid}-OBJ1"])
        extra=[]
        for i,row in enumerate(authored[lid],7):
            item=dict(row,id=f"{lid}-P{i:02d}",objectiveIds=[f"{lid}-OBJ1"])
            if i<=8:
                item.update(level="补充变式",phase="lesson",usage="当堂或下一次学习选做；不要求一次做完")
            else:
                day={9:1,10:3,11:7,12:21}[i]
                item.update(level="独立回顾",phase="spaced-review",reviewAfterDays=day,
                    usage=f"完成本课后第{day}天另题回顾；此前不展示答案",
                    evidenceRule="先记录首次答案及是否使用帮助；答案正确且有帮助时不标为独立保持")
            extra.append(item)
        lesson["practice"]=core+extra
        lesson["objectives"]=[dict(id=f"{lid}-OBJ1",description=lesson["objective"])]
        lesson["practiceUse"]="8道当堂备选题加4道分日独立回顾题，共12题。一次通常选3—5题，按表现补做；不能把同一天看过答案后的重做计为间隔保持。"
        lesson["reviewPlan"]=[
            dict(afterDays=day,taskIds=[f"{lid}-P{i:02d}"],purpose=purpose)
            for i,day,purpose in [(9,1,"检查核心方法的短期保持"),(10,3,"辨别易混条件或错误推理"),(11,7,"在不同情境独立迁移"),(12,21,"解释关键关系并检查长期保持")]
        ]
        lesson["assessmentNotes"]="参考答案及理由用于教研/家长核对。等价的正确表达同样接受；开放解释不自动判满分。分日题使用了独立题干，但真实呈现、帮助记录和调度尚待接入网站。"
    data["status"]="三至六年级课程内容本轮内部定稿；每课12题含4道独立分日回顾，可交外部审核；未接入网站，Kevin试学尚未进行"
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")
    print(f"Grade {grade}: {len(data['lessons'])} lessons, {sum(len(l['practice']) for l in data['lessons'])} exercises, {len(data['lessons'])*4} spaced-review tasks.")
