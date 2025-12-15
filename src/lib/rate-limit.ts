type Bucket = {
  count: number;
  expiresAt: number;
};

const store = new Map<string, Bucket>();

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
const max = Number(process.env.RATE_LIMIT_MAX ?? 10);

export function checkRateLimit(key: string) {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.expiresAt < now) {
    store.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) {
    return false;
  }
  bucket.count += 1;
  store.set(key, bucket);
  return true;
}
