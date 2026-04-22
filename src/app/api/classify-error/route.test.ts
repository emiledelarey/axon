import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimits } from "@/lib/claude";

vi.mock("@/lib/claude", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/claude")>();
  return {
    ...actual,
    client: {
      messages: { create: vi.fn() },
    },
  };
});

import { client } from "@/lib/claude";
import { POST } from "./route";

const mockedCreate = client.messages.create as unknown as ReturnType<typeof vi.fn>;

const sampleCard = {
  concept: "WACC",
  front: "Compute it",
  question: "E=60%, D=40%, Re=12%, Rd=6%, t=30%. What's WACC?",
  answer: "8.88%",
  working: "WACC = 0.6*0.12 + 0.4*0.06*(1-0.3) = 0.072 + 0.0168 = 0.0888",
};

function makeReq(body: unknown): Request {
  return new Request("https://test.local/api/classify-error", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.2" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/classify-error", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
    __resetRateLimits();
  });

  it("rejects missing card or material with 400", async () => {
    const res = await POST(makeReq({ material: "some text", card: {} }));
    expect(res.status).toBe(400);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("returns a normalised classification with defaults", async () => {
    mockedCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            classification: "misconception",
            diagnosis: "You used pre-tax debt.",
            walkback: ["WACC", "Cost of debt", "After-tax adjustment"],
            brokenLink: "After-tax adjustment",
            microLesson: {
              headline: "Always use after-tax debt in WACC.",
              explanation: "Because interest is tax-deductible, the effective cost is Rd*(1-t).",
              formula: "Rd_after_tax = Rd * (1 - t)",
              worked: "6% * (1 - 0.3) = 4.2%",
            },
          }),
        },
      ],
      usage: { input_tokens: 10, output_tokens: 50, cache_read_input_tokens: 500 },
    });

    const res = await POST(
      makeReq({
        material: "WACC = E/V * Re + D/V * Rd * (1-t). ".repeat(5),
        card: sampleCard,
        userAnswer: "10.8%",
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      classification: string;
      walkback: string[];
      microLesson: { formula?: string };
      meta: { cacheReadInputTokens: number };
    };
    expect(body.classification).toBe("misconception");
    expect(body.walkback).toHaveLength(3);
    expect(body.microLesson.formula).toBe("Rd_after_tax = Rd * (1 - t)");
    expect(body.meta.cacheReadInputTokens).toBe(500);

    const callArgs = mockedCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-4-5");
    const text = (callArgs.messages[0].content as Array<{ type: string; text: string }>)[1].text;
    expect(text).toContain("WACC");
    expect(text).toContain("Student's answer: 10.8%");
  });

  it("falls back to 'prerequisite-gap' when model returns an unknown classification", async () => {
    mockedCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            classification: "aliens",
            diagnosis: "",
            walkback: [],
            brokenLink: "",
            microLesson: { headline: "", explanation: "", worked: "" },
          }),
        },
      ],
      usage: {},
    });
    const res = await POST(
      makeReq({ material: "some material that is at least something", card: sampleCard }),
    );
    const body = (await res.json()) as { classification: string };
    expect(body.classification).toBe("prerequisite-gap");
  });
});
