async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m)},base=new URL(page.url()).origin,errors=[];page.on('pageerror',e=>errors.push(e.message));
 const open=async(id,set)=>{await page.goto(base+`/?lesson=${id}&practice=1&set=${set}`);await page.locator('.task-card').waitFor();};
 const data=async()=>await(await page.request.get(base+'/api/studio')).json();
 const complete=async(value,expected='correct')=>{
  await page.locator('.task-fields input').first().fill(value);await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();
  const boxes=page.locator('.self-check-panel input[type=checkbox]');await boxes.first().waitFor();assert(await boxes.count()===3,'自查不再是三项');
  assert(await page.locator('.self-check-panel textarea,.self-check-panel input:not([type=checkbox])').count()===0,'新增了必填操作');for(const box of await boxes.all())await box.check();
  const response=page.waitForResponse(r=>r.url().endsWith('/api/studio/attempt')&&r.request().method()==='POST');await page.getByRole('button',{name:'提交最终答案',exact:true}).click();assert((await response).ok(),'提交失败');await page.locator('.task-feedback.'+expected).waitFor();
 };
 const next=async()=>{await page.getByRole('button',{name:'继续下一题',exact:true}).click();};
 await open('G3-U03-E01','warmup');await complete('50');await next();
 assert((await page.locator('.task-card').innerText()).includes('最左端到最右端'),'未明确所求对象');await page.locator('.measurement-question svg').waitFor();
 const overlay=await page.locator('.measurement-question .task-joint rect').first().evaluate(rect=>getComputedStyle(rect).fill);const alpha=Number(overlay.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)?.[1]??1);assert(alpha<0.4,'重叠区不透明，挡住材料和数字');
 for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'纸条题溢出');await page.locator('.task-card').screenshot({path:`output/playwright/v2-audit/clarity-paper-question-${width}.png`});}
 await page.setViewportSize({width:1440,height:1000});await complete('36');assert((await page.locator('.task-feedback.correct').innerText()).includes('36'),'36未正确通过');
 await page.locator('.task-card').screenshot({path:'output/playwright/v2-audit/clarity-paper-36-correct.png'});
 let p=(await data()).progress,s=Object.values(p.studio.sessions).find(s=>s.lessonId==='G3-U03-E01'&&s.setName==='warmup');
 assert(s.contentVersion==='2026-10-17.1'&&s.selfChecks['G3-U03-E01.w2'].firstAnswer.value==='36'&&s.results['G3-U03-E01.w2'].status==='correct','首答或版本错误');const coins=p.wallet.coins;await page.reload();await page.locator('.studio-practice').waitFor();assert((await data()).progress.wallet.coins===coins,'刷新重复发奖');
 // Five/six pieces used to exceed the fixed 230px SVG viewBox.
 const countChecks=[];
 for(const [set,first,second,count]of [['transfer','68','67',5],['review','41','62',6]]){
  await open('G3-U03-E01',set);await complete(first);await next();
  const svg=page.locator('.measurement-question svg');await svg.waitFor();const bounds=await svg.evaluate(svg=>{const v=svg.viewBox.baseVal;return {height:v.height,clipped:[...svg.querySelectorAll('rect,text,path,line')].map(e=>e.getBBox()).some(b=>b.y+b.height>v.height+2||b.x+b.width>v.width+2)};});
  assert(!bounds.clipped,`${count}条图形或标注被裁掉`);assert(bounds.height>230,'长图仍使用固定高度');
  await page.setViewportSize({width:390,height:844});await page.locator('.task-card').screenshot({path:`output/playwright/v2-audit/clarity-${count}-pieces-390.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'多条搭接题溢出');await page.setViewportSize({width:1440,height:1000});await complete(second);countChecks.push(count);
 }
 await open('G3-U03-E02','core');await complete('70');await next();assert(!(await page.locator('.task-card').innerText()).includes('这样的'),'链环题依赖前题');await complete('3');await next();assert((await page.locator('.task-card').innerText()).includes('两段5毫米'),'缺接头厚度条件');await complete('130');
 await open('G3-U03-O01','transfer');await complete('9');await next();assert((await page.locator('.task-card').innerText()).includes('这一整圈'),'钟面题仍歧义');await complete('12');
 assert(!errors.length,errors.join(';'));return {passed:true,paper36Correct:true,threeChecksOnly:true,firstAnswerPreserved:true,noRepeatReward:true,fullConditionChain:true,clockWholeCircle:true,multiPieceNoClipping:countChecks,widths:[390,1440],errors};
}
