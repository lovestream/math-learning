async page=>{
 const {buildSemanticLedger}=await import(process.cwd()+'/scripts/build-semantic-ledger.mjs');const fingerprints=new Map(buildSemanticLedger().rows.map(r=>[r.lessonId,r.contentFingerprint]));
 const {operateDesktop}=await import(process.cwd()+'/scripts/desktop-math-actions.mjs');
 const base=new URL(page.url()).origin,data=await(await page.request.get(base+'/api/studio')).json(),rows=[],errors=[];
 const assert=(ok,m)=>{if(!ok)throw Error(m)};
 page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
 const stage=async n=>page.locator('.classroom-route button').nth(n).click();
 const shot=async(id,state,width)=>{const path=`output/playwright/v2-audit/desktop-${id}-${state}-${width}.png`;await page.locator('.child-classroom').screenshot({path});return path;};
 const selected=process.env.DESKTOP_LESSONS?data.lessons.filter(l=>process.env.DESKTOP_LESSONS.split(',').includes(l.lessonId)):data.lessons;
 for(const lesson of selected){
  const id=lesson.lessonId;console.log('Desktop mathematical path '+id);
  await page.setViewportSize({width:1440,height:900});await page.goto(base+'/?lesson='+id);await page.locator('.child-classroom').waitFor();
  const screenshots={story:await shot(id,'story',1440)};await stage(1);await page.locator('.prediction-cards button').last().click();screenshots.prediction=await shot(id,'prediction',1440);
  await stage(2);await page.locator('.classroom-stage svg,.classroom-stage [role=img],.classroom-stage .core-relation-table,.classroom-stage .core-nested-boxes,.classroom-stage .lunchboxes,.classroom-stage .hands-on,.classroom-stage .textbook-workbench,.classroom-stage .operation-extension-lab').first().waitFor();screenshots.initial=await shot(id,'experiment-initial',1440);
  const result=await operateDesktop(page,lesson);assert(await page.locator('.textbook-board g[role=button]:focus>text').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).stroke==='none')),'选中区间的文字被焦点描边遮挡 '+id);screenshots.operated=await shot(id,result.mathBehavior==='static-relation-verified'?'static-relation':'operated',1440);
  const widths=[];
  for(const [width,height] of [[1366,768],[1440,900],[1920,1080]]){await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'桌面横向溢出 '+id+' '+width);widths.push({width,height,actionsPerformed:result.actionsPerformed.length,screenshot:width===1440?screenshots.operated:await shot(id,'operated',width)});}
  await page.setViewportSize({width:1440,height:900});await stage(3);assert(await page.locator('.retell-task').innerText()===lesson.childClassroom.whyQuestion,'因果追问错配 '+id);screenshots.why=await shot(id,'why',1440);
  await stage(4);assert(await page.getByRole('heading',{name:'原故事的数学表达',exact:true}).count()===1,'原故事范围缺失');screenshots.symbols=await shot(id,'symbols',1440);
  await stage(5);assert(!await page.locator('.parent-task-preview').getAttribute('open'),'练习目录默认展开');assert(await page.locator('.parent-task-preview li').count()>=3,'练习入口题数不足');screenshots.verify=await shot(id,'verify',1440);
  rows.push({lessonId:id,title:lesson.title,unitId:lesson.textbookUnit?.id??'foundation-bridge',...result,screenshots,widths,result:'pass',contentFingerprint:fingerprints.get(id)});
 }
 assert(rows.length===selected.length,'入口统计错误');if(!process.env.DESKTOP_LESSONS)assert(rows.length===70&&rows.filter(r=>r.mathBehavior==='static-relation-verified').length===6,'入口/静态统计错误');assert(!errors.length,errors.join('\n'));
 // Real Chromium browser zoom preference (not font injection, CSS zoom or pinch).
 // CDP page scale is explicitly NOT used: it is pinch zoom, not browser zoom.
 const desktopZoom={status:'separate-suite',script:'scripts/verify-desktop-zoom-browser.js',method:'native Chromium profile HostZoomMap preferences, not CSS font injection or pinch'};
 return {passed:true,rows,opened:rows.length,fullMathPaths:rows.filter(r=>r.mathBehavior==='full-path-verified').length,staticRelations:rows.filter(r=>r.mathBehavior==='static-relation-verified').length,desktopWidths:[1366,1440,1920],desktopZoom,realLearnerData:false,errors};
}
