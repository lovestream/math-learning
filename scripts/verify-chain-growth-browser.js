async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m)},base=new URL(page.url()).origin,errors=[],screenshots=[];
 page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
 const get=async()=>await(await page.request.get(base+'/api/studio')).json();
 const shot=async(name,locator)=>{const path=`output/playwright/v2-audit/chain-${name}.png`;await locator.screenshot({path});screenshots.push(path);};
 const stage=async n=>page.locator('.classroom-route button').nth(n).click();
 await page.goto(base+'/?lesson=G3-U03-E02');await page.locator('.child-classroom').waitFor();
 assert(await page.locator('.classroom-route button').count()===6,'新增了必经课堂步骤');
 await stage(1);const intro=page.locator('.chain-joint-figure');await intro.waitFor();
 const geometry=async svg=>await svg.evaluate(svg=>{
  const zone=svg.querySelector('.chain-shared-zone'),a=svg.querySelector('[data-metal=previous]'),b=svg.querySelector('[data-metal=next]'),x=n=>Number(n.getAttribute('x')),w=n=>Number(n.getAttribute('width'));
  return {previousAtRight:x(a)+w(a)===x(zone)+w(zone),nextAtLeft:x(b)===x(zone),touching:x(b)+w(b)===x(a)};
 });
 assert(Object.values(await geometry(intro)).every(Boolean),'猜想图接头几何端点错误');await shot('prediction-joint-1440',page.locator('.classroom-stage'));
 await stage(2);const lab=page.locator('.measurement-lab'),initialCoins=(await get()).progress.wallet.coins;
 for(const target of [2,3,4,5]){
  await lab.getByRole('combobox',{name:'目标链环个数'}).selectOption(String(target));
  for(let n=1;n<=target;n++){
   assert(await lab.locator('.ring-enter').count()===n,'环数与状态不符');
   const parts=await lab.locator('.chain-growth-piece').evaluateAll(nodes=>nodes.map(n=>({start:Number(n.dataset.startMm),end:Number(n.dataset.endMm),added:Number(n.dataset.addedMm)})));
   assert(parts.length===n&&parts[0].added===40&&parts.slice(1).every(p=>p.added===30),'首环或新增长度错误');
   assert(parts.reduce((s,p)=>s+p.added,0)===40+30*(n-1),'新增条未守恒');
   if(n<target)await lab.getByRole('button',{name:'接上一个链环',exact:true}).click();
  }
  await lab.getByRole('button',{name:'放大第1处接头',exact:true}).focus();await page.keyboard.press('Enter');
  assert(Object.values(await geometry(lab.locator('.chain-joint-figure'))).every(Boolean),'实验图与猜想图几何不一致');
  await lab.getByRole('button',{name:'撤下最后一个链环',exact:true}).click();assert(await lab.locator('.chain-growth-piece').count()===target-1,'撤回不移走增长段');
  await lab.getByRole('button',{name:'接上一个链环',exact:true}).focus();await page.keyboard.press('Enter');assert(await lab.locator('.ring-enter').count()===target,'键盘接环失败');
 }
 await lab.getByRole('combobox',{name:'目标链环个数'}).selectOption('4');for(let i=0;i<3;i++)await lab.getByRole('button',{name:'接上一个链环',exact:true}).click();
 await lab.getByRole('button',{name:'放大第1处接头',exact:true}).click();
 const layouts=[];for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:width===390?844:1024});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'链环页面溢出');
  const lens=lab.locator('.chain-joint-figure');assert(await lens.isVisible(),'放大图消失');await shot('growth-'+width,lab);layouts.push(width);
 }
 await page.setViewportSize({width:1440,height:1000});await lab.getByRole('button',{name:'先相加，再减重叠',exact:true}).click();assert(await lab.locator('.chain-strip-cut').count()===3,'4环应划去3处重叠');await shot('subtract-1440',lab);
 await lab.locator('.lab-guess input').fill('120');await lab.getByRole('button',{name:'和我的预测核对',exact:true}).click();await lab.getByText('发现一个值得再想的地方',{exact:true}).waitFor();
 await lab.locator('.lab-guess input').fill('130');await lab.getByRole('button',{name:'和我的预测核对',exact:true}).click();await lab.getByText('预测和实验对上了！',{exact:true}).waitFor();
 await page.waitForFunction(()=>document.querySelector('.studio-breadcrumb small')?.textContent?.includes('操作已保存'));
 const reading=(await get()).progress.studio.reading['G3-U03-E02'];assert(reading?.widgets.try?.mode==='chain-overlap','切换方法未保存');
 await page.reload();await lab.getByRole('button',{name:'先相加，再减重叠',exact:true}).waitFor();assert(await lab.locator('.ring-enter').count()===4,'刷新丢环数');assert(await lab.getByRole('button',{name:'先相加，再减重叠',exact:true}).getAttribute('aria-pressed')==='true','刷新丢算法');assert((await get()).progress.wallet.coins===initialCoins,'实验自动发正式掌握积分');
 const confirm=async()=>{const ticks=page.locator('.self-check-panel input[type=checkbox]');await ticks.first().waitFor();assert(await ticks.count()===3,'自查不是3项');for(const box of await ticks.all())await box.check();};
 const submit=async()=>{const reply=page.waitForResponse(r=>r.url().endsWith('/api/studio/attempt')&&r.request().method()==='POST');await page.getByRole('button',{name:'提交最终答案',exact:true}).click();assert((await reply).ok(),'最终答案提交失败');};
 const cases=[['G3-U03-E02','core','G3-U03-E02.c4','4'],['G3-U03-E02','transfer','G3-U03-E02.t2','30'],['G3-U02-E01','review','G3-U02-E01.r1','90'],['G3-U02-E02','review','G3-U02-E02-P09','3'],['G3-U02-E04','review','G3-U02-E04-P09','5'],['G3-U02-O02','review','G3-U02-O02-P09','8'],['G3-U06-E01','review','G3-U06-E01-P09','8小格，蓝6小格，6/8与3/4同长。'],['G3-L03-E01','review','G3-L03-E01-P09','6'],['G3-LP01-E01','review','G3-LP01-E01-P09','星期三，退两整周再退3天；往后17天回到周六。'],['G3-U03-E01','review','G3-U03-E01.r2','12'],['algebra.substitution.intro','review','algebra.substitution.intro.r2','1']];
 for(const [id,set,taskId,answer]of cases){
  await page.goto(base+`/?lesson=${id}&practice=1&set=${set}&task=${taskId}`);const card=page.locator('.task-card');await card.waitFor();
  const input=card.locator('.task-fields input,.explanation-answer textarea').first(),choice=card.locator('.task-options button');
  if(taskId==='G3-U03-E02.c4')assert(!(await card.locator('svg').textContent()).includes('4毫米'),'图提前给出厚度');
  if(taskId==='G3-U03-E02.t2')assert(!(await card.locator('svg').textContent()).includes('30毫米'),'图提前给出外长');
  if(taskId==='G3-U03-E02.c4')await input.fill('10');else if(await input.count())await input.fill(answer);else await choice.nth(Number(answer)-1).click();
  await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();await confirm();
  if(taskId==='G3-U03-E02.c4'){
   await submit();await card.locator('.task-feedback.incorrect').waitFor();await shot('inverse-wrong-thickness',card);await input.fill(answer);
  }
  if(['G3-U03-E02.c4','G3-U03-E02.t2','G3-L03-E01-P09','G3-U06-E01-P09','G3-U03-E01.r2'].includes(taskId)){
   for(const width of [390,768,1440]){await page.setViewportSize({width,height:1024});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'逆向题溢出 '+taskId);assert(await card.locator('.measurement-question').evaluateAll(figures=>figures.every(f=>f.scrollWidth<=f.clientWidth+1)),'逆向图被裁切 '+taskId);await shot('inverse-'+taskId+'-'+width,card);}
  }
  await submit();await card.locator('.task-feedback.correct,.task-feedback.pendingReview').waitFor();
 }
 const p=(await get()).progress,s=Object.values(p.studio.sessions).find(s=>s.lessonId==='G3-U03-E02'&&s.setName==='core');assert(s.selfChecks['G3-U03-E02.c4'].firstAnswer.value==='10'&&s.results['G3-U03-E02.c4'].selfCorrection===true,'订正覆盖首答');
 assert(!errors.length,errors.join(';'));return {passed:true,geometry:{previousAtRight:true,nextAtLeft:true,metalEndsTouch:true},bothMethods:true,counts:[2,3,4,5],inverseTasks:cases.length,firstAnswerPreserved:true,noModelReward:true,refresh:true,threeChecksOnly:true,widths:layouts,reducedMotion:true,keyboard:true,screenshots,errors};
}
