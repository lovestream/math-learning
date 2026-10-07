async(page)=>{
 page.on('dialog',d=>d.accept().catch(()=>{}));
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
 const base=new URL(page.url()).origin;await page.setViewportSize({width:1440,height:900});await page.goto(base+'/?lesson=G3-UP01-B02&practice=1&set=core');await page.locator('.task-card').waitFor();await page.locator('.task-card').getByRole('button',{name:/仍相等，只要水线相同/}).click();if(await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).count())await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();await page.locator('.self-check-panel').waitFor();
 const checks=page.locator('.self-check-panel input[type=checkbox]');
 for(let i=0;i<await checks.count();i++)await checks.nth(i).check();
 await page.getByLabel('重新检查时，我核对了什么？',{exact:true}).fill('同水线比较全部载重，包括新上的人。');
 await page.locator('.task-card').getByRole('button',{name:/不等于，新增乘员也占了载重/}).click();await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='保存草稿'&&!b.disabled)&&document.querySelector('.studio-breadcrumb [role=status]')?.textContent?.includes('草稿已保存'));
 await page.reload();await page.locator('.self-check-panel').waitFor();assert(await page.locator('.self-check-panel input[type=checkbox]:checked').count()===4,'自查草稿丢失');
 await page.getByRole('button',{name:'提交最终答案',exact:true}).click();await page.getByText('答对了！',{exact:true}).waitFor();await page.getByRole('button',{name:'继续下一题',exact:true}).click();
 await page.locator('.task-card').getByRole('button',{name:/不能，水线和称量都有测量误差/}).click();await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();await page.locator('.self-check-panel').waitFor();
 for(const check of await page.locator('.self-check-panel input[type=checkbox]').all())await check.check();
 await page.getByLabel('重新检查时，我核对了什么？',{exact:true}).fill('差不多不是精确，水线与秤都有读数误差。');await page.getByRole('button',{name:'提交最终答案',exact:true}).click();await page.getByText('答对了！',{exact:true}).waitFor();await page.getByRole('button',{name:'继续下一题',exact:true}).click();
 await page.getByLabel(/每个小球的质量/).fill('20');await page.getByLabel(/空盒的质量/).fill('70');await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();await page.locator('.self-check-panel').waitFor();
 for(const check of await page.locator('.self-check-panel input[type=checkbox]').all())await check.check();
 await page.getByLabel('重新检查时，我核对了什么？',{exact:true}).fill('多3个球增加60克，每球20克，盒70克，代回两次都成立。');await page.getByRole('button',{name:'提交最终答案',exact:true}).click();await page.getByText('答对了！',{exact:true}).waitFor();await page.getByRole('button',{name:'看看这一组',exact:true}).click();
 const data=await (await page.request.get(new URL(page.url()).origin+'/api/studio')).json(),session=Object.values(data.progress.studio.sessions).filter(s=>s.lessonId==='G3-UP01-B02'&&s.setName==='core').at(-1);
 assert(session.completedAt,'核心组未完成');assert(session.results['G3-UP01-B02-P03'].selfCorrection===true,'首答订正证据丢失');assert(Object.keys(data.progress.studio.review).includes('G3-UP01-B02'),'没有安排复习');
 await page.screenshot({path:'output/playwright/v2-audit/practice-complete.png',fullPage:true});
 return {passed:true,coreCorrect:session.tasks.filter(t=>session.results[t.id].status==='correct').length,selfCorrection:session.results['G3-UP01-B02-P03'].selfCorrection,first:session.selfChecks['G3-UP01-B02-P03'].firstAnswer,final:session.results['G3-UP01-B02-P03'].finalAnswer,review:data.progress.studio.review['G3-UP01-B02'],coins:data.progress.wallet.coins};
}
