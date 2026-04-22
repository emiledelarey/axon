"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";
import { PasteModalProvider } from "@/components/providers/PasteModalContext";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { FeedbackButton } from "@/components/shell/FeedbackButton";
import { PasteMaterialModal } from "@/components/modals/PasteMaterialModal";
import { STORAGE_KEY } from "@/lib/constants";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { state, update } = useAppState();
  const [showPasteModal, setShowPasteModal] = useState(false);

  const resetDeck = () => {
    if (!confirm("Reset everything? Clears your deck, streak, and XP.")) return;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  // If a first-time visitor somehow lands inside the app shell without completing
  // onboarding, kick them back to the root where <Onboarding /> handles intake.
  if (!state.onboardingComplete) {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  return (
    <PasteModalProvider open={() => setShowPasteModal(true)}>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar
          state={state}
          update={update}
          onSignOut={resetDeck}
          onAddDeck={() => setShowPasteModal(true)}
        />
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Topbar state={state} />
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {children}
          </div>
        </main>
      </div>
      {showPasteModal && (
        <PasteMaterialModal
          onClose={() => setShowPasteModal(false)}
          update={update}
          state={state}
        />
      )}
      <FeedbackButton />
    </PasteModalProvider>
  );
}
