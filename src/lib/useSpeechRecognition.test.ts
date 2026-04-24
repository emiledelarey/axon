// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechRecognition } from "./useSpeechRecognition";

type MockRecog = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult:
    | ((e: {
        resultIndex: number;
        results: Array<{ 0: { transcript: string; confidence: number }; isFinal: boolean }>;
      }) => void)
    | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
};

const created: MockRecog[] = [];

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  onstart: MockRecog["onstart"] = null;
  onend: MockRecog["onend"] = null;
  onerror: MockRecog["onerror"] = null;
  onresult: MockRecog["onresult"] = null;
  start = vi.fn(() => {
    this.onstart?.();
  });
  stop = vi.fn(() => {
    this.onend?.();
  });
  abort = vi.fn();
  constructor() {
    created.push(this as unknown as MockRecog);
  }
}

describe("useSpeechRecognition", () => {
  beforeEach(() => {
    created.length = 0;
  });

  afterEach(() => {
    delete (globalThis.window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (globalThis.window as unknown as { webkitSpeechRecognition?: unknown })
      .webkitSpeechRecognition;
  });

  it("reports unsupported when neither global is present", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.supported).toBe(false);
    act(() => result.current.start());
    expect(result.current.error).toMatch(/supported/i);
  });

  it("reports supported + starts recognition, and pipes final results to onFinal", () => {
    (globalThis.window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      MockSpeechRecognition;

    const onFinal = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onFinal }));
    expect(result.current.supported).toBe(true);

    act(() => result.current.start());
    const recog = created[0];
    expect(recog).toBeDefined();
    expect(recog.start).toHaveBeenCalledOnce();
    expect(result.current.listening).toBe(true);

    // Fire a result: an interim and then a final.
    act(() => {
      recog.onresult?.({
        resultIndex: 0,
        results: [
          {
            0: { transcript: "three over two times", confidence: 0.8 },
            isFinal: false,
          },
        ],
      });
    });
    expect(result.current.interim).toBe("three over two times");
    expect(onFinal).not.toHaveBeenCalled();

    act(() => {
      recog.onresult?.({
        resultIndex: 0,
        results: [
          {
            0: { transcript: "three over two times four", confidence: 0.9 },
            isFinal: true,
          },
        ],
      });
    });
    expect(onFinal).toHaveBeenCalledWith("three over two times four");

    act(() => result.current.stop());
    expect(recog.stop).toHaveBeenCalledOnce();
    expect(result.current.listening).toBe(false);
  });

  it("swallows no-speech errors quietly", () => {
    (globalThis.window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      MockSpeechRecognition;

    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());
    act(() => created[0].onerror?.({ error: "no-speech" }));
    expect(result.current.error).toBeNull();
  });

  it("surfaces meaningful errors", () => {
    (globalThis.window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      MockSpeechRecognition;

    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());
    act(() => created[0].onerror?.({ error: "not-allowed" }));
    expect(result.current.error).toBe("not-allowed");
  });
});
