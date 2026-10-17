async (page) => {
  const base = new URL(page.url()).origin,
    assert = (v, m) => {
      if (!v) throw Error(m);
    },
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const open = async (id) => {
    await page.goto(base + "/?view=map&thinking=" + id);
    await page.locator(".thinking-panel").waitFor();
    const openModel=page.getByRole("button",{name:"打开教具探索（会记录模型验证）",exact:true});
    if(await openModel.count())await openModel.click();
    const lab = page.locator(".thinking-tool");
    await lab.waitFor();
    return lab;
  };
  // Wait for the saved revision to reach the rendered page. A fixed 120ms delay
  // can read the preceding (tilted) state on a busy CI runner after undo.
  const savedAction = async action => {
    const responsePromise = page.waitForResponse(r => new URL(r.url()).pathname === "/api/studio/thinking" && r.request().method() === "POST");
    await action();
    const response = await responsePromise;
    assert(response.ok(), "教具保存失败：" + response.status());
    const out = await response.json();
    await page.locator(".thinking-evidence").filter({hasText: `已借助模型验证 ${out.result.record.scaffold.validationAttempts} 次`}).waitFor();
  };
  const click = async (lab, name) => savedAction(() => lab.getByRole("button", { name, exact: true }).click());
  const mobileShot=async(lab,name)=>{
    await page.setViewportSize({width:390,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+"手机溢出");
    await lab.screenshot({path:`output/playwright/v2-audit/thinking-${name}-390.png`,style:'.sidebar{display:none!important}'});
    await page.setViewportSize({width:1440,height:1000});
  };
  let lab = await open("G3-UP01-TH1");
  await click(lab, "两边各拿走1盒");
  await click(lab, "两边各拿走1盒");
  await click(lab, "两边各拿走20克");
  assert(
    (await lab.getByRole("status").innerText()).includes("仍平衡"),
    "等量操作不平衡",
  );
  await click(lab, "试错：只拿走左边1盒");
  assert(
    (await lab.getByRole("status").innerText()).includes("倾斜"),
    "单边操作假平衡",
  );
  await click(lab, "撤销教具操作");
  assert(
    (await lab.getByRole("status").innerText()).includes("仍平衡"),
    "撤销未恢复平衡",
  );
  assert(await lab.locator('[data-weight-grams="10"]').count()===15,"15个10克小砝码必须对应右侧150克");
  await lab.screenshot({
    path: "output/playwright/v2-audit/thinking-balance-1440.png",
  });
  await mobileShot(lab,"balance");
  await page.reload();
  await lab.waitFor();
  const data = await (await page.request.get(base + "/api/data")).json();
  assert(
    JSON.stringify(data.progress.studio.thinking["G3-UP01-TH1"].tool.values) ===
      "[1,0,0,150]",
    "天平刷新不一致",
  );
  lab = await open("G3-U01-TH1");
  await savedAction(() => lab.getByLabel("前左堆高").selectOption("2"));
  await click(lab, "斜上方");
  await page.waitForTimeout(700);
  assert(
    (await lab.locator('[data-renderer="lit-solid"]').count()) === 1,
    "没有真实立体渲染",
  );
  assert(
    (await lab.getByRole("status").innerText()).includes("两幅图都符合"),
    "多视角条件判错",
  );
  await lab.screenshot({path:"output/playwright/v2-audit/thinking-views-isometric-1440.png"});
  await mobileShot(lab,"views-isometric");
  await savedAction(() => lab.getByLabel("后左堆高").selectOption("2"));
  assert(
    (await lab.getByRole("status").innerText()).includes("还不满足"),
    "错误候选未排除",
  );
  await click(lab, "右侧");
  await page.waitForTimeout(700);
  await lab.screenshot({
    path: "output/playwright/v2-audit/thinking-views-1440.png",
  });
  lab = await open("G3-L07-TH1");
  const zones = lab.locator(".thinking-venn-zones article");
  let person = 0;
  for (const [zone, count] of [
    [0, 6],
    [1, 6],
    [2, 4],
    [3, 4],
  ])
    for (let n = 0; n < count; n++) {
      await lab
        .locator(".thinking-name-bank")
        .getByRole("button", { name: "人" + (person + 1), exact: true })
        .click();
      await savedAction(() => zones
        .nth(zone)
        .getByRole("button", {
          name: "把人" + (person + 1) + "放这里",
          exact: true,
        })
        .click());
      person++;
    }
  assert(
    (await lab.getByRole("status").innerText()).includes("符合全部人数条件"),
    "四区验算错误",
  );
  const before = await (await page.request.get(base + "/api/data")).json();
  await page.reload();
  await lab.waitFor();
  const after = await (await page.request.get(base + "/api/data")).json();
  assert(
    JSON.stringify(after.progress.studio.thinking["G3-L07-TH1"].tool) ===
      JSON.stringify(before.progress.studio.thinking["G3-L07-TH1"].tool),
    "Venn刷新不一致",
  );
  await lab.screenshot({
    path: "output/playwright/v2-audit/thinking-venn-1440.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "思维教具手机溢出",
  );
  await lab.screenshot({
    path: "output/playwright/v2-audit/thinking-venn-390.png",
    style:".sidebar{display:none!important}",
  });
  assert(after.progress.wallet.coins === 0, "教具操作错误发积分");
  assert(errors.length === 0, JSON.stringify(errors));
  return {
    passed: true,
    balance: true,
    oneSidedError: true,
    undo: true,
    solidViews: true,
    candidateRejection: true,
    venn: true,
    refresh: true,
    reward: 0,
    errors,
  };
};
