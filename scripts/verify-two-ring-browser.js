async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m)},base=new URL(page.url()).origin,errors=[],apiRequests=[],screenshots=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiRequests.push(r.url());});
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(base+'/?preview=chain-two');const root=page.locator('.two-ring-preview'),svg=page.locator('.two-main-figure'),second=page.locator('[data-ring=second]');await root.waitFor();
 const shot=async name=>{const path=`output/playwright/v2-audit/two-ring-${name}.png`;await page.screenshot({path,fullPage:true});screenshots.push(path);};
 const state=async()=>svg.evaluate(e=>({offset:Number(e.dataset.offsetMm),coupled:Number(e.dataset.coupledTotalMm),comparison:Number(e.dataset.comparisonTotalMm)}));
 const settled=async n=>page.waitForFunction(n=>Number(document.querySelector('.two-main-figure')?.getAttribute('data-offset-mm'))===n,n);
 const geometry=async()=>{
  const rings=await page.locator('.two-main-figure > [data-ring]').evaluateAll(nodes=>nodes.map(g=>({left:Number(g.dataset.leftMm),right:Number(g.dataset.rightMm),rect:(()=>{const r=g.querySelector('.lab-ring > rect,.two-comparison-outline > rect'),b=r.getBBox(),w=Number.parseFloat(getComputedStyle(r).strokeWidth);return {width:b.width+w,height:b.height+w};})()})));
  assert(rings.length===2&&rings.every(r=>Math.abs(r.right-r.left-40)<1e-8),'完整环外长不等于40');
  assert(Math.abs(rings[0].rect.width-rings[1].rect.width)<.1&&Math.abs(rings[0].rect.height-rings[1].rect.height)<.1,'两个环可见外观比例不同');
  const dims=await svg.locator('.two-first-length,.two-second-length').evaluateAll(nodes=>nodes.map(g=>({from:Number(g.dataset.fromMm),to:Number(g.dataset.toMm),path:(()=>{const b=g.querySelector('.two-size-line').getBBox();return {x:b.x,width:b.width};})()})));
  assert(dims.every((d,i)=>Math.abs(d.from-rings[i].left)<1e-6&&Math.abs(d.to-rings[i].right)<1e-6&&Math.abs(d.path.x-100-d.from*10)<.001&&Math.abs(d.path.width-400)<.001),'40毫米标注没有对准本环外缘 '+JSON.stringify({dims,rings}));
  const r=await svg.boundingBox();assert(r.y>=0&&r.y+r.height<=900,'主要图形未完整出现在电脑一屏内');
 };
 assert(await second.count()===0,'起始已经出现第二环');assert(!(await svg.textContent()).includes('70')&&!(await svg.textContent()).includes('80'),'观察前显示了总长答案');await shot('A-first');
 await page.getByRole('button',{name:'接上第二环',exact:true}).click();await geometry();
 const joint=await svg.locator('[data-metal]').evaluateAll(nodes=>nodes.map(n=>({kind:n.dataset.metal,from:Number(n.dataset.startMm),to:Number(n.dataset.endMm)})));
 assert(joint.length===2&&joint.find(n=>n.kind==='previous').from===35&&joint.find(n=>n.kind==='previous').to===40&&joint.find(n=>n.kind==='next').from===30&&joint.find(n=>n.kind==='next').to===35,'接头端部归属或5毫米范围错位');
 const lensGeometry=await svg.locator('.two-joint-inset svg').evaluate(s=>{const [a,b]=[...s.querySelectorAll('.lab-ring')].map(g=>{const r=g.querySelector('rect'),stroke=Number(r.getAttribute('stroke-width'));return {left:Number(r.getAttribute('x'))-stroke/2,right:Number(r.getAttribute('x'))+Number(r.getAttribute('width'))+stroke/2};}),f=s.querySelector('[data-joint-region]'),left=Number(f.getAttribute('x')),right=left+Number(f.getAttribute('width'));const label=s.querySelector('.two-previous-end-label');return {blueLabelAtRight:Number(label.getAttribute('x'))===right&&label.getAttribute('text-anchor')==='end',blueRight:a.right===right,yellowLeft:b.left===left,realZoom:s.getScreenCTM().a*100>document.querySelector('.two-main-figure').getScreenCTM().a*50};});
 assert(Object.values(lensGeometry).every(Boolean),'放大图没有对齐真实端部，或实际比原图更小');
 for(const t of ['环①完整40毫米','环②完整也是40毫米','共同10毫米','净增加30毫米'])assert(await svg.getByText(t,{exact:true}).isVisible(),'四量同图缺少 '+t);
 await shot('B-coupled-four-quantities');await page.getByRole('button',{name:'拉开比较',exact:true}).click();await settled(0);await shot('C-comparison-start');
 const dragTo=async d=>{
  const point=await svg.evaluate((e,d)=>{const p=e.createSVGPoint();p.x=100+50*10;p.y=258;const q=p.matrixTransform(e.getScreenCTM());return {x:q.x,y:q.y,dx:d*10*e.getScreenCTM().a};},d);
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+point.dx,point.y,{steps:10});await page.mouse.up();
 };
 await dragTo(5);await settled(5);assert(await second.getAttribute('data-left-mm')==='35','未追踪第二环左端');assert(await svg.locator('.two-joint-inset').count()===0,'展开过程中伪造了固定厚度接头');await geometry();
 await dragTo(5);await settled(10);await geometry();
 assert((await state()).coupled===70&&(await state()).comparison===80,'把虚拟比较80写成了相扣答案');assert(await svg.locator('.two-comparison-outline').count()===1,'比较副本仍假装真实金属穿透');await shot('D-adjacent-80');
 await page.getByRole('button',{name:'推回相扣',exact:true}).click();await settled(0);await geometry();await shot('E-back-to-coupled');
 for(let i=0;i<3;i++){await page.getByRole('button',{name:'拉到刚好相邻',exact:true}).click();await settled(10);await page.getByRole('button',{name:'撤销',exact:true}).click();await settled(0);}
 await dragTo(30);await settled(10);await second.focus();await page.keyboard.press('ArrowLeft');await settled(9);await page.keyboard.press('Home');await settled(0);
 await second.focus();for(let i=0;i<15;i++)await page.keyboard.press('ArrowRight');await settled(10);assert(await second.getAttribute('aria-valuenow')==='40','键盘移动越界');
 await page.getByRole('button',{name:'重摆',exact:true}).click();assert(await second.count()===0,'重摆未回到首环');
 // Normal animation moves a complete ring, rather than growing a short bar.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'接上第二环',exact:true}).click();
 await page.waitForFunction(()=>Number(document.querySelector('[data-ring=second]')?.getAttribute('data-left-mm'))>30);
 assert(await second.evaluate(e=>Math.abs(Number(e.dataset.rightMm)-Number(e.dataset.leftMm)-40))<1e-8,'动画缩短了第二环');
 await page.waitForFunction(()=>document.querySelector('[data-ring=second]')?.getAttribute('data-left-mm')==='30');await geometry();
 await page.reload();await root.waitFor();assert(await second.count()===0,'样板刷新写入了持久进度');
 assert(apiRequests.length===0,'隔离样板调用了学习API '+JSON.stringify(apiRequests));assert(!errors.length,errors.join(';'));
 assert(await root.getAttribute('data-approval-status')==='parent-visual-approved','双环批准状态未更新');
 return {passed:true,stage:0,approval:'parent-visual-approved',viewport:'1440x900',screenshots,apiRequests,checks:['A–E真实截图','四量同图与外缘对齐','两个5毫米端部','鼠标/键盘/按钮/撤销/越界','比较不改相扣答案','完整环移动动画','减少动态效果','刷新隔离/零学习API']};
}
