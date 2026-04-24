import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, type AppState, type Subscription } from "./state";
import {
  LIMITS,
  canCreateExtraDeck,
  canSendTutorMessage,
  canUseLiveWrite,
  canUseMockExam,
  canUseVoiceMode,
  entitlementsOf,
  isPro,
  tutorRemaining,
} from "./entitlements";

function state(overrides: Partial<AppState> = {}): AppState {
  return { ...DEFAULT_STATE, ...overrides };
}
function sub(status: Subscription["status"]): Subscription {
  return {
    status,
    stripeCustomerId: "cus_test",
    stripeSubscriptionId: "sub_test",
    currentPeriodEnd: null,
  };
}

describe("isPro", () => {
  it("is false without a subscription", () => {
    expect(isPro(state())).toBe(false);
  });
  it("is true on active and trialing", () => {
    expect(isPro(state({ subscription: sub("active") }))).toBe(true);
    expect(isPro(state({ subscription: sub("trialing") }))).toBe(true);
  });
  it("is false on canceled, past_due, incomplete, unpaid", () => {
    for (const status of ["canceled", "past_due", "incomplete", "unpaid"] as const) {
      expect(isPro(state({ subscription: sub(status) }))).toBe(false);
    }
  });
});

describe("canCreateExtraDeck", () => {
  it("allows the first deck on free", () => {
    expect(canCreateExtraDeck(state())).toBe(true);
  });
  it("blocks a second deck on free", () => {
    const s = state({
      deck: [
        { id: "c1", concept: "c", front: "f", question: "q", answer: "a", working: "w", hint: "h" },
      ],
      activeDeckId: "deck_1",
    });
    expect(canCreateExtraDeck(s)).toBe(false);
  });
  it("always allows on Pro", () => {
    const s = state({
      subscription: sub("active"),
      deck: [
        { id: "c1", concept: "c", front: "f", question: "q", answer: "a", working: "w", hint: "h" },
      ],
      decks: [
        {
          id: "d2",
          subject: "x",
          material: "",
          focus: "",
          notes: "",
          materialLabel: "l",
          cards: [],
          errorsByCard: {},
        },
      ],
      activeDeckId: "deck_1",
    });
    expect(canCreateExtraDeck(s)).toBe(true);
  });
});

describe("Mock Exam / Live Write / Voice Mode gates", () => {
  it("all three are blocked for free", () => {
    expect(canUseMockExam(state())).toBe(false);
    expect(canUseLiveWrite(state())).toBe(false);
    expect(canUseVoiceMode(state())).toBe(false);
  });
  it("all three are allowed for Pro", () => {
    const s = state({ subscription: sub("active") });
    expect(canUseMockExam(s)).toBe(true);
    expect(canUseLiveWrite(s)).toBe(true);
    expect(canUseVoiceMode(s)).toBe(true);
  });
});

describe("tutorRemaining / canSendTutorMessage", () => {
  const monthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  it("free with nothing tracked returns the full cap", () => {
    expect(tutorRemaining(state())).toBe(LIMITS.freeTutorMessagesPerMonth);
    expect(canSendTutorMessage(state())).toBe(true);
  });

  it("free with messages used this month decrements", () => {
    const s = state({
      tutorMessagesThisMonth: 5,
      tutorPeriodStart: `${monthKey()}-01T00:00:00.000Z`,
    });
    expect(tutorRemaining(s)).toBe(LIMITS.freeTutorMessagesPerMonth - 5);
  });

  it("free with an old period returns a fresh cap", () => {
    const s = state({
      tutorMessagesThisMonth: 30,
      tutorPeriodStart: "2000-01-01T00:00:00.000Z",
    });
    expect(tutorRemaining(s)).toBe(LIMITS.freeTutorMessagesPerMonth);
  });

  it("free at cap blocks further messages", () => {
    const s = state({
      tutorMessagesThisMonth: LIMITS.freeTutorMessagesPerMonth,
      tutorPeriodStart: `${monthKey()}-15T00:00:00.000Z`,
    });
    expect(tutorRemaining(s)).toBe(0);
    expect(canSendTutorMessage(s)).toBe(false);
  });

  it("Pro ignores the cap entirely", () => {
    const s = state({
      subscription: sub("active"),
      tutorMessagesThisMonth: 99999,
      tutorPeriodStart: `${monthKey()}-01T00:00:00.000Z`,
    });
    expect(tutorRemaining(s)).toBe(Infinity);
    expect(canSendTutorMessage(s)).toBe(true);
  });
});

describe("entitlementsOf", () => {
  it("returns a stable snapshot of every gate", () => {
    const e = entitlementsOf(state());
    expect(e).toEqual({
      pro: false,
      canCreateExtraDeck: true,
      canUseMockExam: false,
      canUseLiveWrite: false,
      canUseVoiceMode: false,
      canSendTutorMessage: true,
      tutorRemaining: LIMITS.freeTutorMessagesPerMonth,
    });
  });
});
