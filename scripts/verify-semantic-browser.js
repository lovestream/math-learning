async page=>{
 const base=new URL(page.url()).origin,data=await(await page.request.get(base+'/api/studio')).json(),assert=(ok,m)=>{if(!ok)throw Error(m)},errors=[],checked=[];
 page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
 const ids=['G3-U01-B01','G3-U02-B03','G3-U03-E02','G3-UP01-B02','G3-U04-B03','G3-UP02-B01','G3-U05-B02','G3-U06-B03','G3-U07-B01','G3-L01-B01','G3-L02-B03','G3-L03-E01','G3-L04-B03','G3-L05-B02','G3-LP01-B02','G3-L06-B01','G3-L07-B01'];
 const click=async name=>page.locator('.classroom-stage').getByRole('button',{name,exact:true}).click();
 const stage=async n=>page.locator('.classroom-route button').nth(n).click();
 const shot=async(id,state,width)=>page.locator('.child-classroom').screenshot({path:`output/playwright/v2-audit/semantic-${id}-${state}-${width}.png`});
 // Check the cold story before opening any lazy length workbench. Page overflow
 // alone misses a wide SVG clipped by a narrower, internally scrolling figure.
 await page.goto(base+'/?lesson=G3-U03-E02');await page.locator('.classroom-story').waitFor();
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1024});
  const geometry=await page.locator('.classroom-story .measurement-question').evaluate(figure=>{
   const svgs=[...figure.querySelectorAll('svg')];return {fits:figure.scrollWidth<=figure.clientWidth+1&&svgs.every(svg=>svg.getBoundingClientRect().width<=figure.clientWidth+1),labelsFit:svgs.every(svg=>[...svg.querySelectorAll('text')].every(text=>{const a=text.getBoundingClientRect(),b=svg.getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1})),jointFills:[...figure.querySelectorAll('.task-joint rect')].map(rect=>getComputedStyle(rect).fill)};
  });
  assert(geometry.fits&&geometry.labelsFit,'链环首屏内部截图／标注裁切 '+width);
  assert(geometry.jointFills.length===3&&geometry.jointFills.every(fill=>fill!=='rgb(0, 0, 0)'),'冷启动接头样式未加载');
 }
 const operate=async id=>{
  const stage=page.locator('.classroom-stage');
  const reset=stage.getByRole('button',{name:'重新开始',exact:true});if(await reset.count())await reset.click();
  if(id==='G3-U01-B01'){await click('从右侧看');await click('拍下当前方向');assert(await stage.locator('.photo-shelf .projection-card').count()>0,'相机没有留下右视照片');}
  else if(id==='G3-U02-B03'){
   const lab=stage.locator('.mixed-operations-lab');await lab.getByRole('button',{name:'场景 A',exact:true}).click();
   const options=lab.locator('.prediction-panel button');await options.filter({hasText:/8.*4/}).click();await lab.locator('.lab-prediction input').fill('2');await click('按预测算第一步');assert(await lab.locator('.operation-error').count()===1,'错误第一步没有拦截');
   await lab.getByRole('button',{name:'(12 ＋ 8)',exact:true}).click();await lab.locator('.lab-prediction input').fill('20');await click('按预测算第一步');assert((await lab.locator('.operation-readout').innerText()).includes('20'),'红蓝合并的中间量不对');await lab.locator('.lab-prediction input').fill('5');await click('算下一步');assert((await lab.locator('.operation-readout').innerText()).includes('5盒'),'分装结果与模型不符');
  }
  else if(id==='G3-U03-E02'){await stage.getByRole('combobox',{name:'目标链环个数'}).selectOption('5');for(let i=0;i<4;i++)await stage.getByRole('button',{name:'接上一个链环',exact:true}).click();await stage.getByRole('button',{name:'放大第1处接头',exact:true}).click();assert(await stage.getByRole('button',{name:/放大第.*处接头/}).count()===4,'5环不应有5个接头');}
  else if(id==='G3-UP01-B02'){await click('模型象上船');await click('标记模型象的水线');await click('把模型象请下船');assert((await stage.locator('.boat-status').innerText()).includes('太轻'),'象下船后水线没有变化');}
  else if(id==='G3-U04-B03'){await stage.getByRole('combobox',{name:'选择操作情境'}).selectOption('1');for(let i=0;i<7;i++)await click('再放入一组');await click('捆10个一 → 1个十');const numbers=(await stage.locator('.core-place-columns strong').allTextContents()).map(Number);assert(numbers.reduce((s,n,i)=>s+n*[1000,100,10,1][i],0)===68*7,'进位交换没有守恒');}
  else if(id==='G3-UP02-B01'){await stage.getByRole('combobox',{name:'架号',exact:true}).selectOption('2');await stage.getByRole('combobox',{name:'编码每段位数',exact:true}).selectOption('2');await click('为这个位置登记编号');assert((await stage.locator('.textbook-code').innerText()).startsWith('02'),'编号字段没有改变对应位置');}
  else if(id==='G3-U05-B02'){await stage.getByRole('slider',{name:'转动上边改变张口',exact:true}).press('ArrowLeft');await click('叠上直角工具');await click('让上边对齐直角边');assert((await stage.locator('.textbook-feedback').innerText()).includes('90°'),'角与直角工具不符');}
  else if(id==='G3-U06-B03'){await stage.getByRole('combobox',{name:'选择操作情境'}).selectOption('1');await stage.getByRole('button',{name:'选择第1份',exact:true}).first().click();}
  else if(id==='G3-U07-B01'){await click('登记这套搭配');await click('登记这套搭配');assert((await stage.locator('.textbook-feedback').innerText()).includes('重复'),'重复搭配增加计数');await click('选上衣B');await click('登记这套搭配');}
  else if(id==='G3-L01-B01'){await click('穿透两层打一孔');assert((await stage.locator('.textbook-feedback').innerText()).includes('先完全对折'),'未折好就成对打孔');await click('完全对折');await click('穿透两层打一孔');await click('完全展开');}
  else if(id==='G3-L02-B03'){await stage.getByRole('combobox',{name:'选择操作情境'}).selectOption('1');await stage.getByRole('button',{name:/装一满袋/}).click();}
  else if(id==='G3-L03-E01'){await click('两块完整拼好');assert(await stage.locator('svg [role=button]').count()===6,'内部接缝仍算外边');}
  else if(id==='G3-L04-B03'){assert(await stage.locator('.classroom-unit-context [role=img]').count()>0,'单位换算没有10×10条件图');await click('把剪块移到右边');assert((await stage.locator('.textbook-feedback').innerText()).includes('面积40'),'剪拼不守恒');}
  else if(id==='G3-L05-B02'){await click('选择10分钟');await stage.getByRole('button',{name:'把选中的分钟卡放这里',exact:true}).first().click();await click('核对一人一次与分组条件');assert((await stage.locator('.textbook-feedback').innerText()).includes('10分钟'),'错误边界没反馈');await click('移动或选择10分钟');await stage.getByRole('button',{name:'把选中的分钟卡放这里',exact:true}).nth(1).click();}
  else if(id==='G3-LP01-B02'){await click('向前40分钟');await click('向前5分钟');assert((await stage.locator('.textbook-feedback').innerText()).includes('经过45分钟'),'跨小时没有60分钟进位');}
  else if(id==='G3-L06-B01'){await click('数字3');await stage.getByRole('button',{name:'放入选中的数字',exact:true}).nth(2).click();}
  else if(id==='G3-L07-B01'){await click('选择芳芳');await stage.getByRole('button',{name:'把选中的姓名放这里',exact:true}).first().click();await click('核对一人一次与分组条件');assert((await stage.locator('.textbook-feedback').innerText()).includes('芳芳'),'重叠名单错误没有反馈');await click('移动或选择芳芳');await stage.getByRole('button',{name:'把选中的姓名放这里',exact:true}).nth(1).click();}
 };
 for(const id of ids){
  const l=data.lessons.find(l=>l.lessonId===id);await page.setViewportSize({width:390,height:844});await page.goto(base+'/?lesson='+id);await page.locator('.child-classroom').waitFor();await stage(0);await shot(id,'story',390);
  await stage(1);await page.locator('.prediction-cards button').last().click();const guess=await page.locator('.prediction-cards button[aria-pressed=true]').innerText();await shot(id,'prediction',390);
  await stage(2);await shot(id,'initial',390);await operate(id);await shot(id,'operated',390);
  await stage(3);assert(await page.locator('.retell-task').innerText()===l.childClassroom.whyQuestion,'因果追问不对应 '+id);assert((await page.locator('.prediction-comparison').innerText()).includes(guess),'没有回看自己的预测 '+id);await shot(id,'why',390);
  await stage(4);assert(await page.getByRole('heading',{name:'原故事的数学表达',exact:true}).count()===1,'固定表达未标范围 '+id);if(['G3-U02-B03','G3-U04-B03','G3-U06-B03','G3-U03-E02','G3-UP01-B02','G3-L02-B03'].includes(id))assert(await page.locator('.current-experiment').count()===1,'结构化实验条件没有显示 '+id);
  if(id==='G3-U04-B03')assert((await page.locator('.blank-expression').innerText()).includes('68×7'),'切换后仍给147×8');
  if(id==='G3-U06-B03')assert((await page.locator('.blank-expression').innerText()).includes('1/6＋2/6'),'换分组后仍给2/8＋3/8');
  if(id==='G3-U03-E02')assert((await page.locator('.blank-expression').innerText()).includes('(5−1)'),'当前环数错用原来的4环');
  await shot(id,'symbols',390);await stage(5);assert(!await page.locator('.parent-task-preview').getAttribute('open'),'题目清单默认展开');assert(await page.locator('.parent-task-preview li').count()>=3,'家长无法核对题组');assert(!await page.locator('.parent-task-preview li').first().isVisible(),'儿童仍需重复阅读题组');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'语义页面390溢出 '+id);checked.push({id,chapter:l.textbookUnit.id,actualOperation:true,why:true,oldAndCurrentSeparated:true});
 }
 for(const id of ['G3-U01-B01','G3-U02-B03','G3-U04-B03','G3-U03-E02'])for(const width of [768,1440]){await page.setViewportSize({width,height:1024});await page.goto(base+'/?lesson='+id);await page.locator('.child-classroom').waitFor();for(const [n,name] of [[0,'story'],[1,'prediction'],[2,'operated']]){await stage(n);await shot(id,name,width);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'关键图溢出 '+id+' '+width);} }
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/?lesson=G3-U02-B03');await page.locator('.child-classroom').waitFor();await stage(0);
 const fontSample=await page.evaluate(()=>{
  // Snapshot computed sizes before changing parents; !important pixel rules
  // otherwise silently defeat an inherited 200% test on the main story text.
  const story=document.querySelector('.story-sentence'),original=parseFloat(getComputedStyle(story).fontSize);
  const samples=[...document.querySelectorAll('.classroom-stage p,.classroom-stage h2')].map(node=>[node,parseFloat(getComputedStyle(node).fontSize)]);
  for(const [node,size] of samples)node.style.setProperty('font-size',`${size*2}px`,'important');
  return {original};
 });
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const enlarged=await page.locator('.story-sentence').evaluate(story=>({enlarged:parseFloat(getComputedStyle(story).fontSize),inline:story.style.fontSize,priority:story.style.getPropertyPriority('font-size')}));
 Object.assign(fontSample,enlarged);
 assert(fontSample.original>0&&Math.abs(fontSample.enlarged-fontSample.original*2)<.1,'正文未真正放大两倍 '+JSON.stringify(fontSample));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'字体放大导致溢出');await shot('G3-U02-B03','font200',390);
 assert(!errors.length,errors.join('\n'));return {passed:true,chapters:checked,representativeCount:17,widths:[390,768,1440],coldChainStoryNotClipped:true,font200:true,fontSample,realIpad:false,kevinTrial:false,errors};
}
