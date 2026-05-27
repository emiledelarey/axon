import { client, materialBlock, rateLimit, extractJson } from "@/lib/claude";
import { LIMITS, MODELS } from "@/lib/constants";
import { logError } from "@/lib/log";
import { requireUser, unauthorized } from "@/lib/server-auth";
import type { Card, GenerateCardsRequest, GenerateCardsResponse } from "@/lib/api-types";

// Sonnet generating 10 cards from a long paste regularly exceeds the 10s
// default; bump to Hobby+Fluid's max so we stop returning HTML on timeout.
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Axon, an AI study companion that turns pasted study material into active-recall flashcards.

Rules for card design:
- Each card tests ONE concept. Do not cram.
- The FRONT is a short, punchy cue (under 12 words). Ideally a concept name or a "When do you use X?" question.
- The QUESTION is a specific, testable problem. For quantitative topics, include actual numbers the student can compute. For qualitative topics, ask for a concrete application, not a definition.
- The ANSWER is short — a number, a short phrase, a ranked list. Not a paragraph.
- The WORKING shows the step-by-step reasoning or the full explanation. Use plain text; show formulas inline.
- The HINT is what a good tutor would say if the student was stuck, without giving the answer away.

Coverage rules:
- Extract the core concepts that appear MULTIPLE times in the source, or are emphasised, or are clearly foundational. Ignore trivia.
- If the material is structured (headings, lists), use that structure.
- If the material is long, prioritise breadth over depth — better to cover more concepts with one card each than to generate 5 cards on one topic.

Output format: a JSON array of card objects. Each object has: concept (string), front (string), question (string), answer (string), working (string), hint (string). Return ONLY the JSON array, no preamble, no code fences.`;

export async function POST(req: Request): Promise<Response> {
  const authed = await requireUser();
  if (!authed) return unauthorized();
  const { userId } = authed;

  if (
    !rateLimit(userId, {
      max: LIMITS.rateLimit.generateCardsPerMin,
      windowMs: LIMITS.rateLimit.windowMs,
    })
  ) {
    return Response.json({ error: "Slow down — try again in a minute." }, { status: 429 });
  }

  let body: GenerateCardsRequest;
  try {
    body = (await req.json()) as GenerateCardsRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { material, focus = "", notes = "", count = LIMITS.cardsDefault } = body ?? {};

  if (!material || typeof material !== "string" || material.trim().length < LIMITS.materialMin) {
    return Response.json(
      { error: `Paste at least ${LIMITS.materialMin} characters of study material.` },
      { status: 400 },
    );
  }
  if (material.length > LIMITS.materialMax) {
    return Response.json(
      {
        error: `Material too long. Max ${LIMITS.materialMax.toLocaleString()} characters per deck.`,
      },
      { status: 400 },
    );
  }
  if (typeof focus === "string" && focus.length > LIMITS.focusMax) {
    return Response.json({ error: "Focus section is too long." }, { status: 400 });
  }
  if (typeof notes === "string" && notes.length > LIMITS.notesMax) {
    return Response.json({ error: "Notes section is too long." }, { status: 400 });
  }

  const cardCount = Math.min(
    Math.max(parseInt(String(count), 10) || LIMITS.cardsDefault, LIMITS.cardsMin),
    LIMITS.cardsMax,
  );

  const focusBlock = focus.trim()
    ? `\n\nFOCUS — the student flagged these topics or priorities. Bias your card coverage toward them:\n${focus.trim()}`
    : "";
  const notesBlock = notes.trim()
    ? `\n\nSTUDENT NOTES — their own interpretation or summary of the material. Use these to calibrate card depth and to spot misconceptions worth testing:\n${notes.trim()}`
    : "";

  try {
    const response = await client.messages.create({
      model: MODELS.sonnet,
      max_tokens: 4096,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            materialBlock(material),
            {
              type: "text",
              text: `Generate exactly ${cardCount} flashcards from the material above. Return the JSON array only.${focusBlock}${notesBlock}`,
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b): b is { type: "text"; text: string } & typeof b => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const cards = extractJson<Array<Partial<Card>>>(text);
    if (!Array.isArray(cards)) {
      throw new Error("Model did not return a JSON array");
    }

    const now = Date.now();
    const withIds: Card[] = cards.map((c, i) => ({
      id: `c_${now}_${i}`,
      concept: String(c.concept || "Untitled"),
      front: String(c.front || ""),
      question: String(c.question || ""),
      answer: String(c.answer || ""),
      working: String(c.working || ""),
      hint: String(c.hint || ""),
    }));

    const payload: GenerateCardsResponse = {
      cards: withIds,
      meta: {
        count: withIds.length,
        cacheCreationInputTokens: response.usage?.cache_creation_input_tokens ?? 0,
        cacheReadInputTokens: response.usage?.cache_read_input_tokens ?? 0,
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
      },
    };
    return Response.json(payload);
  } catch (err) {
    logError("api.generate-cards", err);
    return Response.json(
      {
        error: "Couldn't generate cards. Please try again.",
        detail: process.env.NODE_ENV === "development" ? String(err) : undefined,
      },
      { status: 500 },
    );
  }
}
