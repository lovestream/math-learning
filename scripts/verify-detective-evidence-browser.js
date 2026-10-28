async(page,{advanceDetectiveClock})=>{
 const base=new URL(page.url()).origin,out='output/playwright/v2-audit',assert=(v,m)=>{if(!v)throw Error(m)};
 const api=async(path,body)=>{const r=await page.request[body?'post':'get'](base+path,body?{data:body}:undefined);assert(r.ok(),`${path} ${r.status()} ${await r.text()}`);return r.json();};
 await api('/api/parent/access',{action:'setup',pin:'913456'});
 const before=await api('/api/parent/export');
 const show=async()=>{await page.goto(base+'/?view=detective');await page.getByRole('button',{name:'自己解、自己查 · 延迟复测',exact:true}).click();};
 await show();const self=page.locator('.det-self');
 const open=async(button)=>{
  await self.locator('.det-self-families article').first().getByRole('button',{name:button,exact:true}).click();
  await self.getByLabel('第一次答案',{exact:true}).fill('9');await self.getByRole('button',{name:/封存首答/}).focus();await page.keyboard.press('Enter');
  await self.getByLabel('自查后的答案',{exact:true}).waitFor();
  const row=(await api('/api/detective/self')).attempts.find(a=>a.phase==='check');assert(row&&!row.result&&!row.answer,'反馈前泄漏判分');return row;
 };
 const finish=async(row,answer,value,expression='',explanation='')=>{
  await self.getByLabel('自查后的答案',{exact:true}).fill(answer);
  await self.getByLabel('我自己写的反查算式（只写左边，不带等号）',{exact:true}).fill(expression);
  await self.getByLabel('我亲自算出的反查结果',{exact:true}).fill(value);
  await self.getByLabel('我怎样核对的（可补充解释，家长核对）',{exact:true}).fill(explanation);
  await self.getByRole('button',{name:/封存第二次答案/}).click();await self.locator('.det-self-result').waitFor();
  return (await api('/api/detective/self')).attempts.find(a=>a.id===row.id);
 };
 const back=()=>self.getByRole('button',{name:/保存完成，回题族列表/}).click();
 let row=await open('自己解一题');assert(row.question.prompt.includes('25颗')&&row.question.check.target==='12.5','抄目标反例条件不同');
 let result=await finish(row,'0.5','12.5','12.5');assert(result.result.finalCorrect&&!result.result.independent&&!result.currentEvidenceEligible&&result.result.category==='answer-correct-check-unproven','抄目标被误计独立');
 const copiedPrompt=row.question.prompt;assert(!result.currentCheckEvidence.reviewable,'裸数值可被家长补认');
 let data=await api('/api/detective/self');assert(data.stats.preFeedbackCorrection.numerator===1&&data.stats.effectiveCorrection.numerator===0,'答案改对与独立检查未拆开');
 await self.screenshot({path:out+'/detective-evidence-copy-target-unproven-1440.png'});await back();
 row=await open('自己解一题');result=await finish(row,'26','26','26×1');assert(result.result.independent,'无辅助实际检验未成立');await back();
 row=await open('换条件 / 求未知量');result=await finish(row,'56','2','56÷(20+8)');assert(result.result.independent,'迁移拆括号未通过');await back();
 advanceDetectiveClock(1);await show();row=await open('做今天到期的新题');assert(!row.question.check,'复测泄漏标准检验');
 result=await finish(row,'1.5','40.5','(20+7)×1.5');assert(result.result.independent,'复测等价式被拒绝');
 await self.screenshot({path:out+'/detective-evidence-equivalent-review-1440.png'});await back();
 advanceDetectiveClock(3);await show();row=await open('做今天到期的新题');result=await finish(row,'0.5','29','14.5÷0.5');assert(result.result.independent,'另一反向关系被拒绝');await back();
 advanceDetectiveClock(7);await show();row=await open('做今天到期的新题');result=await finish(row,'30','30','','我按每颗1克画30个小格，总重30克，符合原条件。');
 assert(!result.result.independent&&result.currentCheckEvidence.source==='pending-parent','未自动证明的方法提前授予独立');
 const sealed=JSON.stringify({firstAnswer:result.firstAnswer,preFeedbackRevision:result.preFeedbackRevision,selfCheckActions:result.selfCheckActions,result:result.result});
 await self.screenshot({path:out+'/detective-evidence-alternative-pending-1440.png'});
 await api('/api/parent/access',{action:'unlock',pin:'913456'});await page.goto(base+'/?view=parent');const parent=page.locator('.det-self-parent');await parent.locator('summary').first().click();
 const card=parent.locator('article').filter({has:page.getByRole('heading',{name:row.question.prompt,exact:true})});
 assert(await card.getByRole('button',{name:'确认封存的独立检验证据',exact:true}).isDisabled(),'未填写依据即可确认');
 const fillReview=async(scope)=>{await scope.getByLabel('我核对的是反馈前封存的独立检验，不是揭晓答案后补做',{exact:true}).check();await scope.getByLabel('给孩子的反馈与具体核对依据（孩子可见）',{exact:true}).fill('核对原先画格说明：每格1克，30格共30克，符合原条件；未给辅助。');};
 await fillReview(parent);
 const copiedCard=parent.locator('article').filter({has:page.getByRole('heading',{name:copiedPrompt,exact:true})});assert(await copiedCard.getByRole('button',{name:'确认封存的独立检验证据',exact:true}).isDisabled(),'勾选与评语让裸数值取得确认资格');
 const other=await page.context().newPage();await other.goto(base+'/?view=parent');const stale=other.locator('.det-self-parent');await stale.locator('summary').first().click();await fillReview(stale);
 await card.getByRole('button',{name:'确认封存的独立检验证据',exact:true}).click();await parent.getByText('复测阶段 3/4',{exact:false}).waitFor();
 const staleCard=stale.locator('article').filter({has:other.getByRole('heading',{name:row.question.prompt,exact:true})});await staleCard.getByRole('button',{name:'确认封存的独立检验证据',exact:true}).click();await stale.getByRole('alert').waitFor();await other.close();
 data=await api('/api/detective/self');result=data.attempts.find(a=>a.id===row.id);
 assert(result.currentEvidenceEligible&&result.currentCheckEvidence.source==='parent-confirmed'&&data.families[0].schedule.stage===3,'家长确认未形成复测闭环');
 assert(result.parentReviews.length===1,'旧标签重复批阅');assert(sealed===JSON.stringify({firstAnswer:result.firstAnswer,preFeedbackRevision:result.preFeedbackRevision,selfCheckActions:result.selfCheckActions,result:result.result}),'追溯改写历史判分');
 await parent.screenshot({path:out+'/detective-evidence-parent-confirmed-1440.png'});
 await show();await self.locator('.det-self-records summary').click();await self.locator('.det-self-records button').filter({hasText:row.question.prompt}).click();await self.getByRole('heading',{name:'家长已核对反馈前的检验证据',exact:true}).waitFor();await self.getByText('原自动反馈：',{exact:false}).waitFor();await self.screenshot({path:out+'/detective-evidence-child-parent-confirmed-1440.png'});
 advanceDetectiveClock(14);await show();row=await open('做今天到期的新题');result=await finish(row,'1.5','46.5','31×1.5');assert(result.result.independent,'最后复测未通过');
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:width===390?844:1024});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${width}横向溢出`);}
 data=await api('/api/detective/self');assert(data.families[0].schedule.stage===4&&data.families[0].evidence.includes('有迁移证据'),'四轮复测闭环未成立');
 await api('/api/parent/access',{action:'unlock',pin:'913456'});const backup=await api('/api/parent/export');await api('/api/parent/import/preview',backup);await api('/api/parent/import',backup);const restored=await api('/api/parent/export');
 assert(JSON.stringify(backup.progress.studio.detective.selfTraining)===JSON.stringify(restored.progress.studio.detective.selfTraining),'带批阅的新证据备份损坏');
 assert(JSON.stringify(before.progress.wallet)===JSON.stringify(restored.progress.wallet)&&restored.progress.studio.detective.badges.length===0,'自查误发奖励');
 return {passed:true,syntheticOnly:true,assertions:['抄目标进检验式仍不授予独立或家长补认','首答封存前后无反馈','普通检验式无提示可核验','交换/括号/多方法复测','其他方法待家长而非判错','家长确认推进一次','双标签409不改历史','四轮复测与备份恢复','钱包与勋章不变'],viewports:[390,768,1440]};
}
