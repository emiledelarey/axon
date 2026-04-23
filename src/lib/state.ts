import type { Card } from "./api-types";

/**
 * A deck that isn't currently active. The active deck's fields live at the top
 * level of AppState (legacy v0 flat shape) — this type describes the stashed
 * decks in state.decks[].
 */
export type InactiveDeck = {
  id: string;
  subject: string;
  material: string;
  focus: string;
  notes: string;
  materialLabel: string;
  cards: Card[];
  errorsByCard: Record<string, number>;
};

/** Full persisted state. Mirrors axon-v0 DEFAULT_STATE verbatim. */
export type AppState = {
  // User
  name: string;
  referrer: string | null;
  createdAt: string | null;
  onboardingComplete: boolean;

  // Active deck (flat at top level for migration compatibility)
  subject: string;
  material: string;
  focus: string;
  notes: string;
  materialLabel: string;
  deck: Card[];
  errorsByCard: Record<string, number>;
  activeDeckId: string | null;

  // Other decks the user has added
  decks: InactiveDeck[];

  // Stats
  streak: number;
  xp: number;
  lastStudyDate: string | null;
  sessionsCompleted: number;
};

export const DEFAULT_STATE: AppState = {
  name: "",
  subject: "",
  material: "",
  focus: "",
  notes: "",
  materialLabel: "",
  deck: [],
  errorsByCard: {},
  activeDeckId: null,
  decks: [],
  streak: 0,
  xp: 0,
  lastStudyDate: null,
  sessionsCompleted: 0,
  referrer: null,
  createdAt: null,
  onboardingComplete: false,
};

/**
 * Hardcoded 3-card deck used when the student clicks "Skip — load demo deck" in
 * onboarding, or when the backend API is unreachable and we still want the app
 * to be explorable.
 */
export const DEMO_DECK: Card[] = [
  {
    id: "demo_1",
    concept: "Opportunity cost",
    front: "Give the two-sentence definition.",
    question:
      "You spend $50 on a concert ticket instead of a textbook you needed. What is your opportunity cost?",
    answer: "The textbook",
    working:
      "Opportunity cost = the value of the next-best alternative forgone. If the textbook was your second choice, that's what you gave up — not the $50.",
    hint: "It's not the dollar amount. It's what you could have had instead.",
  },
  {
    id: "demo_2",
    concept: "Elasticity of demand",
    front: "What makes demand elastic?",
    question: "If a 10% price rise causes a 25% drop in demand, what is the price elasticity?",
    answer: "-2.5 (elastic)",
    working:
      "E = %ΔQ / %ΔP = -25% / +10% = -2.5. |E| > 1 means demand is elastic — quantity responds sharply to price.",
    hint: "Divide the percentage change in quantity by the percentage change in price.",
  },
  {
    id: "demo_3",
    concept: "Marginal revenue",
    front: "Define MR in one sentence.",
    question: "Under perfect competition, why does marginal revenue equal the market price?",
    answer: "Each firm is a price-taker — selling one more unit adds exactly P in revenue.",
    working:
      "In perfect competition the firm faces a horizontal demand curve at P. Selling one more unit doesn't lower the price (firm is too small to move the market), so MR = P exactly. Under imperfect competition, extra sales require lowering price, so MR < P.",
    hint: "Think about whether one more unit affects the price the firm can charge.",
  },
];

/** Pack the currently-active deck as an InactiveDeck snapshot for stashing. */
function snapshotActiveAsInactive(state: AppState): InactiveDeck {
  return {
    id: state.activeDeckId || `deck_${Date.now() - 1}`,
    subject: state.subject || "General",
    material: state.material,
    focus: state.focus || "",
    notes: state.notes || "",
    materialLabel: state.materialLabel,
    cards: state.deck,
    errorsByCard: state.errorsByCard || {},
  };
}

/**
 * Swap the active deck with one from state.decks. The current active deck is
 * pushed into decks[] so it isn't lost.
 */
export function switchToDeck(state: AppState, deckId: string): AppState {
  const target = state.decks.find((d) => d.id === deckId);
  if (!target) return state;
  const currentAsInactive = snapshotActiveAsInactive(state);
  return {
    ...state,
    decks: [...state.decks.filter((d) => d.id !== deckId), currentAsInactive],
    activeDeckId: target.id,
    subject: target.subject || "General",
    material: target.material,
    focus: target.focus || "",
    notes: target.notes || "",
    materialLabel: target.materialLabel,
    deck: target.cards,
    errorsByCard: target.errorsByCard || {},
  };
}

export type NewDeckInput = {
  subject: string;
  material: string;
  focus: string;
  notes: string;
  materialLabel: string;
  cards: Card[];
};

/**
 * Add a new deck and make it active. Pushes the current active deck (if any)
 * into decks[] first so no work is lost. Clears errorsByCard for the new deck.
 */
export function addDeckAsActive(state: AppState, input: NewDeckInput): AppState {
  const currentHasData = Array.isArray(state.deck) && state.deck.length > 0;
  const currentAsInactive: InactiveDeck[] = currentHasData ? [snapshotActiveAsInactive(state)] : [];
  const newId = `deck_${Date.now()}`;
  return {
    ...state,
    decks: [...state.decks, ...currentAsInactive],
    activeDeckId: newId,
    subject: input.subject || "General",
    material: input.material,
    focus: input.focus || "",
    notes: input.notes || "",
    materialLabel: input.materialLabel,
    deck: input.cards,
    errorsByCard: {},
  };
}

/**
 * Delete a deck. If it's the active one, promotes the first inactive deck to
 * active (or empties the active slot if none remain).
 */
export function removeDeck(state: AppState, deckId: string): AppState {
  if (deckId === state.activeDeckId) {
    if (state.decks.length === 0) {
      return {
        ...state,
        subject: "",
        material: "",
        focus: "",
        notes: "",
        materialLabel: "",
        deck: [],
        errorsByCard: {},
        activeDeckId: null,
      };
    }
    const [next, ...rest] = state.decks;
    return {
      ...state,
      decks: rest,
      activeDeckId: next.id,
      subject: next.subject || "General",
      material: next.material,
      focus: next.focus || "",
      notes: next.notes || "",
      materialLabel: next.materialLabel,
      deck: next.cards,
      errorsByCard: next.errorsByCard || {},
    };
  }
  return { ...state, decks: state.decks.filter((d) => d.id !== deckId) };
}

/** Sorted list of unique subjects across active + inactive decks. */
export function allSubjects(state: AppState): string[] {
  const set = new Set<string>();
  if (state.subject) set.add(state.subject);
  state.decks.forEach((d) => {
    if (d.subject) set.add(d.subject);
  });
  return Array.from(set).sort();
}

/**
 * Normalise whatever's in localStorage into a valid AppState. Handles:
 * - brand-new (null/undefined/junk) — returns DEFAULT_STATE with URL referrer
 * - v0 pre-subject state — adds subject: 'General' if a deck exists
 * - current shape — returned as-is, filling any missing fields from defaults
 *
 * Takes the URL for referrer capture so it can run during SSR without window.
 */
export function migrateState(raw: unknown, search?: URLSearchParams): AppState {
  if (raw === null || raw === undefined) {
    return {
      ...DEFAULT_STATE,
      referrer: search?.get("via") ?? null,
      createdAt: new Date().toISOString(),
    };
  }
  if (typeof raw !== "object") {
    return { ...DEFAULT_STATE, createdAt: new Date().toISOString() };
  }

  const parsed = { ...DEFAULT_STATE, ...(raw as Partial<AppState>) };

  if (!Array.isArray(parsed.decks)) parsed.decks = [];

  if (!parsed.activeDeckId && Array.isArray(parsed.deck) && parsed.deck.length > 0) {
    const createdAt = parsed.createdAt ? Date.parse(parsed.createdAt) : NaN;
    const ts = Number.isFinite(createdAt) ? createdAt : Date.now();
    parsed.activeDeckId = `deck_${ts}`;
  }

  if (!parsed.subject && Array.isArray(parsed.deck) && parsed.deck.length > 0) {
    parsed.subject = "General";
  }

  parsed.decks = parsed.decks.map((d) => ({
    ...d,
    subject: d.subject || "General",
    errorsByCard: d.errorsByCard || {},
  }));

  return parsed;
}
