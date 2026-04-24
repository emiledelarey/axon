import "server-only";
import Stripe from "stripe";

/**
 * Singleton Stripe client. Uses the secret key from the environment and
 * Stripe's current default API version (the SDK picks it automatically if
 * we don't pin one). Pinning a version is better hygiene long-term; do it
 * when we're past the bootstrap phase.
 */
let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY must be set in the environment.");
  }
  cached = new Stripe(key);
  return cached;
}

/** Test-only: reset the memoised client so tests can inject mocks. */
export function __resetStripe(): void {
  cached = null;
}
