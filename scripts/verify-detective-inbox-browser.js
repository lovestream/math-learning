async (page,{deliverInbox})=>{
 const assert=(value,message)=>{if(!value)throw Error(message)},base=new URL(page.url()).origin,errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?view=detective');const panel=page.locator('.detective-page');await panel.locator('.det-arrivals .det-case-ticket').first().waitFor();
 const start=await(await page.request.get(base+'/api/detective/today')).json();assert(start.newCases.length===3,'启动未自动收三案');const oldPlan=start.cases.map(x=>x.case.version);
 for(const endpoint of ['/api/data','/api/studio']){const x=await(await page.request.get(base+endpoint)).json();assert(!x.progress.studio.detective,'公开进度泄漏私有收件台账');}
 assert((await page.request.get(base+'/api/parent/detective/sync')).status()===403,'同步状态未保护');assert((await page.request.post(base+'/api/parent/detective/sync',{data:{}})).status()===403,'匿名可写同步接口');
 const delivered=deliverInbox();
 // The fixture advances the server clock by 16 minutes and accelerates its timer;
 // no manual refresh/sync/import endpoint is called to deliver the second bundle.
 await page.waitForFunction(async()=>{const x=await(await fetch('/api/detective/today')).json();return x.newCases?.length===6;});
 await page.reload();await panel.locator('.det-arrivals .det-case-ticket').nth(5).waitFor();
 const today=await(await page.request.get(base+'/api/detective/today')).json();assert(JSON.stringify(today.cases.map(x=>x.case.version))===JSON.stringify(oldPlan),'新投递替换了今日计划');
 const entry=delivered.cases[0],target=today.newCases.find(x=>x.case.id===entry.id);assert(!oldPlan.includes(target.case.version),'目标应当是计划外新案');
 await panel.locator('.det-arrivals .det-case-ticket').filter({hasText:entry.content.prompt}).click();await panel.getByRole('button',{name:'有问题',exact:true}).click();await panel.getByRole('heading',{name:'第一处问题在哪里？',exact:true}).waitFor();
 await panel.locator('.det-work>button').nth(entry.content.errorStep).click();await panel.getByLabel(entry.content.reasons[entry.content.reason],{exact:true}).check();await panel.getByRole('button',{name:/保存证据/}).click();
 await panel.getByLabel('你的答案',{exact:true}).fill('6');await panel.getByRole('button',{name:/保存结果，去验证/}).click();await panel.getByText('这个结果还不能符合全部条件。请回看题目里的数量和单位，再试一次。',{exact:true}).waitFor();await panel.screenshot({path:'output/playwright/v2-audit/detective-inbox-wrong-repair.png'});
 await panel.getByLabel('你的答案',{exact:true}).fill(entry.content.repair.answer);await panel.getByRole('button',{name:/保存结果，去验证/}).click();await panel.getByRole('button',{name:/保存验证，结案/}).waitFor();await panel.getByLabel('你的答案',{exact:true}).fill(entry.content.verify.answer);await panel.getByRole('button',{name:/保存验证，结案/}).click();await panel.getByText('核 对 完 成',{exact:true}).waitFor();assert((await panel.locator('.det-first').innerText()).includes('有问题'),'导入案首判丢失');
 await page.request.post(base+'/api/parent/access',{data:{action:'setup',pin:'912345'}});await page.goto(base+'/?view=parent');const parent=page.locator('.det-parent');await parent.waitFor();await parent.getByText('DT-RUNNING-LENGTHS',{exact:true}).waitFor();
 assert(await parent.locator('.det-backup-entry').getAttribute('open')===null,'备用大表单默认展开');const sync=await(await page.request.get(base+'/api/parent/detective/sync')).json();assert(Object.values(sync.files).every(x=>x.status==='auto-published'),'没有本机同步回执');
 const bank=await(await page.request.get(base+'/api/parent/detective/cases')).json(),count=bank.cases.length;await parent.getByRole('button',{name:'立即同步',exact:true}).click();await parent.getByRole('button',{name:'立即同步',exact:true}).isEnabled();await page.waitForFunction(async()=>!(await(await fetch('/api/parent/detective/sync')).json()).syncing);
 assert((await(await page.request.get(base+'/api/parent/detective/cases')).json()).cases.length===count,'重复同步重复建案');
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:width===390?844:1024});await parent.screenshot({path:`output/playwright/v2-audit/detective-inbox-parent-${width}.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${width}家长页溢出`);}
 const backup=await(await page.request.get(base+'/api/parent/export')).json();assert(backup.progress.studio.detective.inbox.files['content/detective/inbox/DT-RUNNING-LENGTHS.json'],'备份丢失收件台账');assert(backup.progress.wallet.coins===0,'同步触碰原有钱包');
 await page.getByRole('button',{name:'数学小侦探',exact:true}).click();await panel.locator('.det-arrivals').waitFor();assert(await panel.locator('.det-arrivals .det-case-ticket h3').first().evaluate(e=>e.getBoundingClientRect().width)>140,'新案标题被挤成竖排');await panel.screenshot({path:'output/playwright/v2-audit/detective-inbox-arrivals-390.png'});
 assert(!errors.length,errors.join(';'));return {passed:true,assertions:['启动自动收件','运行中定时新包无手工导入','今日计划不变','计划外立即练四步','错误结果不通过','首判保留','PIN保护','新入口和折叠备用表单','重复同步幂等','备份台账和钱包不变','390/768/1440无溢出'],clock:'仅独立测试预加载器模拟16分钟；生产间隔15分钟'};
}
