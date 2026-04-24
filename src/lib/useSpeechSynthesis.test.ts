// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

type UtterLike = {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const utters: UtterLike[] = [];

class MockUtterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
    utters.push(this);
  }
}

const speakMock = vi.fn<(u: UtterLike) => void>();
const cancelMock = vi.fn<() => void>();

function installSynthMock() {
  (globalThis.window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    MockUtterance;
  (globalThis.window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
    speak: (u: UtterLike) => {
      speakMock(u);
      // Fire onstart synchronously so the hook's speaking state flips.
      u.onstart?.();
    },
    cancel: cancelMock,
  };
}

function uninstallSynthMock() {
  delete (globalThis.window as unknown as { SpeechSynthesisUtterance?: unknown })
    .SpeechSynthesisUtterance;
  delete (globalThis.window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
}

describe("useSpeechSynthesis", () => {
  beforeEach(() => {
    utters.length = 0;
    speakMock.mockReset();
    cancelMock.mockReset();
  });

  afterEach(() => uninstallSynthMock());

  it("reports unsupported when the API is missing", () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.supported).toBe(false);
    act(() => result.current.speak("hello"));
    expect(speakMock).not.toHaveBeenCalled();
  });

  it("speaks the given text, fires speaking state, and cancels pending utterances first", () => {
    installSynthMock();
    const { result } = renderHook(() => useSpeechSynthesis({ lang: "en-US", rate: 1.1 }));
    expect(result.current.supported).toBe(true);

    act(() => result.current.speak("first"));
    expect(cancelMock).toHaveBeenCalledOnce();
    expect(speakMock).toHaveBeenCalledOnce();
    expect(utters[0].text).toBe("first");
    expect(utters[0].lang).toBe("en-US");
    expect(utters[0].rate).toBe(1.1);
    expect(result.current.speaking).toBe(true);

    // A second .speak should cancel the previous.
    act(() => result.current.speak("second"));
    expect(cancelMock).toHaveBeenCalledTimes(2);
    expect(utters[1].text).toBe("second");

    // onend resets the speaking flag.
    act(() => utters[1].onend?.());
    expect(result.current.speaking).toBe(false);
  });

  it("skips empty / whitespace text", () => {
    installSynthMock();
    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => result.current.speak("   "));
    expect(speakMock).not.toHaveBeenCalled();
  });

  it("stop() cancels and clears speaking state", () => {
    installSynthMock();
    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => result.current.speak("hello"));
    expect(result.current.speaking).toBe(true);
    act(() => result.current.stop());
    expect(cancelMock).toHaveBeenCalledTimes(2); // once from speak pre-cancel, once from stop
    expect(result.current.speaking).toBe(false);
  });
});
