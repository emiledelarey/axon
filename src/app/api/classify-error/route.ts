import { client, materialBlock, rateLimit, extractJson } from "@/lib/claude";
import { LIMITS, MODELS } from "@/lib/constants";
import { logError } from "@/lib/log";
import { requireUser, unauthorized } from "@/lib/server-auth";
import type {
  ClassifyErrorRequest,
  ClassifyErrorResponse,
  ErrorClassification,
} from "@/lib/api-types";

// Non-streaming Claude call; can exceed the 10s default on slow runs.
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Axon's error classifier. A student just missed a flashcard. Your job is to:

1. Classify the error into ONE of: knowledge-gap, misconception, careless, prerequisite-gap.
   - knowledge-gap: the student never learned this specific thing.
   - misconception: the student has learned a WRONG version. Common traps — using pre-tax debt in WACC, confusing accrual with cash basis, mixing up elasticity sign conventions.
   - careless: the approach is right but arithmetic or a step was fumbled. Only classify as careless if there's clear evidence.
   - prerequisite-gap: the student doesn't understand a concept this one depends on. Most common for multi-step concepts (CAPM depends on risk premium, NPV depends on discounting, etc).

2. Walk back through the prerequisite chain and identify the WEAKEST LINK — the concept where the student's understanding actually breaks down. This is not always the card's topic. Example: a student failing CAPM might actually have a shaky understanding of market risk premium.

3. Write a 90-second micro-lesson that fixes the weakest link, not the card topic directly. Build from firm ground back to the card.

Output format: JSON object with keys: classification, diagnosis, walkback (array of 3-4 concept names from mastered to broken), brokenLink, microLesson ({ headline, explanation, formula (optional, only for quantitative), worked }).

Return ONLY the JSON. No preamble. No code fences.`;

const CLASSIFICATIONS: ErrorClassification[] = [
  "knowledge-gap",
  "misconception",
  "careless",
  "prerequisite-gap",
];

export async function POST(req: Request): Promise<Response> {
  const authed = await requireUser();
  if (!authed) return unauthorized();
  const { userId } = authed;

  if (
    !rateLimit(userId, {
      max: LIMITS.rateLimit.classifyOrChatPerMin,
      windowMs: LIMITS.rateLimit.windowMs,
    })
  ) {
    return Response.json({ error: "Slow down — try again in a minute." }, { status: 429 });
  }

  let body: ClassifyErrorRequest;
  try {
    body = (await req.json()) as ClassifyErrorRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { material, card, userAnswer } = body ?? ({} as ClassifyErrorRequest);
  if (!material || !card?.concept || !card?.question || !card?.answer) {
    return Response.json({ error: "Missing material or card details." }, { status: 400 });
  }

  try {
    const response = await client.messages.create({
      model: MODELS.sonnet,
      max_tokens: 1500,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            materialBlock(material),
            {
              type: "text",
              text: `The student missed this card:

Concept: ${card.concept}
Front: ${card.front || card.concept}
Question: ${card.question}
Correct answer: ${card.answer}
Correct working: ${card.working}
${
  userAnswer
    ? `\nStudent's answer: ${userAnswer}`
    : `\n(The student flipped to the answer and marked 'Again' without submitting an attempt.)`
}

Classify the error, walk back the prerequisite chain, and write a 90-second micro-lesson that rebuilds understanding from the weakest link forward. Return JSON only.`,
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b): b is { type: "text"; text: string } & typeof b => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const raw = extractJson<{
      classification?: string;
      diagnosis?: string;
      walkback?: unknown;
      brokenLink?: string;
      microLesson?: {
        headline?: string;
        explanation?: string;
        formula?: string;
        worked?: string;
      };
    }>(text);

    const classification: ErrorClassification =
      typeof raw.classification === "string" &&
      CLASSIFICATIONS.includes(raw.classification as ErrorClassification)
        ? (raw.classification as ErrorClassification)
        : "prerequisite-gap";

    const normalised: ClassifyErrorResponse = {
      classification,
      diagnosis: String(raw.diagnosis || ""),
      walkback: Array.isArray(raw.walkback)
        ? (raw.walkback as unknown[]).map(String).slice(0, 6)
        : [],
      brokenLink: String(raw.brokenLink || ""),
      microLesson: {
        headline: String(raw.microLesson?.headline || ""),
        explanation: String(raw.microLesson?.explanation || ""),
        formula: raw.microLesson?.formula ? String(raw.microLesson.formula) : undefined,
        worked: String(raw.microLesson?.worked || ""),
      },
      meta: {
        inputTokens: response.usage?.input_tokens ?? 0,
        cacheReadInputTokens: response.usage?.cache_read_input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
      },
    };

    return Response.json(normalised);
  } catch (err) {
    logError("api.classify-error", err);
    return Response.json(
      {
        error: "Couldn't run the error classifier. Try again.",
        detail: process.env.NODE_ENV === "development" ? String(err) : undefined,
      },
      { status: 500 },
    );
  }
}
