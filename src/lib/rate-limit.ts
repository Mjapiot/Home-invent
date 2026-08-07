// Rate limit en mémoire par utilisateur — suffisant en MVP mono-instance.
// (Sur Vercel serverless chaque instance a son compteur ; garde-fou best-effort.)
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  userId: string,
  max = 30,
  windowMs = 60 * 60 * 1000
): boolean {
  const now = Date.now();
  const bucket = buckets.get(userId);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
