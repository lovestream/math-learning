# 数学小侦探：匿名内容收件箱

运行时只读取 `lovestream/math-learning` 的 `detective-inbox` 数据分支下此目录的 `DT-*.json`。本分支的应用源码不是部署版本；应用继续在 PR #1 审核，勿合并数据分支。

家长把错题文字或照片发给 ChatGPT；连接器读取最新投递契约，复算、匿名改编后，每包写一个 JSON。默认两宗错误案、一宗正确案。作业原图、姓名、学校、聊天全文和学习记录一律不提交。没有连接器写入权限时，只能如实说明未投递。

- 正式契约与生成工具在 PR #1 代码分支：`docs/design/数学小侦探_ChatGPT投递开发指南.md`、`shared/detective-inbox.mjs`、`docs/design/数学小侦探_ChatGPT投递契约_v1.json`。
- 同一包使用稳定 bundleId 和同名文件；内容变化必须增加 bundleRevision。不要改应用源码来录题。
- 本机启动及每15分钟只读拉取；确定性模板完整核验通过才自动发布。不支持的题进入本机待核对，数学矛盾拒绝整包。GitHub提交成功不等于本机收到。
- 本目录不存测试fixture。`DT-DEMO-CARDS-20261015.json` 是明确标记的匿名投递演示（非Kevin新作业），用于检验真实GitHub读取链路。
