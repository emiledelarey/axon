import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_STATE, type AppState } from "@/lib/state";

const TABLE = "user_state";

type Row = { user_id: string; state: AppState; updated_at: string };

/**
 * GET /api/state
 * Returns `{ state: AppState | null }` for the current Clerk user. `null`
 * means "no server-side row yet" — the client should treat that as a
 * green light to push localStorage up (first-sync migration).
 */
export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase()
    .from(TABLE)
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("state GET error:", error);
    return Response.json({ error: "Could not load state" }, { status: 500 });
  }

  return Response.json({ state: (data?.state as AppState | undefined) ?? null });
}

/**
 * PUT /api/state
 * Body: AppState JSON. Upserts the row and returns the normalised state.
 * Validation is shallow — trust the client shape because the route is already
 * scoped to the Clerk user's own row, and a malformed blob only hurts them.
 */
export async function PUT(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Body must be an AppState object." }, { status: 400 });
  }

  // Fill any missing top-level fields from DEFAULT_STATE so the row always
  // matches the current shape, even if an older client writes less.
  const state = { ...DEFAULT_STATE, ...(body as Partial<AppState>) };

  const { error } = await supabase()
    .from(TABLE)
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() } satisfies Row, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("state PUT error:", error);
    return Response.json({ error: "Could not save state" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
