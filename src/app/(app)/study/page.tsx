"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Btn } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatTile } from "@/components/ui/StatTile";
import { AxonMark } from "@/components/ui/AxonMark";
import { Icon } from "@/components/ui/Icon";
import { API_AVAILABLE, apiClassifyError, fallbackClassifyError } from "@/lib/api";
import type { Card, ClassifyErrorResponse } from "@/lib/api-types";

type Rating = "again" | "hard" | "good" | "easy";

type SessionStats = {
  correct: number;
  wrong: number;
  reviewed: number;
  xpEarned: number;
};

// Renamed per Perplexity brief. Internal keys stay "again/hard/good/easy" so
// the XP + scheduling logic doesn't need to change.
const RATINGS = [
  { key: "again", label: "Missed it", sub: "+2 XP · rebuild", color: "var(--danger)" },
  { key: "hard", label: "Shaky", sub: "+8 XP · 2 days", color: "var(--warn)" },
  { key: "good", label: "Got it", sub: "+15 XP · 5 days", color: "var(--info)" },
  { key: "easy", label: "Easy", sub: "+25 XP · 12 days", color: "var(--accent)" },
] as const;

export default function StudyPage() {
  const router = useRouter();
  const { state, update } = useAppState();
  const exit = () => router.push("/dashboard");

  const typedMode = state.typedRecallMode;

  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [microLesson, setMicroLesson] = useState<ClassifyErrorResponse | null>(null);
  const [microLessonLoading, setMicroLessonLoading] = useState(false);
  const [microLessonError, setMicroLessonError] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    correct: 0,
    wrong: 0,
    reviewed: 0,
    xpEarned: 0,
  });

  const cards = state.deck || [];
  const card = cards[cardIdx];
  const errorCount = card ? (state.errorsByCard?.[card.id] ?? 0) : 0;

  const runClassifier = async (c: Card) => {
    setMicroLessonLoading(true);
    setMicroLessonError(null);
    try {
      let result: ClassifyErrorResponse;
      if (API_AVAILABLE && state.material) {
        result = await apiClassifyError(state.material, c);
      } else {
        result = await fallbackClassifyError(c);
      }
      setMicroLesson(result);
    } catch {
      try {
        const fallback = await fallbackClassifyError(c);
        setMicroLesson(fallback);
      } catch {
        setMicroLessonError("Classifier stumbled.");
      }
    } finally {
      setMicroLessonLoading(false);
    }
  };

  const handleRating = async (rating: Rating) => {
    if (!card) return;
    const isWrong = rating === "again";
    const xpDelta = rating === "again" ? 2 : rating === "hard" ? 8 : rating === "good" ? 15 : 25;
    setSessionStats((s) => ({
      correct: s.correct + (isWrong ? 0 : 1),
      wrong: s.wrong + (isWrong ? 1 : 0),
      reviewed: s.reviewed + 1,
      xpEarned: s.xpEarned + xpDelta,
    }));

    if (isWrong) {
      update((s) => ({
        ...s,
        errorsByCard: {
          ...s.errorsByCard,
          [card.id]: (s.errorsByCard[card.id] || 0) + 1,
        },
      }));
      setMicroLesson(null);
      setFlipped(false);
      runClassifier(card);
      return;
    }
    advance();
  };

  const advance = () => {
    if (cardIdx >= cards.length - 1) {
      setSessionComplete(true);
      const xpGained = sessionStats.xpEarned + 25;
      const today = new Date().toDateString();
      const wasYesterday = state.lastStudyDate === new Date(Date.now() - 86400000).toDateString();
      const newStreak =
        state.lastStudyDate === today ? state.streak : wasYesterday ? state.streak + 1 : 1;
      update((s) => ({
        ...s,
        xp: s.xp + xpGained,
        streak: newStreak,
        lastStudyDate: today,
        sessionsCompleted: s.sessionsCompleted + 1,
      }));
      return;
    }
    setCardIdx(cardIdx + 1);
    setFlipped(false);
    setTypedAnswer("");
    setMicroLesson(null);
    setMicroLessonError(null);
  };

  if (!card && !sessionComplete) {
    return (
      <div className="fade-in" style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-dim)", marginBottom: 16 }}>No cards in deck yet.</p>
        <Btn variant="secondary" onClick={exit}>
          Back
        </Btn>
      </div>
    );
  }

  if (sessionComplete) return <SessionComplete stats={sessionStats} onContinue={exit} />;

  if (microLessonLoading || microLesson || microLessonError) {
    return (
      <MicroLesson
        loading={microLessonLoading}
        result={microLesson}
        error={microLessonError}
        card={card!}
        onContinue={advance}
        onRetry={() => runClassifier(card!)}
      />
    );
  }

  // "Why this card" chip — explains why the student is seeing this card right now.
  const whyChip =
    errorCount > 0 ? (
      <Chip tone="warn">
        <Icon.alert size={10} /> Weak spot · {errorCount} miss
        {errorCount !== 1 ? "es" : ""}
      </Chip>
    ) : cardIdx === 0 ? (
      <Chip tone="info">First card</Chip>
    ) : (
      <Chip>In rotation</Chip>
    );

  return (
    <div
      className="fade-in"
      style={{
        padding: "1.75rem 2.5rem",
        maxWidth: 900,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <button
          onClick={exit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--text-dim)",
            fontSize: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Icon.arrowLeft size={14} /> Back to today
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: typedMode ? "var(--accent)" : "var(--text-fade)",
              fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
              cursor: "pointer",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            <input
              type="checkbox"
              checked={typedMode}
              onChange={(e) => update({ typedRecallMode: e.target.checked })}
              style={{ accentColor: "var(--accent)", width: 12, height: 12 }}
            />
            Type first
          </label>
          <Chip>
            Card {cardIdx + 1} of {cards.length}
          </Chip>
          {state.materialLabel && <Chip tone="accent">{state.materialLabel}</Chip>}
        </div>
      </div>

      <div className="signal-bar" style={{ marginBottom: 28 }}>
        <div
          className="signal-fill"
          style={{
            width: `${(cardIdx / cards.length) * 100}%`,
            background: "var(--accent)",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {whyChip}
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span className="eyebrow" style={{ color: "var(--text-fade)" }}>
          Concept
        </span>
        <div
          className="italic-serif"
          style={{ fontSize: 24, color: "var(--accent)", marginTop: 4 }}
        >
          {card!.concept}
        </div>
      </div>

      <div className="flip-container" style={{ flex: 1, maxHeight: 460, marginBottom: 28 }}>
        <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
          <div
            className="card-face panel"
            style={{
              position: "absolute",
              inset: 0,
              padding: "2.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              className="italic-serif"
              style={{
                fontSize: 30,
                lineHeight: 1.3,
                color: "var(--text)",
                marginBottom: 18,
                fontWeight: 400,
                maxWidth: 680,
              }}
            >
              {card!.front}
            </div>
            <div
              style={{
                color: "var(--text-dim)",
                fontSize: 16,
                maxWidth: 640,
                lineHeight: 1.55,
                marginBottom: typedMode ? 20 : 32,
              }}
            >
              {card!.question}
            </div>
            {typedMode && (
              <textarea
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type your answer first — then reveal to compare."
                rows={3}
                style={{
                  width: "100%",
                  maxWidth: 560,
                  marginBottom: 20,
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  resize: "vertical",
                  textAlign: "left",
                }}
              />
            )}
            <Btn variant="primary" size="lg" onClick={() => setFlipped(true)} icon={Icon.rotate}>
              {typedMode ? "Reveal & compare" : "Show answer"}
            </Btn>
          </div>
          <div
            className="card-face panel"
            style={{
              position: "absolute",
              inset: 0,
              padding: "2.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              transform: "rotateY(180deg)",
              overflowY: "auto",
            }}
          >
            {typedMode && typedAnswer.trim() && (
              <>
                <div style={{ marginBottom: 6 }}>
                  <span className="eyebrow" style={{ color: "var(--text-fade)" }}>
                    Your answer
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    padding: "0.75rem 1rem",
                    borderRadius: 6,
                    color: "var(--text-dim)",
                    marginBottom: 18,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {typedAnswer.trim()}
                </div>
              </>
            )}
            <div style={{ marginBottom: 14 }}>
              <span className="eyebrow">Answer</span>
            </div>
            <div
              className="italic-serif grad-accent"
              style={{
                fontSize: 40,
                lineHeight: 1.1,
                marginBottom: 22,
                fontWeight: 500,
                wordBreak: "break-word",
              }}
            >
              {card!.answer}
            </div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Working
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 13,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "1rem",
                borderRadius: 6,
                color: "var(--text-dim)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {card!.working}
            </div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div
          className="fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
          }}
        >
          {RATINGS.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRating(r.key)}
              style={{
                padding: "1rem",
                border: `1px solid ${r.color}33`,
                borderRadius: 8,
                background: "var(--surface)",
                transition: "all 0.18s",
                textAlign: "center",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = r.color;
                e.currentTarget.style.background = `${r.color}11`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${r.color}33`;
                e.currentTarget.style.background = "var(--surface)";
              }}
            >
              <div
                className="italic-serif"
                style={{ fontSize: 20, color: r.color, marginBottom: 4 }}
              >
                {r.label}
              </div>
              <div className="font-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
                {r.sub}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-fade)",
            fontSize: 12,
            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
          }}
        >
          {typedMode ? "Commit an answer. Then reveal." : "Think first. Then flip."}
        </div>
      )}
    </div>
  );
}

function MicroLesson({
  loading,
  result,
  error,
  card,
  onContinue,
  onRetry,
}: {
  loading: boolean;
  result: ClassifyErrorResponse | null;
  error: string | null;
  card: Card;
  onContinue: () => void;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div
        className="fade-in"
        style={{
          padding: "1.75rem 2.5rem",
          maxWidth: 900,
          margin: "0 auto",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "2px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
          className="ring-pulse"
        >
          <Icon.brain size={36} color="var(--accent)" />
        </div>
        <div className="eyebrow" style={{ color: "var(--accent)" }}>
          Error classifier · running
        </div>
        <div
          className="italic-serif"
          style={{
            fontSize: 28,
            marginTop: 12,
            textAlign: "center",
            maxWidth: 540,
            fontWeight: 400,
            lineHeight: 1.3,
          }}
        >
          Let&apos;s find out where that broke.
        </div>
        <div
          style={{
            marginTop: 28,
            width: 360,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div className="shimmer-line" style={{ width: "60%" }} />
          <div className="shimmer-line" style={{ width: "85%" }} />
          <div className="shimmer-line" style={{ width: "70%" }} />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div
        className="fade-in"
        style={{
          padding: "1.75rem 2.5rem",
          maxWidth: 700,
          margin: "0 auto",
          textAlign: "center",
          paddingTop: 80,
        }}
      >
        <Icon.alert size={32} color="var(--danger)" />
        <h2 className="italic-serif" style={{ fontSize: 28, marginTop: 16, marginBottom: 8 }}>
          Classifier stumbled.
        </h2>
        <p style={{ color: "var(--text-dim)" }}>{error || "No result."}</p>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <Btn variant="primary" onClick={onRetry} icon={Icon.rotate}>
            Try again
          </Btn>
          <Btn variant="secondary" onClick={onContinue}>
            Skip
          </Btn>
        </div>
      </div>
    );
  }

  const { classification, diagnosis, walkback, brokenLink, microLesson } = result;
  const classLabels: Record<string, string> = {
    "knowledge-gap": "Knowledge gap",
    misconception: "Misconception",
    careless: "Careless",
    "prerequisite-gap": "Prereq gap",
  };

  return (
    <div
      className="fade-in"
      style={{
        padding: "1.75rem 2.5rem",
        maxWidth: 900,
        margin: "0 auto",
        overflowY: "auto",
        height: "100%",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Chip tone="warn">
          <Icon.alert size={10} /> Micro-lesson triggered
        </Chip>
        <h2
          className="italic-serif"
          style={{
            fontSize: 32,
            margin: "0.75rem 0 0.5rem",
            lineHeight: 1.2,
            fontWeight: 400,
          }}
        >
          {diagnosis || "Let's rebuild this from the ground up."}
        </h2>
      </div>

      <div className="panel" style={{ padding: "1.5rem", marginBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          Diagnosis
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {Object.entries(classLabels).map(([key, label]) => {
            const active = classification === key;
            return (
              <div
                key={key}
                style={{
                  padding: "0.9rem",
                  borderRadius: 6,
                  background: active ? "rgba(0,230,168,0.08)" : "var(--bg)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  textAlign: "center",
                }}
              >
                {active && (
                  <Icon.check size={14} color="var(--accent)" style={{ marginBottom: 6 }} />
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: active ? "var(--accent)" : "var(--text-fade)",
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {walkback && walkback.length > 0 && (
        <div className="panel" style={{ padding: "1.5rem", marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Walking back from {card.concept}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              flexWrap: "wrap",
            }}
          >
            {walkback.map((c, i) => {
              const isBroken = c === brokenLink;
              const brokenIdx = walkback.indexOf(brokenLink);
              const isMastered = brokenIdx !== -1 && i > brokenIdx;
              return (
                <div key={`${c}-${i}`} style={{ display: "contents" }}>
                  <div
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: 6,
                      background: isBroken
                        ? "var(--accent)"
                        : isMastered
                          ? "var(--surface-2)"
                          : "var(--bg)",
                      border: `1px solid ${
                        isBroken
                          ? "var(--accent)"
                          : isMastered
                            ? "var(--accent-dim)"
                            : "var(--border)"
                      }`,
                      color: isBroken ? "var(--bg)" : "var(--text)",
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      margin: "4px 0",
                    }}
                  >
                    {isMastered && <Icon.check size={11} />}
                    {c}
                  </div>
                  {i < walkback.length - 1 && (
                    <Icon.arrowLeft
                      size={14}
                      color="var(--text-fade)"
                      style={{ margin: "0 4px" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {brokenLink && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-dim)",
                marginTop: 14,
                fontStyle: "italic",
              }}
            >
              Weakest link: <strong style={{ color: "var(--accent)" }}>{brokenLink}</strong>.
              That&apos;s where we rebuild.
            </div>
          )}
        </div>
      )}

      <div
        className="panel"
        style={{
          padding: "1.75rem",
          borderColor: "var(--accent-dim)",
          background: "rgba(0,230,168,0.03)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Icon.lightbulb size={14} color="var(--accent)" />
          <span className="eyebrow" style={{ color: "var(--accent)" }}>
            90-second fix
          </span>
        </div>
        {microLesson.headline && (
          <div className="italic-serif" style={{ fontSize: 22, marginBottom: 12, lineHeight: 1.3 }}>
            {microLesson.headline}
          </div>
        )}
        {microLesson.explanation && (
          <p
            style={{
              color: "var(--text)",
              fontSize: 14,
              lineHeight: 1.7,
              marginBottom: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {microLesson.explanation}
          </p>
        )}
        {microLesson.formula && (
          <div
            className="font-mono"
            style={{
              fontSize: 13,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              padding: "1rem",
              borderRadius: 6,
              color: "var(--accent)",
              marginBottom: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {microLesson.formula}
          </div>
        )}
        {microLesson.worked && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Worked example
            </div>
            <p
              style={{
                color: "var(--text-dim)",
                fontSize: 13,
                lineHeight: 1.7,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {microLesson.worked}
            </p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Btn variant="primary" size="lg" onClick={onContinue} icon={Icon.check}>
          Got it — next card
        </Btn>
      </div>
    </div>
  );
}

function SessionComplete({ stats, onContinue }: { stats: SessionStats; onContinue: () => void }) {
  const acc = stats.reviewed > 0 ? stats.correct / stats.reviewed : 0;
  return (
    <div
      className="fade-in-slow"
      style={{
        padding: "2rem",
        maxWidth: 600,
        margin: "0 auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <AxonMark size={48} animated />
        <div className="eyebrow" style={{ marginTop: 16, color: "var(--accent)" }}>
          Session complete
        </div>
        <h1 className="italic-serif" style={{ fontSize: 52, margin: "0.5rem 0", fontWeight: 400 }}>
          Nice work.
        </h1>
        <p style={{ color: "var(--text-dim)" }}>
          {stats.reviewed} cards reviewed · {Math.round(acc * 100)}% first-pass accuracy
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <StatTile label="Correct" value={stats.correct} accent="var(--accent)" icon={Icon.check} />
        <StatTile label="Reviewed" value={stats.reviewed} accent="var(--info)" icon={Icon.layers} />
        <StatTile
          label="XP earned"
          value={`+${stats.xpEarned + 25}`}
          accent="var(--warn)"
          sub="Incl. +25 streak bonus"
          icon={Icon.sparkles}
        />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Btn variant="primary" size="lg" onClick={onContinue} icon={Icon.arrowRight}>
          Continue today&apos;s plan
        </Btn>
      </div>
    </div>
  );
}
