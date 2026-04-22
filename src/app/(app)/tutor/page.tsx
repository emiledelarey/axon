"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Btn } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { AxonMark } from "@/components/ui/AxonMark";
import { Icon } from "@/components/ui/Icon";
import { API_AVAILABLE, apiChatStream, fallbackChatResponse } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string; t: string };

export default function TutorPage() {
  const { state } = useAppState();

  const openingLine = useMemo(() => {
    if (state.materialLabel) {
      return `Hi${state.name ? ` ${state.name}` : ""}. I've read your material (${state.materialLabel}). What are you working on?`;
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
        padding: "1.5rem 2rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        maxWidth: 900,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <span className="eyebrow">Tutor Chat</span>
        <h1
          className="italic-serif"
          style={{ fontSize: 30, margin: "0.25rem 0 0", fontWeight: 400 }}
        >
          Socratic. Knows your material. Never writes your assignment.
        </h1>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          paddingRight: 8,
          marginBottom: 20,
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
                padding: "0.9rem 1.1rem",
                borderRadius: 10,
                background: m.role === "user" ? "var(--surface-2)" : "var(--surface)",
                border:
                  m.role === "user" ? "1px solid var(--border-bright)" : "1px solid var(--border)",
                fontSize: 14,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content ||
                (streaming && i === messages.length - 1 ? (
                  <span style={{ opacity: 0.5 }}>...</span>
                ) : (
                  ""
                ))}
            </div>
          </div>
        ))}
        {error && (
          <div
            style={{
              padding: "0.75rem",
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

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          placeholder="Ask anything..."
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
          disabled={streaming}
        />
        <Btn
          variant="primary"
          size="md"
          icon={streaming ? undefined : Icon.send}
          onClick={send}
          disabled={streaming || !input.trim()}
        >
          {streaming ? <Spinner size={12} /> : "Send"}
        </Btn>
      </div>
    </div>
  );
}
