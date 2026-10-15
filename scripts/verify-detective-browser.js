async page=>{
 const assert=(x,message)=>{if(!x)throw Error(message)},base=new URL(page.url()).origin,errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(base+'/?view=detective');await page.getByText('等待新案卷送达',{exact:true}).waitFor();
 assert((await page.request.get(base+'/api/parent/detective/cases')).status()===403,'未解锁竟可读私有案卷');
 await page.request.post(base+'/api/parent/access',{data:{action:'setup',pin:'912345'}});
 await page.goto(base+'/?view=parent');const parent=page.locator('.det-parent');await parent.waitFor();await parent.locator('.det-backup-entry>summary').click();
 await parent.getByRole('button',{name:'手工新增案卷',exact:true}).click();
 await parent.getByLabel('案卷标题',{exact:true}).fill('三袋苹果的结果疑案');
 await parent.getByLabel('原题（儿童会看到，请用小智等虚构称呼）',{exact:true}).fill('有3袋苹果，每袋4个，一共有多少个？');
 await parent.getByLabel('模拟做法（每行一步；只知道答案，就只写答案）',{exact:true}).fill('3×4=7个。');
 await parent.getByLabel('正确结果、理由和另一种检查方法（结案后显示）',{exact:true}).fill('3袋各4个，一共12个；反过来把12个每4个分一袋，正好3袋。');
 const saved=page.waitForResponse(r=>r.url().endsWith('/api/parent/detective/cases')&&r.request().method()==='POST');await parent.getByRole('button',{name:'保存草稿',exact:true}).click();assert((await saved).ok(),'手工草稿保存失败');await parent.locator('.det-editor-heading>span').filter({hasText:/^草稿已保存/}).waitFor();
 await parent.getByRole('button',{name:'预览儿童题面',exact:true}).click();await parent.locator('.det-preview').screenshot({path:'output/playwright/v2-audit/detective-parent-preview.png'});
 const checks=parent.locator('.det-publish-checks input');for(let i=0;i<3;i++)await checks.nth(i).check();
 const published=page.waitForResponse(r=>r.url().endsWith('/api/parent/detective/cases')&&r.request().method()==='POST');await parent.getByRole('button',{name:'审核并发布当前案卷',exact:true}).click();const publication=await published;assert(publication.ok(),'手工案卷发布失败');assert((await publication.json()).cases.some(c=>c.draft.title==='三袋苹果的结果疑案'&&c.status==='published'),'发布响应没有发布版本');await parent.locator('.det-editor-heading>span').filter({hasText:/发布后修改会产生新版本/}).waitFor();
 await parent.getByRole('button',{name:'返回批量审核',exact:true}).click();for(let i=0;i<3;i++)await checks.nth(i).check();
 await parent.getByRole('button',{name:'审核并启用14宗示例',exact:true}).click();
 await parent.getByText('16宗 · 15宗已发布',{exact:true}).waitFor();
 const bank=(await(await page.request.get(base+'/api/parent/detective/cases')).json()).cases;
 // Stage A parent-created oral case must enter a real child plan. Withdraw other
 // wrong cases in this temporary fixture so daily selection includes the manual case.
 const manual=bank.find(c=>c.draft.title==='三袋苹果的结果疑案');
 for(const c of bank.filter(c=>c.status==='published'&&c.draft.verdict==='wrong'&&c.id!==manual.id&&c.id!=='DET-G3-003')){
  const r=await page.request.post(base+'/api/parent/detective/cases',{data:{action:'withdraw',eventId:crypto.randomUUID(),caseId:c.id,expectedRevision:c.revision}});assert(r.ok(),'临时计划撤回失败');
 }
 const allBank=(await(await page.request.get(base+'/api/parent/detective/cases')).json()).cases;
 await page.getByRole('button',{name:'数学小侦探',exact:true}).click();const panel=page.locator('.detective-page');await panel.locator('.det-case-ticket').first().waitFor();
 assert((await page.request.get(base+'/api/export')).status()===403,'离开家长页后私有完整备份仍公开');
 const today=await(await page.request.get(base+'/api/detective/today')).json();assert(today.cases.length===3,'不是三案');
 const cs=today.cases.map(x=>allBank.find(c=>c.id===x.case.id).versions.find(v=>v.id===x.case.version).content);assert(cs.filter(x=>x.verdict==='correct').length===1,'正确案比例');
 await panel.screenshot({path:'output/playwright/v2-audit/detective-today-1440.png'});
 for(const entry of today.cases){
  const c=allBank.find(c=>c.id===entry.case.id).versions.find(v=>v.id===entry.case.version).content;
  await panel.getByRole('button',{name:new RegExp(entry.case.title)}).click();await panel.getByRole('heading',{name:'这份做法有问题吗？',exact:true}).waitFor();
  if(entry.case.id==='DET-G3-003'){
   await panel.getByRole('button',{name:'没问题',exact:true}).click();await panel.getByText(/这次漏掉了一个问题/).waitFor();
   await panel.screenshot({path:'output/playwright/v2-audit/detective-missed-error.png'});
   await page.reload();await panel.locator('.det-history').evaluate(e=>e.open=true);await panel.locator('.det-history button').filter({hasText:entry.case.title}).click();await panel.getByRole('heading',{name:'这份做法有问题吗？',exact:true}).waitFor();assert((await panel.locator('.det-first').innerText()).includes('没问题'),'刷新丢首判');
  }
  await panel.getByRole('button',{name:c.verdict==='wrong'?'有问题':'没问题',exact:true}).click();
  await panel.getByRole('heading',{name:c.verdict==='wrong'?'第一处问题在哪里？':'你用什么依据判断正确？',exact:true}).waitFor();
  if(c.verdict==='wrong')await panel.locator('.det-work>button').nth(c.errorStep).click();else assert(await panel.locator('.det-work>button').count()===0,'正确案强迫选错行');
  await panel.getByLabel(c.reasons[c.reason],{exact:true}).check();await panel.getByRole('button',{name:'保存证据',exact:false}).click();
  await panel.getByRole('button',{name:'保存结果，去验证',exact:false}).waitFor();
  if(c.repair.kind==='oral')await panel.getByLabel('我已把理由说给家长听，等待家长核对。',{exact:true}).check();
  else if(c.repair.kind==='number')await panel.getByLabel('你的答案',{exact:true}).fill(c.repair.answer);
  else if(c.repair.kind==='choice')await panel.getByLabel(c.repair.answer,{exact:true}).check();
  if(entry.case.id==='DET-G3-003'){
   await panel.locator('.det-toolbar').getByText('记录已保存在本机',{exact:true}).waitFor();await page.reload();await panel.locator('.det-history').evaluate(e=>e.open=true);await panel.locator('.det-history button').filter({hasText:entry.case.title}).click();await panel.getByLabel('你的答案',{exact:true}).waitFor();assert(await panel.getByLabel('你的答案',{exact:true}).inputValue()==='30','刷新丢草稿');
   await panel.screenshot({path:'output/playwright/v2-audit/detective-cards-evidence-1440.png'});
  }
  await panel.getByRole('button',{name:'保存结果，去验证',exact:false}).click();await panel.getByRole('button',{name:'保存验证，结案',exact:false}).waitFor();
  if(c.verify.kind==='oral')await panel.getByLabel('我已把理由说给家长听，等待家长核对。',{exact:true}).check();else await panel.getByLabel('你的答案',{exact:true}).fill(c.verify.answer);
  await panel.getByRole('button',{name:'保存验证，结案',exact:false}).click();
  if(c.verify.kind==='oral')await panel.getByRole('heading',{name:'解释已保存，请家长听一听',exact:true}).waitFor();else await panel.getByText('核 对 完 成',{exact:true}).waitFor();
  if(entry.case.id==='DET-G3-003'){assert((await panel.locator('.det-first').innerText()).includes('没问题'),'结案改写首判');await panel.screenshot({path:'output/playwright/v2-audit/detective-assisted-closure.png'});}
  await panel.getByRole('button',{name:'暂停，回案卷柜',exact:false}).click();await panel.locator('.det-case-ticket').first().waitFor();
 }
 const history=await(await page.request.get(base+'/api/detective/today')).json();assert(history.history.find(x=>x.case.id===manual.id).attempt.status==='parent-review','口述自动判完成');
 assert(history.badges===2,'待审核也发勋章');
 await page.request.post(base+'/api/parent/access',{data:{action:'unlock',pin:'912345'}});await page.goto(base+'/?view=parent');await parent.waitFor();await parent.locator('.det-backup-entry>summary').click();
 const article=parent.locator('.det-parent-review article').filter({hasText:'三袋苹果的结果疑案'});await parent.getByLabel('给孩子的公开反馈',{exact:true}).fill('临时测试：已听完数量关系和逆向分组解释。');
 await article.getByRole('button',{name:'解释与验证成立',exact:true}).click();await parent.getByText('批阅已保存，原始首判和历次审核仍保留。',{exact:true}).waitFor();if(await parent.locator('.det-parent-review').getAttribute('open')===null)await parent.locator('.det-parent-review>summary').click();await parent.locator('.det-parent-review').screenshot({path:'output/playwright/v2-audit/detective-parent-review.png'});
 const exportResponse=await page.request.get(base+'/api/parent/export');assert(exportResponse.ok(),'解锁后家长专用备份导出失败');const exported=await exportResponse.json();assert(exported.progress.wallet.coins===0,'侦探改了钱包');assert(exported.progress.studio.detective.badges.length===3,'家长核对没有发独立侦探徽章');assert((await page.request.post(base+'/api/parent/import',{data:exported})).ok(),'导入失败');
 // Correcting a parent review must show remediation, never a contradictory closed stamp.
 await parent.getByLabel('给孩子的公开反馈',{exact:true}).fill('临时测试：再核对每袋4个的分组理由。');
 const correction=page.waitForResponse(r=>r.url().endsWith('/api/parent/detective/grade'));
 await article.getByRole('button',{name:'需要再核对',exact:true}).click();assert((await correction).ok(),'更正批阅失败');await article.getByText(/needs-revisit/).waitFor();
 await page.getByRole('button',{name:'数学小侦探',exact:true}).click();await panel.locator('.det-case-ticket').first().waitFor();await panel.getByRole('button',{name:/三袋苹果的结果疑案/}).click();await panel.getByRole('heading',{name:'这份解释还需要再核对',exact:true}).waitFor();assert(await panel.locator('.det-closed-stamp').count()===0,'回补还显示结案章');await panel.screenshot({path:'output/playwright/v2-audit/detective-parent-remediation.png'});
 await panel.getByRole('button',{name:'重新核对，保留原记录',exact:true}).click();await panel.getByRole('heading',{name:'第一处问题在哪里？',exact:true}).waitFor();assert((await panel.locator('.det-first').innerText()).includes('有问题'),'重新核对覆盖了首判');
 await panel.locator('.det-work>button').click();await panel.getByLabel('逐项对照题目条件和数量关系。',{exact:true}).check();await panel.getByRole('button',{name:'保存证据',exact:false}).click();await panel.getByLabel('我已把理由说给家长听，等待家长核对。',{exact:true}).check();await panel.getByRole('button',{name:'保存结果，去验证',exact:false}).click();await panel.getByRole('heading',{name:'再换一条路线检查',exact:true}).waitFor();await panel.getByLabel('我已把理由说给家长听，等待家长核对。',{exact:true}).check();await panel.getByRole('button',{name:'保存验证，结案',exact:false}).click();await panel.getByRole('heading',{name:'解释已保存，请家长听一听',exact:true}).waitFor();await panel.getByRole('button',{name:'暂停，回案卷柜',exact:false}).click();
 // Conditions-only mobile / tablet layouts, keyboard navigation, and reduced motion.
 await panel.locator('.det-case-ticket').first().waitFor();
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:width===390?844:1024});await panel.screenshot({path:`output/playwright/v2-audit/detective-today-${width}.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'侦探页面横向溢出 '+width);}
 await page.emulateMedia({reducedMotion:'reduce'});await page.keyboard.press('Tab');
 assert(!errors.length,errors.join('\n'));return {passed:true,threeMixedCases:true,parentManual:true,parentPublish:true,immutableFirst:true,refreshDraft:true,oralReview:true,parentCorrection:true,remediation:true,privateExport:true,isolatedWallet:true,widths:[390,768,1440],errors};
}
