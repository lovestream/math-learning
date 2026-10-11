async page=>{
 const base=new URL(page.url()).origin,DAY=86400000,errors=[];
 const assert=(v,m)=>{if(!v)throw Error(m)},get=async()=> (await page.request.get(base+'/api/studio')).json();
 page.on('pageerror',e=>errors.push(e.message));
 const submitGroup=async(id,set)=>{
  await page.goto(base+`/?lesson=${id}&practice=1&set=${set}`);await page.locator('.task-card').waitFor();
  const current=()=>get().then(d=>Object.values(d.progress.studio.sessions).reverse().find(s=>s.lessonId===id&&s.setName===set));
  const first=await current();
  for(let i=0;i<first.tasks.length;i++){
   await page.locator('.explanation-answer textarea').fill('仅测试批阅调度：说明题中整体、部分与条件关系，不作为数学正确证据。');
   await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();
   const ticks=page.locator('.self-check-panel input[type=checkbox]');await ticks.first().waitFor();assert(await ticks.count()===3,'自查数量变化');for(const tick of await ticks.all())await tick.check();
   const response=page.waitForResponse(r=>r.url().endsWith('/api/studio/attempt')&&r.request().method()==='POST');await page.getByRole('button',{name:'提交最终答案',exact:true}).click();await(await response).finished();await page.locator('.task-feedback.pendingReview').waitFor();
   if(i<first.tasks.length-1)await page.getByRole('button',{name:'继续下一题',exact:true}).click();
  }
  return current();
 };
 const initial=(await get()).progress.studio.review['G3-U06-E01'];assert(Date.parse(initial.dueAt)<=Date.now(),'临时库未提供到期情境');
 const review=await submitGroup('G3-U06-E01','review'),coins=(await get()).progress.wallet.coins;
 assert(!review.completedAt,'提交待审核解释竟完成');
 await page.request.post(base+'/api/parent/access',{data:{action:'setup',pin:'912345'}});
 await page.goto(base+'/?view=parent');const formal=page.locator('.parent-formal-review');await formal.waitFor();
 const grade=async(s,task,verdict='correct')=>{
  const queued=(await(await page.request.get(base+'/api/parent/formal')).json()).tasks.find(r=>r.sessionId===s.id&&r.task.id===task.id);assert(queued,'解释未进入批阅队列');
  const loaded=page.waitForResponse(r=>r.url().endsWith('/api/parent/formal')&&r.request().method()==='GET');await formal.getByRole('button',{name:'刷新解释题队列',exact:true}).click();await(await loaded).finished();
  await formal.getByLabel('选择作答').selectOption(`${s.id}:${task.id}`);await formal.getByLabel('给Kevin的核对反馈').fill('仅测试正式批阅与复习时序，不代表Kevin掌握。');
  const response=page.waitForResponse(r=>r.url().endsWith('/api/parent/formal/review')&&r.request().method()==='POST');await formal.getByRole('button',{name:verdict==='correct'?'关系与解释正确':'需要回补',exact:true}).click();const received=await response;assert(received.ok(),'家长批阅失败');await received.finished();return received.request().postDataJSON();
 };
 let replay;for(const task of review.tasks)replay=await grade(review,task);
 let p=(await get()).progress,r=p.studio.review['G3-U06-E01'],s=p.studio.sessions[review.id];
 assert(s.completedAt&&r.history.length===1&&r.history[0].independent&&r.stage===1,'家长批准没有推进独立复习');
 assert(Date.parse(r.dueAt)===Date.parse(initial.firstLearnedAt)+3*DAY,'复习没有保持1/3/7/21初学锚点');assert(p.wallet.coins===coins,'人工审批补发了积分');
 const again=await page.request.post(base+'/api/parent/formal/review',{data:replay});assert(again.ok(),'重复回执失败');assert((await get()).progress.studio.review['G3-U06-E01'].history.length===1,'重复审批增加独立日期');
 const stale=await page.request.post(base+'/api/parent/formal/review',{data:{...replay,eventId:crypto.randomUUID(),verdict:'needs-remediation'}});assert(stale.status()===409,'旧页面覆盖新批阅');
 await formal.screenshot({path:'output/playwright/v2-audit/formal-review-schedule-approved.png'});
 await grade(review,review.tasks[0],'needs-remediation');p=(await get()).progress;r=p.studio.review['G3-U06-E01'];s=p.studio.sessions[review.id];
 assert(!s.completedAt&&s.hadIncorrect&&Date.parse(r.dueAt)>Date.now()&&Date.parse(r.dueAt)<=Date.now()+DAY,'需要回补没有设置未来一天');assert(r.history.length===1,'更正伪造第二次复习');assert(s.parentReviews[review.tasks[0].id].length===2,'更正历史丢失');assert(s.selfChecks[review.tasks[0].id].firstAnswer.value.includes('仅测试'),'首答被覆盖');
 await formal.screenshot({path:'output/playwright/v2-audit/formal-review-remediation.png'});
 const exported=await(await page.request.get(base+'/api/export')).json();assert((await page.request.post(base+'/api/import',{data:exported})).ok(),'导入恢复失败');assert(JSON.stringify((await get()).progress.studio.review['G3-U06-E01'])===JSON.stringify(r),'导入丢失复习历史');
 const core=await submitGroup('G3-UP02-B01','core');await page.request.post(base+'/api/parent/access',{data:{action:'unlock',pin:'912345'}});await page.goto(base+'/?view=parent');await formal.waitFor();const before=(await get()).progress.wallet.coins;
 for(const task of core.tasks)await grade(core,task);
 p=(await get()).progress;r=p.studio.review['G3-UP02-B01'];s=p.studio.sessions[core.id];assert(s.completedAt&&r.firstLearnedAt===s.completedAt&&r.firstLearnedDay&&r.scheduleVersion===2,'人工核心完成未建初学日期');assert(p.wallet.coins===before,'核心人工批阅擅自加积分');
 await formal.screenshot({path:'output/playwright/v2-audit/formal-core-review-anchor.png'});
 assert(!errors.length,errors.join('\n'));return {passed:true,dueReviewAdvanced:true,anchorPreserved:true,remediationNextDay:true,noManualPoints:true,duplicateReplay:true,stale409:true,firstAnswerPreserved:true,importExport:true,coreFirstLearned:true,errors};
}
