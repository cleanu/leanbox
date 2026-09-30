import "server-only";
import { headers } from "next/headers";

/**
 * Basic fixed-window IP throttle for auth actions. In-memory, so it only
 * protects a single server instance — on serverless / multi-instance hosting
 * swap this for Upstash Ratelimit or similar. Supabase Auth also enforces
 * its own rate limits (Auth → Rate Limits in the dashboard).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function rateLimit(action: string, { limit = 10, windowMs = 60_000 } = {}): Promise<boolean> {
  const key = `${action}:${await clientIp()}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5_000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
