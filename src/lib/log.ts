import "server-only";

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const MAX_LEN = 600;

/**
 * Truncate to a sane length and replace anything that looks like an email
 * address with a placeholder. Stripe and Clerk error messages frequently embed
 * customer email; we don't want that landing in Vercel logs.
 */
function sanitize(value: unknown): string {
  let s: string;
  if (value instanceof Error) {
    s = `${value.name}: ${value.message ?? ""}`;
  } else if (typeof value === "string") {
    s = value;
  } else {
    try {
      s = JSON.stringify(value);
    } catch {
      s = String(value);
    }
  }
  return s.slice(0, MAX_LEN).replace(EMAIL_RE, "[email]");
}

/**
 * Server-side error logger. Tags every line with a context label so logs are
 * grep-able, scrubs email PII, and truncates noisy upstream errors so we don't
 * accidentally write a 4 KB Stripe payload into the Vercel log stream.
 *
 * Phase-2 hook point — when Sentry / Vercel Observability gets wired in,
 * forward the original `err` (unsanitised) here. The console line stays clean
 * for local + Vercel runtime logs, the structured tracker gets the full thing.
 */
export function logError(context: string, err: unknown, extra?: Record<string, unknown>): void {
  const message = sanitize(err);
  const meta = extra ? ` ${JSON.stringify(extra).slice(0, MAX_LEN)}` : "";
  console.error(`[${context}] ${message}${meta}`);
  // TODO(phase-2): Sentry.captureException(err, { tags: { context }, extra });
}

/** Tagged informational log — use sparingly, mostly for unhandled webhook event types. */
export function logInfo(context: string, message: string, extra?: Record<string, unknown>): void {
  const meta = extra ? ` ${JSON.stringify(extra).slice(0, MAX_LEN)}` : "";
  console.log(`[${context}] ${sanitize(message)}${meta}`);
}
