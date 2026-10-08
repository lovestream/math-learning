async (page) => {
  const base = new URL(page.url()).origin,
    data = await (await page.request.get(base + "/api/data")).json(),
    rows = data.articleCourses.filter((l) =>
      l.conceptScenes?.some((s) => s.textbookSpec?.cases),
    ),
    checked = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400)
      errors.push(r.status() + " " + r.url());
  });
  const assert = (v, m) => {
      if (!v) throw Error(m);
    },
    click = async (lab, name) =>
      lab.getByRole("button", { name, exact: true }).click();
  assert(rows.length === 11, "缺计算核心教具");
  for (const lesson of rows) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/?lesson=" + lesson.lessonId);
    const lab = page.locator(".core-workbench");
    await lab.waitFor();
    const model = lesson.conceptScenes[0].textbookSpec;
    for (const choice of [0, 5]) {
      await lab
        .getByRole("combobox", { name: "选择练习情境" })
        .selectOption(String(choice));
      const c = model.cases[choice],
        context = model.contexts[choice];
      if (model.type === "product-place") {
        for (let n = 0; n < c[1]; n++) await click(lab, "再放入一组");
        const amounts = (
          await lab.locator(".core-place-columns strong").allTextContents()
        ).map(Number);
        assert(
          amounts.reduce((sum, n, i) => sum + n * [1000, 100, 10, 1][i], 0) ===
            c[0] * c[1],
          "逐组乘法总量不对",
        );
        const names = ["千", "百", "十", "一"];
        for (let i = 3; i >= 1; i--) {
          for (let tries = 0; tries < 12; tries++) {
            const amount = Number(
              await lab
                .locator(".core-place-columns article")
                .nth(i)
                .locator("strong")
                .innerText(),
            );
            if (amount < 10) break;
            await click(lab, `捆10个${names[i]} → 1个${names[i - 1]}`);
          }
        }
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            `${c[0]}×${c[1]}=${c[0] * c[1]}`,
          ),
          "进位后错误",
        );
        await click(lab, "捆10个一 → 1个十");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不够10",
          ),
          "无效进位未拦截",
        );
      } else if (model.type === "share-place") {
        // Greedy place-value division, including thousands and empty tens.
        const names = ["千", "百", "十", "一"],
          groups = lab.locator(".core-share-groups article");
        for (let i = 0; i < 4; i++) {
          const amount = Number(
              await lab
                .locator(".core-place-columns article")
                .nth(i)
                .locator("strong")
                .innerText(),
            ),
            each = Math.floor(amount / c[1]);
          for (let g = 0; g < c[1]; g++)
            for (let k = 0; k < each; k++)
              await groups
                .nth(g)
                .getByRole("button", { name: "分1个" + names[i], exact: true })
                .click();
          if (i < 3) {
            const left = Number(
              await lab
                .locator(".core-place-columns article")
                .nth(i)
                .locator("strong")
                .innerText(),
            );
            for (let k = 0; k < left; k++)
              await click(lab, `拆1个${names[i]} → 10个${names[i + 1]}`);
          }
        }
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "每组都是" + c[0] / c[1],
          ),
          "不能完全平均分",
        );
        const unit = (c[0] / c[1]) % 10 ? "一" : "十";
        await groups
          .first()
          .getByRole("button", { name: "退回1个" + unit, exact: true })
          .click();
        await groups
          .nth(1)
          .getByRole("button", { name: "分1个" + unit, exact: true })
          .click();
        assert(
          !(await lab.locator(".textbook-feedback").innerText()).includes(
            "每组都是",
          ),
          "分错也完成",
        );
        await click(lab, "撤销上次操作");
      } else if (model.type === "pack-remainder") {
        await click(lab, "检验余数");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不能算完成",
          ),
          "余数大却通过",
        );
        for (let n = 0; n < Math.floor(c[0] / c[1]); n++)
          await click(lab, context.kind==='strip'?'剪出一完整段':'装一满袋');
        await click(lab, context.kind==='strip'?'剪出一完整段':'装一满袋');
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不够做",
          ),
          "袋外数量不拦截",
        );
        await click(lab, context.kind==='strip'?'拼回一段':'拆回一袋');
        await click(lab, "检验余数");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不能算完成",
          ),
          "撤袋后大余数被允许",
        );
      } else if (model.type === "fraction-core") {
        if (model.mode === "add") {
          for (let n = 1; n <= c[1] + c[2]; n++)
            await click(lab, "选择第" + n + "份");
          assert(
            (await lab.locator(".textbook-feedback").innerText()).includes(
              `合计${c[1] + c[2]}/${c[0]}`,
            ),
            "分数加法状态错误",
          );
          await click(lab, "放回第2次取出的1份");
          assert((await lab.locator(".textbook-feedback").innerText()).includes(`＝${c[1]+c[2]-1}/${c[0]}`),"放回一小份没有减少相同计量单位");
          await click(lab,"选择第"+(c[1]+c[2])+"份");
        } else {
          for (let n = 1; n <= c[2]; n++) await click(lab, "选择第" + n + "份");
          assert(
            (await lab.locator(".textbook-feedback").innerText()).includes(
              `共${(c[0] / c[1]) * c[2]}${context.unit}`,
            ),
            "分数实际量错误",
          );
        }
        await click(lab, "选择第1份");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不能再重复取",
          ),
          "重复取份没拦截",
        );
        await click(lab, "撤销上次操作");
      } else if (model.type === "estimate-product") {
        await click(lab, "把人数估成" + c[3]);
        await click(lab, "把人数估成" + c[4]);
        await click(lab, "精算后检验预算");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "=" + c[0] * c[1] + "元",
          ),
          "估算费用不同数据源",
        );
      } else if (model.type === "nested-groups") {
        await click(lab, `登记第1${context.outer}第1${context.inner}`);
        await click(lab, `登记第1${context.outer}第1${context.inner}`);
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不要重复",
          ),
          "同一盒重复",
        );
        await click(lab, "撤销上次操作");
        await click(lab, `登记第2${context.outer}第1${context.inner}`);
        await click(lab, `反过来：按${context.outer}、${context.inner}分回去`);
      } else if (model.type === "invariant-table") {
        await click(lab, "总量不变");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "总价会随数量变化",
          ),
          "归一归总没区分",
        );
        await click(lab, "每份数量不变");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "=" + (c[1] / c[0]) * c[2] + "元",
          ),
          "单价不变费用不对",
        );
        await click(lab, "重新分装：总量不变");
        await click(lab, "总量不变");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "=" + (c[3] * c[0]) / c[4] + context.outer,
          ),
          "总量不变分箱不对",
        );
      }
    }
    await page.waitForTimeout(950);
    const out = await (await page.request.get(base + "/api/data")).json(),
      state = Object.values(
        out.progress.studio.reading[lesson.lessonId]?.widgets ?? {},
      ).find((s) => s.stateKind === "textbook");
    assert(state?.actions?.length > 0, "没有保存核心操作");
    await page.reload();
    await lab.waitFor();
    const reloaded = await (await page.request.get(base + "/api/data")).json();
    assert(
      JSON.stringify(
        Object.values(
          reloaded.progress.studio.reading[lesson.lessonId].widgets,
        ).find((s) => s.stateKind === "textbook"),
      ) === JSON.stringify(state),
      "刷新不一致",
    );
    await lab.screenshot({
      path: `output/playwright/v2-audit/core-${lesson.lessonId}-1440.png`,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "390宽溢出 " + lesson.lessonId,
    );
    await lab.screenshot({
      path: `output/playwright/v2-audit/core-${lesson.lessonId}-390.png`,
      style:".sidebar{visibility:hidden}",
    });
    checked.push({
      id: lesson.lessonId,
      type: model.type,
      caseCount: model.cases.length,
      exercisedCases: [0, 5],
      refreshed: true,
    });
  }
  assert(errors.length === 0, JSON.stringify(errors));
  const out = await (await page.request.get(base + "/api/data")).json();
  assert(
    out.progress.wallet.coins === data.progress.wallet.coins,
    "探索错误发积分",
  );
  return { passed: true, checked, reward: 0, errors };
};
