import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimits } from "@/lib/claude";

vi.mock("@/lib/claude", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/claude")>();
  return {
    ...actual,
    client: {
      messages: { stream: vi.fn() },
    },
  };
});

import { client } from "@/lib/claude";
import { POST } from "./route";

const mockedStream = client.messages.stream as unknown as ReturnType<typeof vi.fn>;

function makeReq(body: unknown): Request {
  return new Request("https://test.local/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.3" },
    body: JSON.stringify(body),
  });
}

/** Minimal fake that mimics the SDK's `messages.stream` return value. */
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

describe("POST /api/chat", () => {
  beforeEach(() => {
    mockedStream.mockReset();
    __resetRateLimits();
  });

  it("rejects missing material with 400", async () => {
    const res = await POST(makeReq({ mode: "tutor", messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(400);
    expect(mockedStream).not.toHaveBeenCalled();
  });

  it("rejects empty messages array with 400", async () => {
    const res = await POST(makeReq({ material: "material at least something", messages: [] }));
    expect(res.status).toBe(400);
  });

  it("streams text chunks then a done event", async () => {
    mockedStream.mockReturnValueOnce(
      fakeStream(["Hello ", "world"], { input_tokens: 10, output_tokens: 2 }),
    );

    const res = await POST(
      makeReq({
        material: "WACC weighs E and D costs.",
        mode: "tutor",
        messages: [{ role: "user", content: "Explain WACC simply." }],
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    const body = await readAll(res);
    expect(body).toContain(`data: ${JSON.stringify({ text: "Hello " })}`);
    expect(body).toContain(`data: ${JSON.stringify({ text: "world" })}`);
    expect(body).toContain(`"done":true`);
    expect(body).toContain(`"outputTokens":2`);
  });

  it("prepends student working in livework mode", async () => {
    mockedStream.mockReturnValueOnce(fakeStream(["ok"]));

    await POST(
      makeReq({
        material: "Problem material.",
        mode: "livework",
        studentWorking: "Step 1: I wrote 0.6 * 12 = 7.2",
        messages: [{ role: "user", content: "Check my working." }],
      }),
    );

    const callArgs = mockedStream.mock.calls[0][0];
    const userContent = callArgs.messages[0].content as Array<{ type: string; text: string }>;
    expect(userContent[1].text).toContain("Student's current working:");
    expect(userContent[1].text).toContain("Step 1: I wrote 0.6 * 12 = 7.2");
    expect(userContent[1].text).toContain("Check my working.");
  });
});
