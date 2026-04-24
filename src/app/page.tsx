"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAppState } from "@/components/providers/AppStateProvider";
import { FeedbackButton } from "@/components/shell/FeedbackButton";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { LandingPage } from "@/components/landing/LandingPage";

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

  // Avoid flashing any landing/onboarding while Clerk hydrates.
  if (!isLoaded) return null;

  if (isSignedIn && state.onboardingComplete) return null;

  // Signed in but not onboarded — finish the in-app onboarding flow. This
  // also covers the post-sign-up return where Clerk lands on / first.
  if (isSignedIn) {
    return (
      <>
        <Onboarding
          state={state}
          update={update}
          isSignedIn
          onDone={() => router.push("/dashboard")}
        />
        <FeedbackButton />
      </>
    );
  }

  // Signed out — public marketing landing.
  return <LandingPage />;
}
