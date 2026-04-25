import "server-only";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_STATE, type AppState } from "@/lib/state";

const TABLE = "user_state";

export type AuthedUser = { userId: string; state: AppState };

/**
 * Resolve the Clerk-signed-in user and load their AppState from Supabase.
 * Returns null if no session — caller should `Response.json({ error: "Unauthorized" }, { status: 401 })`.
 *
 * Falls back to DEFAULT_STATE when no Supabase row exists yet (first-sync,
 * mid-onboarding). Server-side feature gates that need real state will see
 * a free-tier shape and behave conservatively.
 */
export async function requireUser(): Promise<AuthedUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const { data, error } = await supabase()
    .from(TABLE)
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("requireUser supabase error:", error);
    throw new Error("Could not load user state");
  }

  const state = (data?.state as AppState | undefined) ?? DEFAULT_STATE;
  return { userId, state };
}

/** Convenience: 401 response when requireUser returns null. */
export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

/** Convenience: 402-style "you need to upgrade" response with a stable shape the client can branch on. */
export function paywall(reason: "pro" | "tutor_quota" | "deck_cap"): Response {
  const messages: Record<typeof reason, string> = {
    pro: "This feature is on Axon Pro.",
    tutor_quota: "You've used this month's tutor messages on the free tier.",
    deck_cap: "Free tier is capped at one active deck. Upgrade to add more.",
  };
  return Response.json({ error: messages[reason], reason }, { status: 402 });
}
