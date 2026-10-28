async page=>{
 const base=new URL(page.url()).origin,start=await(await page.request.get(base+'/api/data')).json(),checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 const assert=(v,m)=>{if(!v)throw Error(m)};
 for(const [id,unit,times,result,total] of [['G3-L02-B02','十',3,13,52],['G3-L02-B04','百',2,102,408]]){
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/?lesson='+id);const lab=page.locator('.textbook-workbench');await lab.waitFor();await lab.getByRole('button',{name:'重新开始',exact:true}).click();const people=lab.locator('.bank-recipients>article');
  for(let i=0;i<4;i++)await people.nth(i).getByRole('button',{name:'分1个'+unit,exact:true}).click();
  if(total===52)await lab.getByRole('button',{name:'拆1个十 → 10个一',exact:true}).click();
  for(let i=0;i<4;i++)for(let n=0;n<times;n++)await people.nth(i).getByRole('button',{name:'分1个一',exact:true}).click();
  assert((await lab.locator('.textbook-feedback').innerText()).includes(`全部分完，4份都是${result}`),'按位分配不能完成 '+id);
  await people.nth(0).getByRole('button',{name:'退回1个一',exact:true}).click();await people.nth(1).getByRole('button',{name:'分1个一',exact:true}).click();assert(!(await lab.locator('.textbook-feedback').innerText()).includes('全部分完'),'不平均却显示平均分完成');
  await people.nth(1).getByRole('button',{name:'退回1个一',exact:true}).click();await people.nth(0).getByRole('button',{name:'分1个一',exact:true}).click();assert((await lab.locator('.textbook-feedback').innerText()).includes(`全部分完，4份都是${result}`),'错误分配不能修改');
  await page.waitForTimeout(1100);assert(await people.evaluateAll(cards=>cards.every(card=>[...card.querySelectorAll('.bank-material svg')].every(svg=>svg.getBoundingClientRect().top>=card.querySelector('h4').getBoundingClientRect().bottom+8))),'材料盖住班级标题');await lab.screenshot({path:`output/playwright/v2-audit/division-${id}-complete-1440.png`});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'材料小屏溢出');assert(await people.evaluateAll(cards=>cards.every(card=>[...card.querySelectorAll('.bank-material svg')].every(svg=>svg.getBoundingClientRect().top>=card.querySelector('h4').getBoundingClientRect().bottom+8))),'手机材料盖住标题');await lab.screenshot({path:`output/playwright/v2-audit/division-${id}-complete-390.png`});checks.push({id,total,quotient:result,regroup:true,wrongShareRejected:true,repair:true});
 }
 const out=await(await page.request.get(base+'/api/data')).json();assert(out.progress.wallet.coins===start.progress.wallet.coins,'练习教具错误记为积分');assert(errors.length===0,JSON.stringify(errors));return {passed:true,checks,reward:0,errors};
}
