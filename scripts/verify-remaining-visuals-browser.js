async page=>{
 const base=new URL(page.url()).origin,errors=[],screenshots=[],assert=(v,m)=>{if(!v)throw Error(m)};
 const get=async()=>await(await page.request.get(base+'/api/studio')).json();
 const {lessons}=await import(process.cwd()+'/content/pilot/source.mjs');
 const {inverseEntries}=await import(process.cwd()+'/shared/inverse-index.mjs');
 const {firstOperationOptions,expressionASTText,evaluateExpressionAST,formatFraction}=await import(process.cwd()+'/shared/pilot-math.mjs');
 page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 const stage=async n=>page.locator('.classroom-route button').nth(n).click();
 const open=async id=>{await page.goto(base+'/?lesson='+id);await page.locator('.child-classroom').waitFor();await stage(2);};
 const saved=async()=>page.waitForFunction(()=>document.querySelector('.studio-breadcrumb small')?.textContent?.includes('操作已保存'));
 const shot=async name=>{const p=`output/playwright/v2-audit/remaining-${name}-1440.png`;await page.screenshot({path:p});screenshots.push(p);};
 const initial=(await get()).progress.wallet.coins;
 const order=node=>node.type==='number'?[]:[...order(node.left),...order(node.right),node];
 // A/B/A uses independent expected units and outcomes, including wrong first choice.
 for(const id of ['G3-U02-B01','G3-U02-B03','G3-U02-E01']){
  const lesson=lessons.find(l=>l.lessonId===id);await open(id);const lab=page.locator('.mixed-operations-lab');
  for(const i of [0,1,0]){
   await lab.locator('.scene-switcher button').nth(i).click();const scene=lesson.mathScenes[i];
   assert((await lab.locator('.mixed-story>small').innerText()).startsWith('场景 '+String.fromCharCode(65+i)),'场景标签混用了内部taskMode');
   assert((await lab.locator('.operation-track>strong').innerText())===expressionASTText(scene.expressionAST),'算式未随完整场景切换');
   if(id==='G3-U02-B03'){
    const mission=await page.locator('.experiment-mission').innerText();
    if(i===1){assert(mission.includes('原有12袋')&&mission.includes('8颗散珠')&&!mission.includes('红珠'),'场景B仍显示合并红蓝珠');assert(JSON.stringify(await lab.locator('.quantity-cards em').allTextContents())===JSON.stringify(['袋','颗','颗/袋']),'场景B单位不是12袋/8颗/每袋4颗');}
    else assert(mission.includes('12颗红珠')&&mission.includes('8颗蓝珠')&&mission.includes('每盒4颗'),'场景A混入袋数');
   }
   const choices=firstOperationOptions(scene.expressionAST,scene.sceneId),wrong=choices.find(c=>!c.correct),right=choices.find(c=>c.correct);
   if(wrong){await lab.getByRole('button',{name:wrong.text,exact:true}).click();await lab.getByRole('button',{name:'按预测算第一步',exact:true}).click();assert(await lab.locator('.operation-error').isVisible(),'错误的第一步没有反馈');}
   await lab.getByRole('button',{name:right.text,exact:true}).click();
   for(const [step,node] of order(scene.expressionAST).entries()){
    await lab.locator('.lab-prediction input').fill(formatFraction(evaluateExpressionAST(node)));await lab.getByRole('button',{name:step===0?'按预测算第一步':'算下一步',exact:true}).click();
   }
   const result=await lab.locator('.operation-readout').innerText();assert(result.includes(scene.expected.value+scene.expected.unit),'结果标签不属于当前场景');
   if(id==='G3-U02-B03'){assert(result.includes(i===1?'14袋':'5盒'),'A/B结果单位混用');await page.locator('.experiment-mission').scrollIntoViewIfNeeded();await shot(i===1?'brackets-B':'brackets-A');const objectPath=`output/playwright/v2-audit/remaining-brackets-${i===1?'B':'A'}-objects-1440.png`;await lab.locator('.operation-stage').screenshot({path:objectPath});screenshots.push(objectPath);}
   await lab.getByRole('button',{name:'撤销一步',exact:true}).click();await saved();await page.reload();await lab.waitFor();assert((await lab.locator('.mixed-story>small').innerText()).startsWith('场景 '+String.fromCharCode(65+i)),'刷新丢失场景');await stage(4);assert((await page.locator('.blank-expression').innerText())===expressionASTText(scene.expressionAST)+'＝□','第5步没有采用当前故事');if(id==='G3-U02-B03')assert((await page.locator('.symbol-lines').innerText()).includes('(12＋8)÷4'),'原故事算式被场景B覆盖');await stage(2);
  }
 }
 for(const [id,relation,reveal,result]of [['G3-L06-B03','money-exchange','把10角换成1元','3.8＋2.5＝6.3（元）'],['G3-U07-R01','supply-plan','对照数量关系','36×2−20＝52（张）']]){
  await open(id);const figure=page.locator(`[data-relation="${relation}"]`);await figure.scrollIntoViewIfNeeded();assert(!(await figure.innerText()).includes(result),'尚未揭示就输出最终结果');await shot(relation+'-before');
  await figure.getByRole('button',{name:reveal,exact:true}).click();assert((await figure.innerText()).includes(result),'关系揭示错误');await saved();await page.reload();await figure.waitFor();assert(await figure.getAttribute('data-revealed')==='true','关系示例刷新丢失');await figure.scrollIntoViewIfNeeded();await shot(relation+'-after');
  await figure.getByRole('button').focus();await page.keyboard.press('Enter');assert(await figure.getAttribute('data-revealed')==='false','键盘回看失效');
 }
 await open('G3-L02-B06');const lab=page.locator('.core-workbench');
 const model=lessons.find(l=>l.lessonId==='G3-L02-B06').conceptScenes[0].textbookSpec;
 for(let i=0;i<model.cases.length;i++){
  await lab.locator('.core-case-selector select').selectOption(String(i));await lab.getByRole('button',{name:'重新分装：总量不变',exact:true}).click();
  const [count,,,oldEach,newEach]=model.cases[i],total=count*oldEach,figure=lab.locator('[data-relation="fixed-total"]');
  const ids=()=>figure.locator('[data-material-id]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.materialId)));
  const originalIds=await ids();assert(originalIds.length===total,'原分组材料不足');
  if(i===0){await figure.scrollIntoViewIfNeeded();await shot('regroup-before');}
  await figure.getByRole('button').click();assert(await figure.getAttribute('data-arrangement')==='new','未切换分组');assert(JSON.stringify(await ids())===JSON.stringify(originalIds),'重新分组更换或丢失原对象');assert((await figure.locator('svg').getAttribute('aria-label')).includes(String(total/newEach)),'新组数不一致');
  await saved();await page.reload();await figure.waitFor();assert(await figure.getAttribute('data-arrangement')==='new','刷新丢失分组状态');
  if(i===0){await figure.scrollIntoViewIfNeeded();await shot('regroup-after');}await stage(4);assert((await page.locator('.current-experiment').innerText()).includes(model.contexts[i].alternate),'第5步重新分装仍套价格条件');assert((await page.locator('.blank-expression').innerText())===`${count}×${oldEach}÷${newEach}＝□（${model.contexts[i].outer}）`,'总量模式算式错配');if(i===0){await page.locator('.current-experiment').scrollIntoViewIfNeeded();await shot('regroup-math');}await stage(2);
  await lab.getByRole('button',{name:'撤销上次操作',exact:true}).click();assert(await figure.getAttribute('data-arrangement')==='original','撤销没有回到旧分组');
  await lab.getByRole('button',{name:'同价商品：单价不变',exact:true}).click();assert(!await figure.count(),'商品单价场景残留同一批分装图');assert((await page.locator('.experiment-mission').innerText()).includes('单价不变'),'两类不变量顶层任务混用');await stage(4);assert((await page.locator('.current-experiment').innerText()).includes(model.contexts[i].story),'单价模式残留分装条件');await stage(2);
 }
 await open('G3-L01-B02');const motion=page.locator('[data-textbook-model="motion"]');await motion.getByRole('button',{name:'向右平移两格',exact:true}).click();assert(await motion.locator('[data-motion-trail="translation"]').count()===1,'平移缺原位置轨迹');await motion.getByRole('button',{name:'绕尾端转90°',exact:true}).click();assert(await motion.locator('[data-motion-trail="rotation"]').count()===1,'旋转缺扇形方向');await motion.scrollIntoViewIfNeeded();await shot('motion-trails');
 assert((await get()).progress.wallet.coins===initial,'观察/揭示或分组操作发放掌握积分');
 const entries=inverseEntries(lessons);
 for(const row of entries){
  await page.goto(base+'/?view=review');const index=page.locator('.inverse-practice-index');await index.locator('summary').click();assert(await index.locator('li').count()===11,'逆向索引没有精确引用11题');
  if(row===entries[0]){await index.scrollIntoViewIfNeeded();await shot('inverse-index');}
  await index.locator('li').filter({hasText:row.taskId}).getByRole('button',{name:'打开原题',exact:true}).click();await page.locator('.task-card').waitFor();
  assert(await page.locator('.inverse-task-direction').count()===1,'原题没有逆向任务标签');const prompt=lessons.find(l=>l.lessonId===row.lessonId).taskSets[row.set].find(t=>t.id===row.taskId).prompt;assert((await page.locator('.task-card').innerText()).includes(prompt),'索引显示的题干不属于原任务 '+row.taskId);
  await page.waitForFunction(async meta=>{const p=await(await fetch('/api/studio')).json(),session=Object.values(p.progress.studio.sessions).find(s=>s.lessonId===meta.lessonId&&s.setName===meta.set);return session?.tasks[session.index]?.id===meta.taskId;},row);

 }
 const beforeReplay=Object.keys((await get()).progress.studio.sessions).length;
 const last=entries.at(-1);await page.goto(base+`/?lesson=${last.lessonId}&practice=1&set=${last.set}&task=${last.taskId}`);await page.locator('.task-card').waitFor();assert(Object.keys((await get()).progress.studio.sessions).length===beforeReplay,'再次打开索引新建重复任务会话');
 assert((await get()).progress.wallet.coins===initial,'逆向索引打开原题奖励了额外积分');assert(!errors.length,errors.join('\n'));
 return {passed:true,sceneSwitches:'A/B/A for 3 courses; complete operations, wrong path, undo and refresh',prototypes:['money-exchange','supply-plan','fixed-total'],regroupCases:6,stableMaterialIds:true,inverseExistingTaskLinks:11,noExtraPoints:true,realLearnerData:false,screenshots,errors};
}
