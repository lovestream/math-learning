async page => {
 const base=new URL(page.url()).origin,assert=(ok,message)=>{if(!ok)throw Error(message)},data=await(await page.request.get(base+'/api/studio')).json(),checked=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const steps=['真实问题','先猜一猜','亲手实验','说出发现','写成数学','自己验证'];
 const shots=new Set(['G3-U01-B01','G3-U02-B03','G3-U03-E02','G3-U04-B03','G3-U06-B03','G3-L04-B01','numbers.quantity.intro']);
 for(const lesson of data.lessons){
  await page.goto(base+'/?lesson='+lesson.lessonId);await page.locator('.classroom-story').waitFor();
  assert((await page.locator('.story-sentence').innerText())===lesson.childClassroom.story,'故事与教案不同 '+lesson.lessonId);
  assert(await page.locator('.classroom-route button').count()===6,'六步缺失 '+lesson.lessonId);
  const graphical=lesson.introVisual||lesson.mathScenes?.length||lesson.lengthScenes?.length||lesson.articleBlocks[0]?.diagram;
  if(graphical)assert(await page.locator('.classroom-story [role=img],.classroom-story svg,.classroom-story .teaching-diagram,.classroom-story .ribbon-strip,.classroom-story .lunchboxes,.classroom-story .apple-row,.classroom-story .sticker-row,.classroom-story .tile-diagram,.classroom-story .snack-contents,.classroom-story .candy-comparison').count()>0,'真实问题缺图 '+lesson.lessonId);
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'390故事溢出 '+lesson.lessonId);
  if(shots.has(lesson.lessonId))await page.locator('.child-classroom').screenshot({path:`output/playwright/v2-audit/template-${lesson.lessonId}-390.png`});
  for(let i=1;i<steps.length;i++){
   const title=i===2&&lesson.interactionStatus==='static-visual'?'画图想一想':steps[i];
   await page.getByRole('button',{name:`${i+1} ${title}`,exact:true}).click();
   if(i===1){assert(await page.locator('.prediction-cards button').count()>=2,'缺少猜想 '+lesson.lessonId);await page.locator('.prediction-cards button').first().click();}
   if(i===2)assert(await page.locator('.classroom-stage .experiment-mission').innerText()===lesson.childClassroom.mission,'实验目标不同 '+lesson.lessonId);
   if(i===4){assert(await page.locator('.symbol-lines p').count()===lesson.childClassroom.symbols.length,'数学表达缺失 '+lesson.lessonId);assert((await page.locator('.classroom-symbols>p').first().innerText()).includes('第一步的故事'),'原故事表达与可切换的实验条件未区分 '+lesson.lessonId);}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'390步骤溢出 '+lesson.lessonId+' '+i);
  }
  const expected=lesson.lessonId.match(/^(G3-U04-B0[1345]|G3-L02-B0[1356]|G3-U06-B0[345])$/)?5:lesson.taskSets.core.length;
  assert(!await page.locator('.parent-task-preview').getAttribute('open'),'儿童题组预览默认展开 '+lesson.lessonId);
  assert(!await page.locator('.classroom-verify li').first().isVisible(),'儿童需重复读题 '+lesson.lessonId);
  assert(await page.locator('.classroom-verify li').count()===expected,'练习清单不对应实际题组 '+lesson.lessonId);
  if(expected===5&&lesson.lessonId.match(/^(G3-U04-B0[1345]|G3-L02-B0[1356]|G3-U06-B0[345])$/)){
   await page.getByRole('button',{name:'开始这组独立练习',exact:true}).click();await page.locator('.task-card').waitFor();
   assert(new URL(page.url()).searchParams.get('assessment')==='withdrawn-v1','五题清单未进入撤教具小测 '+lesson.lessonId);
   assert((await page.locator('.task-card header span').innerText()).includes('1/5'),'小测题数不是五题 '+lesson.lessonId);
   assert(await page.locator('.set-tabs').count()===0,'小测仍展示普通题组');
   await page.getByRole('button',{name:'返回讲解',exact:true}).click();await page.locator('.classroom-verify').waitFor();
  }
  await page.getByRole('button',{name:'2 先猜一猜',exact:true}).click();assert(await page.locator('.prediction-cards button[aria-pressed=true]').count()===1,'猜想丢失 '+lesson.lessonId);
  await page.getByRole('button',{name:'家长完整教案',exact:true}).click();await page.locator('.story-opening').waitFor();
  await page.getByRole('button',{name:'Kevin 短课堂',exact:true}).click();await page.locator('.classroom-predict').waitFor();
  checked.push(lesson.lessonId);await page.setViewportSize({width:1440,height:1000});
 }
 // No reflection or intermediate-result typing is needed for either an ordinary
 // task or mixed operations. Ticking boxes never itself marks an answer correct.
 for(const [id,first,final] of [['G3-U01-B01','1','2'],['G3-U02-B03','999','5']]){
  await page.goto(base+`/?lesson=${id}&practice=1&set=core`);await page.locator('.task-card').waitFor();
  const answer=page.locator('.task-fields input').first();
  if(id==='G3-U01-B01'){await page.locator('.task-card button[aria-pressed]').first().click();}
  else await answer.fill(first);
  await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();await page.locator('.self-check-panel').waitFor();
  const checkboxes=page.locator('.self-check-panel input[type=checkbox]');assert(await checkboxes.count()===3,'自查不是三项');assert(await page.locator('.self-check-panel input:not([type=checkbox]),.self-check-panel textarea').count()===0,'仍要求填写自查');
  const before=await(await page.request.get(base+'/api/studio')).json();const s=Object.values(before.progress.studio.sessions).find(s=>s.lessonId===id&&!s.completedAt);assert(!s.results[s.tasks[0].id],'首答或勾选提前判分');
  for(const box of await checkboxes.all())await box.check();
  if(id==='G3-U02-B03')await answer.fill(final);
  await page.locator('.studio-practice').screenshot({path:`output/playwright/v2-audit/template-self-check-${id}.png`});
  await page.getByRole('button',{name:'提交最终答案',exact:true}).click();await page.locator('.task-feedback').waitFor();
  const out=await(await page.request.get(base+'/api/studio')).json();const latest=out.progress.studio.sessions[s.id];assert(latest.selfChecks[s.tasks[0].id].evidence.format==='checklist-v1','自查格式未存档');assert(latest.selfChecks[s.tasks[0].id].evidence.reflection==='','生成了虚假的填写说明');
  if(id==='G3-U02-B03'){assert(latest.results[s.tasks[0].id].status==='correct','三项勾选后仍不能提交');assert(latest.results[s.tasks[0].id].selfCorrection,'订正记录丢失');}
  await page.locator('.studio-practice').screenshot({path:`output/playwright/v2-audit/template-final-answer-${id}.png`});
 }
 assert(checked.length===70,'课程未覆盖全');assert(!errors.length,JSON.stringify(errors));return {passed:true,lessons:checked,defaultShortClassroom:true,sixSteps:true,threeChecksOnly:true,noRequiredReflection:true,legacyParentPlan:true,errors};
}
