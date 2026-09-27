# 三至六年级课程重编：编写约定

本目录是待审阅的内容方案，不接入现有网站。教材以 research/source-textbooks 的八本实际 PDF 为准，旧 curriculum-map 只作问题对照，不作为版本证据。

每年级输出 grade-N.json、grade-N.md、sources-grade-N.md。JSON 顶层：grade、editionNote、sources（id/path/pdfPages/edition/printedPageOffset）、units、lessons。unit：id/term/title/sourceId/printedPages/coverage（该单元实际小节与对应课 ID）/sequence（建议学习顺序 ID）/notes。

每课字段：
- id：G4-U01-B01 等；U/L 分别表示上下册，B 基础，E 提升，O 思想专题，R 整理复习。
- title、unitId、tier（B/E/O/R）、minutes（建议 30–40）。
- anchor：sourceId、printedPages（如“12–15”）、pdfPages（如“18–21”）、type（textbook/extension）、note（教材实际内容与原创提升的边界）。页码未核实就明确未核实，不得猜造。
- prerequisites：描述先修内容的字符串数组；dependsOn：本年级已命名的课 ID 数组。
- objective、realProblem、why、model（具体图形/实物/数线操作，文字应自足，无图也能理解）。
- explanation：至少 3 步具体讲解，不使用可套所有课的空模板。
- example：question、steps（数组）、answer；原创完整例题，不复制整段课本。
- practice：至少 12 题，题题有 level（基础/变式/迁移/挑战/回顾）、question、answer、reason。至少 3 种任务形式，不只是同一题换数字。前8题为当堂或下一次学习的备选题，后4题有独立完整题干、不同答案/理由及第1、3、7、21天的回顾安排；不要求一次做完题库。
- misconception：wrong、correction。数学限制条件必须准确。
- retell：让孩子用自己的话解释具体原因的提问。
- next：去向与联系；无需强行每课都加奥数。同一知识只设一个主要教学位置，后续标为复习、迁移、深化。

原则：逐个教材单元全覆盖，单元复习/综合实践也要有位置；每册约 25–40 次课仅为量级参考，不能为凑数合并不同核心概念或拆碎重复。先写基础主线，再设计真正关联的提升和少量有充分先修的奥数专题。所有课均应有可读的备课内容和带答案练习，不能只列标题。不用强制选单位题，但答案保留情境所需单位。生活情境是学习动机，不冒充未经考证的数学起源史。

练习和讲解需自行复核；完成时报告已核实的教材页、课数、练习数、可能遗漏与不确定处。Markdown 供家长逐课审阅，JSON 供检查和未来内容生成，二者内容必须一致。

本轮补题遵循每课12题的定稿标准：每题有稳定P01–P12 ID；后四题标记spaced-review并带reviewAfterDays，课程另有reviewPlan和OBJ1目标链接。这些元数据是教案，不代表现有网站已经发题。复习时优先记录首次独立答案；使用帮助后不能把同题订正计为独立保持。

## 2026-09-24 三年级外审后新增契约

本节仅应用于三年级；其他年级保持冻结，不为统一字段批量改写。

- conceptId稳定且与年级无关；exposure区分首教、深化、迁移、复习。未学选学课时，基础课自身也必须包含必要建模。
- teachingContract明确教材核心/选学、3道当堂最低代表题、其他备选、最低证据、退出、回补与分次。最低题不得引用P09–P12分日题。
- interaction每课必须有具体初态、动作、可观察变化、追问、预期理由、错误反馈、撤除帮助后的完整题目。implementationStatus不得把文字规约标成已编码。
- 稳定任务ID与题文/答案/理由SHA-256绑定。audit只取unreviewed/auto_checked/human_checked/needs_revision；AI复核单列editorReview，不允许冒充具名人类教师。
- scoring保留参考和理由证据；没有可接受解集合与结构约束时不直接编译为自动评分器。单位固定显示，不机械要求另选单位。
- 首答、自查、最终答、提示和成人确认分开。单错题先补问再提可能原因，允许家长改判断。
- 当日练习3–5题、全站到期复习至多3题；预留独立题不可先展示答案。所有题含开放题均允许等价正确表达，不能用参考字面字符串唯一判定。
- 本次编辑的AI复核记录是静态摘要清单；check.py重新运行不会把变更后的题自动登记为语义已审。

## 提升题标准适用于全部单元

按grade-3-quality-map.json的逐课入口维护。提升必须写明新增的思考：改变条件、未知量、信息不足、等量替换、不变量、枚举、极值或反例；单纯换数/多算几步只算基础巩固。每道改写题有两级具体提示，图的display区分question与hint-1。改题须同步scoring、修改记录、质量映射、独立模型检查和静态编辑审核摘要；改图也使审核失效。不得把新增提升塞进原最低基础过关任务。原基础分日复习不能自动认证提升掌握。
