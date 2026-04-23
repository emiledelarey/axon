"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAppState } from "@/components/providers/AppStateProvider";
import { FeedbackButton } from "@/components/shell/FeedbackButton";
import { Onboarding } from "@/components/onboarding/Onboarding";

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { state, update } = useAppState();

  // Hydrate state.name from Clerk on first sign-in so greetings, sidebar
  // avatar, etc. stop showing "Student" the moment auth completes.
  useEffect(() => {
    if (isSignedIn && user && !state.name) {
      const name = user.firstName || user.username || "";
      if (name) update({ name });
    }
  }, [isSignedIn, user, state.name, update]);

  // Signed in + already onboarded → straight to dashboard.
  useEffect(() => {
    if (isSignedIn && state.onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, state.onboardingComplete, router]);

  // Avoid flashing the landing while Clerk hydrates.
  if (!isLoaded) return null;

  if (isSignedIn && state.onboardingComplete) return null;

  return (
    <>
      <Onboarding
        state={state}
        update={update}
        isSignedIn={!!isSignedIn}
        onDone={() => router.push("/dashboard")}
      />
      <FeedbackButton />
    </>
  );
}
