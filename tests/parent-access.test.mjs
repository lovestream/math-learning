import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createParentAccess,
  assertLocalWrite,
} from "../server/parent-access.mjs";
test("家长资料需要解锁，密码哈希与会话不进入进度，退出与重启锁定", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kevin-parent-test-"));
  try {
    const access = createParentAccess(dir),
      req = { headers: {}, socket: { remoteAddress: "test" } };
    assert.throws(() => access.requireParent(req), /解锁/);
    assert.throws(() => access.unlock(req, "123"), /6到12/);
    const cookie = access.unlock(req, "912345", true);
    const unlocked = { ...req, headers: { cookie: cookie.split(";")[0] } };
    assert(access.status(unlocked).unlocked);
    assert.doesNotThrow(() => access.requireParent(unlocked));
    assert.match(cookie, /HttpOnly; SameSite=Strict/);
    assert(
      !fs
        .readFileSync(path.join(dir, "parent-access.json"), "utf8")
        .includes("912345"),
    );
    assert(!createParentAccess(dir).status(unlocked).unlocked);
    access.lock(unlocked);
    assert.throws(() => access.requireParent(unlocked));
    assert.throws(() => access.unlock(req, "912345", true), /已有/);
    assert.throws(() => access.unlock(req, "000000"), /不正确/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test("所有本地JSON写入要求同源，拒绝恶意来源、null源、跨站与表单写入", () => {
  const good = {
    method: "POST",
    headers: {
      host: "127.0.0.1:4177",
      origin: "http://127.0.0.1:4177",
      "content-type": "application/json",
    },
  };
  assert.doesNotThrow(() => assertLocalWrite(good));
  assert.doesNotThrow(() =>
    assertLocalWrite({
      method: "POST",
      headers: { host: "localhost:4177", "content-type": "application/json" },
    }),
  );
  for (const origin of [
    "https://evil.example",
    "null",
    "http://127.0.0.1:9999",
    "http://localhost:4177",
  ])
    assert.throws(() =>
      assertLocalWrite({ ...good, headers: { ...good.headers, origin } }),
    );
  assert.throws(() =>
    assertLocalWrite({
      ...good,
      headers: { ...good.headers, "sec-fetch-site": "cross-site" },
    }),
  );
  assert.throws(() =>
    assertLocalWrite({
      ...good,
      headers: { ...good.headers, "content-type": "text/plain" },
    }),
  );
  assert.throws(() =>
    assertLocalWrite({
      ...good,
      headers: {
        ...good.headers,
        "content-type": "application/x-www-form-urlencoded",
      },
    }),
  );
  assert.doesNotThrow(() => assertLocalWrite({ ...good, method: "GET" }));
});
