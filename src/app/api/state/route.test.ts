import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted runs before vi.mock factories, so we can refer to these inside
// the factories below without tripping "Cannot access before initialization".
const { authMock, selectImpl, upsertImpl } = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<{ userId: string | null }>>(),
  selectImpl: vi.fn(),
  upsertImpl: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: selectImpl,
        }),
      }),
      upsert: upsertImpl,
    }),
  }),
  __resetSupabase: () => {},
}));

import { GET, PUT } from "./route";
import { DEFAULT_STATE } from "@/lib/state";

function makePutReq(body: unknown): Request {
  return new Request("https://test.local/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/state", () => {
  beforeEach(() => {
    authMock.mockReset();
    selectImpl.mockReset();
  });

  it("returns 401 when Clerk has no user", async () => {
    authMock.mockResolvedValueOnce({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns state: null when the user has no row yet", async () => {
    authMock.mockResolvedValueOnce({ userId: "user_abc" });
    selectImpl.mockResolvedValueOnce({ data: null, error: null });
    const res = await GET();
    const body = (await res.json()) as { state: unknown };
    expect(res.status).toBe(200);
    expect(body.state).toBeNull();
  });

  it("returns the stored state when a row exists", async () => {
    authMock.mockResolvedValueOnce({ userId: "user_abc" });
    const stored = { ...DEFAULT_STATE, name: "Sam", xp: 120 };
    selectImpl.mockResolvedValueOnce({ data: { state: stored }, error: null });
    const res = await GET();
    const body = (await res.json()) as { state: { name: string; xp: number } };
    expect(res.status).toBe(200);
    expect(body.state.name).toBe("Sam");
    expect(body.state.xp).toBe(120);
  });

  it("returns 500 when Supabase errors", async () => {
    authMock.mockResolvedValueOnce({ userId: "user_abc" });
    selectImpl.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/state", () => {
  beforeEach(() => {
    authMock.mockReset();
    upsertImpl.mockReset();
  });

  it("returns 401 when Clerk has no user", async () => {
    authMock.mockResolvedValueOnce({ userId: null });
    const res = await PUT(makePutReq({}));
    expect(res.status).toBe(401);
  });

  it("rejects non-object bodies with 400", async () => {
    authMock.mockResolvedValueOnce({ userId: "user_abc" });
    const req = new Request("https://test.local/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: '"just a string"',
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    expect(upsertImpl).not.toHaveBeenCalled();
  });

  it("upserts the normalised state and returns ok", async () => {
    authMock.mockResolvedValueOnce({ userId: "user_abc" });
    upsertImpl.mockResolvedValueOnce({ error: null });
    const res = await PUT(makePutReq({ name: "Sarah", onboardingComplete: true }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);

    expect(upsertImpl).toHaveBeenCalledOnce();
    const [row, options] = upsertImpl.mock.calls[0];
    expect(row.user_id).toBe("user_abc");
    // Missing fields fall back to DEFAULT_STATE, not undefined.
    expect(row.state.name).toBe("Sarah");
    expect(row.state.onboardingComplete).toBe(true);
    expect(row.state.deck).toEqual([]);
    expect(row.state.xp).toBe(0);
    expect(options.onConflict).toBe("user_id");
  });

  it("returns 500 when Supabase upsert errors", async () => {
    authMock.mockResolvedValueOnce({ userId: "user_abc" });
    upsertImpl.mockResolvedValueOnce({ error: { message: "nope" } });
    const res = await PUT(makePutReq({ name: "Sarah" }));
    expect(res.status).toBe(500);
  });
});
