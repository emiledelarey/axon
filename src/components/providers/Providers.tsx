"use client";

import type { ReactNode } from "react";
import { AppStateProvider } from "./AppStateProvider";

export function Providers({ children }: { children: ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
