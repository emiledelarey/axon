import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimits } from "@/lib/claude";
import { DEFAULT_STATE } from "@/lib/state";

vi.mock("@/lib/claude", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/claude")>();
  return {
    ...actual,
    client: {
      messages: { create: vi.fn() },
    },
  };
});

vi.mock("@/lib/server-auth", () => ({
  requireUser: vi.fn(async () => ({ userId: "test_user", state: DEFAULT_STATE })),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  paywall: (reason: string) => Response.json({ error: "Paywall", reason }, { status: 402 }),
}));

import { client } from "@/lib/claude";
import { requireUser } from "@/lib/server-auth";
import { POST } from "./route";

const mockedRequireUser = requireUser as unknown as ReturnType<typeof vi.fn>;

const mockedCreate = client.messages.create as unknown as ReturnType<typeof vi.fn>;

function makeReq(body: unknown): Request {
  return new Request("https://test.local/api/generate-cards", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate-cards", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
    __resetRateLimits();
    mockedRequireUser.mockResolvedValue({ userId: "test_user", state: DEFAULT_STATE });
  });

  it("returns 401 when not signed in", async () => {
    mockedRequireUser.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ material: "x".repeat(120) }));
    expect(res.status).toBe(401);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects too-short material with 400", async () => {
    const res = await POST(makeReq({ material: "short" }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/at least/i);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects overlong material with 400", async () => {
    const res = await POST(makeReq({ material: "x".repeat(80_001) }));
    expect(res.status).toBe(400);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("calls Claude and normalises the response", async () => {
    mockedCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify([
            {
              concept: "Opportunity cost",
              front: "Define it",
              question: "What is the opportunity cost of X?",
              answer: "The next-best alternative",
              working: "Walkthrough here",
              hint: "Think alternatives",
            },
          ]),
        },
      ],
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    });

    const res = await POST(
      makeReq({
        material:
          "The opportunity cost of any action is the value of the next best alternative forgone. ".repeat(
            5,
          ),
        focus: "Drill me on opportunity cost examples.",
        count: 3,
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      cards: Array<{ id: string; concept: string }>;
      meta: { count: number };
    };
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].concept).toBe("Opportunity cost");
    expect(body.cards[0].id).toMatch(/^c_\d+_0$/);
    expect(body.meta.count).toBe(1);

    expect(mockedCreate).toHaveBeenCalledOnce();
    const callArgs = mockedCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-4-5");
    const userContent = callArgs.messages[0].content as Array<{ type: string; text: string }>;
    expect(userContent[0].type).toBe("text");
    expect(userContent[0].text).toContain("opportunity cost");
    expect(userContent[1].text).toMatch(/Generate exactly 3 flashcards/);
    expect(userContent[1].text).toContain("FOCUS");
    expect(userContent[1].text).toContain("Drill me on opportunity cost examples.");
  });

  it("returns 429 once the rate limit is exceeded", async () => {
    mockedCreate.mockResolvedValue({
      content: [{ type: "text", text: "[]" }],
      usage: {},
    });
    const req = () =>
      makeReq({
        material: "Study material goes here — long enough to pass the minimum. ".repeat(5),
      });
    // Plan allows 5 per minute; the 6th should be throttled.
    for (let i = 0; i < 5; i++) {
      const res = await POST(req());
      expect(res.status).toBe(200);
    }
    const sixth = await POST(req());
    expect(sixth.status).toBe(429);
  });
});
