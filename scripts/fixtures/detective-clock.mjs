// Browser fixtures advance the inbox timer without crossing an unrelated daily
// plan boundary. Production daily plans use UTC+8, regardless of the host zone.
export function sameDayNoon(now) {
  if (!Number.isFinite(now)) throw new Error('Invalid fixture clock');
  const day = 86400000, zone = 8 * 3600000;
  return Math.floor((now + zone) / day) * day - zone + 12 * 3600000;
}
