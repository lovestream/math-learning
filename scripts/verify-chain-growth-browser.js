async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m)},base=new URL(page.url()).origin,errors=[],screenshots=[];
 page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});
 const get=async()=>await(await page.request.get(base+'/api/studio')).json();
 const shot=async(name,locator)=>{const path=`output/playwright/v2-audit/chain-${name}.png`;if(locator)await locator.screenshot({path});else await page.screenshot({path});screenshots.push(path);};
 const stage=async n=>page.locator('.classroom-route button').nth(n).click();
 const saved=async()=>page.waitForFunction(()=>document.querySelector('.studio-breadcrumb small')?.textContent?.includes('操作已保存'));
 await page.goto(base+'/?lesson=G3-U03-E02');await page.locator('.child-classroom').waitFor();assert(await page.locator('.classroom-route button').count()===6,'改变了六步流程');
 await stage(1);await shot('prediction-1440',page.locator('.classroom-stage'));await stage(2);
 const lab=page.locator('.measurement-lab'),initialCoins=(await get()).progress.wallet.coins;
 assert(await lab.locator('.chain-length-strip').count()===0,'正式课仍在展示旧外长卡');
 assert(!(await lab.innerText()).includes('130'),'尚未接环就显示未来总长');await shot('classroom-one-1440');
 await lab.getByRole('button',{name:'接上一个链环',exact:true}).click();await lab.locator('.two-second-length').waitFor();
 for(const text of ['环①完整40毫米','环②完整也是40毫米','共同10毫米','净增加30毫米'])assert(await lab.getByText(text,{exact:true}).isVisible(),'正式双环缺少 '+text);
 await shot('classroom-two-1440');await lab.getByRole('button',{name:'拉开比较',exact:true}).click();const slider=lab.getByRole('slider');await slider.focus();await slider.press('End');assert(await lab.locator('.two-main-figure').getAttribute('data-comparison-total-mm')==='80','双环展开失效');
 assert(await lab.locator('.chain-teaching').getAttribute('data-total-mm')==='70','比较80污染相扣模型');await saved();await page.reload();await lab.getByRole('slider').waitFor();assert(await lab.getByRole('slider').getAttribute('aria-valuenow')==='40','双环比较状态刷新丢失');
 await lab.getByRole('button',{name:'逐个新增',exact:true}).click();
 const overviewGeometry=async n=>{
  const overview=lab.locator('.chain-overview');await overview.waitFor();await page.waitForFunction(()=>document.querySelector('.chain-overview')?.getAttribute('data-arriving')==='false');
  assert(await overview.getAttribute('data-count')===String(n)&&await overview.getAttribute('data-total-mm')===String(40+30*(n-1)),'总长/环数错误');
  assert(await overview.getByRole('button',{name:/放大第.*处接头/}).count()===n-1,'接头数量错误');
  const rings=await overview.locator('.ring-enter').evaluateAll(nodes=>nodes.map(g=>{const r=g.querySelector('.lab-ring rect'),sw=Number(r.getAttribute('stroke-width'));return {left:Number(g.dataset.leftMm),right:Number(g.dataset.rightMm),width:Number(r.getAttribute('width'))+sw,height:Number(r.getAttribute('height'))+sw,edge:Number(r.getAttribute('x'))-sw/2};}));
  assert(rings.length===n&&rings.every((r,i)=>r.left===i*30&&r.right===i*30+40&&r.width===220&&r.height===88),'完整环的尺寸或端点发生改变');
  const ruler=await overview.locator('.chain-total-ruler path').evaluate(p=>{const b=p.getBBox();return {x:b.x,width:b.width};});assert(Math.abs(ruler.x-rings[0].edge)<.001&&Math.abs(ruler.width-(40+30*(n-1))*5.5)<.001,'总长尺没对齐最外两端');
  assert(await overview.locator('.chain-total-ruler').count()===1,'多环重复长度尺');
  assert(!/完整40|5毫米/.test(await overview.locator('.chain-main-figure').textContent()),'多环复制了双环四量注释');
  return JSON.stringify(rings);
 };
 for(const target of [3,4,5]){
  await lab.getByRole('combobox',{name:'目标链环个数'}).selectOption(String(target));
  for(let n=1;n<target;n++)await lab.getByRole('button',{name:'接上一个链环',exact:true}).click();
  const geometry=await overviewGeometry(target),overview=lab.locator('.chain-overview');
  assert(await overview.locator('.chain-latest-added').count()===1,'新增法不止一段新增标记');
  await overview.locator('.chain-formula summary').click();await page.evaluate(()=>document.querySelector('.classroom-stage').scrollIntoView({block:'start'}));
  const b=await lab.boundingBox();assert(b.y>=-2&&b.y+b.height<=900,'电脑端主教具/控制未单屏可见 '+JSON.stringify(b));
  await shot(`overview-${target}-growth-1440`);
  await lab.getByRole('button',{name:'先加后减',exact:true}).click();assert(await overviewGeometry(target)===geometry,'切算法移动了原链');
  assert(await overview.locator('.chain-latest-added').count()===0,'去重模式仍混入新增箭头');assert((await overview.locator('.chain-overview-reading').innerText()).includes(`${target-1}处接头，每处共同10毫米`),'去重不是单一汇总');
  await overview.locator('.chain-formula summary').click();await shot(`overview-${target}-subtract-1440`);
  for(let j=0;j<target-1;j++){
   await overview.getByRole('button',{name:`放大第${j+1}处接头`,exact:true}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();assert(await dialog.count()===1,'出现多个接头镜头');
   assert((await dialog.innerText()).includes(`整条${target}环链仍长${40+30*(target-1)}毫米`),'局部/整链总长混淆');
   const pair=[String.fromCodePoint(0x2460+j),String.fromCodePoint(0x2461+j)];for(const label of [`环${pair[0]}的右端`,`环${pair[1]}的左端`])assert(await dialog.getByText(label,{exact:true}).isVisible(),'接头身份与主链不一致');
   if(target===5&&j===3)await shot('overview-5-joint-4-1440');await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert(await overviewGeometry(target)===geometry,'关闭细节改变整链');
  }
 }
 await saved();const before=(await get()).progress.studio.reading['G3-U03-E02'];const exported=await page.request.get(base+'/api/export');assert(exported.ok(),'模拟进度导出失败');const imported=await page.request.post(base+'/api/import',{data:await exported.json()});assert(imported.ok(),'模拟进度恢复失败');await page.reload();await overviewGeometry(5);assert(await lab.getByRole('button',{name:'先加后减',exact:true}).getAttribute('aria-pressed')==='true','刷新/导入丢算法');
 assert(JSON.stringify((await get()).progress.studio.reading['G3-U03-E02'])===JSON.stringify(before),'导入丢失原阅读/实验记录');
 await stage(4);assert((await page.locator('.current-experiment').innerText()).includes('现在已扣5个环（计划5个）'),'第5步未采用当前条件');assert((await page.locator('.blank-expression').innerText()).includes('(5−1)'),'当前条件仍用旧4环');await stage(2);
 await lab.getByRole('button',{name:'撤下最后一个链环',exact:true}).click();await overviewGeometry(4);await lab.getByRole('button',{name:'接上一个链环',exact:true}).focus();await page.keyboard.press('Enter');await overviewGeometry(5);
 await lab.locator('.chain-prediction summary').click();await lab.locator('.lab-guess input').fill('150');await lab.getByRole('button',{name:'和我的预测核对',exact:true}).click();await lab.getByText('发现一个值得再想的地方',{exact:true}).waitFor();await lab.locator('.lab-guess input').fill('160');await lab.getByRole('button',{name:'和我的预测核对',exact:true}).click();await lab.getByText('预测和实验对上了！',{exact:true}).waitFor();
 assert((await get()).progress.wallet.coins===initialCoins,'探索操作/核对发放了独立掌握积分');
 await lab.getByRole('combobox',{name:'目标链环个数'}).selectOption('3');await page.emulateMedia({reducedMotion:'no-preference'});await lab.getByRole('button',{name:'接上一个链环',exact:true}).click();await lab.getByRole('button',{name:'接上一个链环',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.chain-overview')?.getAttribute('data-arriving')==='true');
 const moving=await lab.locator('.chain-main-figure .ring-enter').last().evaluate(g=>({left:Number(g.dataset.leftMm),right:Number(g.dataset.rightMm)}));assert(Math.abs(moving.right-moving.left-40)<1e-6&&moving.left>60,'新增动画把完整环缩短或未真实移动');
 await overviewGeometry(3);await page.emulateMedia({reducedMotion:'reduce'});
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
 assert(!errors.length,errors.join(';'));return {passed:true,counts:[2,3,4,5],sameGeometryAcrossMethods:true,oneOverviewRuler:true,latestAddedOnly:true,singleOptionalJointLens:true,formalClassroomIntegrated:true,approvedTwoRingPreserved:true,threeChecksOnly:true,inverseTasks:cases.length,firstAnswerPreserved:true,noModelReward:true,refresh:true,importExport:true,keyboard:true,screenshots,errors};
}
