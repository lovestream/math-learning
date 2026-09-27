# 课程审核基线：当前只推进三年级

更新于2026-09-24。根据ChatGPT外审意见，本轮只修改三年级设计与教案，四至六年级JSON、逐年级Markdown和来源文件冻结。新教案仍未接入网站。

| 年级 | 课数 | 课内题 | 分日回顾题 | 当前状态 |
|---|---:|---:|---:|---|
| 三年级 | 60 | 720 | 240 | 外审后已修订；另有5道单元诊断、1道专用迁移题、60道思维收尾题 |
| 四年级 | 71 | 852 | 284 | 冻结原稿 |
| 五年级 | 75 | 900 | 300 | 冻结原稿 |
| 六年级 | 75 | 900 | 300 | 冻结原稿 |

三年级按实际两册教材17个目录入口组织。每章基础先完成必要目标；提升与思想入口共享同一课程和题目ID，不另复制一份奥数。每课12题是题库，前8题备选、后4题分日；一次3–5题，复杂课分次，E/O不作为B的通关门槛。

## 三年级权威文件

- grade-3.json：60课原文、具体操作规约、3道最低代表题、可选题、回补和独立检验、任务审核状态。
- grade-3-pathway.json：教材路线、conceptId索引、跨年级未来链接、5道单元诊断与试学边界。
- grade-3-thinking.json：共60题，原34题加20张暑假方法改写卡与6张长度连接卡；含15幅SVG、提示、完整推理与六条方法联系。
- grade-3.md：完整可读教案；sources-grade-3.md：教材证据与拓展边界。
- grade-3-audit.json：逐题自动检查和AI编辑复核台账，明确human_checked与未试学。
- audit-results.json：四个年级只读结构/算式筛查汇总，不代表四至六年级本轮重审。
- docs/review/：更新的设计稿、三年级独立教案、路线、五课交互规格、审计回应；旧合订稿仅同步三年级。

## 后续编辑与生成

修订以当前JSON为准。题文变化后，原AI/人类审核摘要必须失效，不可仅靠运行检查重新认定已经审过。先做真实复核并登记新摘要，再运行：

~~~sh
python3 research/curriculum-v2/grade3-revision/check.py
python3 research/curriculum-v2/render-plans.py --grade 3
python3 research/curriculum-v2/audit.py
python3 research/curriculum-v2/export-review.py
~~~

不要运行各年级早期build/author/finalize或polish.py覆盖现稿。本轮grade3-revision中的revise.py/specifications.py/pathway.py/update-design.py同样属于一次编辑过程记录，不是每次生成器。四至六年级冻结检查摘要在grade3-revision/frozen-grades.json中。

本轮未改网站运行代码，不宣称60课已上线。下一步按五课规格先编码B01/B03两课，试学后再逐批接入三年级。

## 全单元质量复查（2026-09-25）

grade-3-quality-map.json覆盖17个教材入口与60课，记录基础、实际提升题及证据边界。48道备选练习已经改写并补两级提示；新增11幅课内图，思维卡15幅图保持。基础最低过关题未提高难度，四至六年级不动。完整复查与图文预览在docs/review。
