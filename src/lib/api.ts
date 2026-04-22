import type {
  Card,
  ChatMessage,
  ChatMode,
  ChatStreamChunk,
  ClassifyErrorResponse,
  GenerateCardsRequest,
  GenerateCardsResponse,
} from "./api-types";

/**
 * True when the app is being served over http(s) — i.e. the API routes can be
 * reached. False when the same HTML is opened via file://, in which case the
 * client-side fallbacks take over. Preserved from v0 so the same HTML can still
 * be dragged into a browser as a last-resort demo.
 */
export const API_AVAILABLE =
  typeof window !== "undefined" && !window.location.protocol.startsWith("file");

export async function apiGenerateCards(
  input: GenerateCardsRequest,
): Promise<GenerateCardsResponse> {
  const res = await fetch("/api/generate-cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      material: input.material,
      focus: input.focus ?? "",
      notes: input.notes ?? "",
      count: input.count ?? 10,
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Network error" }))) as {
      error?: string;
    };
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as GenerateCardsResponse;
}

export async function apiClassifyError(
  material: string,
  card: Pick<Card, "concept" | "front" | "question" | "answer" | "working">,
  userAnswer?: string,
): Promise<ClassifyErrorResponse> {
  const res = await fetch("/api/classify-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ material, card, userAnswer }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Network error" }))) as {
      error?: string;
    };
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as ClassifyErrorResponse;
}

export async function apiChatStream(
  input: {
    material: string;
    mode: ChatMode;
    messages: ChatMessage[];
    studentWorking?: string;
  },
  onChunk: (chunk: ChatStreamChunk) => void,
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Network error" }))) as {
      error?: string;
    };
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const data = JSON.parse(payload) as ChatStreamChunk;
        onChunk(data);
      } catch {
        /* swallow malformed SSE frames */
      }
    }
  }
}

/**
 * Fallback micro-lesson used when the backend is unreachable (file:// or a
 * network failure). Shape matches ClassifyErrorResponse so the UI doesn't need
 * to branch.
 */
export function fallbackClassifyError(
  card: Pick<Card, "concept" | "working">,
): Promise<ClassifyErrorResponse> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          classification: "prerequisite-gap",
          diagnosis: `Your error on ${card.concept} suggests the issue is one concept upstream — not the formula itself.`,
          walkback: [card.concept, "Underlying rule", "Building block", "Foundation"],
          brokenLink: "Underlying rule",
          microLesson: {
            headline: `${card.concept} depends on one rule most students skip.`,
            explanation:
              "The common mistake is memorising the formula without understanding what it measures. Read the working — notice which step required a definition, not plugging numbers.",
            worked: card.working,
          },
          meta: { inputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0 },
        }),
      1400,
    ),
  );
}

/**
 * Fallback streaming tutor reply used when the backend is unreachable. Streams
 * a fixed Socratic question chunk-by-chunk so the UI animation still works.
 */
export function fallbackChatResponse(
  _userMessage: string,
  onChunk: (chunk: ChatStreamChunk) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const reply =
      "Before I answer — what made you ask this specifically? Walk me through what you already know, even roughly. The best teaching happens when I can see where your thinking is.";
    let i = 0;
    const interval = setInterval(() => {
      if (i < reply.length) {
        onChunk({ text: reply.slice(i, i + 3) });
        i += 3;
      } else {
        onChunk({
          done: true,
          meta: { inputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0 },
        });
        clearInterval(interval);
        resolve();
      }
    }, 28);
  });
}
