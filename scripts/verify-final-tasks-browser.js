async page => {
 const base=new URL(page.url()).origin,errors=[],checked=[];
 const assert=(v,m)=>{if(!v)throw Error(m)};
 const data=async()=> (await page.request.get(base+'/api/studio')).json();
 const session=async id=>Object.values((await data()).progress.studio.sessions).reverse().find(s=>s.lessonId===id);
 page.on('pageerror',e=>errors.push(e.message));
 const open=async(id,set)=>{await page.goto(base+`/?lesson=${id}&practice=1&set=${set}`);await page.locator('.task-card').waitFor();};
 const fill=async value=>{const textarea=page.locator('.explanation-answer textarea');if(await textarea.count())await textarea.fill(value);else await page.locator('.task-fields input').first().fill(value);};
 const self=async()=>{
  await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();
  const checks=page.locator('.self-check-panel input[type=checkbox]');await checks.first().waitFor();
  assert(await checks.count()===3,'自查必须仍只有三项');
  assert(await page.locator('.self-check-panel textarea,.self-check-panel input:not([type=checkbox])').count()===0,'新增了必填自查步骤');
  for(const box of await checks.all())await box.check();
 };
 const submit=async()=>{const response=page.waitForResponse(r=>r.url().endsWith('/api/studio/attempt')&&r.request().method()==='POST');await page.getByRole('button',{name:'提交最终答案',exact:true}).click();await(await response).finished();await page.locator('.task-feedback').waitFor();};
 const next=async()=>{await page.getByRole('button',{name:'继续下一题',exact:true}).click();};
 const complete=async value=>{await fill(value);await self();await submit();};

 await open('G3-U02-B04','core');await complete('31');await next();
 assert((await page.locator('.task-card').innerText()).includes('50'),'没有进入修订综合算式题');
 await fill('38');await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();await page.locator('.task-feedback').waitFor();
 assert((await page.locator('.task-feedback').innerText()).includes('写完整'),'只报数值竟被判为改写正确');
 await page.locator('.studio-practice').screenshot({path:'output/playwright/v2-audit/final-task-expression-result-only.png'});
 assert(!(await session('G3-U02-B04')).selfChecks['G3-U02-B04.c2'],'不完整格式被记成正式首答');
 await fill('50+18-6');await self();await submit();
 const old=await session('G3-U02-B04');assert(old.selfChecks['G3-U02-B04.c2'].firstAnswer.value==='50+18-6','首答未存');
 await page.reload();await page.locator('.task-card').waitFor();
 assert(await page.locator('.self-check-panel input[type=checkbox]').count()===3,'刷新没有恢复自查');
 await fill('50+6-18=38');await submit();
 let s=await session('G3-U02-B04');assert(s.results['G3-U02-B04.c2'].status==='correct','等价改写被拒绝');
 assert(s.results['G3-U02-B04.c2'].selfCorrection,'订正未留痕');assert(s.selfChecks['G3-U02-B04.c2'].firstAnswer.value==='50+18-6','首答被覆盖');checked.push('expression-structure-first-answer-refresh');

 await open('G3-UP01-B02','review');await complete('600');await next();
 await page.locator('.task-options button').filter({hasText:'不能，原重物质量对应石块与新增乘员的总质量'}).click();await self();await submit();await next();await complete('2');await next();
 const claims=page.locator('.task-options:not(.evidence-options) button'),evidence=page.locator('.evidence-options button');
 assert(await claims.count()===3,'替代测量选项缺少');const texts=await claims.allInnerTexts(),lengths=texts.map(t=>[...t].length);assert(Math.max(...lengths)-Math.min(...lengths)<=2,'正确项仍显著最长');
 await claims.filter({hasText:'同船舱装满'}).click();await evidence.filter({hasText:'建立载重相等'}).click();await self();await submit();
 assert((await page.locator('.task-feedback').innerText()).includes('还没对'),'装满船舱被当同质量');
 await page.locator('.studio-practice').screenshot({path:'output/playwright/v2-audit/final-task-mass-volume-error.png'});
 await claims.filter({hasText:'同船同水线，其他负载不变，称全部石块'}).click();await submit();
 s=await session('G3-UP01-B02');assert(s.results['G3-UP01-B02-P12'].status==='correct','同载重且称全未通过');
 assert(s.selfChecks['G3-UP01-B02-P12'].firstAnswer.value==='c1','错误首答丢失');checked.push('replacement-mass-unique-parallel-options');

 await open('G3-UP02-B01','core');await complete('号码相同会认错架子，需要架号和层号区分。');await next();
 await complete('不一定，固定字段宽度的前导零有助于划分字段。');await next();
 assert(await page.locator('.explanation-answer textarea').count()===1,'身份码仍是普通数值判分');
 const before=(await data()).progress.wallet.coins;await complete('3207，3是年级，2是班，07是两位序号。');
 s=await session('G3-UP02-B01');assert(s.results['G3-UP02-B01-P07'].status==='pendingReview','编号被假自动批准');
 assert((await data()).progress.wallet.coins===before,'待核对编号发奖');
 await page.locator('.studio-practice').screenshot({path:'output/playwright/v2-audit/final-task-code-parent-review.png'});checked.push('code-parent-review-no-reward');

 await open('G3-U06-B03','review');await complete('1/2');s=await session('G3-U06-B03');assert(s.results['G3-U06-B03-P09'].status==='correct','等值分数1/2被拒');
 const wallet=(await data()).progress.wallet.coins;await page.reload();await page.locator('.studio-practice').waitFor();assert((await data()).progress.wallet.coins===wallet,'刷新重复发奖');checked.push('equivalent-fraction-no-repeat-reward');
 assert(errors.length===0,errors.join('\n'));
 return {passed:true,checked,threeChecksOnly:true,firstAnswerPreserved:true,isolatedLearnerData:true,errors};
}
