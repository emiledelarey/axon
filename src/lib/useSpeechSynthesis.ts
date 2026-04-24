"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseSpeechSynthesisOptions = {
  /** BCP-47 tag. The browser picks a matching voice. Default en-AU. */
  lang?: string;
  /** 0.1..10. Default 1. */
  rate?: number;
  /** 0..2. Default 1. */
  pitch?: number;
};

export type UseSpeechSynthesisReturn = {
  /** True when the API is present in the browser. */
  supported: boolean;
  /** True while an utterance is actively being spoken. */
  speaking: boolean;
  /** Speak the given text. Cancels any in-flight utterance first. */
  speak(text: string, onEnd?: () => void): void;
  /** Stop any in-flight speech. */
  stop(): void;
};

/**
 * Wraps the browser SpeechSynthesis API for read-aloud of coach hints. Desktop
 * Chrome/Edge/Safari/Firefox all support it; iOS is quirky (needs a user
 * gesture). `supported` is a synchronous check; it's false during SSR.
 */
export function useSpeechSynthesis(opts: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisReturn {
  const { lang = "en-AU", rate = 1, pitch = 1 } = opts;
  const supported = typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
  const [speaking, setSpeaking] = useState(false);
  const currentUtterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    currentUtterRef.current = null;
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!supported) return;
      const clean = text.trim();
      if (!clean) return;
      // Stop anything already speaking so consecutive .speak() calls don't queue.
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = lang;
      utter.rate = rate;
      utter.pitch = pitch;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => {
        setSpeaking(false);
        if (currentUtterRef.current === utter) currentUtterRef.current = null;
        onEnd?.();
      };
      utter.onerror = () => {
        setSpeaking(false);
        if (currentUtterRef.current === utter) currentUtterRef.current = null;
      };
      currentUtterRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [supported, lang, rate, pitch],
  );

  // Cancel any in-flight speech on unmount. Re-check window instead of closing
  // over `supported` so tests that tear down the global mock don't crash.
  useEffect(
    () => () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    [],
  );

  return { supported, speaking, speak, stop };
}
