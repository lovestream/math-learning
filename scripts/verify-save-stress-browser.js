async (page) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const base = new URL(page.url()).origin,
    assert = (v, m) => {
      if (!v) throw Error(m);
    },
    id = "G3-L01-B02";
  const get = async () => {
    const out = await (await page.request.get(base + "/api/data")).json();
    return Object.values(out.progress.studio.reading[id]?.widgets ?? {}).find(
      (s) => s.stateKind === "textbook",
    );
  };
  await page.goto(base + "/?view=map");
  await page.evaluate((id)=>{history.pushState(null,"","/?lesson="+id);window.dispatchEvent(new PopStateEvent("popstate"))},id);
  await page.locator(".lesson-article").waitFor();
  await page.getByRole("button", {name:"3 亲手实验",exact:true}).click();
  const lab = page.locator(".textbook-workbench");
  await lab.waitFor();
  await lab.getByRole("button", { name: "重新开始", exact: true }).click();
  const circle = lab.getByRole("slider", {
      name: "拖箭头尾端平移",
      exact: true,
    }),
    unused = await circle.scrollIntoViewIfNeeded(),
    rect = await circle.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(1430, 990, { steps: 65 });
  await page.mouse.up();
  await page.waitForTimeout(950);
  let state = await get();
  assert(
    state.actions.length === 1,
    "一个拖动历史数为" + state.actions.length + "，应为1",
  );
  assert(
    state.left === 530 && state.top === 240,
    "越界拖动后坐标" + state.left + "," + state.top + "，应收回530,240",
  );
  await lab.getByRole("button", { name: "撤销上次操作", exact: true }).click();
  await page.waitForTimeout(900);
  state = await get();
  assert(
    state.left === 150 && state.top === 190,
    "一次撤销没有返回整个手势起点",
  );
  for (let n = 0; n < 44; n++)
    await lab.getByRole("button", { name: "绕尾端转90°", exact: true }).click();
  await page.waitForTimeout(950);
  state = await get();
  assert(
    state.rotation === 0 && state.actions.length === 30,
    "快速长操作的状态或历史上限不正确",
  );
  const snapshot = JSON.stringify(state),
    envelope = await (await page.request.get(base + "/api/export")).json();
  assert(!("parentAccess" in envelope.progress), "导出泄漏家长凭据");
  const imported = await page.request.post(base + "/api/import", {
    data: envelope,
  });
  assert(imported.ok(), "长操作导入失败");
  await page.reload();
  await lab.waitFor();
  assert(JSON.stringify(await get()) === snapshot, "长操作导入刷新不一致");
  const second = await page.context().newPage();
  await second.goto(base + "/?lesson=" + id);
  await second.locator(".lesson-article").waitFor();
  await second.getByRole("button", {name:"3 亲手实验",exact:true}).click();
  const other = second.locator(".textbook-workbench");
  await other.waitFor();
  await lab.getByRole("button", { name: "向右平移两格", exact: true }).click();
  await page.waitForTimeout(900);
  await other
    .getByRole("button", { name: "向右平移两格", exact: true })
    .click();
  await second.waitForTimeout(950);
  assert(
    (await second.locator(".studio-breadcrumb").innerText()).includes(
      "另一页面已更新",
    ),
    "多标签页冲突没有清楚恢复提示",
  );
  await second
    .getByRole("button", { name: "返回学习地图", exact: true })
    .click();
  assert(
    (await second.locator(".lesson-article").count()) === 1,
    "保存失败仍然离开课程",
  );
  await second
    .getByRole("button", {
      name: "载入其他页面的最新操作（替换本页操作）",
      exact: true,
    })
    .click();
  await second.waitForTimeout(200);
  assert(
    (await second.locator(".studio-breadcrumb").innerText()).includes("已载入"),
    "载入最新操作失败",
  );
  await second.close();
  await page.context().setOffline(true);
  await lab.getByRole("button", { name: "绕尾端转90°", exact: true }).click();
  await page.waitForTimeout(1000);
  assert(
    (await page.locator(".studio-breadcrumb").innerText()).includes("暂未保存"),
    "断网却提示保存成功",
  );
  await page.getByRole("button", { name: "返回学习地图", exact: true }).click();
  assert(
    (await page.locator(".lesson-article").count()) === 1,
    "断网保存失败后仍离开",
  );
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "家长中心", exact: true })
    .click();
  assert(
    (await page.locator(".lesson-article").count()) === 1,
    "侧栏绕过保存失败保护",
  );
  await page.goBack();
  await page.waitForTimeout(500);
  assert((await page.locator(".lesson-article").count())===1 && new URL(page.url()).searchParams.get("lesson")===id,"浏览器后退绕过保存保护");
  await page.context().setOffline(false);
  await page.getByRole("button", { name: "重试保存", exact: true }).click();
  await page.waitForTimeout(400);
  assert(
    (await page.locator(".studio-breadcrumb").innerText()).includes(
      "操作已保存",
    ),
    "断网恢复重试失败",
  );
  await lab.screenshot({
    path: "output/playwright/v2-audit/save-stress-1440.png",
  });
  return {
    passed: true,
    pointerMoves: 65,
    gestureHistory: 1,
    operations: 44,
    historyBound: 30,
    multiTabConflict: true,
    offlineRetry: true,
    navigationBlockedOnFailure: true,
    browserBackBlockedOnFailure: true,
    importExport: true,
  };
};
