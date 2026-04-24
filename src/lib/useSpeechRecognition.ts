"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal shape of a SpeechRecognition instance — the TS DOM lib doesn't ship
 * these types. We cover what the hook actually uses.
 */
type SpeechRecognitionAlternative = { transcript: string; confidence: number };
type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternative;
};
type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};
type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};
type SpeechRecognitionErrorEvent = Event & { error: string; message?: string };

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type UseSpeechRecognitionOptions = {
  /** BCP-47 tag, e.g. "en-AU". Default en-AU. */
  lang?: string;
  /** Keep listening across pauses. Default true. */
  continuous?: boolean;
  /** Stream partial results as the user speaks. Default true. */
  interimResults?: boolean;
  /** Called once per final segment. Use this to append to your target field. */
  onFinal?: (text: string) => void;
};

export type UseSpeechRecognitionReturn = {
  /** True when the API is present in the browser. */
  supported: boolean;
  /** True while recognition is actively listening. */
  listening: boolean;
  /** Latest interim (in-flight, not yet finalised) transcript. */
  interim: string;
  /** Last error string, or null. */
  error: string | null;
  start(): void;
  stop(): void;
  reset(): void;
};

/**
 * Wraps the Web Speech API (webkitSpeechRecognition on Safari/Chrome) into
 * a React hook. Finals fire `onFinal(text)`; interims are exposed via
 * `interim` so you can render them as live captioning. Not supported in
 * Firefox or older Safari — check `supported` before showing UI.
 */
export function useSpeechRecognition(
  opts: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const { lang = "en-AU", continuous = true, interimResults = true, onFinal } = opts;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  // Stash onFinal in a ref so start() closures don't go stale across renders.
  // Sync inside an effect — React 19 forbids writing to ref.current in render.
  const onFinalRef = useRef<typeof onFinal>(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  // Derived value, not state — safe under React 19's setState-in-effect rule
  // and avoids a redundant render after mount. Returns false during SSR.
  const supported = typeof window !== "undefined" && getCtor() != null;

  const stop = useCallback(() => {
    recogRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setInterim("");
    setError(null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Speech recognition isn't supported in this browser.");
      return;
    }
    // Abort any existing session before (re)starting so we don't stack handlers.
    recogRef.current?.abort();

    const recog = new Ctor();
    recog.lang = lang;
    recog.continuous = continuous;
    recog.interimResults = interimResults;

    recog.onstart = () => {
      setListening(true);
      setError(null);
    };
    recog.onend = () => {
      setListening(false);
    };
    recog.onerror = (e) => {
      // "no-speech" fires benignly when the student pauses; don't surface it.
      if (e.error && e.error !== "no-speech") setError(e.error);
      setListening(false);
    };
    recog.onresult = (e) => {
      let nextInterim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const alt = result[0];
        if (result.isFinal) {
          onFinalRef.current?.(alt.transcript);
        } else {
          nextInterim += alt.transcript;
        }
      }
      setInterim(nextInterim);
    };

    recogRef.current = recog;
    try {
      recog.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start microphone.");
      setListening(false);
    }
  }, [lang, continuous, interimResults]);

  useEffect(
    () => () => {
      recogRef.current?.abort();
    },
    [],
  );

  return { supported, listening, interim, error, start, stop, reset };
}
