"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Btn } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatTile } from "@/components/ui/StatTile";
import { Icon } from "@/components/ui/Icon";
import {
  buildExamQuestions,
  formatMs,
  meanTimePerQuestion,
  missedConcepts,
  scoreOf,
} from "@/lib/exam";
import { canUseMockExam } from "@/lib/entitlements";
import { Paywall } from "@/components/billing/Paywall";
import type { ExamAttempt } from "@/lib/state";
import type { Card } from "@/lib/api-types";

type Phase = "setup" | "session" | "review" | "results";

const DEFAULT_SECS_PER_Q = 60;

export default function ExamPage() {
  const router = useRouter();
  const { state, update } = useAppState();
  const deck = state.deck || [];

  const [phase, setPhase] = useState<Phase>("setup");
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [readOnlyAttempt, setReadOnlyAttempt] = useState<ExamAttempt | null>(null);

  if (!canUseMockExam(state)) {
    return (
      <Paywall
        feature="Mock Exam Mode"
        blurb="Timed runs through your deck with post-exam analysis: score, weak concepts, time per question, and a direct link to rebuild in Daily Study."
        bullets={[
          "Timed or untimed sessions",
          "Question navigator + flag-for-review",
          "Self-grade with side-by-side your answer vs correct",
          "Attempt history saved across devices",
        ]}
      />
    );
  }

  if (deck.length < 3) {
    return (
      <div
        className="fade-in"
        style={{
          padding: "1.25rem 1.5rem",
          maxWidth: 600,
          margin: "0 auto",
          textAlign: "center",
          paddingTop: 80,
        }}
      >
        <Icon.trophy size={32} color="var(--text-fade)" />
        <h2
          className="italic-serif"
          style={{ fontSize: 28, marginTop: 14, marginBottom: 6, fontWeight: 400 }}
        >
          Need at least 3 cards.
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 18 }}>
          Mock Exam pulls questions from your active deck. Add material in the Library first.
        </p>
        <Btn variant="primary" onClick={() => router.push("/library")} icon={Icon.sparkles}>
          Go to Decks
        </Btn>
      </div>
    );
  }

  if (readOnlyAttempt) {
    return (
      <ExamResults
        attempt={readOnlyAttempt}
        cards={deck}
        readOnly
        onDone={() => setReadOnlyAttempt(null)}
        onRestart={() => {
          setReadOnlyAttempt(null);
          setPhase("setup");
        }}
      />
    );
  }

  if (phase === "setup") {
    return (
      <ExamSetup
        deck={deck}
        deckLabel={state.materialLabel || "Unnamed deck"}
        deckId={state.activeDeckId}
        pastAttempts={state.examAttempts}
        onStart={(a) => {
          setAttempt(a);
          setPhase("session");
        }}
        onOpenAttempt={(a) => setReadOnlyAttempt(a)}
      />
    );
  }

  if (phase === "session" && attempt) {
    return (
      <ExamSession
        attempt={attempt}
        cards={deck}
        onSubmit={(finished) => {
          setAttempt(finished);
          setPhase("review");
        }}
        onAbort={() => {
          setAttempt(null);
          setPhase("setup");
        }}
      />
    );
  }

  if (phase === "review" && attempt) {
    return (
      <ExamReview
        attempt={attempt}
        cards={deck}
        onComplete={(graded) => {
          const finalScore = scoreOf(graded);
          const finalAttempt: ExamAttempt = { ...graded, score: finalScore };
          update((s) => ({
            ...s,
            examAttempts: [finalAttempt, ...s.examAttempts].slice(0, 50),
          }));
          setAttempt(finalAttempt);
          setPhase("results");
        }}
      />
    );
  }

  if (phase === "results" && attempt) {
    return (
      <ExamResults
        attempt={attempt}
        cards={deck}
        readOnly={false}
        onDone={() => {
          setAttempt(null);
          setPhase("setup");
        }}
        onRestart={() => {
          setAttempt(null);
          setPhase("setup");
        }}
      />
    );
  }

  return null;
}

/* ────────── setup ────────── */

function ExamSetup({
  deck,
  deckLabel,
  deckId,
  pastAttempts,
  onStart,
  onOpenAttempt,
}: {
  deck: Card[];
  deckLabel: string;
  deckId: string | null;
  pastAttempts: ExamAttempt[];
  onStart: (attempt: ExamAttempt) => void;
  onOpenAttempt: (a: ExamAttempt) => void;
}) {
  const [count, setCount] = useState(Math.min(deck.length, 10));
  const [timed, setTimed] = useState(true);
  const [secsPerQ, setSecsPerQ] = useState(DEFAULT_SECS_PER_Q);

  const start = () => {
    const questions = buildExamQuestions(deck, count);
    const attempt: ExamAttempt = {
      id: `exam_${Date.now()}`,
      deckId,
      deckLabel,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationMs: null,
      questionCount: questions.length,
      timeLimitMs: timed ? questions.length * secsPerQ * 1000 : null,
      questions,
      score: null,
    };
    onStart(attempt);
  };

  return (
    <div className="fade-in" style={{ padding: "1.25rem 1.5rem", maxWidth: 920, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">Mock Exam · setup</span>
        <h1
          className="italic-serif"
          style={{ fontSize: 30, margin: "0.35rem 0 0", fontWeight: 400 }}
        >
          Time yourself under pressure.
        </h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 13,
            margin: "8px 0 0",
            maxWidth: 620,
            lineHeight: 1.55,
          }}
        >
          A timed run through your deck. Answer what you can, flag the shaky ones, review at the
          end. We&apos;ll surface the concepts you missed and link back to Daily Study for the
          rebuild.
        </p>
      </div>

      <section className="panel" style={{ padding: "1.25rem", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Chip tone="accent">{deckLabel}</Chip>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.05em" }}
          >
            {deck.length} cards available
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div>
            <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
              Questions
            </label>
            <input
              type="number"
              min={3}
              max={deck.length}
              value={count}
              onChange={(e) =>
                setCount(Math.min(Math.max(parseInt(e.target.value, 10) || 3, 3), deck.length))
              }
              style={{ fontSize: 14 }}
            />
          </div>
          <div>
            <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
              Timer
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setTimed(true)}
                style={{
                  padding: "0.55rem 0.9rem",
                  borderRadius: 6,
                  border: `1px solid ${timed ? "var(--accent)" : "var(--border)"}`,
                  background: timed ? "rgba(0,230,168,0.08)" : "var(--surface)",
                  color: timed ? "var(--accent)" : "var(--text-dim)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Timed
              </button>
              <button
                onClick={() => setTimed(false)}
                style={{
                  padding: "0.55rem 0.9rem",
                  borderRadius: 6,
                  border: `1px solid ${!timed ? "var(--accent)" : "var(--border)"}`,
                  background: !timed ? "rgba(0,230,168,0.08)" : "var(--surface)",
                  color: !timed ? "var(--accent)" : "var(--text-dim)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Untimed
              </button>
            </div>
          </div>
        </div>

        {timed && (
          <div style={{ marginBottom: 14 }}>
            <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
              Seconds per question
            </label>
            <input
              type="number"
              min={20}
              max={300}
              step={10}
              value={secsPerQ}
              onChange={(e) =>
                setSecsPerQ(Math.min(Math.max(parseInt(e.target.value, 10) || 60, 20), 300))
              }
              style={{ fontSize: 14 }}
            />
            <div
              className="font-mono"
              style={{ fontSize: 11, color: "var(--text-fade)", marginTop: 6 }}
            >
              Total window: {formatMs(count * secsPerQ * 1000)} for {count} questions.
            </div>
          </div>
        )}

        <Btn variant="primary" size="lg" icon={Icon.play} onClick={start}>
          Start mock exam
        </Btn>
      </section>

      {pastAttempts.length > 0 && (
        <section className="panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Icon.trophy size={14} color="var(--text-dim)" />
            <span className="eyebrow">Past attempts</span>
          </div>
          {pastAttempts.slice(0, 8).map((a) => {
            const pct = a.score == null ? null : Math.round(a.score * 100);
            return (
              <button
                key={a.id}
                onClick={() => onOpenAttempt(a)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 120px 80px",
                  gap: 12,
                  padding: "0.55rem 0",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  borderTop: "1px solid var(--border)",
                  cursor: "pointer",
                  color: "inherit",
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.deckLabel}
                </div>
                <div className="font-mono" style={{ color: "var(--text-dim)" }}>
                  {a.questionCount} Qs
                </div>
                <div className="font-mono" style={{ color: "var(--text-dim)" }}>
                  {new Date(a.startedAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <div
                  className="italic-serif"
                  style={{
                    fontSize: 16,
                    color:
                      pct == null
                        ? "var(--text-fade)"
                        : pct >= 80
                          ? "var(--accent)"
                          : "var(--warn)",
                    textAlign: "right",
                  }}
                >
                  {pct == null ? "—" : `${pct}%`}
                </div>
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}

/* ────────── session ────────── */

function ExamSession({
  attempt,
  cards,
  onSubmit,
  onAbort,
}: {
  attempt: ExamAttempt;
  cards: Card[];
  onSubmit: (finished: ExamAttempt) => void;
  onAbort: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [questions, setQuestions] = useState(attempt.questions);
  // React 19 flags reading ref.current during render, so the session start
  // anchor lives in useState — we only need to read it, never mutate it after
  // mount. The per-question entry time stays in a ref because it's only read
  // inside handlers.
  const [startedAt] = useState(() => Date.now());
  const qEnterRef = useRef<number>(Date.now());
  const [now, setNow] = useState<number>(Date.now());

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const timeLimit = attempt.timeLimitMs;
  const elapsed = now - startedAt;
  const remaining = timeLimit == null ? null : Math.max(0, timeLimit - elapsed);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const captureTime = () => {
    const spent = Date.now() - qEnterRef.current;
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, timeMs: q.timeMs + spent } : q)));
    qEnterRef.current = Date.now();
  };

  const go = (next: number) => {
    captureTime();
    setIdx(Math.min(Math.max(next, 0), questions.length - 1));
  };

  const finish = () => {
    captureTime();
    const endedAt = new Date().toISOString();
    onSubmit({
      ...attempt,
      questions,
      endedAt,
      durationMs: Date.now() - startedAt,
    });
  };

  // Auto-submit on timer expiry.
  useEffect(() => {
    if (remaining != null && remaining <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const q = questions[idx];
  const card = byId.get(q.cardId);

  if (!card) return null;

  const progress = (idx / questions.length) * 100;
  const flaggedCount = questions.filter((x) => x.flagged).length;
  const answeredCount = questions.filter((x) => x.studentAnswer.trim().length > 0).length;

  return (
    <div
      className="fade-in"
      style={{
        padding: "1rem 1.5rem",
        maxWidth: 900,
        margin: "0 auto",
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
          marginBottom: 10,
        }}
      >
        <button
          onClick={() => {
            if (confirm("Abandon this exam? Your progress will be lost.")) onAbort();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-dim)",
            fontSize: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Icon.arrowLeft size={14} /> Abandon
        </button>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {remaining != null && (
            <Chip tone={remaining < 60_000 ? "warn" : "accent"}>
              <Icon.clock size={10} /> {formatMs(remaining)}
            </Chip>
          )}
          <Chip>
            Q {idx + 1} of {questions.length}
          </Chip>
          {flaggedCount > 0 && <Chip tone="warn">{flaggedCount} flagged</Chip>}
        </div>
      </div>

      <div className="signal-bar" style={{ marginBottom: 14 }}>
        <div
          className="signal-fill"
          style={{ width: `${progress}%`, background: "var(--accent)" }}
        />
      </div>

      <div
        className="panel"
        style={{ padding: "1.25rem", marginBottom: 12, flex: 1, overflowY: "auto" }}
      >
        <div style={{ marginBottom: 10 }}>
          <span className="eyebrow" style={{ color: "var(--text-fade)" }}>
            Concept
          </span>
          <div
            className="italic-serif"
            style={{ fontSize: 18, color: "var(--accent)", marginTop: 2 }}
          >
            {card.concept}
          </div>
        </div>
        <div
          className="italic-serif"
          style={{ fontSize: 22, marginBottom: 10, lineHeight: 1.3, fontWeight: 400 }}
        >
          {card.front}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--text-dim)",
            marginBottom: 14,
            lineHeight: 1.55,
          }}
        >
          {card.question}
        </div>
        <textarea
          value={q.studentAnswer}
          onChange={(e) =>
            setQuestions((qs) =>
              qs.map((x, i) => (i === idx ? { ...x, studentAnswer: e.target.value } : x)),
            )
          }
          placeholder="Type your answer. You can always come back via the navigator below."
          rows={6}
          style={{
            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
            fontSize: 13,
            lineHeight: 1.6,
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        {questions.map((x, i) => {
          const isActive = i === idx;
          const filled = x.studentAnswer.trim().length > 0;
          return (
            <button
              key={x.cardId}
              onClick={() => go(i)}
              title={`Question ${i + 1}${x.flagged ? " · flagged" : ""}`}
              style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                border: `1px solid ${
                  isActive
                    ? "var(--accent)"
                    : x.flagged
                      ? "var(--warn)"
                      : filled
                        ? "var(--accent-dim)"
                        : "var(--border)"
                }`,
                background: isActive
                  ? "var(--accent)"
                  : x.flagged
                    ? "rgba(255,170,61,0.12)"
                    : filled
                      ? "rgba(0,230,168,0.08)"
                      : "var(--surface)",
                color: isActive ? "var(--bg)" : "var(--text)",
                fontSize: 11,
                fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn
          variant="secondary"
          size="md"
          icon={Icon.arrowLeft}
          onClick={() => go(idx - 1)}
          disabled={idx === 0}
        >
          Back
        </Btn>
        <Btn
          variant="secondary"
          size="md"
          onClick={() =>
            setQuestions((qs) => qs.map((x, i) => (i === idx ? { ...x, flagged: !x.flagged } : x)))
          }
        >
          {q.flagged ? "Unflag" : "Flag for review"}
        </Btn>
        {idx < questions.length - 1 ? (
          <Btn variant="primary" size="md" icon={Icon.arrowRight} onClick={() => go(idx + 1)}>
            Next
          </Btn>
        ) : (
          <Btn variant="primary" size="md" icon={Icon.check} onClick={finish}>
            Submit exam
          </Btn>
        )}
        <div style={{ flex: 1 }} />
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: "var(--text-fade)",
            alignSelf: "center",
          }}
        >
          {answeredCount}/{questions.length} answered
        </span>
      </div>
    </div>
  );
}

/* ────────── review (self-grade) ────────── */

function ExamReview({
  attempt,
  cards,
  onComplete,
}: {
  attempt: ExamAttempt;
  cards: Card[];
  onComplete: (graded: ExamAttempt) => void;
}) {
  const [questions, setQuestions] = useState(attempt.questions);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const ungraded = questions.some((q) => q.correct === null);

  const mark = (i: number, correct: boolean) => {
    setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, correct } : x)));
  };

  return (
    <div
      className="fade-in"
      style={{
        padding: "1.25rem 1.5rem",
        maxWidth: 900,
        margin: "0 auto",
        overflowY: "auto",
        height: "100%",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <span className="eyebrow">Mock Exam · self-grade</span>
        <h1
          className="italic-serif"
          style={{ fontSize: 26, margin: "0.35rem 0 0", fontWeight: 400 }}
        >
          How did each one go?
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "6px 0 0" }}>
          Be honest — we use these marks to find your weak concepts, not to judge you.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {questions.map((q, i) => {
          const card = byId.get(q.cardId);
          if (!card) return null;
          return (
            <div key={q.cardId} className="panel" style={{ padding: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: 11, color: "var(--text-fade)" }}>
                    Q{i + 1}
                  </span>
                  <div className="italic-serif" style={{ fontSize: 15, color: "var(--accent)" }}>
                    {card.concept}
                  </div>
                  {q.flagged && <Chip tone="warn">Flagged</Chip>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => mark(i, true)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: 6,
                      border: `1px solid ${q.correct === true ? "var(--accent)" : "var(--border)"}`,
                      background: q.correct === true ? "rgba(0,230,168,0.12)" : "var(--surface)",
                      color: q.correct === true ? "var(--accent)" : "var(--text-dim)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Got it
                  </button>
                  <button
                    onClick={() => mark(i, false)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: 6,
                      border: `1px solid ${q.correct === false ? "var(--danger)" : "var(--border)"}`,
                      background: q.correct === false ? "rgba(229,111,76,0.12)" : "var(--surface)",
                      color: q.correct === false ? "var(--danger)" : "var(--text-dim)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Missed it
                  </button>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-dim)",
                  marginBottom: 10,
                  lineHeight: 1.55,
                }}
              >
                {card.question}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>
                    Your answer
                  </div>
                  <div
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "0.6rem 0.8rem",
                      minHeight: 52,
                      fontSize: 12,
                      fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                      color: q.studentAnswer ? "var(--text)" : "var(--text-fade)",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.5,
                    }}
                  >
                    {q.studentAnswer.trim() || "(no answer)"}
                  </div>
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>
                    Correct answer
                  </div>
                  <div
                    className="italic-serif"
                    style={{
                      background: "rgba(0,230,168,0.04)",
                      border: "1px solid var(--accent-dim)",
                      borderRadius: 6,
                      padding: "0.6rem 0.8rem",
                      minHeight: 52,
                      fontSize: 16,
                      color: "var(--accent)",
                      lineHeight: 1.3,
                    }}
                  >
                    {card.answer}
                  </div>
                </div>
              </div>
              <details>
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--text-fade)",
                    fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Show working
                </summary>
                <div
                  className="font-mono"
                  style={{
                    marginTop: 6,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    padding: "0.6rem 0.8rem",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "var(--text-dim)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.65,
                  }}
                >
                  {card.working}
                </div>
              </details>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn
          variant="primary"
          size="lg"
          icon={Icon.check}
          onClick={() => onComplete({ ...attempt, questions })}
          disabled={ungraded}
        >
          {ungraded ? "Grade every question to finish" : "See results"}
        </Btn>
      </div>
    </div>
  );
}

/* ────────── results ────────── */

function ExamResults({
  attempt,
  cards,
  readOnly,
  onDone,
  onRestart,
}: {
  attempt: ExamAttempt;
  cards: Card[];
  readOnly: boolean;
  onDone: () => void;
  onRestart: () => void;
}) {
  const router = useRouter();
  const pct = attempt.score == null ? null : Math.round(attempt.score * 100);
  const meanTime = meanTimePerQuestion(attempt);
  const weak = missedConcepts(attempt, cards, 5);
  const correctCount = attempt.questions.filter((q) => q.correct === true).length;
  const totalDuration = attempt.durationMs;

  return (
    <div
      className="fade-in"
      style={{
        padding: "1.25rem 1.5rem",
        maxWidth: 900,
        margin: "0 auto",
        overflowY: "auto",
        height: "100%",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <span className="eyebrow">Mock Exam · results</span>
        <h1
          className="italic-serif"
          style={{ fontSize: 30, margin: "0.35rem 0 0", fontWeight: 400 }}
        >
          {pct == null ? "Attempt" : pct >= 80 ? "Strong." : pct >= 60 ? "Mixed." : "Rebuild."}
          <span style={{ color: "var(--text-fade)", fontSize: 22 }}> · {attempt.deckLabel}</span>
        </h1>
        {readOnly && (
          <Chip style={{ marginTop: 8 }}>
            Read-only · attempted {new Date(attempt.startedAt).toLocaleDateString("en-AU")}
          </Chip>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <StatTile
          label="Score"
          value={pct == null ? "—" : `${pct}%`}
          sub={`${correctCount}/${attempt.questionCount} correct`}
          accent={pct == null ? "var(--text-fade)" : pct >= 80 ? "var(--accent)" : "var(--warn)"}
          icon={Icon.trophy}
        />
        <StatTile
          label="Duration"
          value={totalDuration == null ? "—" : formatMs(totalDuration)}
          sub={attempt.timeLimitMs == null ? "Untimed" : `of ${formatMs(attempt.timeLimitMs)}`}
          accent="var(--info)"
          icon={Icon.clock}
        />
        <StatTile
          label="Avg/Q"
          value={meanTime == null ? "—" : formatMs(meanTime)}
          sub="per answered Q"
          accent="var(--text)"
          icon={Icon.clock}
        />
        <StatTile
          label="Flagged"
          value={attempt.questions.filter((q) => q.flagged).length}
          sub="marked for review"
          accent="var(--warn)"
          icon={Icon.alert}
        />
      </div>

      <section className="panel" style={{ padding: "1.25rem", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Icon.alert size={14} color="var(--warn)" />
          <span className="eyebrow">Missed concepts</span>
        </div>
        {weak.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Nothing missed. Clean sweep.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {weak.map((w) => (
              <div
                key={w.cardId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0.55rem 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ flex: 1, fontSize: 13 }}>{w.concept}</div>
                <Chip tone="warn">missed</Chip>
              </div>
            ))}
            {!readOnly && (
              <div style={{ marginTop: 12 }}>
                <Btn
                  variant="secondary"
                  size="sm"
                  icon={Icon.brain}
                  onClick={() => router.push("/study")}
                >
                  Rebuild in Daily Study
                </Btn>
              </div>
            )}
          </div>
        )}
      </section>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" size="md" onClick={onDone}>
          Back to setup
        </Btn>
        {!readOnly && (
          <Btn variant="primary" size="md" icon={Icon.rotate} onClick={onRestart}>
            New attempt
          </Btn>
        )}
      </div>
    </div>
  );
}
