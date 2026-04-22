import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Singleton Anthropic SDK client. Reads ANTHROPIC_API_KEY from env at import time.
 * Consumers never import this directly — they import the helpers below.
 */
export const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Cache-eligible text block for the student's pasted material. The first request in a
 * 5-minute window writes the cache at 1.25× input cost; subsequent requests within the
 * window read it at 0.1×. Used by generate-cards, classify-error, and chat so they can
 * share one cache entry per deck.
 */
export function materialBlock(material: string) {
  return {
    type: "text" as const,
    text: material,
    cache_control: { type: "ephemeral" as const },
  };
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Per-IP in-memory rate limiter. Returns true if the request is allowed, false if
 * over the limit for the current window. State is lost on serverless cold starts —
 * this is "good enough for v0"; swap for Vercel KV or Upstash past ~1k DAU.
 */
export function rateLimit(ip: string, opts: { max: number; windowMs: number }): boolean {
  const now = Date.now();
  const existing = buckets.get(ip);
  const bucket: Bucket =
    existing && now <= existing.resetAt ? existing : { count: 0, resetAt: now + opts.windowMs };
  bucket.count += 1;
  buckets.set(ip, bucket);
  return bucket.count <= opts.max;
}

/**
 * Best-effort IP extraction for rate-limit keying. Reads the first hop from
 * x-forwarded-for, falls back to x-real-ip, then "unknown". Good enough for per-IP
 * throttling on Vercel; not a security boundary.
 */
export function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/**
 * Parse JSON from a Claude response that may include preamble text or ```json fences.
 * Tries three strategies: direct JSON.parse, fenced code block, first {...} or [...]
 * substring. Throws if none succeed.
 */
export function extractJson<T = unknown>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {}
  }

  const obj = text.match(/[{[][\s\S]*[\]}]/);
  if (obj) {
    try {
      return JSON.parse(obj[0]) as T;
    } catch {}
  }

  throw new Error("Could not extract JSON from model response");
}

/**
 * Test-only: reset the rate-limit state. Not exported from the public surface; used
 * by vitest to isolate cases.
 */
export function __resetRateLimits(): void {
  buckets.clear();
}
