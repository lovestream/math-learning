async page=>{
 const {chromium}=await import('playwright'),fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
 const base=new URL(page.url()).origin,results=[],assert=(ok,m)=>{if(!ok)throw Error(m)};
 const ids=['G3-U01-B01','G3-U02-B03','G3-U03-E02','G3-UP01-B02','G3-U04-B03','G3-UP02-B01','G3-U05-B02','G3-U06-B03','G3-U07-B01','G3-L01-B01','G3-L02-B03','G3-L03-E01','G3-L04-B03','G3-L05-B02','G3-LP01-B02','G3-L06-B01','G3-L07-B01','G3-U02-E03','G3-U02-E02','G3-U02-O01','G3-U04-B05','G3-U07-R01','G3-L02-B05','G3-L02-B06','G3-L06-B03','G3-L07-R01'];
 // Chromium HostZoomMap uses this native profile preference. Empty default
 // storage-partition path has key "x". No user profile is read or modified.
 // https://github.com/chromium/chromium/blob/main/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc
 for(const zoom of [1.25,1.5,2]){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kevin-native-zoom-'));fs.mkdirSync(dir+'/Default');fs.writeFileSync(dir+'/Default/Preferences',JSON.stringify({partition:{default_zoom_level:{x:Math.log(zoom)/Math.log(1.2)}}}));let context;
  try{context=await chromium.launchPersistentContext(dir,{headless:true,viewport:null,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),args:['--window-size=1440,900','--force-device-scale-factor=1']});const p=await context.newPage();await p.emulateMedia({reducedMotion:'reduce'});
   for(const id of ids){await p.goto(base+'/?lesson='+id);await p.locator('.child-classroom').waitFor();
    const measured=await p.evaluate(()=>({dpr:devicePixelRatio,inner:innerWidth,outer:outerWidth,pinch:visualViewport.scale}));assert(Math.abs(measured.dpr-zoom)<.02&&Math.abs(measured.inner*zoom-1440)<3&&measured.pinch===1,'没有真正启用浏览器缩放 '+JSON.stringify(measured));
    for(let step=0;step<6;step++){await p.locator('.classroom-route button').nth(step).click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'浏览器缩放溢出 '+id+' '+zoom+' '+step);if(step===0||step===2)await p.locator('.classroom-stage').screenshot({path:`output/playwright/v2-audit/native-zoom-${id}-${zoom*100}-${step}.png`});}
    await p.locator('.classroom-route button').nth(1).click();await p.locator('.optional-thought input').focus();await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.activeElement?.tagName==='BUTTON'),'键盘Tab没有到操作按钮');await p.keyboard.press('Escape');
    if(id==='G3-U01-B01'){await p.locator('.classroom-route button').nth(2).click();const svg=p.locator('.solid-viewport');await svg.scrollIntoViewIfNeeded();const before=await svg.locator('[data-face="3"]').getAttribute('points'),box=await svg.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+60,box.y+box.height/2-25,{steps:6});await p.mouse.up();assert(before!==await svg.locator('[data-face="3"]').getAttribute('points'),'缩放后鼠标旋转失效');}
    results.push({id,zoom,measured,sixStages:true,tabAndEscape:true});
   }
  }finally{await context?.close();fs.rmSync(dir,{recursive:true,force:true});}
 }
 return {passed:true,method:'native Chromium HostZoomMap preference in isolated profile; measured devicePixelRatio and layout viewport, pinch scale remains 1',results,realLearnerData:false};
}
