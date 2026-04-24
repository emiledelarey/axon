"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Btn } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Spinner } from "@/components/ui/Spinner";
import { AxonMark } from "@/components/ui/AxonMark";
import { Icon } from "@/components/ui/Icon";
import { API_AVAILABLE, apiChatStream, fallbackChatResponse } from "@/lib/api";
import { canSendTutorMessage, isPro, tutorRemaining } from "@/lib/entitlements";

type Msg = { role: "user" | "assistant"; content: string; t: string };

// Per Perplexity brief: one-tap actions that prefill the composer so the
// student can edit before sending. Keeps the dialogue feeling Socratic —
// these are prompts *to* the tutor, not buttons that auto-post.
const QUICK_ACTIONS = [
  {
    label: "Explain simply",
    prompt: "Explain the key idea of our material as if I'm seeing it for the first time.",
  },
  {
    label: "Quiz me",
    prompt: "Quiz me on the material. One question at a time, start with the foundational concept.",
  },
  {
    label: "Give example",
    prompt: "Give me a concrete worked example using numbers from the material.",
  },
  {
    label: "Compare concepts",
    prompt:
      "Compare the two concepts I'm most likely confusing in this material. What's the specific difference?",
  },
] as const;

export default function TutorPage() {
  const { state, update } = useAppState();
  const pro = isPro(state);
  const remaining = tutorRemaining(state);
  const canSend = canSendTutorMessage(state);

  const openingLine = useMemo(() => {
    if (state.materialLabel) {
      return `Hi${state.name ? ` ${state.name}` : ""}. I've read your material (${state.materialLabel}). Ask anything — I'll diagnose first, then teach.`;
    }
    return `Hi${state.name ? ` ${state.name}` : ""}. Paste some material first if you want me to be deck-aware. Otherwise, ask anything — I'll help you reason through it.`;
  }, [state.materialLabel, state.name]);

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: openingLine,
      t: new Date().toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!input.trim() || streaming) return;
    if (!canSend) {
      setError("You've used your 30 tutor messages this month. Upgrade to Pro for unlimited chat.");
      return;
    }
    setError(null);
    const now = new Date().toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMsg: Msg = { role: "user", content: input, t: now };
    const aiMsg: Msg = { role: "assistant", content: "", t: now };
    const next = [...messages, userMsg];
    setMessages([...next, aiMsg]);
    const sendMessages = next.map((m) => ({ role: m.role, content: m.content }));
    const userInput = input;
    setInput("");
    setStreaming(true);

    // Free-tier metering: count every *user* message, roll over at month start.
    if (!pro) {
      const d = new Date();
      const firstOfMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const sameMonth = state.tutorPeriodStart?.slice(0, 7) === firstOfMonth.slice(0, 7);
      update({
        tutorPeriodStart: sameMonth ? state.tutorPeriodStart : firstOfMonth,
        tutorMessagesThisMonth: sameMonth ? state.tutorMessagesThisMonth + 1 : 1,
      });
    }

    const onChunk = (chunk: unknown) => {
      const c = chunk as { text?: string; error?: string };
      if (c.text) {
        setMessages((msgs) => {
          const last = msgs[msgs.length - 1];
          return [...msgs.slice(0, -1), { ...last, content: last.content + c.text }];
        });
      }
      if (c.error) setError(c.error);
    };

    try {
      if (API_AVAILABLE && state.material) {
        await apiChatStream(
          { material: state.material, mode: "tutor", messages: sendMessages },
          onChunk,
        );
      } else {
        await fallbackChatResponse(userInput, onChunk);
      }
    } catch {
      await fallbackChatResponse(userInput, onChunk);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        padding: "1rem 1.5rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        maxWidth: 900,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <span className="eyebrow">Tutor Chat</span>
        <h1
          className="italic-serif"
          style={{ fontSize: 22, margin: "0.2rem 0 0", fontWeight: 400 }}
        >
          Socratic. Knows your material. Never writes your assignment.
        </h1>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          {state.materialLabel ? (
            <Chip tone="accent">
              <Icon.book size={10} /> Using: {state.materialLabel}
            </Chip>
          ) : (
            <Chip>No material loaded — general tutor</Chip>
          )}
          <Chip>Concepts dialogue · use Problem Coach for working</Chip>
          {pro ? (
            <Chip tone="accent">
              <Icon.sparkles size={10} /> Pro · unlimited
            </Chip>
          ) : (
            <Chip tone={remaining <= 5 ? "warn" : "info"}>
              {remaining} / 30 messages left this month
            </Chip>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          paddingRight: 8,
          marginBottom: 14,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className="fade-in"
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "78%",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginLeft: m.role === "user" ? "auto" : 0,
              }}
            >
              {m.role === "assistant" ? (
                <>
                  <AxonMark size={12} />
                  <span className="eyebrow" style={{ color: "var(--accent)" }}>
                    Axon
                  </span>
                </>
              ) : (
                <span className="eyebrow">You</span>
              )}
              <span className="font-mono" style={{ fontSize: 10, color: "var(--text-fade)" }}>
                {m.t}
              </span>
            </div>
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: 10,
                background: m.role === "user" ? "var(--surface-2)" : "var(--surface)",
                border:
                  m.role === "user" ? "1px solid var(--border-bright)" : "1px solid var(--border)",
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content ||
                (streaming && i === messages.length - 1 ? (
                  <span style={{ opacity: 0.5 }}>…</span>
                ) : (
                  ""
                ))}
            </div>
          </div>
        ))}
        {error && (
          <div
            style={{
              padding: "0.65rem 0.8rem",
              background: "rgba(229,111,76,0.08)",
              border: "1px solid var(--danger)",
              borderRadius: 6,
              color: "var(--danger)",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Quick actions — prefill the composer so the student can tweak before sending */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => setInput(a.prompt)}
            disabled={streaming}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: 16,
              border: "1px solid var(--border-bright)",
              background: "transparent",
              color: "var(--text-dim)",
              fontSize: 11,
              fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
              cursor: streaming ? "not-allowed" : "pointer",
              opacity: streaming ? 0.5 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!streaming) {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-bright)";
              e.currentTarget.style.color = "var(--text-dim)";
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {!canSend && (
        <div
          style={{
            padding: "0.9rem 1rem",
            marginBottom: 10,
            borderRadius: 8,
            border: "1px solid var(--accent-dim)",
            background: "rgba(0,230,168,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Icon.sparkles size={14} color="var(--accent)" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 2 }}>
              You&apos;ve used your 30 tutor messages this month.
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
              Upgrade to Pro for unlimited tutor chat, Mock Exam, Live Write, and voice mode.
            </div>
          </div>
          <Link
            href="/pricing"
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: 6,
              background: "var(--accent)",
              color: "var(--bg)",
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Upgrade · A$20/mo
          </Link>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          placeholder={canSend ? "Ask anything..." : "Tutor cap reached — upgrade to continue"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          style={{ flex: 1, resize: "none", fontSize: 14 }}
          disabled={streaming || !canSend}
        />
        <Btn
          variant="primary"
          size="md"
          icon={streaming ? undefined : Icon.send}
          onClick={send}
          disabled={streaming || !input.trim() || !canSend}
        >
          {streaming ? <Spinner size={12} /> : "Send"}
        </Btn>
      </div>
    </div>
  );
}
