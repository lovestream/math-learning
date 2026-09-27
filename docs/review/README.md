# 给ChatGPT审核的材料（本轮仅三年级）

修订日期：2026-09-25。用户提供的审计原文《Kevin数学课程与网站_教材对照审计及修改意见_20260923.md》保持不动。

建议先上传《Kevin数学学习网站_设计与实现审核稿.md》和《Kevin三年级课程_完整教案审核稿.md》。需要检查交互再加《Kevin三年级_混合运算五课交互规格.md》；全单元修订先看《Kevin三年级_全单元质量复查与改写记录.md》及《Kevin三年级_全单元提升题预览.html》。新增图文预览可打开《Kevin三年级_提升题图文预览.html》，暑假20天对应关系与修订原因见《Kevin三年级_暑假提升题对照与修订说明.md》。想快速看全年主线则看《Kevin三年级_教材主线与分层实施路线.md》。提升与奥数60题可单独看《Kevin三年级_提升与奥数思维题.md》。审计回应、检查数量和待实现边界见《Kevin三年级_审计回应与核验记录.md》。

原《Kevin三至六年级课程_完整教案审核稿.md》也已同步三年级部分；四至六年级原稿冻结，不作为本轮修订范围。不要同时上传三年级独立稿与合订稿，让相同内容重复占用上下文。

建议审核提示：

> 只审核三年级。请沿实际教材单元检查基础是否完整、最低代表题是否匹配、提升是否从本章自然延伸、A改变顺序/B等值改写/C运算律是否分清。同时检查2026-09-25全单元改写记录中的48道题：是不是增加了关系、条件、反例、枚举或优化，而不是仅多算几步；图与题干是否一致。优先逐题检查五课B01/B02/B03/E01/O01及新增E03/E04/E05/O02。指出具体lessonId/taskId、原句、问题、反例或正确答案、建议替换文本。不要把auto_checked当教师审核，也不要把规格当已上线。开放题请说明可接受的其他回答，教学效果请说明要从Kevin试学观察什么。

## 维护与再生成

权威内容为content/course-plan-v2/grade-3.json、grade-3-pathway.json、grade-3-thinking.json；design-review-template.md为设计模板。四至六年级保持冻结。

~~~sh
python3 research/curriculum-v2/grade3-revision/build-quality-map.py
python3 research/curriculum-v2/grade3-revision/render-unit-preview.py
python3 research/curriculum-v2/grade3-revision/check-summer.py
python3 research/curriculum-v2/grade3-revision/check.py
python3 research/curriculum-v2/render-plans.py --grade 3
python3 research/curriculum-v2/audit.py
python3 research/curriculum-v2/export-review.py
~~~

check.py核对静态AI审核摘要与当前题文；改过的题不能靠重新运行脚本自动获得AI/人类语义审核。grade3-revision中的revise.py/specifications.py/pathway.py/update-design.py是本次编辑迁移的过程记录，不是以后每次导出的前置步骤；不要重跑来覆盖后续逐题修订。若改路径图或状态机，需同步对应Markdown，再导出主稿。
