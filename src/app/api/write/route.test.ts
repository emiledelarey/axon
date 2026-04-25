import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimits } from "@/lib/claude";
import { DEFAULT_STATE, type AppState } from "@/lib/state";

vi.mock("@/lib/claude", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/claude")>();
  return {
    ...actual,
    client: {
      messages: { stream: vi.fn() },
    },
  };
});

const PRO_STATE: AppState = {
  ...DEFAULT_STATE,
  subscription: {
    status: "active",
    stripeCustomerId: "cus_test",
    stripeSubscriptionId: "sub_test",
    currentPeriodEnd: null,
  },
};

vi.mock("@/lib/server-auth", () => ({
  requireUser: vi.fn(async () => ({ userId: "test_user", state: PRO_STATE })),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  paywall: (reason: string) => Response.json({ error: "Paywall", reason }, { status: 402 }),
}));

import { client } from "@/lib/claude";
import { requireUser } from "@/lib/server-auth";
import { POST } from "./route";

const mockedRequireUser = requireUser as unknown as ReturnType<typeof vi.fn>;

const mockedStream = client.messages.stream as unknown as ReturnType<typeof vi.fn>;

function makeReq(body: unknown): Request {
  return new Request("https://test.local/api/write", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.4" },
    body: JSON.stringify(body),
  });
}

function fakeStream(deltas: string[], usage = { input_tokens: 0, output_tokens: 0 }) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of deltas) {
        yield {
          type: "content_block_delta",
          delta: { type: "text_delta", text },
        };
      }
    },
    finalMessage: async () => ({ usage }),
  };
}

async function readAll(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value);
  }
  return out;
}

describe("POST /api/write", () => {
  beforeEach(() => {
    mockedStream.mockReset();
    __resetRateLimits();
    mockedRequireUser.mockResolvedValue({ userId: "test_user", state: PRO_STATE });
  });

  it("returns 401 when not signed in", async () => {
    mockedRequireUser.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ prompt: "p", draft: "d", action: "plan" }));
    expect(res.status).toBe(401);
    expect(mockedStream).not.toHaveBeenCalled();
  });

  it("returns 402 with reason 'pro' for free-tier users", async () => {
    mockedRequireUser.mockResolvedValueOnce({ userId: "test_user", state: DEFAULT_STATE });
    const res = await POST(makeReq({ prompt: "p", draft: "d", action: "plan" }));
    expect(res.status).toBe(402);
    const body = (await res.json()) as { reason: string };
    expect(body.reason).toBe("pro");
    expect(mockedStream).not.toHaveBeenCalled();
  });

  it("rejects missing prompt with 400", async () => {
    const res = await POST(makeReq({ draft: "some draft", action: "plan" }));
    expect(res.status).toBe(400);
    expect(mockedStream).not.toHaveBeenCalled();
  });

  it("rejects missing draft with 400", async () => {
    const res = await POST(makeReq({ prompt: "Discuss the causes of WWI.", action: "plan" }));
    expect(res.status).toBe(400);
    expect(mockedStream).not.toHaveBeenCalled();
  });

  it("rejects an unknown action with 400", async () => {
    const res = await POST(
      makeReq({
        prompt: "prompt here",
        draft: "draft here",
        action: "not-a-real-action",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("streams tokens and a done event on a plan action", async () => {
    mockedStream.mockReturnValueOnce(
      fakeStream(["Here is ", "the plan."], { input_tokens: 12, output_tokens: 4 }),
    );

    const res = await POST(
      makeReq({
        prompt: "Discuss the causes of WWI.",
        rubric: "Marks: thesis, evidence, counterargument.",
        draft: "Thesis: tangled alliances + nationalism. Outline: ...",
        notes: "Focus on the Balkans.",
        action: "plan",
      }),
    );

    expect(res.status).toBe(200);
    const body = await readAll(res);
    expect(body).toContain(`data: ${JSON.stringify({ text: "Here is " })}`);
    expect(body).toContain(`data: ${JSON.stringify({ text: "the plan." })}`);
    expect(body).toContain(`"done":true`);
    expect(body).toContain(`"outputTokens":4`);

    // Verify the rubric + notes landed in the user message.
    const call = mockedStream.mock.calls[0][0];
    const userText = (call.messages[0].content as Array<{ type: string; text: string }>)[0].text;
    expect(userText).toContain("Essay prompt:");
    expect(userText).toContain("Discuss the causes of WWI.");
    expect(userText).toContain("Rubric:");
    expect(userText).toContain("Student notes:");
    expect(userText).toContain("Focus on the Balkans.");
    // Action-specific focus line is first.
    expect(userText.split("\n")[0]).toContain("Focus:");
  });

  it("switches focus copy based on action", async () => {
    mockedStream.mockReturnValueOnce(fakeStream(["ok"]));
    await POST(
      makeReq({
        prompt: "p",
        draft: "d",
        action: "challenge",
      }),
    );
    const userText = (
      mockedStream.mock.calls[0][0].messages[0].content as Array<{
        type: string;
        text: string;
      }>
    )[0].text;
    expect(userText).toMatch(/Socratic counter-questions/);
  });
});
