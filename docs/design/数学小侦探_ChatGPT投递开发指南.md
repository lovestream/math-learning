# ChatGPT → GitHub → 数学小侦探：v1投递指南

适用：`lovestream/math-learning` PR #1 的自动收件实现。原设计书里的JSON是示意；以下是已落地的精确契约，不能添加 `approved`、`confidence`、`expected` 或 `checkedBy` 冒充独立核验。

## 家长只需要做什么

把错题照片、截图或文字发给有 GitHub 写权限的 ChatGPT 对话，说“加入数学小侦探”。ChatGPT先检查完整条件及原答案，独立复算，再生成匿名模拟做法。没有看见原过程时，不能说这些步骤是孩子原本写的。关键条件看不清就在聊天里确认，不猜造。

连接器不是每个新对话都天然有写权限；必须实际调用工具，并看到具体提交SHA。网站是127.0.0.1本机服务，ChatGPT不能直接查询其收到状态，也不能读学习进度。成功投递只说“已写入GitHub，等待本机同步”。

## 固定写入位置

- 仓库 `lovestream/math-learning`（公开）。
- 分支 `detective-inbox`；不是 main 或 PR代码分支。
- 文件 `content/detective/inbox/<bundleId>.json`，bundleId格式 `DT-[A-Za-z0-9_-]{1,90}`。
- 一个错题包一文件，1～3案。默认原关系错案、换参数错案、正确对照案。宁可可靠一案，不凑三案。
- 稳定ID只取匿名数学条件和修订；不要包含姓名、学校、私聊链接。相同包重复提交不重建；修改同包须 `bundleRevision+1`，保留case ID。新数学版本不覆盖孩子旧首答。
- 不提交原图、笔迹、真实人物、班级、老师评语、聊天全文、私人来源或个人学习记录。`sourceNotes` 必须为空。图只使用允许的原生条件图。

## 生成可自动发布的包

事实校验与运行时准入是两回事。网站不尝试用正则证明任意中文题意；当前只对下列六类审定模板自动发布，逐字段比对独立推导的完整题面、步骤、首错、依据、提示、正解、逆查、单位及图。数学模板没有覆盖到的题可存为待家长核对，不能偷偷自动发布。

读取 `shared/detective-inbox.mjs` 的 `deriveImportedCase(template, parameters)` 获取精确文本。不要自行润色模板字段；需要不同数学故事时先走待核对。Node生成工具可从匿名参数构造完整CaseContent：

```sh
node scripts/create-detective-bundle.mjs --input=/tmp/匿名参数.json --output=/tmp/DT-匿名稳定编号.json
```

参数文件：

```json
{
  "bundleId": "DT-CARDS-匿名稳定编号",
  "bundleRevision": 1,
  "cases": [
    {"role":"original-error","template":"card-thickness-grouping-v1","parameters":{"mode":"wrong","cardsPerGroup":3,"groupThicknessMm":2,"targetMm":20}},
    {"role":"transfer-error","template":"card-thickness-grouping-v1","parameters":{"mode":"wrong","cardsPerGroup":4,"groupThicknessMm":3,"targetMm":15}},
    {"role":"correct-control","template":"card-thickness-grouping-v1","parameters":{"mode":"correct","cardsPerGroup":5,"groupThicknessMm":2,"targetMm":10}}
  ]
}
```

ChatGPT没有代码运行工具时，可以根据同一渲染器/样例逐字段填写完整JSON；不能执行工具时须如实说明，不声称已运行服务器数学核验。结构样例在 `tests/fixtures/detective-inbox-v1.json`，**它只是测试夹具，不得直接投递**。

模板的参数如下，`mode` 均为 `wrong` 或 `correct`：

|template|其他参数|数学与范围|
|---|---|---|
|card-thickness-grouping-v1|cardsPerGroup、groupThicknessMm、targetMm|整组；每组2～20张；目标大于组厚且整除；总张数≤100000。首错为把组数当张数。逆查总厚度。使用随参数变化的manual条件图，不能复用固定旧卡片SVG。|
|arithmetic-order-v1|a、b、c、operator|operator为add-multiply或subtract-divide，正整数≤1000。除减须整除、非负；错误顺序结果必须不同。逆向检查回到原项。|
|length-conversion-v1|value、from、to|正整数≤100000；从较大单位换小单位，结果≤100000000。毫米/厘米/分米/米/千米。首错为换单位不换数。|
|equal-groups-v1|groups、each|均2～100000，总数≤1000000且加法与乘法结果不同。用总数÷每组数逆查组数。|
|length-ordering-v1|items: [{value,unit},…]|3～5个不同长度，正整数和上述单位；统一毫米降序；错误案交换前两项，逆查最长项的毫米数。|
|wrap-surplus-shortage-v1|lowTurns, highTurns, surplusDm, shortageDm, scene|圈数1≤lowTurns<highTurns≤12；多出/缺少1～100分米且不相等；(surplusDm+shortageDm)须整除圈数差。scene为bamboo（铁丝绕竹竿）或spool（绳子绕线轴）。每圈等长，单位固定分米。错误案第3行误加缺少量；逆查用另一绕法求一圈，再核两条原条件。|

`schemaVersion` 固定 `detective-inbox.v1`；`producer` 固定 `chatgpt-github`；`privacy` 固定 `public-anonymized-math-only`；`policy` 固定 `auto-if-independently-verified`；每案 `simulatedSteps:true`。`verification`仅接受template、parameters和可选firstWrongStep。完整JSON Schema在 `docs/design/数学小侦探_ChatGPT投递契约_v1.json`；运行时JS检查更严格，并有数学参数边界检查。

`producer`只作协议标记，不是身份认证。首期信任边界是固定分支的GitHub写权限＋本机独立数学核验。隐私关键词拦截不是万能识别器，投递者必须先脱敏；普通儿童API仍分阶段隐藏标准答案，公开GitHub本身不保证答案保密。

## 实际投递

1. 连接器读取收件目录/目标文件；新包用create_file并明确branch。重复包先比对；修改用最新blob SHA及递增修订号调用update_file。
2. 只写一个数据文件，不改源码、不合并main、不上传备份。数据分支不运行应用CI；已部署网站读取JSON即可，不必每题构建。
3. 工具成功后报告文件链接和commit SHA：“已投递，网站下次检查后可见”。工具失败就报告失败，保留匿名包供重试。
4. 本机启动检查，此后每15分钟检查；进入侦探页距上次成功检查超过2分钟也会异步刷新。后台失败按1、2、4…分钟退避，最多6小时；GitHub限流遵守reset。断网保留全部本地训练。
5. 家长收件箱显示本机成功时间、每包自动发布/待核对/数学拒绝，以及同步错误和下次重试时间。可暂停自动发布、立即同步。已经生成的今日三案保持版本不动；新到训练立即可练，不增加每天三枚徽章上限。

每文件≤192KiB，目录≤400项，200案/20版本/3MiB原侦探容量限制保留。索引使用ETag；仅新blob下载，并独立校验Git blob SHA。blob API限流时仅回退到同仓库/同分支的固定GitHub原文件地址，依旧必须匹配索引blob SHA；目录API不可用时明确等待，不绕过来源校验。事务以单包为单位：有数学矛盾整包拒绝，有未支持模板整包待核对。其他包仍可导入。源删除不删除本机案卷。导入台账、待审草稿和已发表版本随原进度备份；客户端进度不暴露私有namespace。

## 独立验证

```sh
node --test tests/detective-inbox.test.mjs tests/detective-http.test.mjs
node scripts/run-browser-ci.mjs --only=verify-detective-inbox-browser,verify-detective-browser,verify-detective-recovery-browser
node scripts/verify-detective-live-inbox.mjs
```

最后一项使用真实公开GitHub和操作系统临时库，仅验证明确标记的匿名演示包。它不读取或写入Kevin真实学习库；网络不可用时失败并如实报告。浏览器CI使用显式Node预加载的假GitHub目录与测试时钟，生产代码没有可配置外部收件URL或测试写接口。

当前没有本机回执上传通道；也没有网站OCR、原作业照片存储、自动读取私人对话、几何开放题自动数学证明或Kevin真实试学验收。不能把演示联调冒充用户新照片三方闭环。

## 新投递训练的逐题验收

`node scripts/verify-detective-deliveries.mjs --prefix=DT-批次编号` 可在自动创建的临时学习库中，对新包做真实GitHub接收、逐blob对照、独立复算和全部案件的四步浏览器验收；1～3案包均支持。该工具不写真实学习库，也不要求每道新题修改应用代码。须先`git fetch origin`，保证审阅的不可变数据提交与本机同步blob一致。

独立复算不调用题目生成器获取数值答案：运算使用精确表达式解析；长度用单位量级；等组和厚度用重复分组/重复累加。浏览器再用这份独立结果作答，覆盖排序拖动、错误修复、刷新恢复、今日计划不变、徽章上限及备份恢复。输出在`output/playwright/detective-deliveries/`。网络不可达时明确失败，不伪称已导入。


## 2026-10-16 绕线模板与版本边界

审定三案见 `content/detective/reviewed/DT-20261016-WIRE-A.json`：原关系模拟18分米、换情境16分米、正确对照26分米。原始过程未知，不能称模拟步骤为孩子实际错法。未知模板的旧程序会保留待核对；升级后重复同步可重新数学核验，不能自动重写已被家长编辑的草稿。运行中的程序不会因GitHub加入模板源码而自行升级。

新到列表与今日列表按案号＋版本去重；完整收件台账不减少。今日旧版本与新活动版本同时存在时，两者均有入口，原首答仍关联旧版本。

## 2026-10-27 V2新增四模板（oracle.v3）

包仍使用detective-inbox.v1，未知模板仍待审。新参数必须用create-detective-bundle生成全字段；不按题目ID硬编码数学。

|模板|参数（另外都需要mode=wrong/correct）|约束|
|---|---|---|
|batch-average-mass-v1|item,count,totalGrams；wrong模式另有wrongDivisor|物品白名单：花生米/豆子/坚果仁/玻璃珠；颗数2～1000；质量(0,10000]且至多三位小数；错误除数必须不同于颗数|
|mass-average-inverse-v1|item,ask=total/count,averageGrams；求total时count，求count时totalGrams|质量正且至多三位小数；颗数为正整数；不取整、不接受多余字段|
|spring-total-length-v1|originalCm,mmPerKg,loadKg|原长和每千克增量正整数≤1000，载重0～1000；总长=10×originalCm+mmPerKg×loadKg；漏原长首错在结论行|
|spring-reverse-v1|ask=load/initial,mmPerKg,finalMm；load另有originalCm，initial另有loadKg|总长正整数≤100000；未知量非负整数，不将不整除重量四舍五入；不能让题干提前给出未知原长|

四份20261026固定blob有单独的审定文字版本，须全字段/参数完全相同且再做数值、单位、首错核验；这不是接受任意ChatGPT文案。新参数默认使用确定性生成器。独立审校工具另走精确解析、重复相加、枚举和代回路线，覆盖12案及泛化边界。旧v1/v2待审回执会绕开ETag缓存重验；已编辑、撤回、已发布或归档的案不覆盖，相同blob的编辑冲突只记录一次稳定待人工说明，其他健康包继续处理。

匿名投递仍禁止原照片、真实笔迹、姓名、学校和学习记录。真实题只提供错因归纳；“10颗共6克”等是模拟参数，不能记作原作业实测值。
