"use client";

import { createContext, useContext, type ReactNode } from "react";

type Ctx = { openPasteModal: () => void };

const PasteModalCtx = createContext<Ctx | null>(null);

export function PasteModalProvider({
  open,
  children,
}: {
  open: () => void;
  children: ReactNode;
}) {
  return (
    <PasteModalCtx.Provider value={{ openPasteModal: open }}>
      {children}
    </PasteModalCtx.Provider>
  );
}

export function usePasteModal(): Ctx {
  const ctx = useContext(PasteModalCtx);
  if (!ctx)
    throw new Error("usePasteModal must be used inside <PasteModalProvider>");
  return ctx;
}
