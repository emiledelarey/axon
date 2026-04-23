"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEY } from "./constants";
import { DEFAULT_STATE, migrateState, type AppState } from "./state";

/**
 * Client-only React hook. Loads from localStorage on mount (with migration),
 * writes back on every change. The returned `update` accepts either a partial
 * patch or a function (state -> state), like useState's setter.
 *
 * Pulled out of state.ts so the pure data module stays server-safe — the API
 * route imports DEFAULT_STATE from state.ts without dragging React hooks into
 * the server bundle.
 */
export function useLocalState(): [
  AppState,
  (patch: Partial<AppState> | ((s: AppState) => AppState)) => void,
] {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      return migrateState(parsed, new URLSearchParams(window.location.search));
    } catch {
      return migrateState(null, new URLSearchParams(window.location.search));
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota / private-mode — best effort */
    }
  }, [state]);

  const update = useCallback((patch: Partial<AppState> | ((s: AppState) => AppState)) => {
    setState((s) => (typeof patch === "function" ? patch(s) : { ...s, ...patch }));
  }, []);

  return [state, update];
}
