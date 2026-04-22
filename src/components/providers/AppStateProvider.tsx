"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLocalState, type AppState } from "@/lib/state";

type Update = (patch: Partial<AppState> | ((s: AppState) => AppState)) => void;
type Ctx = { state: AppState; update: Update };

const AppStateCtx = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, update] = useLocalState();
  return <AppStateCtx.Provider value={{ state, update }}>{children}</AppStateCtx.Provider>;
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}
