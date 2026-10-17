async (page,{wireBundle})=>{
 const assert=(v,m)=>{if(!v)throw Error(m)},base=new URL(page.url()).origin,panel=page.locator('.detective-page');
 await page.goto(base+'/?view=detective');await panel.locator('.det-case-ticket').first().waitFor();
 const get=async()=>await(await page.request.get(base+'/api/detective/today')).json();
 const first=await get(),plan=first.cases.map(p=>p.case.version);assert(first.newCases.length===3&&first.cases.length===3,'绕线三案未发布');
 assert(await panel.locator('.det-case-ticket').count()===3,'今日与新到重复渲染');assert(await panel.locator('.det-arrivals').count()===0,'全重叠仍展示新到区');
 for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});await page.screenshot({path:`output/playwright/v2-audit/detective-deduplicated-${width}.png`});}
 await page.setViewportSize({width:1440,height:1000});
 for(const entry of wireBundle.cases){
  const c=entry.content;await panel.locator('.det-case-ticket').filter({hasText:c.prompt}).click();
  assert((await panel.locator('.det-case-sheet').innerText()).includes('虚构的匿名模拟'),'未标明模拟');
  await panel.getByRole('img',{name:/同一根线摊直比较/}).waitFor();
  const before=await get(),publicCard=before.history.find(p=>p.case.id===entry.id).case;assert(!('solution'in publicCard)&&!('response'in publicCard),'首答前泄题');
  if(entry===wireBundle.cases[0])await page.screenshot({path:'output/playwright/v2-audit/detective-wire-conditions.png'});
  await panel.getByRole('button',{name:c.verdict==='wrong'?'有问题':'没问题',exact:true}).click();await panel.locator('.det-options').waitFor();
  if(c.verdict==='wrong')await panel.locator('.det-work>button').nth(c.errorStep).click();else assert(await panel.locator('.det-work>button').count()===0,'正确案强制圈错');
  await panel.getByLabel(c.reasons[c.reason],{exact:true}).check();await panel.getByRole('button',{name:/保存证据/}).click();
  await panel.getByLabel('你的答案',{exact:true}).fill(c.repair.answer);await panel.getByRole('button',{name:/保存结果，去验证/}).click();
  await panel.getByRole('button',{name:/保存验证，结案/}).waitFor();await panel.getByLabel('你的答案',{exact:true}).fill(c.verify.answer);await panel.getByRole('button',{name:/保存验证，结案/}).click();await panel.getByText('核 对 完 成',{exact:true}).waitFor();
  assert((await panel.locator('.det-solution').innerText()).includes('反查：'),'未显示两路逆查');
  await panel.getByRole('button',{name:/暂停，回案卷柜/}).click();await panel.locator('.det-case-ticket').first().waitFor();
 }
 const completed=await get();assert(completed.badges===3&&completed.history.length===3,'首答/勋章异常');
 await page.reload();await panel.locator('.det-case-ticket').first().waitFor();assert(await panel.locator('.det-case-ticket').count()===3,'刷新重复');
 assert((await page.request.post(base+'/api/parent/access',{data:{action:'setup',pin:'912345'}})).ok(),'临时家长解锁失败');
 const bank=await(await page.request.get(base+'/api/parent/detective/cases')).json(),c=bank.cases.find(c=>c.id===wireBundle.cases[0].id),draft={...c.draft,title:c.draft.title+' · 新版本'};
 let r=await page.request.post(base+'/api/parent/detective/cases',{data:{action:'save',caseId:c.id,expectedRevision:c.revision,eventId:crypto.randomUUID(),content:draft}});assert(r.ok(),'新版本草稿失败');
 const changed=(await r.json()).cases.find(x=>x.id===c.id);r=await page.request.post(base+'/api/parent/detective/cases',{data:{action:'publish',caseId:c.id,expectedRevision:changed.revision,eventId:crypto.randomUUID(),checks:[true,true,true]}});assert(r.ok(),'新版本发布失败');
 await page.reload();await panel.locator('.det-arrivals .det-case-ticket').waitFor();assert(await panel.locator('.det-case-ticket').count()===4,'新活动版本被按案号错误隐藏');
 const latest=await get();assert(JSON.stringify(latest.cases.map(p=>p.case.version))===JSON.stringify(plan),'当日版本快照被替换');assert(JSON.stringify(latest.history)===JSON.stringify(completed.history),'历史首答被覆盖');assert(latest.badges===3,'显示去重改了勋章');
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:width===390?844:1024});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'绕线案页面溢出');await page.screenshot({path:`output/playwright/v2-audit/detective-version-entry-${width}.png`});}
 const backup=await(await page.request.get(base+'/api/parent/export')).json();assert(backup.progress.wallet.coins===0,'侦探改变钱包');
 return {passed:true,wireCases:3,answers:['18','16','26'],anonymousSimulations:true,todayInboxDeduplicated:true,newVersionVisible:true,immutablePlanAndHistory:true,badges:3,widths:[390,768,1440]};
}
