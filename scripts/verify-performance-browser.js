async (page) => {
  const base = new URL(page.url()).origin, browser = page.context().browser(), samples=[];
  for(const profile of [{name:'desktop',width:1440,height:1000,cpu:1},{name:'mobile-width-cpu4',width:390,height:844,cpu:4}]){
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height}}), cold=await context.newPage(), cdp=await context.newCDPSession(cold);
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});
    for(const target of [{name:'map',path:'/?view=map',selector:'.textbook-unit-map'},{name:'core-classroom',path:'/?lesson=G3-U04-B03',selector:'.core-workbench'}]){
      const started=Date.now();await cold.goto(base+target.path);await cold.locator(target.selector).waitFor();
      samples.push({profile:profile.name,target:target.name,uiReadyMs:Date.now()-started,...await cold.evaluate(()=>({domContentLoadedMs:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),transferredBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.transferSize,0)}))});
    }
    await context.close();
  }
  return {passed:true,method:'One local sample per view. Cold map then first classroom, separate browser cache per profile. 4x CPU is a simulation, not a real phone benchmark; no speed threshold asserted.',samples};
}
