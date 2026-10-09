async (page) => {
 const base=new URL(page.url()).origin,data=await (await page.request.get(base+'/api/studio')).json(),errors=[],stories=[],predictions=[];
 page.on('pageerror',e=>errors.push(e.message));
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 const widths=[1440,390],shots=new Set(['G3-U01-B01','G3-U01-B03','G3-U06-E01','G3-L03-E01','G3-L04-B03','G3-LP01-B01','G3-U03-E02','G3-UP01-B02']);
 for(const lesson of data.lessons.filter(l=>l.introVisual||l.mathScenes?.length||l.lengthScenes?.length||l.articleBlocks[0]?.diagram)){
  await page.goto(base+'/?lesson='+lesson.lessonId);await page.locator('.lesson-article').waitFor();
  if(lesson.childClassroom){await page.getByRole('button',{name:'Kevin 短课堂',exact:true}).click();await page.getByRole('button',{name:'1 真实问题',exact:true}).click()}
  const picture=page.locator(lesson.childClassroom?'.classroom-story [data-intro-visual]' :'.story-opening [data-intro-visual],.story-opening .teaching-figure,.story-opening .teaching-diagram').first();await picture.waitFor().catch(()=>{throw Error("故事图不可见 "+lesson.lessonId)});
  assert(await picture.locator('svg, .ribbon-strip, .tile-diagram, .tile-grid, .candy-dots, .snack-contents, .candy-comparison, .lunchboxes, .apple-row, .sticker-row, .intro-calendar').count()>0,'只有文字没有图 '+lesson.lessonId);
  for(const width of widths){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'故事图横向溢出 '+lesson.lessonId+' '+width);
   if(shots.has(lesson.lessonId))await picture.screenshot({path:'output/playwright/v2-audit/intro-'+lesson.lessonId+'-'+width+'.png'});
  }
  stories.push(lesson.lessonId);
  if(lesson.childClassroom){await page.getByRole('button',{name:'2 先猜一猜',exact:true}).click();const prediction=page.locator('.classroom-predict [data-intro-visual]').first();await prediction.waitFor();assert(await prediction.locator('svg, .ribbon-strip, .tile-diagram, .tile-grid, .candy-dots, .snack-contents, .candy-comparison, .lunchboxes, .apple-row, .sticker-row, .intro-calendar').count()>0,'预测缺图 '+lesson.lessonId);
   assert(await prediction.getAttribute('data-intro-stage')==='prediction','预测阶段图形类型错了');
   if(lesson.lessonId==='G3-U01-B01'){assert(await prediction.locator('[data-prediction-unknown] svg').count()===0,'新照片提前揭晓');assert((await prediction.locator('[data-prediction-unknown]').innerText()).includes('？'),'新照片没有待猜占位')}
   if(lesson.lessonId==='G3-U01-B03')assert(await prediction.locator('[data-net-face]').count()===6,'预测展开图不是六面');
   for(const width of widths){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'预测图横向溢出 '+lesson.lessonId);await prediction.screenshot({path:'output/playwright/v2-audit/predict-'+lesson.lessonId+'-'+width+'.png'})}
   await page.locator('.prediction-cards button').first().click();await page.getByRole('button',{name:lesson.interactionStatus==='static-visual'?'带着我的猜想去看图':'带着我的猜想去实验',exact:true}).click();await page.locator('.classroom-stage').waitFor();
   await page.getByRole('button',{name:'2 先猜一猜',exact:true}).click();assert(await page.locator('.prediction-cards button[aria-pressed=true]').count()===1,'回看时猜想丢失');
   predictions.push(lesson.lessonId);
  }
 }
 assert(stories.length===70,'故事图覆盖数发生变化，需要逐项审核 '+stories.length);assert(predictions.length===70,'61节有图课堂的预测未全部核查');
 // Updating the frontend must also work with a server started before these fields existed.
 await page.route('**/api/studio',async route=>{const response=await route.fetch(),old=await response.json();for(const lesson of old.lessons){delete lesson.introVisual;if(lesson.childClassroom){delete lesson.childClassroom.storyVisual;delete lesson.childClassroom.predictionVisual}}await route.fulfill({response,json:old})});
 try{await page.goto(base+'/?lesson=G3-U01-B01');await page.getByRole('button',{name:'Kevin 短课堂',exact:true}).click();await page.getByRole('button',{name:'1 真实问题',exact:true}).click();await page.locator('.classroom-story [data-intro-visual]' ).waitFor();await page.getByRole('button',{name:'2 先猜一猜',exact:true}).click();await page.locator('.classroom-predict [data-intro-visual]').first().waitFor()}finally{await page.unroute('**/api/studio')}
 assert(errors.length===0,JSON.stringify(errors));
 return {passed:true,storyPictures:stories.length,predictionPictures:predictions.length,widths,olderApiCompatible:true,stories,predictions,errors};
}
