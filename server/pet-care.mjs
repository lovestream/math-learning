import catalog from '../content/pets/catalog.json' with { type: 'json' };

export const { pets: PETS, items: ITEMS, levels: LEVELS } = catalog;
export const petDay = now => new Date(now + 8 * 3600000).toISOString().slice(0, 10);
const ensure = (ok, message) => { if (!ok) throw new Error(message); };
const friend = (now, growth = 0) => ({ growth, bond: 0, meals: 0, joinedAt: new Date(now).toISOString(), gifts: [] });

// This one-time extension keeps existing progress, coins and original companions.
export function normalizePets(p, now = Date.now()) {
  if (p.pets.care) return p;
  const previous = p.pets.active;
  const friends = Object.fromEntries(p.pets.owned.map(key => [key, friend(now, key === previous ? p.pets.xp : 0)]));
  if (!p.pets.owned.includes('dongdong')) p.pets.owned.push('dongdong');
  friends.dongdong ??= friend(now);
  p.pets.active = 'dongdong';
  p.inventory.icecream = (p.inventory.icecream ?? 0) + 2;
  p.inventory.berry = (p.inventory.berry ?? 0) + 2;
  p.pets.care = { version: 1, friends, scene: 'meadow', decorations: p.inventory.plant ? ['plant'] : [], daily: { day: petDay(now), touches: 0, plays: 0 }, claims: [], receipts: [], memories: [] };
  remember(p, 'welcome', '咚咚羊来做你的数学伙伴啦！见面礼：冰淇淋 ×2、星莓 ×2。', now);
  return p;
}

export function ensureFriend(p, now = Date.now()) {
  normalizePets(p, now);
  return p.pets.care.friends[p.pets.active] ??= friend(now);
}

function remember(p, kind, text, now, lessonId = null) {
  p.pets.care.memories.unshift({ pet: p.pets.active, kind, text, at: new Date(now).toISOString(), lessonId });
  p.pets.care.memories = p.pets.care.memories.slice(0, 160);
}

export function growPet(p, amount, now = Date.now()) {
  ensureFriend(p, now).growth += amount;
  p.pets.xp += amount;
}

export function learningMemory(p, lesson, mode, now = Date.now()) {
  const f = ensureFriend(p, now);
  growPet(p, mode === 'learn' ? 10 : 4, now);
  f.bond += mode === 'learn' ? 3 : 2;
  remember(p, mode, mode === 'learn' ? `一起发现了「${lesson.title}」：${lesson.takeaway}` : `一起重新想明白了「${lesson.title}」。`, now, lesson.id);
}

const requestId = input => ensure(typeof input?.id === 'string' && /^[a-zA-Z0-9:_-]{1,120}$/.test(input.id), '这次互动的编号不正确，请重试。');
function repeat(p, input, action) {
  requestId(input);
  const receipt = p.pets.care.receipts.find(r => r.id === input.id);
  if (receipt) {
    ensure(receipt.action === action, '这个互动编号已用于其他操作。');
    return { ...receipt.result, duplicate: true };
  }
  return null;
}
function receipt(p, input, action, result) {
  p.pets.care.receipts.push({ id: input.id, action, result });
  // Bound backup size; the latest 20,000 interactions remain retry-safe.
  if (p.pets.care.receipts.length > 20000) p.pets.care.receipts.shift();
  return result;
}

export function applyFeed(p, input, now = Date.now()) {
  const f = ensureFriend(p, now), action = `feed:${input.item}`;
  const duplicate = repeat(p, input, action); if (duplicate) return duplicate;
  const food = ITEMS[input.item];
  ensure(food?.kind === 'food' && p.inventory[input.item] > 0, '背包里还没有这份食物，去小铺挑一份吧。');
  const favorite = PETS[p.pets.active].favorite === input.item;
  const bond = food.bond + (favorite ? 2 : 0);
  p.inventory[input.item]--; p.pets.feedCount++; f.meals++; f.bond += bond;
  growPet(p, food.growth, now);
  if (f.meals === 1 || favorite) remember(p, 'feed', favorite ? `你记住了我的最爱：${food.name}！` : `第一次一起吃${food.name}。`, now);
  return receipt(p, input, action, { ok: true, xp: food.growth, bond, favorite });
}

export function applyInteract(p, input, now = Date.now()) {
  const f = ensureFriend(p, now);
  ensure(['touch', 'play'].includes(input.action), '没有找到这个互动。');
  const action = `interact:${input.action}`, duplicate = repeat(p, input, action); if (duplicate) return duplicate;
  const care = p.pets.care;
  if (care.daily.day !== petDay(now)) care.daily = { day: petDay(now), touches: 0, plays: 0 };
  const key = input.action === 'touch' ? 'touches' : 'plays';
  const cap = input.action === 'touch' ? 3 : 1;
  const bond = care.daily[key] < cap ? (input.action === 'touch' ? 1 : 3) : 0;
  care.daily[key] = Math.min(cap, care.daily[key] + 1); f.bond += bond;
  if (input.action === 'play' && bond) remember(p, 'play', '一起玩了一次接星星。好搭档，配合成功！', now);
  return receipt(p, input, action, { ok: true, bond });
}

export function petMissions(p, courses, now = Date.now(), articleCourses = []) {
  normalizePets(p, now);
  const day = petDay(now), sameDay = iso => iso && petDay(Date.parse(iso)) === day;
  const completed = courses.filter(c => sameDay(p.lessons[c.id]?.completedAt));
  const reviewed = p.wallet.ledger.some(e => e.id.startsWith('review:') && e.amount > 0 && sameDay(e.at));
  const sessions = Object.values(p.studio?.sessions ?? {}).filter(s => sameDay(s.completedAt));
  const core = sessions.filter(s => s.setName === 'core');
  const reviewedArticle = sessions.some(s => s.setName === 'review' && s.reviewDue && s.taskIds.every(id => s.results[id]?.status === 'correct' && !s.results[id].assisted));
  return [
    { id: 'discover', name: '一起发现新知识', detail: '完成一节课的核心练习或新关卡', done: completed.length > 0 || core.length > 0, item: 'berry', amount: 2, route: 'learn' },
    { id: 'think', name: '来一次脑力探险', detail: '完成思维课的核心练习或新关卡', done: completed.some(c => c.kind === 'thinking') || core.some(s => articleCourses.some(l => l.lessonId === s.lessonId && l.track === 'olympiad')), item: 'cookie', amount: 1, route: 'thinking' },
    { id: 'review', name: '把旧发现记得更牢', detail: '完成一次到期复习', done: reviewed || reviewedArticle, item: 'icecream', amount: 1, route: 'review' }
  ].map(m => ({ ...m, claimed: p.pets.care.claims.includes(`${day}:${m.id}`) }));
}

export function applyPetReward(p, input, courses, now = Date.now(), articleCourses = []) {
  const f = ensureFriend(p, now);
  if (input.type === 'mission') {
    const mission = petMissions(p, courses, now, articleCourses).find(m => m.id === input.reward);
    ensure(mission?.done, '先完成这个学习约定，再回来领礼物吧。');
    if (mission.claimed) return { duplicate: true };
    p.pets.care.claims.push(`${petDay(now)}:${mission.id}`);
    p.inventory[mission.item] = (p.inventory[mission.item] ?? 0) + mission.amount;
    remember(p, 'gift', `${mission.name}，收到了${ITEMS[mission.item].name} ×${mission.amount}。`, now);
  } else {
    ensure(input.type === 'growth', '没有找到这份奖励。');
    const level = LEVELS.find(l => l.xp === input.reward && l.gift);
    ensure(level && f.growth >= level.xp, '还没有到这个成长阶段，一起慢慢来。');
    if (f.gifts.includes(level.xp)) return { duplicate: true };
    f.gifts.push(level.xp);
    p.inventory[level.gift] = Math.max(1, p.inventory[level.gift] ?? 0);
    remember(p, 'milestone', `我们成为了「${level.name}」！一起拆开礼物：${ITEMS[level.gift].name}。`, now);
  }
  return { ok: true };
}

export function applyHome(p, input) {
  normalizePets(p);
  if (input.scene !== undefined) {
    const required = { meadow: 0, sunset: 60, starlight: 150 };
    ensure(Object.hasOwn(required, input.scene), '没有找到这个小屋。');
    ensure(Object.values(p.pets.care.friends).some(f => f.growth >= required[input.scene]), '继续和伙伴成长，就能开启这个小屋。');
    p.pets.care.scene = input.scene;
  }
  if (input.item !== undefined) {
    ensure(ITEMS[input.item]?.kind === 'decoration' && p.inventory[input.item] > 0 && typeof input.placed === 'boolean', '先获得这件装饰，再布置小屋。');
    p.pets.care.decorations = p.pets.care.decorations.filter(x => x !== input.item);
    if (input.placed) p.pets.care.decorations.push(input.item);
  }
  return { ok: true };
}

export function validateCare(p) {
  if (p.pets.care === undefined) return;
  const c = p.pets.care, object = v => v && typeof v === 'object' && !Array.isArray(v);
  const integer = n => Number.isSafeInteger(n) && n >= 0 && n <= 1e9;
  const iso = d => typeof d === 'string' && d.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(d) && Number.isFinite(Date.parse(d));
  const safe = s => typeof s === 'string' && /^[a-zA-Z0-9:._-]{1,160}$/.test(s) && !['__proto__', 'constructor', 'prototype'].includes(s);
  const unique = a => new Set(a).size === a.length;
  const check = ok => ensure(ok, '宠物养成记录格式不正确，已取消导入。');
  check(object(c) && c.version === 1 && object(c.friends));
  check(p.pets.owned.every(k => Object.hasOwn(c.friends, k)) && Object.keys(c.friends).every(k => p.pets.owned.includes(k)));
  for (const f of Object.values(c.friends)) check(object(f) && integer(f.growth) && integer(f.bond) && integer(f.meals) && iso(f.joinedAt) && Array.isArray(f.gifts) && unique(f.gifts) && f.gifts.every(x => LEVELS.some(l => l.gift && l.xp === x) && x <= f.growth));
  check(['meadow', 'sunset', 'starlight'].includes(c.scene) && Array.isArray(c.decorations) && unique(c.decorations) && c.decorations.every(k => ITEMS[k]?.kind === 'decoration' && p.inventory[k] > 0));
  check(Object.values(c.friends).some(f => f.growth >= ({meadow:0, sunset:60, starlight:150}[c.scene])));
  check(object(c.daily) && /^\d{4}-\d{2}-\d{2}$/.test(c.daily.day) && integer(c.daily.touches) && c.daily.touches <= 3 && integer(c.daily.plays) && c.daily.plays <= 1);
  check(Array.isArray(c.claims) && c.claims.length <= 50000 && unique(c.claims) && c.claims.every(k => /^\d{4}-\d{2}-\d{2}:(discover|think|review)$/.test(k)));
  check(Array.isArray(c.receipts) && c.receipts.length <= 20000 && unique(c.receipts.map(r => r?.id)));
  for (const r of c.receipts) check(object(r) && safe(r.id) && /^(feed:(berry|cookie|icecream|honeytoast)|interact:(touch|play))$/.test(r.action) && object(r.result) && r.result.ok === true && integer(r.result.bond) && (r.result.xp === undefined || integer(r.result.xp)) && (r.result.favorite === undefined || typeof r.result.favorite === 'boolean'));
  check(Array.isArray(c.memories) && c.memories.length <= 160);
  for (const m of c.memories) check(object(m) && p.pets.owned.includes(m.pet) && ['welcome', 'feed', 'play', 'learn', 'review', 'gift', 'milestone', 'adopt'].includes(m.kind) && typeof m.text === 'string' && m.text.length <= 3000 && iso(m.at) && (m.lessonId === null || safe(m.lessonId)));
}
