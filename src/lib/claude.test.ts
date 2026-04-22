import { beforeEach, describe, expect, it } from "vitest";
import { extractJson, rateLimit, getIp, __resetRateLimits } from "./claude";

describe("extractJson", () => {
  it("parses raw JSON directly", () => {
    const result = extractJson<{ a: number }>('{"a":1}');
    expect(result).toEqual({ a: 1 });
  });

  it("strips ```json fences and parses", () => {
    const text = '```json\n{"a":1,"b":[2,3]}\n```';
    expect(extractJson(text)).toEqual({ a: 1, b: [2, 3] });
  });

  it("strips unlabelled ``` fences and parses", () => {
    const text = "```\n[1, 2, 3]\n```";
    expect(extractJson(text)).toEqual([1, 2, 3]);
  });

  it("extracts the first object from text with a preamble", () => {
    const text = 'Sure, here you go: {"ok":true, "n":42} — enjoy.';
    expect(extractJson(text)).toEqual({ ok: true, n: 42 });
  });

  it("extracts an array from text with a preamble", () => {
    const text = 'Here are the cards:\n[{"id":"a"},{"id":"b"}]';
    expect(extractJson(text)).toEqual([{ id: "a" }, { id: "b" }]);
  });

  it("throws when no JSON is recoverable", () => {
    expect(() => extractJson("sorry, I cannot comply")).toThrow(/Could not extract JSON/);
  });
});

describe("rateLimit", () => {
  beforeEach(() => {
    __resetRateLimits();
  });

  it("allows requests up to max within the window", () => {
    const opts = { max: 3, windowMs: 60_000 };
    expect(rateLimit("1.2.3.4", opts)).toBe(true);
    expect(rateLimit("1.2.3.4", opts)).toBe(true);
    expect(rateLimit("1.2.3.4", opts)).toBe(true);
  });

  it("blocks the request that exceeds max", () => {
    const opts = { max: 2, windowMs: 60_000 };
    expect(rateLimit("5.6.7.8", opts)).toBe(true);
    expect(rateLimit("5.6.7.8", opts)).toBe(true);
    expect(rateLimit("5.6.7.8", opts)).toBe(false);
  });

  it("tracks IPs independently", () => {
    const opts = { max: 1, windowMs: 60_000 };
    expect(rateLimit("a", opts)).toBe(true);
    expect(rateLimit("b", opts)).toBe(true);
    expect(rateLimit("a", opts)).toBe(false);
    expect(rateLimit("b", opts)).toBe(false);
  });

  it("resets the counter after the window expires", async () => {
    const opts = { max: 1, windowMs: 10 };
    expect(rateLimit("9.9.9.9", opts)).toBe(true);
    expect(rateLimit("9.9.9.9", opts)).toBe(false);
    await new Promise((r) => setTimeout(r, 15));
    expect(rateLimit("9.9.9.9", opts)).toBe(true);
  });
});

describe("getIp", () => {
  it("reads the first hop from x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.9" },
    });
    expect(getIp(req)).toBe("198.51.100.9");
  });

  it("returns 'unknown' when no identifying headers are set", () => {
    const req = new Request("https://example.com");
    expect(getIp(req)).toBe("unknown");
  });
});
