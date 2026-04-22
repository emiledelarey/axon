"use client";

import { useState } from "react";
import { API_AVAILABLE, apiGenerateCards } from "@/lib/api";
import { DEMO_DECK, type AppState } from "@/lib/state";
import { Btn } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Icon } from "../ui/Icon";
import { AxonMark } from "../ui/AxonMark";
import { OnboardingStep } from "./OnboardingStep";

type Update = (patch: Partial<AppState> | ((s: AppState) => AppState)) => void;
type InputTab = "material" | "focus" | "notes";

export function Onboarding({
  state,
  update,
  onDone,
}: {
  state: AppState;
  update: Update;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state?.name || "");
  const [subject, setSubject] = useState(state?.subject || "");
  const [material, setMaterial] = useState(state?.material || "");
  const [focus, setFocus] = useState(state?.focus || "");
  const [notes, setNotes] = useState(state?.notes || "");
  const [inputTab, setInputTab] = useState<InputTab>("material");
  const [label, setLabel] = useState(state?.materialLabel || "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finishWithDemo = () => {
    update((s) => ({
      ...s,
      name: name || "Student",
      deck: DEMO_DECK,
      subject: "Economics",
      materialLabel: "Fundamentals",
      material:
        "Core economics: opportunity cost is the value of the next-best alternative forgone. Price elasticity of demand is the percentage change in quantity demanded divided by percentage change in price. Marginal revenue is additional revenue from selling one more unit; in perfect competition MR equals price.",
      focus: "",
      notes: "",
      activeDeckId: `deck_${Date.now()}`,
      errorsByCard: {},
      onboardingComplete: true,
    }));
    onDone();
  };

  const handleGenerate = async () => {
    if (!subject.trim()) {
      setError("Give this a subject (e.g. Finance, Accounting).");
      return;
    }
    if (material.length < 100) {
      setError("Paste at least 100 characters of material.");
      setInputTab("material");
      return;
    }
    if (!label.trim()) {
      setError("Name this week or topic.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      if (API_AVAILABLE) {
        const { cards } = await apiGenerateCards({ material, focus, notes, count: 10 });
        update((s) => ({
          ...s,
          name: name || "Student",
          subject: subject.trim(),
          material,
          focus,
          notes,
          materialLabel: label.trim(),
          deck: cards,
          activeDeckId: `deck_${Date.now()}`,
          onboardingComplete: true,
          errorsByCard: {},
        }));
        onDone();
      } else {
        update((s) => ({
          ...s,
          name: name || "Student",
          subject: subject.trim(),
          material,
          focus,
          notes,
          materialLabel: label.trim(),
          deck: DEMO_DECK,
          activeDeckId: `deck_${Date.now()}`,
          onboardingComplete: true,
          errorsByCard: {},
        }));
        onDone();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't generate. Skip to demo deck or try again.",
      );
      setGenerating(false);
    }
  };

  if (step === 0) {
    return (
      <div
        className="fade-in-slow"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="noise" />
        <header
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1.75rem 2.5rem",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AxonMark size={22} />
            <span
              className="font-display"
              style={{ fontSize: 20, letterSpacing: "0.05em", fontWeight: 600 }}
            >
              AXON
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <div className="font-mono" style={{ fontSize: 11, color: "var(--text-fade)" }}>
            axon.study
          </div>
        </header>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "0 2.5rem",
            position: "relative",
          }}
        >
          <div
            style={{
              maxWidth: 900,
              width: "100%",
              margin: "0 auto",
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 32,
              }}
            >
              <span className="status-dot live" />
              <span className="eyebrow" style={{ color: "var(--accent)" }}>
                {state?.referrer ? `Invited by ${state.referrer} · live now` : "Live · April 2026"}
              </span>
            </div>
            <h1
              className="italic-serif"
              style={{
                fontSize: "clamp(48px, 7vw, 88px)",
                lineHeight: 1.02,
                margin: 0,
                fontWeight: 400,
                letterSpacing: "-0.02em",
              }}
            >
              The study tool
              <br />
              students
              <br />
              <span className="grad-accent">actually use.</span>
            </h1>
            <p
              style={{
                color: "var(--text-dim)",
                fontSize: 19,
                maxWidth: 640,
                marginTop: 32,
                lineHeight: 1.55,
              }}
            >
              Paste any study material and get a daily practice loop. Spaced-repetition flashcards,
              error-classified micro-lessons when you slip, and a Socratic tutor that refuses to
              write your assignment.
            </p>
            <div
              style={{
                marginTop: 40,
                display: "flex",
                gap: 14,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Btn variant="primary" size="lg" icon={Icon.arrowRight} onClick={() => setStep(1)}>
                Enter Axon
              </Btn>
              <Btn variant="ghost" size="md" onClick={finishWithDemo}>
                Skip — load demo deck →
              </Btn>
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 11,
                color: "var(--text-fade)",
                marginTop: 32,
              }}
            >
              Free while in beta · no card required
            </div>
          </div>
        </div>

        <footer
          style={{
            padding: "1.5rem 2.5rem",
            borderTop: "1px solid var(--border)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 48,
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { v: "Any subject", l: "paste, deck, study" },
              { v: "~20s", l: "to your first card" },
              { v: "Socratic", l: "never writes your work" },
              { v: "Claude 4.5", l: "powered by Sonnet" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span className="italic-serif" style={{ fontSize: 28, color: "var(--accent)" }}>
                  {s.v}
                </span>
                <span className="eyebrow">{s.l}</span>
              </div>
            ))}
          </div>
        </footer>
      </div>
    );
  }

  if (step === 1) {
    return (
      <OnboardingStep
        step={1}
        total={2}
        title="What should we call you?"
        sub="First name is fine. Used only for your greeting."
      >
        <div style={{ maxWidth: 440, margin: "0 auto 28px" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sam"
            maxLength={30}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) setStep(2);
            }}
            style={{ fontSize: 16, padding: "0.9rem 1rem" }}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <Btn
            variant="primary"
            size="lg"
            icon={Icon.arrowRight}
            onClick={() => setStep(2)}
            disabled={!name.trim()}
          >
            Continue
          </Btn>
        </div>
      </OnboardingStep>
    );
  }

  if (step === 2) {
    return (
      <OnboardingStep
        step={2}
        total={2}
        title="Feed Axon what you're studying."
        sub="Material is required — everything else makes the deck sharper. Or skip to a demo deck to look around first."
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Finance, Accounting, Microeconomics"
            maxLength={40}
            style={{ marginBottom: 14 }}
          />
          <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
            Week / topic
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Week 4 — Elasticity"
            maxLength={80}
            style={{ marginBottom: 14 }}
          />
          <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
            Your input
          </label>
          <div style={{ fontSize: 12, color: "var(--text-fade)", marginBottom: 10 }}>
            Material is required. Focus and Notes are optional but make the deck much better.
          </div>

          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 10,
              borderBottom: "1px solid var(--border)",
            }}
          >
            {(
              [
                { key: "material", label: "Material", count: material.length, required: true },
                { key: "focus", label: "Focus", count: focus.length, required: false },
                { key: "notes", label: "Notes", count: notes.length, required: false },
              ] as const
            ).map((t) => {
              const active = inputTab === t.key;
              const hasContent = t.count > 0;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setInputTab(t.key)}
                  style={{
                    padding: "0.55rem 0.9rem",
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                    color: active ? "var(--text)" : "var(--text-dim)",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                  {t.required && !hasContent && (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--danger)",
                      }}
                    />
                  )}
                  {hasContent && (
                    <span
                      style={{
                        fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: active ? "var(--accent)" : "var(--text-fade)",
                      }}
                    >
                      {t.count >= 1000 ? `${Math.round(t.count / 1000)}k` : t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {inputTab === "material" && (
            <div>
              <textarea
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder={
                  "Paste lecture slides, textbook pages, a problem set...\n\nMinimum 100 characters."
                }
                rows={8}
                style={{
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  resize: "vertical",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--text-fade)",
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                }}
              >
                <span>
                  {material.length < 100
                    ? `${100 - material.length} more chars to generate`
                    : "Ready"}
                </span>
                <span>{material.length.toLocaleString()} / 80,000</span>
              </div>
            </div>
          )}

          {inputTab === "focus" && (
            <div>
              <textarea
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder={
                  "What to weight heavily. Examples:\n- The lecturer emphasised tax shields\n- I always get WACC wrong — drill me on that\n- Skip history, focus on calculations"
                }
                rows={6}
                style={{ fontSize: 14, lineHeight: 1.6, resize: "vertical" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--text-fade)",
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                }}
              >
                <span>
                  {focus.trim()
                    ? "Axon will bias the deck toward these topics"
                    : "Optional — leave blank for balanced coverage"}
                </span>
                <span>{focus.length} / 2,000</span>
              </div>
            </div>
          )}

          {inputTab === "notes" && (
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  "Your own notes from the lecture, or your summary of the material.\n\nAxon reads these to calibrate card depth and spot misconceptions."
                }
                rows={8}
                style={{ fontSize: 14, lineHeight: 1.6, resize: "vertical" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--text-fade)",
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                }}
              >
                <span>
                  {notes.trim()
                    ? "Axon will calibrate cards to your understanding"
                    : "Optional — adds real value when you write something"}
                </span>
                <span>{notes.length.toLocaleString()} / 15,000</span>
              </div>
            </div>
          )}
          {error && (
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(229,111,76,0.08)",
                border: "1px solid var(--danger)",
                borderRadius: 6,
                marginTop: 14,
                color: "var(--danger)",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Btn
              variant="primary"
              size="lg"
              icon={generating ? undefined : Icon.sparkles}
              onClick={handleGenerate}
              disabled={!material || material.length < 100 || !label.trim() || generating}
            >
              {generating ? (
                <>
                  <Spinner size={14} /> Generating...
                </>
              ) : (
                "Generate deck"
              )}
            </Btn>
            <Btn variant="ghost" size="md" onClick={finishWithDemo} disabled={generating}>
              Skip — load demo deck →
            </Btn>
          </div>
        </div>
      </OnboardingStep>
    );
  }

  return null;
}
