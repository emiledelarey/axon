"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import type { AppState } from "@/lib/state";
import { useLocalState } from "@/lib/useLocalState";

type Update = (patch: Partial<AppState> | ((s: AppState) => AppState)) => void;
type Ctx = { state: AppState; update: Update };

const AppStateCtx = createContext<Ctx | null>(null);

/**
 * Cross-device sync rules:
 * - On first render after a Clerk user is known, GET /api/state once.
 * - If the server has a stored state, it wins (server is the source of truth
 *   across devices). Local state is overwritten.
 * - If the server has no row yet AND the current local state already has a
 *   deck or completed onboarding, upload local → server. This is the
 *   anonymous-era migration path: the same browser that clicked "Skip — load
 *   demo deck" pre-auth now pushes that deck up to the user's account.
 * - After initial sync, every mutation debounces into a PUT so the server
 *   stays caught up without per-keystroke writes.
 */
const SYNC_DEBOUNCE_MS = 800;

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, update] = useLocalState();
  const { isLoaded, isSignedIn } = useUser();
  const initialSyncDoneRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || initialSyncDoneRef.current) return;
    initialSyncDoneRef.current = true;

    void (async () => {
      try {
        const res = await fetch("/api/state", { credentials: "same-origin" });
        if (!res.ok) return;
        const { state: serverState } = (await res.json()) as {
          state: AppState | null;
        };
        if (serverState) {
          update(() => serverState);
        } else if (state.onboardingComplete || state.deck.length > 0) {
          await fetch("/api/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(state),
          });
        }
      } catch {
        /* offline / transient — keep using localStorage */
      }
    })();
    // `state` is intentionally omitted: only run once per auth transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, update]);

  useEffect(() => {
    if (!initialSyncDoneRef.current || !isSignedIn) return;
    const timer = setTimeout(() => {
      void fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(state),
      }).catch(() => {
        /* swallow — we'll retry on the next change */
      });
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state, isSignedIn]);

  return <AppStateCtx.Provider value={{ state, update }}>{children}</AppStateCtx.Provider>;
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}
