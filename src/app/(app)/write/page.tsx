"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Chip } from "@/components/ui/Chip";
import { Spinner } from "@/components/ui/Spinner";
import { AxonMark } from "@/components/ui/AxonMark";
import { Icon } from "@/components/ui/Icon";
import { API_AVAILABLE, apiWriteStream, fallbackWriteResponse } from "@/lib/api";
import type { WriteAction } from "@/lib/api-types";

const ACTIONS: Array<{ key: WriteAction; label: string; hint: string }> = [
  { key: "plan", label: "Help me plan", hint: "Outline before drafting" },
  { key: "thesis", label: "Test my thesis", hint: "Find counterarguments" },
  { key: "gaps", label: "Find argument gaps", hint: "Missing links + unsupported claims" },
  { key: "rubric", label: "Check rubric alignment", hint: "Score against criteria" },
  { key: "paragraph", label: "Improve this paragraph", hint: "Structure + evidence critique" },
  { key: "challenge", label: "Challenge my reasoning", hint: "Socratic counter-questions" },
];

export default function WritePage() {
  const { state, update } = useAppState();
  const [response, setResponse] = useState("");
  const [activeAction, setActiveAction] = useState<WriteAction | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const responseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [response]);

  const hasMinimum = state.writingPrompt.trim() && state.writingDraft.trim();

  const runAction = async (action: WriteAction) => {
    if (!hasMinimum) {
      setError("Add an essay prompt and a draft or outline before asking for feedback.");
      return;
    }
    setError(null);
    setResponse("");
    setActiveAction(action);
    setStreaming(true);

    const onChunk = (chunk: unknown) => {
      const c = chunk as { text?: string; error?: string };
      if (c.text) setResponse((r) => r + c.text);
      if (c.error) setError(c.error);
    };

    try {
      if (API_AVAILABLE) {
        await apiWriteStream(
          {
            prompt: state.writingPrompt.trim(),
            rubric: state.writingRubric.trim(),
            draft: state.writingDraft.trim(),
            notes: state.writingNotes.trim(),
            action,
          },
          onChunk,
        );
      } else {
        await fallbackWriteResponse(action, onChunk);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coach stumbled.");
    } finally {
      setStreaming(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    rows: number,
    optional = false,
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label className="eyebrow" style={{ display: "block" }}>
        {label}
        {optional && <span style={{ color: "var(--text-fade)" }}> (optional)</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          resize: "vertical",
        }}
      />
    </div>
  );

  return (
    <div
      className="fade-in"
      style={{
        padding: "1rem 1.5rem",
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
          marginBottom: 12,
        }}
      >
        <div>
          <span className="eyebrow">Live Write · writing coach</span>
          <h1
            className="italic-serif"
            style={{ fontSize: 22, margin: "0.2rem 0 0", fontWeight: 400 }}
          >
            Rubric-aware feedback. Never ghost-writes.
          </h1>
        </div>
        <Chip tone="accent">
          <span className="status-dot live" style={{ marginRight: 4 }} />
          Coaching
        </Chip>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 14,
          minHeight: 0,
        }}
      >
        <div
          className="panel"
          style={{
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          {field(
            "Essay prompt",
            state.writingPrompt,
            (v) => update({ writingPrompt: v }),
            "e.g. Discuss the main causes of the First World War.",
            2,
          )}
          {field(
            "Rubric",
            state.writingRubric,
            (v) => update({ writingRubric: v }),
            "Paste the marking criteria if you have them.",
            3,
            true,
          )}
          {field(
            "Draft / outline",
            state.writingDraft,
            (v) => update({ writingDraft: v }),
            "Paste what you've got — an outline, a rough paragraph, or the whole draft.",
            8,
          )}
          {field(
            "Your notes",
            state.writingNotes,
            (v) => update({ writingNotes: v }),
            "Lecture notes, source quotes, anything the coach should consider.",
            3,
            true,
          )}
        </div>

        <div
          className="panel"
          style={{
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AxonMark size={14} animated />
            <span className="eyebrow" style={{ color: "var(--accent)" }}>
              Feedback
            </span>
            {activeAction && (
              <Chip tone="info">{ACTIONS.find((a) => a.key === activeAction)?.label}</Chip>
            )}
            {streaming && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                }}
              >
                <Spinner size={12} /> Coach thinking…
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => runAction(a.key)}
                disabled={streaming}
                title={a.hint}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: 16,
                  border: `1px solid ${
                    activeAction === a.key ? "var(--accent)" : "var(--border-bright)"
                  }`,
                  background: activeAction === a.key ? "rgba(0,230,168,0.08)" : "transparent",
                  color: activeAction === a.key ? "var(--accent)" : "var(--text)",
                  fontSize: 12,
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                  cursor: streaming ? "not-allowed" : "pointer",
                  opacity: streaming ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!streaming && activeAction !== a.key) {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--accent)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeAction !== a.key) {
                    e.currentTarget.style.borderColor = "var(--border-bright)";
                    e.currentTarget.style.color = "var(--text)";
                  }
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div
            ref={responseRef}
            style={{
              flex: 1,
              overflowY: "auto",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0.9rem 1rem",
              fontSize: 13,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              color: "var(--text)",
              minHeight: 0,
            }}
          >
            {response ? (
              response
            ) : error ? (
              <span style={{ color: "var(--danger)" }}>{error}</span>
            ) : (
              <span style={{ color: "var(--text-dim)" }}>
                Paste your prompt and draft on the left, then pick an action. The coach returns
                scaffolding — outlines, questions, critique — never a paste-ready paragraph.
              </span>
            )}
          </div>

          {!hasMinimum && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-fade)",
                fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
              }}
            >
              Essay prompt + draft required before any action fires.
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              fontSize: 11,
              color: "var(--text-fade)",
              fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
            }}
          >
            <Icon.alert size={10} />
            Axon refuses to write drop-in paragraphs. Use it to plan, challenge, and check — not to
            ghost-write.
          </div>
        </div>
      </div>
    </div>
  );
}
