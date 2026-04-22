import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATE,
  DEMO_DECK,
  addDeckAsActive,
  allSubjects,
  migrateState,
  removeDeck,
  switchToDeck,
  type AppState,
  type InactiveDeck,
} from "./state";
import type { Card } from "./api-types";

function card(id: string, concept = "Concept"): Card {
  return {
    id,
    concept,
    front: "Front",
    question: "Q",
    answer: "A",
    working: "W",
    hint: "H",
  };
}

function inactiveDeck(id: string, subject = "Finance"): InactiveDeck {
  return {
    id,
    subject,
    material: `material for ${id}`,
    focus: "",
    notes: "",
    materialLabel: `${subject} — ${id}`,
    cards: [card(`${id}_a`), card(`${id}_b`)],
    errorsByCard: {},
  };
}

function baseState(overrides: Partial<AppState> = {}): AppState {
  return {
    ...DEFAULT_STATE,
    name: "Sam",
    subject: "Economics",
    material: "active material",
    materialLabel: "Week 3",
    deck: [card("active_1"), card("active_2")],
    activeDeckId: "deck_active",
    onboardingComplete: true,
    ...overrides,
  };
}

describe("migrateState", () => {
  it("fresh state captures referrer from search params and stamps createdAt", () => {
    const search = new URLSearchParams("?via=sarah");
    const next = migrateState(null, search);
    expect(next.referrer).toBe("sarah");
    expect(next.createdAt).toBeTypeOf("string");
    expect(next.deck).toEqual([]);
    expect(next.onboardingComplete).toBe(false);
  });

  it("pre-subject v0 state gets subject: 'General' when a deck exists", () => {
    const legacy = {
      material: "m",
      materialLabel: "Week 1",
      deck: [card("c1")],
      errorsByCard: {},
      referrer: null,
      createdAt: "2026-03-01T00:00:00.000Z",
      // subject, decks, activeDeckId, name, onboardingComplete all missing
    };
    const next = migrateState(legacy);
    expect(next.subject).toBe("General");
    expect(next.decks).toEqual([]);
    expect(next.activeDeckId).toBe(`deck_${Date.parse(legacy.createdAt)}`);
  });

  it("keeps current-shape state intact while filling missing fields", () => {
    const current = baseState({ decks: [inactiveDeck("deck_x")] });
    const next = migrateState(current);
    expect(next.subject).toBe("Economics");
    expect(next.activeDeckId).toBe("deck_active");
    expect(next.decks[0].id).toBe("deck_x");
    expect(next.decks[0].subject).toBe("Finance");
  });

  it("defaults missing subject on inactive decks to 'General'", () => {
    const raw = baseState({
      decks: [{ ...inactiveDeck("deck_x"), subject: "" }],
    });
    const next = migrateState(raw);
    expect(next.decks[0].subject).toBe("General");
  });
});

describe("addDeckAsActive", () => {
  it("pushes the previous active deck to decks[] when it had cards", () => {
    const s = baseState();
    const next = addDeckAsActive(s, {
      subject: "Accounting",
      material: "new material",
      focus: "tax shields",
      notes: "",
      materialLabel: "Week 5 — WACC",
      cards: [card("n1"), card("n2"), card("n3")],
    });
    expect(next.decks).toHaveLength(1);
    expect(next.decks[0].materialLabel).toBe("Week 3");
    expect(next.deck.map((c) => c.id)).toEqual(["n1", "n2", "n3"]);
    expect(next.subject).toBe("Accounting");
    expect(next.activeDeckId).toMatch(/^deck_\d+$/);
    expect(next.errorsByCard).toEqual({});
  });

  it("does not snapshot an empty active deck", () => {
    const s = { ...DEFAULT_STATE };
    const next = addDeckAsActive(s, {
      subject: "",
      material: "m".repeat(50),
      focus: "",
      notes: "",
      materialLabel: "first",
      cards: [card("n1")],
    });
    expect(next.decks).toHaveLength(0);
    expect(next.subject).toBe("General");
  });
});

describe("switchToDeck", () => {
  it("swaps the active deck and stashes the current one", () => {
    const other = inactiveDeck("deck_other", "Finance");
    const s = baseState({ decks: [other] });
    const next = switchToDeck(s, "deck_other");
    expect(next.activeDeckId).toBe("deck_other");
    expect(next.subject).toBe("Finance");
    expect(next.deck.map((c) => c.id)).toEqual(["deck_other_a", "deck_other_b"]);
    expect(next.decks).toHaveLength(1);
    expect(next.decks[0].id).toBe("deck_active");
  });

  it("no-ops if the target id isn't in decks[]", () => {
    const s = baseState();
    const next = switchToDeck(s, "nonexistent");
    expect(next).toBe(s);
  });
});

describe("removeDeck", () => {
  it("promotes the first inactive deck when removing the active one", () => {
    const s = baseState({ decks: [inactiveDeck("deck_promo")] });
    const next = removeDeck(s, "deck_active");
    expect(next.activeDeckId).toBe("deck_promo");
    expect(next.decks).toHaveLength(0);
  });

  it("clears the active slot when no inactive decks remain", () => {
    const s = baseState({ decks: [] });
    const next = removeDeck(s, "deck_active");
    expect(next.activeDeckId).toBeNull();
    expect(next.deck).toEqual([]);
    expect(next.materialLabel).toBe("");
  });

  it("removes an inactive deck without touching the active one", () => {
    const keep = inactiveDeck("deck_keep");
    const drop = inactiveDeck("deck_drop");
    const s = baseState({ decks: [keep, drop] });
    const next = removeDeck(s, "deck_drop");
    expect(next.activeDeckId).toBe("deck_active");
    expect(next.decks).toHaveLength(1);
    expect(next.decks[0].id).toBe("deck_keep");
  });
});

describe("allSubjects", () => {
  it("sorts and de-duplicates across active + inactive decks", () => {
    const s = baseState({
      subject: "Finance",
      decks: [
        inactiveDeck("a", "Accounting"),
        inactiveDeck("b", "Economics"),
        inactiveDeck("c", "Finance"),
      ],
    });
    expect(allSubjects(s)).toEqual(["Accounting", "Economics", "Finance"]);
  });
});

describe("DEMO_DECK", () => {
  it("has three cards with all required fields populated", () => {
    expect(DEMO_DECK).toHaveLength(3);
    for (const c of DEMO_DECK) {
      expect(c.id).toBeTruthy();
      expect(c.concept).toBeTruthy();
      expect(c.front).toBeTruthy();
      expect(c.question).toBeTruthy();
      expect(c.answer).toBeTruthy();
      expect(c.working).toBeTruthy();
      expect(c.hint).toBeTruthy();
    }
  });
});
