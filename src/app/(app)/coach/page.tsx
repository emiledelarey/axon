"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Chip } from "@/components/ui/Chip";
import { Spinner } from "@/components/ui/Spinner";
import { AxonMark } from "@/components/ui/AxonMark";
import { Icon } from "@/components/ui/Icon";
import { API_AVAILABLE, apiChatStream, fallbackChatResponse } from "@/lib/api";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useSpeechSynthesis } from "@/lib/useSpeechSynthesis";

type Hint = {
  id: number;
  t: string;
  role: "user" | "assistant";
  text: string;
};

type CoachAction = {
  key: string;
  label: string;
  prompt: (ctx: { problem: string; working: string; stuck: string }) => string;
};

// The structured actions per Perplexity brief. Each one sends a targeted
// prompt rather than a raw "check my working" blob, so the coach's reply
// stays focused on exactly the axis the student asked about.
const ACTIONS: CoachAction[] = [
  {
    key: "logic",
    label: "Check logic",
    prompt: ({ problem, working, stuck }) =>
      `Focus: is my reasoning pointed the right way? Ignore arithmetic for now.\n\nProblem: ${problem || "(not given)"}\nMy working: ${working || "(not given)"}${stuck ? `\nWhere I'm stuck: ${stuck}` : ""}`,
  },
  {
    key: "formula",
    label: "Check formula choice",
    prompt: ({ problem, working, stuck }) =>
      `Focus: am I using the right formula / model for this situation? If not, name the right one but don't plug numbers.\n\nProblem: ${problem || "(not given)"}\nMy working: ${working || "(not given)"}${stuck ? `\nWhere I'm stuck: ${stuck}` : ""}`,
  },
  {
    key: "arithmetic",
    label: "Check arithmetic",
    prompt: ({ problem, working, stuck }) =>
      `Focus: arithmetic only. Point to the specific line with a calculation slip, don't solve it for me.\n\nProblem: ${problem || "(not given)"}\nMy working: ${working || "(not given)"}${stuck ? `\nWhere I'm stuck: ${stuck}` : ""}`,
  },
  {
    key: "hint",
    label: "Give next hint",
    prompt: ({ problem, working, stuck }) =>
      `I'm stuck. One targeted hint — don't give me the answer.\n\nProblem: ${problem || "(not given)"}\nMy working: ${working || "(not given)"}${stuck ? `\nWhere I'm stuck: ${stuck}` : ""}`,
  },
];

export default function CoachPage() {
  const { state, update } = useAppState();
  const voiceMode = state.voiceMode;
  const [problem, setProblem] = useState("");
  const [working, setWorking] = useState("");
  const [stuck, setStuck] = useState("");
  const [hints, setHints] = useState<Hint[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Voice Mode (Session 8): mic toggle appends final dictation to the working
  // field; the interim ribbon under the textarea shows the in-flight phrase.
  // TTS replay + separate transcript panels arrive in Session 9.
  const speech = useSpeechRecognition({
    onFinal: (text) => {
      const clean = text.trim();
      if (!clean) return;
      setWorking((w) => (w.trim().length === 0 ? clean : `${w.trimEnd()} ${clean}`));
    },
  });
  const toggleMic = () => {
    if (speech.listening) speech.stop();
    else speech.start();
  };

  // Voice output — read coach hints back via browser TTS.
  const synth = useSpeechSynthesis();
  const speakHint = (text: string) => {
    if (synth.speaking) {
      synth.stop();
      return;
    }
    synth.speak(text);
  };
  const replayLast = () => {
    const last = [...hints].reverse().find((h) => h.role === "assistant" && h.text.trim());
    if (last) speakHint(last.text);
  };

  // Live-state badge — priority: coach speaking > processing > listening >
  // muted (voice mode on, mic idle) > watching (text mode).
  const badge = synth.speaking
    ? { tone: "accent" as const, label: "Coach speaking" }
    : streaming
      ? { tone: "info" as const, label: "Processing" }
      : speech.listening
        ? { tone: "accent" as const, label: "Listening" }
        : voiceMode
          ? { tone: "warn" as const, label: "Muted" }
          : { tone: "accent" as const, label: "Watching" };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [hints]);

  const hasContext = problem.trim() || working.trim() || stuck.trim();

  const ask = async (userMessage: string, displayLabel: string) => {
    setError(null);
    setStreaming(true);
    const now = new Date().toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userHint: Hint = { id: Date.now(), t: now, role: "user", text: displayLabel };
    const aiHint: Hint = { id: Date.now() + 1, t: now, role: "assistant", text: "" };
    setHints((h) => [...h, userHint, aiHint]);

    // Collect the full assistant reply so we can feed it to TTS after streaming
    // — React batches state updates so reading hints right after the stream
    // finishes doesn't necessarily have the latest text yet.
    let fullText = "";

    const onChunk = (chunk: unknown) => {
      const c = chunk as { text?: string; error?: string };
      if (c.text) {
        fullText += c.text;
        setHints((h) => h.map((x) => (x.id === aiHint.id ? { ...x, text: x.text + c.text } : x)));
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
      if (voiceMode && synth.supported && fullText.trim()) {
        synth.speak(fullText);
      }
    }
  };

  const runAction = (action: CoachAction) => {
    if (!hasContext) {
      setError("Paste a problem, your working, or where you're stuck before asking.");
      return;
    }
    ask(action.prompt({ problem, working, stuck }), action.label);
  };

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
          <span className="eyebrow">Problem Coach · Socratic</span>
          <h1
            className="italic-serif"
            style={{ fontSize: 22, margin: "0.2rem 0 0", fontWeight: 400 }}
          >
            Show your working. Axon points at the next step.
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {synth.supported && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: voiceMode ? "var(--accent)" : "var(--text-fade)",
                fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
              title="In voice mode the coach auto-reads each reply aloud."
            >
              <input
                type="checkbox"
                checked={voiceMode}
                onChange={(e) => {
                  update({ voiceMode: e.target.checked });
                  if (!e.target.checked) synth.stop();
                }}
                style={{ accentColor: "var(--accent)", width: 12, height: 12 }}
              />
              Voice mode
            </label>
          )}
          <Chip tone={badge.tone}>
            <span
              className={badge.label === "Muted" ? "" : "status-dot live"}
              style={{
                marginRight: 4,
                background:
                  badge.tone === "warn"
                    ? "var(--warn)"
                    : badge.tone === "info"
                      ? "var(--info)"
                      : "var(--accent)",
              }}
            />
            {badge.label}
          </Chip>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
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
            minHeight: 0,
            gap: 10,
          }}
        >
          <div>
            <label className="eyebrow" style={{ display: "block", marginBottom: 4 }}>
              Problem
            </label>
            <input
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. Compute WACC for a firm with 60% equity, 40% debt, Re=12%, Rd=6%, t=30%"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <label className="eyebrow" style={{ display: "block" }}>
                My working
              </label>
              {speech.supported && (
                <button
                  onClick={toggleMic}
                  title={
                    speech.listening
                      ? "Stop listening"
                      : "Speak your working — we'll transcribe into this box"
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.25rem 0.6rem",
                    borderRadius: 14,
                    border: `1px solid ${speech.listening ? "var(--accent)" : "var(--border-bright)"}`,
                    background: speech.listening ? "rgba(0,230,168,0.1)" : "transparent",
                    color: speech.listening ? "var(--accent)" : "var(--text-dim)",
                    fontSize: 11,
                    fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon.mic size={12} />
                  {speech.listening ? (
                    <>
                      <span className="status-dot live" style={{ background: "var(--accent)" }} />
                      Listening
                    </>
                  ) : (
                    "Speak"
                  )}
                </button>
              )}
            </div>
            <textarea
              value={working}
              onChange={(e) => setWorking(e.target.value)}
              placeholder={
                speech.supported
                  ? "Type or speak your working. Mic captures into this box so you can edit it."
                  : "Type or paste your working as you go..."
              }
              style={{
                flex: 1,
                resize: "none",
                fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                fontSize: 13,
                lineHeight: 1.6,
                minHeight: 120,
              }}
            />
            {(speech.listening || speech.interim) && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "var(--accent)",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  minHeight: 18,
                }}
              >
                {speech.interim || <span style={{ opacity: 0.7 }}>Listening — speak now.</span>}
              </div>
            )}
            {speech.error && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--danger)",
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                }}
              >
                Mic: {speech.error}
                {speech.error === "not-allowed" && " — grant microphone access in your browser."}
              </div>
            )}
          </div>

          <div>
            <label className="eyebrow" style={{ display: "block", marginBottom: 4 }}>
              Where I&apos;m stuck <span style={{ color: "var(--text-fade)" }}>(optional)</span>
            </label>
            <textarea
              value={stuck}
              onChange={(e) => setStuck(e.target.value)}
              placeholder="e.g. I'm not sure if I should use pre-tax or after-tax debt"
              rows={2}
              style={{ fontSize: 13, lineHeight: 1.55, resize: "none" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              borderTop: "1px solid var(--border)",
              paddingTop: 10,
            }}
          >
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => runAction(a)}
                disabled={streaming}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: 16,
                  border: "1px solid var(--border-bright)",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: 12,
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
                  e.currentTarget.style.color = "var(--text)";
                }}
              >
                {a.key === "hint" ? "💡 " : ""}
                {a.label}
              </button>
            ))}
            {streaming && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                }}
              >
                <Spinner size={12} /> Coach thinking…
              </div>
            )}
          </div>
        </div>

        <div
          className="panel"
          style={{
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <AxonMark size={14} animated />
            <span className="eyebrow" style={{ color: "var(--accent)" }}>
              Coaching feed
            </span>
            {synth.supported && hints.some((h) => h.role === "assistant" && h.text.trim()) && (
              <button
                onClick={replayLast}
                title={synth.speaking ? "Stop speech" : "Replay last coach hint"}
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0.2rem 0.55rem",
                  borderRadius: 14,
                  border: `1px solid ${synth.speaking ? "var(--accent)" : "var(--border-bright)"}`,
                  background: synth.speaking ? "rgba(0,230,168,0.08)" : "transparent",
                  color: synth.speaking ? "var(--accent)" : "var(--text-dim)",
                  fontSize: 11,
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Icon.volume size={12} />
                {synth.speaking ? "Stop" : "Replay last"}
              </button>
            )}
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
                  padding: "1.5rem 0",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Fill in at least one field on the left, then tap an action.
                <br />
                Axon won&apos;t give you the answer — it&apos;ll point at the next step.
              </div>
            )}
            {hints.map((h) => (
              <div
                key={h.id}
                className="slide-right"
                style={{
                  padding: "0.65rem 0.8rem",
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {h.role === "assistant" && synth.supported && h.text.trim() && (
                      <button
                        onClick={() => speakHint(h.text)}
                        title={synth.speaking ? "Stop speech" : "Read this hint aloud"}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: 2,
                          background: "transparent",
                          border: "none",
                          color: synth.speaking ? "var(--accent)" : "var(--text-fade)",
                          cursor: "pointer",
                        }}
                      >
                        <Icon.volume size={12} />
                      </button>
                    )}
                    <span className="font-mono" style={{ fontSize: 10, color: "var(--text-fade)" }}>
                      {h.t}
                    </span>
                  </span>
                </div>
                <div style={{ color: "var(--text)" }}>
                  {h.text ||
                    (h.role === "assistant" && streaming ? (
                      <span style={{ opacity: 0.6 }}>…</span>
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
        </div>
      </div>
    </div>
  );
}
