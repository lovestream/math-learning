async (page) => {
 const base=new URL(page.url()).origin,data=await (await page.request.get(base+'/api/studio')).json(),errors=[],live=[],staticCards=[],models=new Set();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/api/')&&r.status()>=400)errors.push(r.status()+' '+r.url())});
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 const open=async lesson=>{await page.goto(base+'/?lesson='+lesson.lessonId);await page.locator('.lesson-article').waitFor();if(lesson.childClassroom)await page.getByRole('button',{name:'3 亲手实验',exact:true}).click()};
 for(const lesson of data.lessons){
  await page.setViewportSize({width:1440,height:1000});await open(lesson);
  const staticCard=lesson.widget==='conceptLab'&&lesson.conceptScenes.every(s=>!s.handsOnSpec&&!s.modelSpec&&!s.textbookSpec);
  if(staticCard){assert(await page.locator('.static-concept-figure').count()===1,'静态课缺少真实关系图 '+lesson.lessonId);assert(await page.locator('.concept-reading-card').count()===1,'关系卡被错误呈现为操作台 '+lesson.lessonId);assert(await page.getByRole('link',{name:'画图想一想',exact:true}).count()===1,'静态内容仍冒充动手实验 '+lesson.lessonId);const figure=page.locator('.static-concept-figure');await figure.screenshot({path:'output/playwright/v2-audit/static-'+lesson.lessonId+'-1440.png'});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'静态关系图手机溢出 '+lesson.lessonId);await figure.screenshot({path:'output/playwright/v2-audit/static-'+lesson.lessonId+'-390.png',style:'.sidebar{display:none!important}'});staticCards.push(lesson.lessonId);continue}
  const lab=page.locator('.hands-on-workbench,.operation-extension-lab,.measurement-lab,.hands-on,.textbook-workbench').first();await lab.waitFor();
  assert(await lab.locator('button:not(:disabled),input[type=range],select').count()>0,'没有可操作控件 '+lesson.lessonId);
  assert(await lab.locator('svg,.lunchboxes,.apple-row,.sticker-row,.ribbon-strip,.snack-contents,.candy-dots,.bank-material,.textbook-dropzone,.interactive-calendar,.core-place-columns,.core-relation-table,.core-nested-boxes,.core-fraction-whole').count()>0,'没有可识别的数学对象 '+lesson.lessonId);
  await lab.screenshot({path:'output/playwright/v2-audit/inventory-'+lesson.lessonId+'-1440.png'});
  if(lesson.widget==='mixedOperations'){
   for(const [i,scene] of lesson.mathScenes.entries()){
    if(lesson.mathScenes.length>1)await page.getByRole('button',{name:'场景 '+String.fromCharCode(65+i),exact:true}).click();
    else await page.getByRole('button',{name:'恢复初始状态',exact:true}).click();
    const operations=[];const collect=n=>{if(n.type==='operation'){collect(n.left);collect(n.right);operations.push(n)}};collect(scene.expressionAST);
    const text=n=>n.type==='number'?String(n.value):(n.grouped?'(':'')+text(n.left)+' '+({add:'＋',subtract:'－',multiply:'×',divide:'÷'}[n.operator])+' '+text(n.right)+(n.grouped?')':'');
    const evalAst=n=>n.type==='number'?Number(n.value):({add:(a,b)=>a+b,subtract:(a,b)=>a-b,multiply:(a,b)=>a*b,divide:(a,b)=>a/b}[n.operator])(evalAst(n.left),evalAst(n.right));
    await lab.getByRole('button',{name:text(operations[0]),exact:true}).click();
    for(let n=0;n<operations.length;n++){await lab.getByRole('textbox',{name:'这一小步得到多少？',exact:true}).fill(String(evalAst(operations[n])));await lab.getByRole('button',{name:n===0?'按预测算第一步':'算下一步',exact:true}).click()}
    assert((await lab.locator('.operation-readout').innerText()).includes('整条算式完成'),'场景不能跑完 '+scene.sceneId);models.add(scene.model.type);
    await lab.screenshot({path:'output/playwright/v2-audit/scene-'+scene.sceneId+'.png'});
   }
  }
  const mode=lesson.lengthScenes?.[0]?.mode;
  if(mode==='ruler'){
   await lab.getByRole('button',{name:'把零刻度对齐左端',exact:true}).click();const ruler=lab.getByRole('slider',{name:'移动尺子调整小棒左端的毫米读数'});await ruler.focus();await ruler.press('ArrowLeft');assert(await ruler.getAttribute('aria-valuenow')==='1','尺子键盘移动失效');
  }else if(mode==='boards'){
   await lab.getByRole('button',{name:'两板首尾相接',exact:true}).click();const board=lab.getByRole('slider',{name:'拖动乙板改变重叠厘米数'});await board.focus();await board.press('ArrowLeft');assert(await board.getAttribute('aria-valuenow')==='1','木板重叠操作失效');
  }else if(mode==='chain'){
   await lab.getByRole('button',{name:'重新摆',exact:true}).click();await lab.getByRole('button',{name:'接上一个链环',exact:true}).dragTo(lab.locator('.lab-stage'));assert(await lab.locator('.ring-enter').count()===2,'链环不能真实拖入');await lab.getByRole('button',{name:'放大第1处接头',exact:true}).click();assert(await lab.locator('.lab-joint-lens').count()===1,'接头放大失效');
  }else if(mode==='route'){
   await lab.getByRole('button',{name:'回学校',exact:true}).click();await lab.getByRole('button',{name:/再走/}).click();assert((await lab.locator('.lab-trip-meter').innerText()).includes('走过 1'),'行走路线没有前进');
  }else if(mode==='interval'){
   await lab.getByRole('button',{name:'把首尾接起来',exact:true}).click();await lab.getByRole('button',{name:'重新走',exact:true}).click();await lab.getByRole('button',{name:/走一段/}).click();assert(await lab.locator('.lab-rope-pin').count()===6,'闭合绳端点重复');
  }
  if(lesson.widget==='quantity'){
   await lab.getByRole('button',{name:'拿出全部苹果，重新配一次',exact:true}).click();for(const b of await lab.locator('.lunchboxes>button').all())await b.click();assert((await lab.locator('.discovery-line').innerText()).includes('已经配好 7'),'一一对应数数失效');await lab.getByRole('button',{name:'摆开一点',exact:true}).click();assert(await lab.locator('.apple-row.spread').count()===1,'数量守恒摆开失效');
  }else if(lesson.widget==='addition'){
   await lab.getByRole('button',{name:'回到左3、右2',exact:true}).click();await lab.getByRole('button',{name:'右篮挪1个到左篮',exact:true}).click();assert((await lab.locator('.discovery-line').innerText()).includes('4＋1＝5'),'挪动破坏总数');await lab.getByRole('button',{name:'从厨房新添1个到右篮',exact:true}).click();assert((await lab.locator('.discovery-line').innerText()).includes('4＋2＝6'),'新添没有增加总数');
  }else if(lesson.widget==='subtraction'){
   await lab.getByRole('button',{name:'送出贴纸：求剩下',exact:true}).click();await lab.getByRole('button',{name:'把送出的贴纸拿回来',exact:true}).click();await lab.getByRole('button',{name:'送出第1张贴纸',exact:true}).click();assert(await lab.locator('.sticker-row button.sent').count()===1,'送出贴纸反馈失效');
  }else if(lesson.widget==='substitution'){
   await lab.getByRole('button',{name:'合上盒子，再数一次',exact:true}).click();for(let n=1;n<=3;n++)await lab.getByRole('button',{name:'打开第'+n+'盒',exact:true}).click();assert(await lab.locator('.snack-contents.opened').count()===3,'拆盒动画对象遗漏');
  }else if(lesson.widget==='balance'){
   await lab.getByRole('button',{name:'1袋＋3颗，共10颗',exact:true}).click();await lab.getByRole('button',{name:'只从左边拿走3颗',exact:true}).click();assert(await lab.locator('.candy-comparison.unequal').count()===1,'单边拿走没有不等反馈');await lab.getByRole('button',{name:'回到开始',exact:true}).click();await lab.getByRole('button',{name:'两边各拿走3颗',exact:true}).click();assert(await lab.locator('.candy-comparison.equal').count()===1,'两边同减没有等量反馈');
  }else if(lesson.widget==='area'){
   await lab.getByRole('button',{name:'重新数一次',exact:true}).click();await lab.getByRole('button',{name:'第1块地垫',exact:true}).click();await lab.getByRole('button',{name:'沿外圈走1厘米',exact:true}).click();assert(await lab.locator('.tile-marked').count()===1&&await lab.locator('.rope-traced').count()===1,'面积与外边界混淆');
  }else if(lesson.widget==='fraction'){
   await lab.getByRole('button',{name:'全部放回去',exact:true}).click();await lab.getByRole('button',{name:'选前1小段',exact:true}).click();assert(await lab.locator('.ribbon-strip button.chosen').count()===1,'分数选取不对应小份');
  }
  const extension=lesson.conceptScenes?.[0]?.modelSpec;
  if(extension){
   await lab.getByRole('button',{name:'重新探索',exact:true}).click();
   if(extension.type==='wallet'){await lab.getByRole('button',{name:extension.pay+'－'+extension.refund,exact:true}).click();await lab.getByRole('button',{name:'把净支出放进钱袋',exact:true}).click();assert((await lab.locator('.model-result').innerText()).includes('余额：52'),'钱袋模型错误')}
   else if(extension.type==='division-groups'){await lab.getByRole('button',{name:'总人数＝6×2',exact:true}).click();await lab.getByRole('button',{name:'按选择平均分',exact:true}).click();assert(await lab.locator('.sharing-person').count()===12,'分组人数不符')}
   else if(extension.type==='reverse'){await lab.getByRole('button',{name:'除以4',exact:true}).click();await lab.getByRole('button',{name:'减去7',exact:true}).click();assert((await lab.locator('.model-result').innerText()).includes('找回□＝4'),'倒推输入错误')}
   else if(extension.type==='substitution'){await lab.getByRole('button',{name:'□包住（12＋8）',exact:true}).click();await lab.getByRole('button',{name:'替换所选对象',exact:true}).click();assert(await lab.locator('[data-substitution-frame="whole"]').count()===3,'完整对象替换丢失盒子')}
   else {const range=lab.locator('input[type=range]');await range.focus();await range.press('Home');await range.press('ArrowRight');assert(await lab.locator('[data-array-cut]').getAttribute('data-array-cut')==='2','分块与滑块不同源')}
  }
  await page.setViewportSize({width:390,height:844});await lab.scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'实验页面横向溢出 '+lesson.lessonId);await lab.screenshot({path:'output/playwright/v2-audit/inventory-'+lesson.lessonId+'-390.png'});live.push(lesson.lessonId);
 }
 assert(errors.length===0,'浏览器错误 '+JSON.stringify(errors));return {passed:true,opened:data.lessons.length,interactive:live.length,staticCards:staticCards.length,mixedSceneTypes:[...models],live,errors};
}
