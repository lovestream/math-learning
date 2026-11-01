async page=>{
 const {lessons}=await import(process.cwd()+'/content/pilot/source.mjs');
 const {buildSemanticLedger}=await import(process.cwd()+'/scripts/build-semantic-ledger.mjs');
 const {operateDesktop}=await import(process.cwd()+'/scripts/desktop-math-actions.mjs');
 const {codingQuiz}=await import(process.cwd()+'/shared/coding-model.mjs');
 const review=JSON.parse((await import('node:fs')).readFileSync(process.cwd()+'/docs/review/final-task-review/versioned/coding-20261101.json'));
 const id='G3-UP02-B01',lesson=lessons.find(l=>l.lessonId===id),base=new URL(page.url()).origin,out='output/playwright/v2-audit',errors=[],actions=[],screenshots={};
 const assert=(v,m)=>{if(!v)throw Error('编码课：'+m)};
 page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
 const get=async()=>{const r=await page.request.get(base+'/api/studio');assert(r.ok(),'读取临时库失败');return r.json();};
 const post=async(path,body)=>{const r=await page.request.post(base+path,{data:body});assert(r.ok(),path+' '+r.status()+' '+await r.text());return r.json();};
 const initial=(await get()).progress;
 await page.setViewportSize({width:1440,height:900});await page.goto(base+'/?lesson='+id);const classroom=page.locator('.child-classroom'),stage=page.locator('.classroom-stage');await classroom.waitFor();
 const move=async n=>classroom.locator('.classroom-route button').nth(n).click();
 const shot=async(name,scope=classroom)=>{const file=out+'/coding-'+name+'.png';await scope.screenshot({path:file});screenshots[name]=file;return file;};
 assert(await classroom.locator('.classroom-route button').count()===6,'增加了课堂步骤');
 assert(await stage.locator('.coding-overview article').count()===4,'故事没有四种编码条件图');await shot('story-1440');
 await move(1);assert(await stage.locator('.coding-overview article').count()===4,'猜想缺图');await stage.locator('.prediction-cards button').nth(1).click();await shot('prediction-1440');
 await move(2);
 const exploration=page.locator('.coding-exploration');await exploration.waitFor();
 assert(await exploration.locator('.coding-groups .coding-segment').count()===8,'身份证分段数');
 for(let i=0;i<8;i++){await exploration.locator('.coding-segment').nth(i).click();assert((await exploration.locator('.coding-detail').first().innerText()).includes(['第1—2','第3—4','第5—6','第7—10','第11—12','第13—14','第15—17','第18'][i]),'分段说明未对应位置 '+i);}
 await exploration.getByRole('button',{name:'004',exact:true}).click();assert((await exploration.locator('.coding-example').innerText()).includes('偶数，按规则对应女性'),'第17位偶数解释错误');
 await exploration.getByRole('button',{name:'003',exact:true}).click();assert((await exploration.locator('.coding-example').innerText()).includes('奇数，按规则对应男性'),'第17位奇数解释错误');actions.push('逐段定位18字符，003/004比较第17位，说明第18位X规则与局限');
 for(const [width,height]of [[1366,768],[1440,900],[390,844]]){
  await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'页面横向溢出 '+width);
  assert(await exploration.locator('.coding-segment strong').evaluateAll(nodes=>nodes.every(e=>e.scrollWidth<=e.clientWidth+1)),'数字分段被裁切 '+width);await shot('identity-'+width,exploration);
 }
 await page.setViewportSize({width:1440,height:900});await exploration.getByRole('button',{name:'邮政编码6位',exact:true}).click();
 assert(await exploration.locator('.coding-segment').count()===4,'邮编分段数');for(let i=0;i<4;i++)await exploration.locator('.coding-segment').nth(i).click();assert((await exploration.innerText()).includes('不是同一套规则'),'邮编与地址码混淆');await shot('postal-1440',exploration);actions.push('六位邮编2/1/1/2分段，与身份证地址码对照');
 await exploration.getByRole('button',{name:'自己设计学号',exact:true}).click();
 await exploration.getByLabel('班级',{exact:true}).selectOption('1');assert(await exploration.locator('.coding-code-preview').innerText()==='03-01-07','跨班未换字段');
 await exploration.getByLabel('班级',{exact:true}).selectOption('2');await exploration.getByLabel('年级',{exact:true}).selectOption('6');assert((await exploration.innerText()).includes('不把六年级再次当作下一年级'),'毕业边界伪造六升六');
 await exploration.getByLabel('年级',{exact:true}).selectOption('3');assert((await exploration.innerText()).includes('04-02-07'),'升年级字段不变');await shot('class-design-1440',exploration);
 await exploration.getByRole('button',{name:'长期校内编号',exact:true}).click();await exploration.getByLabel('该入学年校内唯一流水号',{exact:true}).selectOption('810');assert(await exploration.locator('.coding-code-preview').innerText()==='2024-0810','流水号被限制到单班45人');assert((await exploration.innerText()).includes('全校范围分配'),'流水范围未说明');await shot('stable-design-1440',exploration);actions.push('跨班同序号、升年级和六年级毕业边界；校内流水跨班唯一且可容纳810人');
 await exploration.getByRole('button',{name:'综合辨错',exact:true}).click();
 for(const [i,q]of codingQuiz.entries()){const item=exploration.locator('.coding-quiz').nth(i);await item.getByRole('button').nth((q.correct+1)%3).click();assert((await item.innerText()).includes('这次不符合规则'),'错误路径没反馈');await item.getByRole('button').nth(q.correct).click();assert((await item.innerText()).includes('本题符合规则'),'正确路径没反馈');}
 await shot('misconceptions-1440',exploration);await exploration.getByRole('button',{name:'清空本页练习，重新思考',exact:true}).click();assert(await exploration.locator('.coding-quiz-right,.coding-quiz-wrong').count()===0,'清空失效');actions.push('五道辨错的正误路径和清空，不计正式掌握');
 const operated=await operateDesktop(page,lesson);actions.push(...operated.actionsPerformed);await shot('shelf-operated-1440');
 for(const n of [3,4,5]){await move(n);await shot(['','','','discovery-1440','math-language-1440','verification-1440'][n]);}
 assert(await stage.locator('.parent-task-preview li').count()===3,'核心题组不是3题');
 const afterExplore=(await get()).progress;assert(afterExplore.wallet.coins===initial.wallet.coins,'探索误发积分');assert(Object.keys(afterExplore.studio.sessions).length===Object.keys(initial.studio.sessions).length,'探索误开正式会话');
 // No identity-number entry exists: only fixed segments ending ?, class selectors, and an optional fictional discussion.
 await move(2);assert(await stage.locator('input').count()===0,'出现要求填写完整身份号码的输入框');
 const sessions=[],taskResults=[];
 const fill=async(t,value)=>{if(t.kind==='choice'){const i=t.options.findIndex(o=>o.id===value);await page.locator('.task-options button').nth(i).click();}else await page.locator(t.kind==='explanation'?'.explanation-answer textarea':'.task-fields input').fill(value);};
 for(const [set,tasks]of Object.entries(lesson.taskSets)){
  await page.goto(base+`/?lesson=${id}&practice=1&set=${set}`);await page.locator('.task-card').waitFor();
  let session=Object.values((await get()).progress.studio.sessions).filter(s=>s.lessonId===id&&s.setName===set).at(-1);assert(session.contentVersion===lesson.contentVersion,'测评版本错误');
  for(const [i,t]of tasks.entries()){
   const first=t.kind==='choice'?t.options.find(o=>o.id!==t.expected).id:t.kind==='number'?'17':'我还没有说明字段和规则。';
   await fill(t,first);await page.getByRole('button',{name:'先保存首答，自己检查',exact:true}).click();const checks=page.locator('.self-check-panel input[type=checkbox]');await checks.first().waitFor();assert(await checks.count()===3,'自查不是三项');
   let before=(await get()).progress.studio.sessions[session.id];assert(!before.results[t.id],'自查前提前判分');assert(!Object.hasOwn(before.tasks.find(x=>x.id===t.id),'expected')&&!Object.hasOwn(before.tasks.find(x=>x.id===t.id),'solution'),'会话泄漏标准答案');
   for(const checkbox of await checks.all())await checkbox.check();
   const answer=t.kind==='explanation'?review.rows.find(r=>r.taskId===t.id).semanticReview.acceptableAlternative:t.expected;
   await fill(t,answer);const response=page.waitForResponse(r=>r.url().endsWith('/api/studio/attempt')&&r.request().method()==='POST');await page.getByRole('button',{name:'提交最终答案',exact:true}).click();assert((await response).ok(),'提交失败');await page.locator('.task-feedback').waitFor();
   session=(await get()).progress.studio.sessions[session.id];const result=session.results[t.id];assert(result.status===(t.kind==='explanation'?'pendingReview':'correct'),'判分错误 '+t.id);assert(session.selfChecks[t.id].firstAnswer.value===first,'首答被覆盖 '+t.id);if(t.kind==='explanation')assert(!result.paid,'开放题自动发积分');taskResults.push({id:t.id,kind:t.kind,first,final:answer,status:result.status});
   if(t.id.endsWith('P07'))await shot('open-task-P07-1440',page.locator('.studio-practice'));
   if(i<tasks.length-1)await page.getByRole('button',{name:'继续下一题',exact:true}).click();
  }sessions.push(session);
 }
 assert(taskResults.length===12,'未实测全部12题');
 await post('/api/parent/access',{action:'setup',pin:'915837'});await page.goto(base+'/?view=parent');const formal=page.locator('.parent-formal-review');await formal.waitFor();
 const beforeReview=(await get()).progress,queued=await(await page.request.get(base+'/api/parent/formal')).json();assert(queued.tasks.filter(q=>q.lessonId===id||q.sessionId&&sessions.some(s=>s.id===q.sessionId)).length===5,'开放题待批队列不是5题');
 for(const session of sessions)for(const t of session.tasks.filter(t=>t.kind==='explanation')){
  await formal.getByRole('button',{name:'刷新解释题队列',exact:true}).click();await formal.getByLabel('选择作答').selectOption(`${session.id}:${t.id}`);await formal.getByLabel('给Kevin的核对反馈').fill('合成验收：按本题字段、范围、反例与参考依据逐项核对，不代表Kevin真实掌握。');
  const response=page.waitForResponse(r=>r.url().endsWith('/api/parent/formal/review')&&r.request().method()==='POST');await formal.getByRole('button',{name:'关系与解释正确',exact:true}).click();const r=await response;assert(r.ok(),'家长批阅失败 '+t.id);
  assert((await page.request.post(base+'/api/parent/formal/review',{data:r.request().postDataJSON()})).ok(),'重复批阅回放失败');
 }
 const final=(await get()).progress;assert(final.wallet.coins===beforeReview.wallet.coins,'家长批阅重复计分');for(const s of sessions){assert(final.studio.sessions[s.id].completedAt,'题组未完成 '+s.setName);for(const t of s.tasks)assert(final.studio.sessions[s.id].selfChecks[t.id].firstAnswer.value===s.selfChecks[t.id].firstAnswer.value,'批阅改写首答');}
 assert(final.studio.review[id]?.dueAt,'没有复习入口到期记录');await shot('parent-review-1440',formal);
 const backup=await(await page.request.get(base+'/api/parent/export')).json();await post('/api/parent/import',backup);const restored=await(await page.request.get(base+'/api/parent/export')).json();assert(JSON.stringify(backup.progress)===JSON.stringify(restored.progress),'导出恢复改变记录');
 assert(!errors.length,errors.join('\n'));
 const row={lessonId:id,title:lesson.title,contentFingerprint:buildSemanticLedger({evidence:null}).rows.find(r=>r.lessonId===id).contentFingerprint,result:'pass',mathBehavior:'full-path-verified',actionsPerformed:actions,assertions:['四类图与六步一致','字段定位、奇偶、邮编和稳定编号真实操作','错误路径、重置与原书架操作','12题先封存再三项自查','5题开放方案仅家长批阅','旧答案与积分边界、复习、完整备份恢复'],screenshots,visualInspected:false};
 return {passed:true,rows:[row],taskResults,version:lesson.contentVersion,viewports:[1366,1440,390],syntheticOnly:true,noExplorationPoints:true,noOpenTaskAutoGrade:true,backupRestore:true,parentReviewed:'synthetic-workflow-only',kevinMastery:'not-assessed',errors};
}
