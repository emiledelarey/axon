"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";
import { FeedbackButton } from "@/components/shell/FeedbackButton";
import { Onboarding } from "@/components/onboarding/Onboarding";

export default function Home() {
  const router = useRouter();
  const { state, update } = useAppState();

  useEffect(() => {
    if (state.onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [state.onboardingComplete, router]);

  if (state.onboardingComplete) return null;

  return (
    <>
      <Onboarding state={state} update={update} onDone={() => router.push("/dashboard")} />
      <FeedbackButton />
    </>
  );
}
