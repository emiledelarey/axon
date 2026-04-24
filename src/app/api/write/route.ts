import { client, getIp, rateLimit } from "@/lib/claude";
import { LIMITS, MODELS } from "@/lib/constants";
import type { WriteAction, WriteRequest, WriteStreamChunk } from "@/lib/api-types";

const WRITE_SYSTEM = `You are Axon's writing coach. You help a university student plan, improve, and evaluate an essay — you NEVER write their essay for them.

Core rules — non-negotiable:
- NEVER output a full essay, a full paragraph that could be pasted into a submission, or polished "just drop this in" prose. If the student asks for "write my intro" or "give me a conclusion," refuse and offer scaffolding instead.
- Prefer: outlines, paragraph goals ("this paragraph should argue X with evidence Y"), sentence starters, counterargument prompts, rubric-linked critique, questions that push the student to write it themselves.
- Ground every piece of feedback in either the essay prompt, the rubric, or the student's draft. Quote briefly when pointing at specific text.
- If the rubric is provided, map every critique back to a specific rubric criterion.
- Keep responses tight — short structured blocks, not an essay about their essay.

Style: direct, warm, specific. No emoji. Plain text. Short Markdown headings are OK to organise feedback; no decorative formatting.`;

const ACTIONS: Record<WriteAction, { label: string; focus: string }> = {
  plan: {
    label: "Help me plan",
    focus:
      "Focus: build a structured 5-7 point outline the student can use BEFORE drafting. Ground each point in the prompt and the rubric if provided. If the student already has a draft, propose restructuring — don't rewrite it.",
  },
  thesis: {
    label: "Test my thesis",
    focus:
      "Focus: identify the student's thesis (or help them write one in a single sentence). Name 2 counterarguments or weak spots. Ask: does the thesis survive these? Don't answer your own questions.",
  },
  gaps: {
    label: "Find argument gaps",
    focus:
      "Focus: walk through the draft's argument and name specific missing links, unsupported claims, or unaddressed counters. Be concrete — cite lines or phrases from the draft.",
  },
  rubric: {
    label: "Check rubric alignment",
    focus:
      "Focus: score coverage against each rubric criterion the student provided. If no rubric is given, say so and pivot to general structure/argument critique.",
  },
  paragraph: {
    label: "Improve this paragraph",
    focus:
      "Focus: critique the most substantive paragraph of the draft on structure, argument, and evidence. Offer suggestion frames only — no rewrites, no polished replacement prose.",
  },
  challenge: {
    label: "Challenge my reasoning",
    focus:
      "Focus: pose 3-4 Socratic counter-questions about the student's argument. Don't answer them. Push the student to defend or revise.",
  },
};

function sse(chunk: WriteStreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

const MAX_FIELD = 40_000;

export async function POST(req: Request): Promise<Response> {
  const ip = getIp(req);
  if (
    !rateLimit(ip, {
      max: LIMITS.rateLimit.classifyOrChatPerMin,
      windowMs: LIMITS.rateLimit.windowMs,
    })
  ) {
    return Response.json({ error: "Slow down — try again in a minute." }, { status: 429 });
  }

  let body: WriteRequest;
  try {
    body = (await req.json()) as WriteRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = String(body?.prompt ?? "").trim();
  const rubric = String(body?.rubric ?? "").trim();
  const draft = String(body?.draft ?? "").trim();
  const notes = String(body?.notes ?? "").trim();
  const action = body?.action;

  if (!prompt) return Response.json({ error: "Missing essay prompt." }, { status: 400 });
  if (!draft) return Response.json({ error: "Missing draft or outline." }, { status: 400 });
  if (!action || !(action in ACTIONS)) {
    return Response.json({ error: "Unknown action." }, { status: 400 });
  }
  if (
    prompt.length > MAX_FIELD ||
    rubric.length > MAX_FIELD ||
    draft.length > MAX_FIELD ||
    notes.length > MAX_FIELD
  ) {
    return Response.json({ error: "One of your fields is too long." }, { status: 400 });
  }

  const { focus } = ACTIONS[action];

  const userText = `${focus}

Essay prompt:
${prompt}
${rubric ? `\nRubric:\n${rubric}\n` : ""}${notes ? `\nStudent notes:\n${notes}\n` : ""}
Draft / outline:
${draft}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const msgStream = client.messages.stream({
          model: MODELS.sonnet,
          max_tokens: 1400,
          system: [{ type: "text", text: WRITE_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: userText }],
            },
          ],
        });

        for await (const event of msgStream) {
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            controller.enqueue(encoder.encode(sse({ text: event.delta.text })));
          }
        }

        const final = await msgStream.finalMessage();
        controller.enqueue(
          encoder.encode(
            sse({
              done: true,
              meta: {
                inputTokens: final.usage?.input_tokens ?? 0,
                cacheReadInputTokens: final.usage?.cache_read_input_tokens ?? 0,
                outputTokens: final.usage?.output_tokens ?? 0,
              },
            }),
          ),
        );
      } catch (err) {
        console.error("write error:", err);
        controller.enqueue(
          encoder.encode(sse({ error: "Writing coach is having trouble. Try again in a moment." })),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
