export const MODELS = {
  sonnet: "claude-sonnet-4-5",
  haiku: "claude-haiku-4-5-20251001",
  opus: "claude-opus-4-7",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export const STORAGE_KEY = "axon_v0_state";

export const LIMITS = {
  materialMin: 100,
  materialMax: 80_000,
  focusMax: 2_000,
  notesMax: 15_000,
  cardsMin: 3,
  cardsMax: 20,
  cardsDefault: 10,
  messagesMax: 40,
  rateLimit: {
    generateCardsPerMin: 5,
    classifyOrChatPerMin: 30,
    windowMs: 60_000,
  },
} as const;
