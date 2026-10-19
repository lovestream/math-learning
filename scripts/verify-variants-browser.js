async page=>{
 const base=new URL(page.url()).origin,data=await(await page.request.get(base+'/api/data')).json(),errors=[],checked=[],assert=(v,m)=>{if(!v)throw Error(m)};page.on('pageerror',e=>errors.push(e.message));
 for(const card of data.thinkingCards.filter(t=>t.publicationStatus==='guided-study')){
  const r=data.progress.studio.thinking[card.id];assert([9,12].includes(r.variantIndex),'变式夹具版本不正确');
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/?view=map&thinking='+card.id);const panel=page.locator('.thinking-panel');await panel.waitFor();assert((await panel.locator('.thinking-question').innerText()).includes(r.variant.question),'题图题干不同源 '+card.id);const image=panel.getByRole('img',{name:'复习题的已知条件图',exact:true});assert(await image.count()===1,'反向几何缺图 '+card.id);assert(await panel.locator('.thinking-tool').count()===0,'挑战模式有自动验证 '+card.id);assert(!(await image.textContent()).includes('undefined'),'未知量错误 '+card.id);
  await image.screenshot({path:`output/playwright/v2-audit/variant-${card.id}-R${r.variantIndex}.png`});
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'新情境390溢出 '+card.id);await panel.getByLabel('我的首答和理由').fill('仅测试：这里记录反向推理的首答。');await panel.getByRole('button',{name:'保存首答，再自查',exact:true}).click();await panel.locator('blockquote').waitFor();await page.reload();await panel.waitFor();assert((await panel.locator('blockquote').textContent()).includes('反向推理'),'新情境刷新丢首答 '+card.id);checked.push({id:card.id,variant:r.variant.id,diagram:r.variant.figure.unit});
 }
 assert(!errors.length,JSON.stringify(errors));return {passed:true,A12:{knownFigures:checked,all204MathematicalParameters:'Node oracle tests',rewardFromExperiment:0},errors};
}
