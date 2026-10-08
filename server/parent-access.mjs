import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
const deny = (message) => {
  throw Object.assign(new Error(message), {
    status: 403,
    code: "PARENT_ACCESS_REQUIRED",
  });
};
export function createParentAccess(dataDir) {
  const file = path.join(dataDir, "parent-access.json"),
    sessions = new Map(),
    attempts = new Map();
  const configured = () => fs.existsSync(file);
  const session = (req) => {
    const token = (req.headers.cookie ?? "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("kevin_parent="))
      ?.slice(13);
    const item = sessions.get(token);
    if (!item || item.expires <= Date.now()) {
      sessions.delete(token);
      return null;
    }
    return token;
  };
  const requireParent = (req) => {
    if (!session(req)) deny("请先在家长中心解锁批阅工作台。");
  };
  const unlock = (req, pin, setup = false) => {
    const key = req.socket?.remoteAddress ?? "local",
      now = Date.now(),
      recent = (attempts.get(key) ?? []).filter((t) => now - t < 60000);
    if (recent.length >= 5) deny("尝试过于频繁，请一分钟后重试。");
    attempts.set(key, [...recent, now]);
    if (typeof pin !== "string" || !/^\d{6,12}$/.test(pin))
      deny("请使用6到12位数字家长密码。");
    if (setup) {
      if (configured()) deny("已有家长密码，请使用解锁。");
      const salt = randomBytes(16).toString("hex");
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(
        file,
        JSON.stringify({
          salt,
          hash: scryptSync(pin, salt, 32).toString("hex"),
        }),
        { flag: "wx", mode: 0o600 },
      );
    } else {
      if (!configured()) deny("请由家长先设置批阅密码。");
      const stored = JSON.parse(fs.readFileSync(file, "utf8"));
      if (
        !timingSafeEqual(
          scryptSync(pin, stored.salt, 32),
          Buffer.from(stored.hash, "hex"),
        )
      )
        deny("家长密码不正确。");
    }
    // Only one parent session remains active. The local credential is never exported as learning data.
    sessions.clear();
    const token = randomBytes(32).toString("hex");
    sessions.set(token, { expires: now + 30 * 60000 });
    attempts.delete(key);
    return `kevin_parent=${token}; HttpOnly; SameSite=Strict; Path=/api/parent; Max-Age=1800`;
  };
  return {
    configured,
    requireParent,
    unlock,
    status: (req) => ({ configured: configured(), unlocked: !!session(req) }),
    lock: (req) => {
      sessions.delete(session(req));
      return "kevin_parent=; HttpOnly; SameSite=Strict; Path=/api/parent; Max-Age=0";
    },
  };
}
export function assertLocalWrite(req) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
  const fail = () => deny("写入请求必须来自当前本地网页。");
  if (req.headers["sec-fetch-site"] === "cross-site") fail();
  if (
    req.headers.origin !== undefined &&
    req.headers.origin !== `http://${req.headers.host}`
  )
    fail();
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] ?? ""))
    fail();
}
