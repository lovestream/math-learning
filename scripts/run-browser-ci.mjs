import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
// Reuse the same checked-in browser callbacks locally and in CI. No real learner data.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";
import { createStore } from "../server/store.mjs";
import {
  applyThinking,
  applyThinkingReview,
} from "../server/thinking-store.mjs";
const all = [
  "verify-hands-on-browser",
  "verify-classroom-flow",
  "verify-motion-browser",
  "verify-lab-inventory",
  "verify-intro-visuals",
  "verify-textbook-browser",
  "verify-thinking-browser",
  "verify-division-browser",
  "verify-core-browser",
  "verify-save-stress-browser",
  "verify-thinking-tools-browser",
  "verify-performance-browser",
  "verify-evidence-browser",
  "verify-accessibility-browser",
  "verify-variants-browser",
  "verify-template-browser",
];
const only = process.argv.find((v) => v.startsWith("--only=")),
  names = only
    ? only.slice(7).split(",")
    : process.argv.includes("--full")
      ? all
      : [
          "verify-thinking-browser",
          "verify-division-browser",
          "verify-core-browser",
          "verify-save-stress-browser",
          "verify-thinking-tools-browser",
          "verify-evidence-browser",
          "verify-accessibility-browser",
          "verify-variants-browser",
          "verify-template-browser",
        ];
if (names.some((n) => !all.includes(n)))
  throw Error("Unknown browser callback");
const out = "output/playwright/v2-audit";
fs.mkdirSync(out, { recursive: true });
const summary = [];
const checkoutSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const sourceEvidence={prHeadSha:process.env.AUDIT_PR_HEAD_SHA ?? checkoutSha,sha:checkoutSha,dirty:Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()),diffHash:createHash('sha256').update(execFileSync('git',['diff','HEAD'])).digest('hex'),startedAt:new Date().toISOString()};
fs.writeFileSync(`${out}/source-evidence.json`,JSON.stringify(sourceEvidence,null,2));
let browser;
const timeout = setTimeout(() => {
  console.error("Browser audit exceeded 12 minutes");
  process.exitCode = 1;
  void browser?.close();
}, 12 * 60000);
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
  });
  for (const name of names) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kevin-browser-ci-")),
      probe = net.createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = probe.address().port;
    await new Promise((r) => probe.close(r));
    // A visibly named simulated old review allows testing the due-review UI without
    // changing production clocks, adding test APIs, or importing real Kevin records.
    if (name === "verify-thinking-browser") {
      const store = createStore(dir, []),
        now = Date.now() - 2 * 86400000,
        id = "G3-UP01-TH1";
      store.mutate((p) => {
        const send = (action, extra = {}) =>
          applyThinking(
            p,
            {
              taskId: id,
              eventId: crypto.randomUUID(),
              revision: p.studio.thinking?.[id]?.revision ?? 0,
              action,
              ...extra,
            },
            now,
          );
        send("first", {
          answer: "自动化夹具：两边同时去掉两个盒子，再去20克。",
        });
        send("check", {
          checks: [true, true, true],
          reflection: "测试夹具的等量操作核对。",
        });
        send("final", { answer: "测试夹具：一盒150克。" });
        return applyThinkingReview(
          p,
          {
            taskId: id,
            eventId: crypto.randomUUID(),
            revision: p.studio.thinking[id].revision,
            verdict: "independent-mastered",
            comment: "仅自动化测试数据，不代表Kevin掌握。",
            reviewer: "自动化测试夹具",
            causes: [],
          },
          now,
        );
      });
      store.close();
    }
    if(name === "verify-evidence-browser") {
      const store=createStore(dir,[]),start=Date.now()-60*86400000;
      store.mutate(p=>{
        const complete=(id,at)=>{
          const send=(action,extra={})=>applyThinking(p,{taskId:id,revision:p.studio.thinking?.[id]?.revision??0,eventId:crypto.randomUUID(),action,...extra},at);
          send('first',{answer:'自动化夹具：独立推理，不代表Kevin学习。'});send('check',{checks:[true,true,true],reflection:'仅测试：核对每个条件。'});send('final',{answer:'自动化夹具最终解释。'});
        };
        for(const [id,rounds,verdict] of [['G3-U02-TH1',4,'independent-mastered'],['G3-U03-TH1',4,'needs-remediation'],['G3-U06-TH1',12,'needs-remediation']]) {
          let at=start;complete(id,at);
          const grade=()=>applyThinkingReview(p,{taskId:id,revision:p.studio.thinking[id].revision,eventId:crypto.randomUUID(),verdict,comment:'自动化夹具：不代表Kevin掌握。',reviewer:'测试夹具',causes:[]},at);
          grade();
          for(let i=0;i<rounds;i++){at=Date.parse(p.studio.thinking[id].review.dueAt);applyThinking(p,{taskId:id,revision:p.studio.thinking[id].revision,eventId:crypto.randomUUID(),action:'review-start'},at);complete(id,at);grade();}
        }
      });store.close();
    }
    if(name === "verify-variants-browser") {
      const store=createStore(dir,[]),start=Date.now()-60*86400000;
      const {thinkingCards}=await import('../content/pilot/thinking-source.mjs');
      store.mutate(p=>{for(const [n,card] of thinkingCards.filter(t=>t.publicationStatus==='guided-study').entries()){
        const id=card.id,target=n%2===0?9:12;let at=start;
        const send=(action,extra={})=>applyThinking(p,{taskId:id,revision:p.studio.thinking?.[id]?.revision??0,eventId:crypto.randomUUID(),action,...extra},at);
        for(let i=0;i<target;i++){
          send('first',{answer:'自动化夹具的真实首答字段，不代表Kevin。'});send('check',{checks:[true,true,true],reflection:'自动化夹具：核对条件。'});send('final',{answer:'自动化夹具最终解释。'});
          applyThinkingReview(p,{taskId:id,revision:p.studio.thinking[id].revision,eventId:crypto.randomUUID(),verdict:'needs-remediation',comment:'仅自动化测试夹具。',reviewer:'测试夹具',causes:[]},at);
          at=Date.parse(p.studio.thinking[id].review.dueAt);send('review-start');
        }
      }});store.close();
    }
    const log = fs.createWriteStream(`${out}/${name}-server.log`),
      child = spawn(
        process.execPath,
        ["server/index.mjs", `--port=${port}`, `--data-dir=${dir}`],
        { stdio: ["ignore", "pipe", "pipe"] },
      );
    child.stdout.pipe(log);
    child.stderr.pipe(log);
    const context = await browser.newContext(),
      page = await context.newPage(),
      messages = [];
    page.on("console", (m) => messages.push(`${m.type()}: ${m.text()}`));
    page.on("pageerror", (e) => messages.push(`pageerror: ${e.stack}`));
    await page.setViewportSize({ width: 1440, height: 1000 });
    page.setDefaultTimeout(12000);
    const base = `http://127.0.0.1:${port}`;
    try {
      let ready = false;
      for (let i = 0; i < 80; i++) {
        try {
          if ((await fetch(base + "/api/data")).ok) {
            ready = true;
            break;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!ready) throw Error("Isolated server did not start");
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });
      // Legacy suites explicitly exercise the experiment. Default lesson screens
      // are separately covered for all 70 entries by verify-template-browser.
      const experimentSuites=new Set(["verify-hands-on-browser","verify-motion-browser","verify-lab-inventory","verify-textbook-browser","verify-division-browser","verify-core-browser","verify-save-stress-browser","verify-performance-browser","verify-accessibility-browser","verify-evidence-browser"]);
      if(experimentSuites.has(name)){
        const navigate=page.goto.bind(page);
        page.goto=async(url,options)=>{const result=await navigate(url,options),query=new URL(url).searchParams;if(query.has('lesson')&&!query.has('practice')){await page.locator('.lesson-article').waitFor();const step=page.getByRole('button',{name:/^3 (亲手实验|画图想一想)$/});if(await step.count())await step.click();}return result;};
      }
      await page.goto(base);
      const source=fs.readFileSync(`scripts/${name}.js`, "utf8").trim().replace(/;$/, "");
      const callback = new Function(`return (${source})`)();
      const result = await callback(page);
      if (!result?.passed) throw Error("Callback did not report success");
      summary.push({ name, ...result, source:sourceEvidence });
      fs.writeFileSync(
        `${out}/${name}.json`,
        JSON.stringify({...result,source:sourceEvidence}, null, 2) + "\n",
      );
      console.log(`${name}: passed`);
    } catch (e) {
      await page
        .screenshot({ path: `${out}/${name}-failed.png`, fullPage: true })
        .catch(() => {});
      messages.push(e.stack);
      summary.push({ name, passed: false, error: e.message });
      process.exitCode = 1;
      console.error(`${name}: ${e.message}`);
    } finally {
      fs.writeFileSync(`${out}/${name}-browser.log`, messages.join("\n"));
      await context.tracing
        .stop({ path: `${out}/${name}-trace.zip` })
        .catch(() => {});
      await context.close();
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
      log.end();
      fs.rmSync(dir, { recursive: true, force: true });
      fs.writeFileSync(
        `${out}/ci-summary.json`,
        JSON.stringify(summary, null, 2) + "\n",
      );
    }
    if (process.exitCode) break;
  }
} finally {
  clearTimeout(timeout);
  await browser?.close();
  fs.writeFileSync(
    `${out}/ci-summary.json`,
    JSON.stringify(summary, null, 2) + "\n",
  );
}
