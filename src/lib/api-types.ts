// Shared request/response types between the Next.js API routes and the client
// helpers in src/lib/api.ts. Keep these shapes aligned with the v0 behaviour in
// Axon_MVP_5.html — every field that crosses the wire is declared here.

export type Card = {
  id: string;
  concept: string;
  front: string;
  question: string;
  answer: string;
  working: string;
  hint: string;
};

export type GenerateCardsRequest = {
  material: string;
  focus?: string;
  notes?: string;
  count?: number;
};

export type GenerateCardsMeta = {
  count: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  inputTokens: number;
  outputTokens: number;
};

export type GenerateCardsResponse = {
  cards: Card[];
  meta: GenerateCardsMeta;
};

export type ErrorClassification =
  | "knowledge-gap"
  | "misconception"
  | "careless"
  | "prerequisite-gap";

export type ClassifyErrorRequest = {
  material: string;
  card: Pick<Card, "concept" | "front" | "question" | "answer" | "working">;
  userAnswer?: string;
};

export type MicroLesson = {
  headline: string;
  explanation: string;
  formula?: string;
  worked: string;
};

export type ClassifyErrorResponse = {
  classification: ErrorClassification;
  diagnosis: string;
  walkback: string[];
  brokenLink: string;
  microLesson: MicroLesson;
  meta: {
    inputTokens: number;
    cacheReadInputTokens: number;
    outputTokens: number;
  };
};

export type ChatMode = "tutor" | "livework";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  material: string;
  mode: ChatMode;
  messages: ChatMessage[];
  studentWorking?: string;
};

export type ChatStreamChunk =
  | { text: string }
  | {
      done: true;
      meta: { inputTokens: number; cacheReadInputTokens: number; outputTokens: number };
    }
  | { error: string };

export type ApiErrorResponse = { error: string };

export type WriteAction = "plan" | "thesis" | "gaps" | "rubric" | "paragraph" | "challenge";

export type WriteRequest = {
  prompt: string;
  rubric?: string;
  draft: string;
  notes?: string;
  action: WriteAction;
};

// Shares ChatStreamChunk's shape on purpose — same SSE framing, client helpers,
// and fallbacks all work unchanged.
export type WriteStreamChunk = ChatStreamChunk;
