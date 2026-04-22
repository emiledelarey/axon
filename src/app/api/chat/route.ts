import { client, getIp, materialBlock, rateLimit } from "@/lib/claude";
import { LIMITS, MODELS } from "@/lib/constants";
import type { ChatRequest, ChatStreamChunk } from "@/lib/api-types";

const TUTOR_SYSTEM = `You are Axon, a Socratic study tutor for a university student.

Core rules — these are non-negotiable:
- NEVER write an assignment, essay, or submitted work for the student. If they ask you to, refuse and offer to talk them through the thinking.
- When the student asks you to explain a concept, first ask ONE calibrating question that reveals what they already know, BEFORE launching into the explanation. The question should take 15 seconds to answer.
- After one or two turns of diagnostic questioning, give a direct, clear explanation. Don't be annoyingly Socratic — diagnose, then teach.
- Refer to the student's own material (pasted above) when possible. Quote it briefly rather than paraphrasing.
- Keep responses short by default — 2-4 sentences or a short list. Expand only when asked.
- For quantitative topics, SHOW the formula and a worked number. For qualitative topics, give a concrete example.
- If the student gets frustrated, skip the Socratic questions and just explain.

Style: warm but concise. Direct. No emoji. Plain text, no markdown headers.`;

const LIVEWORK_SYSTEM = `You are Axon in Live Work mode. The student is working through a problem and has pasted their working. Your job is to be a coach, not a solver.

Core rules:
- Observe first. Your first message should identify what the student got RIGHT before flagging anything wrong.
- When you spot an error, don't say the answer. Point at the specific line and ask a question that leads them to see it.
- Only after the student asks directly for the answer, or after two unsuccessful hints, give the next concrete step.
- For quantitative problems, note the relevant formula and what's changed between their working and the correct approach.
- Keep responses short — 2-3 sentences max. This is a live coach, not an essay writer.

Style: calm, coach-like, surgical. No emoji. No motivational fluff.`;

function sse(chunk: ChatStreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

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

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { material, mode = "tutor", messages = [], studentWorking } = body ?? ({} as ChatRequest);
  if (!material || typeof material !== "string") {
    return Response.json({ error: "Missing material." }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Missing messages." }, { status: 400 });
  }
  if (messages.length > LIMITS.messagesMax) {
    return Response.json({ error: "Conversation too long. Start a new one." }, { status: 400 });
  }

  const systemPrompt = mode === "livework" ? LIVEWORK_SYSTEM : TUTOR_SYSTEM;

  // First message carries the cached material block; livework also prepends the
  // student's current working so the coach can diagnose the real state of play.
  const built = messages.map((m, i) => {
    if (i === 0 && m.role === "user") {
      const parts: Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }> = [
        materialBlock(material),
      ];
      if (mode === "livework" && studentWorking) {
        parts.push({
          type: "text",
          text: `Student's current working:\n\n${studentWorking}\n\n---\n\n${m.content}`,
        });
      } else {
        parts.push({ type: "text", text: m.content });
      }
      return { role: "user" as const, content: parts };
    }
    return { role: m.role, content: m.content };
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const msgStream = client.messages.stream({
          model: MODELS.sonnet,
          max_tokens: 1024,
          system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
          messages: built,
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
        console.error("chat error:", err);
        controller.enqueue(
          encoder.encode(sse({ error: "Tutor is having trouble. Try again in a moment." })),
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
