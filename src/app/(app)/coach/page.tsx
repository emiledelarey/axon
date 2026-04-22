"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Btn } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Spinner } from "@/components/ui/Spinner";
import { AxonMark } from "@/components/ui/AxonMark";
import { Icon } from "@/components/ui/Icon";
import {
  API_AVAILABLE,
  apiChatStream,
  fallbackChatResponse,
} from "@/lib/api";

type Hint = {
  id: number;
  t: string;
  role: "user" | "assistant";
  text: string;
};

export default function CoachPage() {
  const { state } = useAppState();
  const [problem, setProblem] = useState("");
  const [working, setWorking] = useState("");
  const [hints, setHints] = useState<Hint[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [hints]);

  const ask = async (userMessage: string) => {
    setError(null);
    setStreaming(true);
    const now = new Date().toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userHint: Hint = { id: Date.now(), t: now, role: "user", text: userMessage };
    const aiHint: Hint = { id: Date.now() + 1, t: now, role: "assistant", text: "" };
    setHints((h) => [...h, userHint, aiHint]);

    const onChunk = (chunk: unknown) => {
      const c = chunk as { text?: string; error?: string };
      if (c.text) {
        setHints((h) =>
          h.map((x) => (x.id === aiHint.id ? { ...x, text: x.text + c.text } : x)),
        );
      }
      if (c.error) setError(c.error);
    };

    try {
      if (API_AVAILABLE && state.material) {
        const messages = [
          ...hints.map((h) => ({ role: h.role, content: h.text })),
          { role: "user" as const, content: userMessage },
        ];
        await apiChatStream(
          {
            material: state.material,
            mode: "livework",
            messages,
            studentWorking: working,
          },
          onChunk,
        );
      } else {
        await fallbackChatResponse(userMessage, onChunk);
      }
    } catch {
      await fallbackChatResponse(userMessage, onChunk);
    } finally {
      setStreaming(false);
    }
  };

  const checkWork = () => {
    if (!problem.trim() && !working.trim()) {
      setError("Paste a problem or some working first.");
      return;
    }
    const prompt = problem.trim()
      ? `Here's the problem: ${problem}\n\nCheck my working and point me to the next step.`
      : "Check my working and point me to the next step.";
    ask(prompt);
  };

  const askForHint = () => {
    if (!problem.trim() && !working.trim()) {
      setError("Paste a problem or some working first.");
      return;
    }
    ask("I'm stuck. Give me a hint — don't tell me the answer.");
  };

  return (
    <div
      className="fade-in"
      style={{
        padding: "1.5rem 2rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <span className="eyebrow">Live Work · Socratic coach</span>
          <h1
            className="italic-serif"
            style={{ fontSize: 30, margin: "0.25rem 0 0", fontWeight: 400 }}
          >
            Paste your working. Axon watches and coaches.
          </h1>
        </div>
        <Chip tone="accent">
          <span className="status-dot live" style={{ marginRight: 4 }} />
          Watching
        </Chip>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 16,
          minHeight: 0,
        }}
      >
        <div
          className="panel"
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
              Problem (optional)
            </label>
            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. Compute WACC for a firm with 60% equity, 40% debt, Re=12%, Rd=6%, t=30%"
            />
          </div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
            Your working
          </label>
          <textarea
            value={working}
            onChange={(e) => setWorking(e.target.value)}
            placeholder={
              "Type or paste your working as you go...\n\nAxon hints when you stall. It won't give you the answer."
            }
            style={{
              flex: 1,
              resize: "none",
              fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
              fontSize: 13,
              lineHeight: 1.7,
              minHeight: 200,
            }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Btn
              variant="primary"
              size="md"
              icon={streaming ? undefined : Icon.check}
              onClick={checkWork}
              disabled={streaming}
            >
              {streaming ? (
                <>
                  <Spinner size={12} /> Checking
                </>
              ) : (
                "Check my working"
              )}
            </Btn>
            <Btn
              variant="secondary"
              size="md"
              icon={Icon.lightbulb}
              onClick={askForHint}
              disabled={streaming}
            >
              Ask for a hint
            </Btn>
          </div>
        </div>

        <div
          className="panel"
          style={{
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <AxonMark size={14} animated />
            <span className="eyebrow" style={{ color: "var(--accent)" }}>
              Coaching feed
            </span>
          </div>
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minHeight: 0,
            }}
          >
            {hints.length === 0 && !error && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  padding: "2rem 0",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Paste your working, then hit &quot;Check my working&quot; or &quot;Ask for a hint.&quot;
                <br />
                Axon won&apos;t give you the answer — it&apos;ll help you see the next step.
              </div>
            )}
            {hints.map((h) => (
              <div
                key={h.id}
                className="slide-right"
                style={{
                  padding: "0.75rem 0.9rem",
                  borderRadius: 6,
                  background: h.role === "user" ? "var(--surface-2)" : "var(--bg)",
                  borderLeft: `2px solid ${h.role === "user" ? "var(--info)" : "var(--accent)"}`,
                  fontSize: 13,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      color: "var(--text-fade)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {h.role === "user" ? "You" : "Coach"}
                  </span>
                  <span
                    className="font-mono"
                    style={{ fontSize: 10, color: "var(--text-fade)" }}
                  >
                    {h.t}
                  </span>
                </div>
                <div style={{ color: "var(--text)" }}>
                  {h.text ||
                    (h.role === "assistant" && streaming ? (
                      <span style={{ opacity: 0.6 }}>...</span>
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
        </div>
      </div>
    </div>
  );
}
