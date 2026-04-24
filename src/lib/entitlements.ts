import type { AppState } from "./state";

/**
 * Free tier caps. These are the product boundaries the student feels — raise
 * them here and the whole app loosens together. Keep conservative: the
 * conversion story for Pro dies if free feels unlimited.
 */
export const LIMITS = {
  freeDecks: 1,
  freeTutorMessagesPerMonth: 30,
} as const;

/**
 * True when the student is currently entitled to Pro-tier features — either
 * paying or in a Stripe trial. Everything else (past_due, canceled, never
 * subscribed) = free tier.
 */
export function isPro(state: AppState): boolean {
  const sub = state.subscription;
  if (!sub) return false;
  return sub.status === "active" || sub.status === "trialing";
}

/**
 * Total decks the student has across active + inactive. Used for the
 * deck-cap gate on Library.
 */
export function totalDeckCount(state: AppState): number {
  const active = state.deck && state.deck.length > 0 ? 1 : 0;
  return active + state.decks.length;
}

/** Free tier: 1 active deck. Pro: unlimited. */
export function canCreateExtraDeck(state: AppState): boolean {
  if (isPro(state)) return true;
  return totalDeckCount(state) < LIMITS.freeDecks;
}

/** Pro gates. These three features are paywalled outright for free users. */
export function canUseMockExam(state: AppState): boolean {
  return isPro(state);
}
export function canUseLiveWrite(state: AppState): boolean {
  return isPro(state);
}
export function canUseVoiceMode(state: AppState): boolean {
  return isPro(state);
}

/**
 * Tutor-chat free-tier cap. Rolls over at the start of each calendar month —
 * compares the first of the current month against the stored period start.
 * If it's a new month we treat the counter as fresh; the caller is expected
 * to also bump tutorPeriodStart when it writes the new count.
 */
export function tutorRemaining(state: AppState): number {
  if (isPro(state)) return Infinity;
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const stored = state.tutorPeriodStart?.slice(0, 7);
  if (stored !== thisMonth) return LIMITS.freeTutorMessagesPerMonth;
  return Math.max(0, LIMITS.freeTutorMessagesPerMonth - state.tutorMessagesThisMonth);
}

/** Convenience: can the student send another tutor message right now? */
export function canSendTutorMessage(state: AppState): boolean {
  return tutorRemaining(state) > 0;
}

/**
 * Snapshot of every gate so components can destructure once instead of
 * calling each helper. The shape is stable — add new flags here as we add
 * features.
 */
export type Entitlements = {
  pro: boolean;
  canCreateExtraDeck: boolean;
  canUseMockExam: boolean;
  canUseLiveWrite: boolean;
  canUseVoiceMode: boolean;
  canSendTutorMessage: boolean;
  tutorRemaining: number;
};

export function entitlementsOf(state: AppState): Entitlements {
  return {
    pro: isPro(state),
    canCreateExtraDeck: canCreateExtraDeck(state),
    canUseMockExam: canUseMockExam(state),
    canUseLiveWrite: canUseLiveWrite(state),
    canUseVoiceMode: canUseVoiceMode(state),
    canSendTutorMessage: canSendTutorMessage(state),
    tutorRemaining: tutorRemaining(state),
  };
}
