import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service_role (now "secret") key. This
 * bypasses RLS — we rely on the Clerk-authenticated Next.js route handler to
 * scope every query to the current user's id. The client is never exposed to
 * the browser.
 */
let cached: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set in the environment.");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Test-only: reset the memoised client so tests can inject mocks. */
export function __resetSupabase(): void {
  cached = null;
}
