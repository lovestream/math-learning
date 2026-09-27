// All drawing coordinates and explanations are derived from these millimetre models.
export function boundedInteger(value, fallback, min, max) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}
const positive = (n, name) => { if (!Number.isFinite(n) || n <= 0) throw new Error(`${name}必须是正数`); };

export function chainMeasure(lengthMm, thicknessMm, count) {
  positive(lengthMm, '外长'); positive(thicknessMm, '厚度');
  if (!Number.isInteger(count) || count < 1 || count > 20 || 2 * thicknessMm >= lengthMm) throw new Error('链环条件无效');
  const overlapMm = 2 * thicknessMm, addedMm = lengthMm - overlapMm;
  const starts = Array.from({length: count}, (_, i) => i * addedMm);
  return {lengthMm, thicknessMm, count, overlapMm, addedMm, starts,
    joints: starts.slice(1).map(start => ({start, end: start + overlapMm})),
    totalMm: lengthMm + (count - 1) * addedMm};
}

export function boardMeasure(lengths, overlaps) {
  if (!lengths.length || overlaps.length !== lengths.length - 1) throw new Error('接头数与木板数不匹配');
  lengths.forEach(n => positive(n, '木板长度'));
  overlaps.forEach((n, i) => {
    if (!Number.isFinite(n) || n < 0 || n >= Math.min(lengths[i], lengths[i + 1])) throw new Error('重叠长度无效');
  });
  const starts = [0];
  for (let i = 1; i < lengths.length; i++) starts.push(starts[i - 1] + lengths[i - 1] - overlaps[i - 1]);
  for (let i = 2; i < lengths.length; i++) if (starts[i] < starts[i - 2] + lengths[i - 2]) throw new Error('这个模型不允许三重重叠');
  const materialMm = lengths.reduce((a, b) => a + b, 0), repeatedMm = overlaps.reduce((a, b) => a + b, 0);
  return {starts, materialMm, repeatedMm, totalMm: materialMm - repeatedMm,
    joints: overlaps.map((n, i) => ({start: starts[i + 1], end: starts[i + 1] + n}))};
}

export function rulerReading(startMm, lengthMm) {
  if (!Number.isFinite(startMm) || startMm < 0) throw new Error('起点无效');
  positive(lengthMm, '物体长度');
  return {startMm, endMm: startMm + lengthMm, lengthMm};
}

export function intervalMeasure(lengthMm, spacingMm, closed) {
  positive(lengthMm, '总长'); positive(spacingMm, '间距');
  const segments = lengthMm / spacingMm;
  if (!Number.isInteger(segments) || segments > 100) throw new Error('总长必须包含整数个间隔');
  return {segments, points: segments + (closed ? 0 : 1)};
}

export const routePath = Array.from({length: 81}, (_, i) => {
  const t = i / 80;
  return {x: 70 + 620 * t, y: 155 - 53 * Math.sin(t * Math.PI * 2) - 28 * t};
});
// Markers and the traveller use the same polyline as the visible road.
export function pointOnRoute(fraction) {
  const target = Math.max(0, Math.min(1, fraction));
  const distances = routePath.slice(1).map((p, i) => Math.hypot(p.x - routePath[i].x, p.y - routePath[i].y));
  let remaining = target * distances.reduce((a, b) => a + b, 0);
  for (let i = 0; i < distances.length; i++) {
    if (remaining <= distances[i]) {
      const f = remaining / distances[i], a = routePath[i], b = routePath[i + 1];
      return {x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f};
    }
    remaining -= distances[i];
  }
  return routePath.at(-1);
}

export function validateLengthScene(scene) {
  let expected;
  if (scene.mode === 'chain') expected = chainMeasure(scene.pieceLengthsMm[0], scene.thicknessMm, scene.count).totalMm;
  else if (scene.mode === 'boards') expected = boardMeasure(scene.pieceLengthsMm, scene.overlapsMm).totalMm;
  else if (scene.mode === 'ruler') expected = rulerReading(scene.startMm, scene.endMm - scene.startMm).lengthMm;
  else if (scene.mode === 'route' || scene.mode === 'interval') {
    expected = scene.endMm - scene.startMm;
    intervalMeasure(expected, scene.spacingMm, Boolean(scene.closed));
  } else throw new Error('未注册的测量场景');
  if (scene.expectedMm !== undefined && expected !== scene.expectedMm) throw new Error(`${scene.sceneId} 的图与预期长度不一致`);
  return expected;
}
