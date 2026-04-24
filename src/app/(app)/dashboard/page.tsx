"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Btn } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatTile } from "@/components/ui/StatTile";
import { Icon } from "@/components/ui/Icon";
import { PasteMaterialModal } from "@/components/modals/PasteMaterialModal";

export default function DashboardPage() {
  const router = useRouter();
  const { state, update } = useAppState();
  const [showPasteModal, setShowPasteModal] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const deck = state.deck || [];
  const weakCards = useMemo(() => {
    const cards = state.deck || [];
    return Object.entries(state.errorsByCard || {})
      .map(([id, count]) => ({ id, count, card: cards.find((c) => c.id === id) }))
      .filter((x): x is { id: string; count: number; card: NonNullable<(typeof x)["card"]> } =>
        Boolean(x.card && x.count > 0),
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [state.errorsByCard, state.deck]);

  const topWeak = weakCards[0];
  const estMinutes = Math.max(1, Math.ceil(deck.length * 0.8));
  const hasDeck = deck.length > 0;

  return (
    <div className="fade-in" style={{ padding: "1.5rem", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 22 }}>
        <span className="eyebrow">
          Today ·{" "}
          {new Date().toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
        <h1
          className="italic-serif"
          style={{
            fontSize: 38,
            margin: "0.25rem 0 0.25rem",
            lineHeight: 1.1,
            fontWeight: 400,
          }}
        >
          {greeting}
          {state.name ? `, ${state.name}` : ""}.
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 14, margin: 0, maxWidth: 640 }}>
          {topWeak ? (
            <>
              Your weakest concept right now is{" "}
              <span className="italic-serif" style={{ color: "var(--warn)" }}>
                {topWeak.card.concept}
              </span>
              . That&apos;s where we&apos;ll start today.
            </>
          ) : !hasDeck ? (
            <>No deck yet. Paste material to generate cards.</>
          ) : state.sessionsCompleted === 0 ? (
            <>
              Your deck has{" "}
              <span className="italic-serif" style={{ color: "var(--accent)" }}>
                {deck.length} cards
              </span>{" "}
              ready. Start with Daily Study — it takes about {estMinutes} minutes.
            </>
          ) : (
            <>Nice work keeping the streak alive. {deck.length} cards in rotation.</>
          )}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatTile
          label="Streak"
          value={state.streak}
          sub={state.streak === 0 ? "Study today to start" : "+1 today if you study"}
          accent="var(--warn)"
          icon={Icon.flame}
        />
        <StatTile
          label="XP"
          value={state.xp.toLocaleString()}
          sub={`${state.sessionsCompleted} session${state.sessionsCompleted !== 1 ? "s" : ""} done`}
          accent="var(--accent)"
          icon={Icon.sparkles}
        />
        <StatTile
          label="Cards"
          value={deck.length}
          sub={hasDeck ? `~${estMinutes} min to review` : "Generate your deck"}
          accent="var(--info)"
          icon={Icon.layers}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Primary action — resume hero */}
          <section
            className="panel"
            style={{
              padding: "1.25rem",
              borderColor: hasDeck ? "var(--accent-dim)" : "var(--border)",
              background: hasDeck ? "rgba(0,230,168,0.03)" : "var(--surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <Icon.bolt size={14} color={hasDeck ? "var(--accent)" : "var(--text-dim)"} />
              <span
                className="eyebrow"
                style={{ color: hasDeck ? "var(--accent)" : "var(--text-dim)" }}
              >
                {hasDeck ? "Resume where you left off" : "Start your first deck"}
              </span>
            </div>
            {hasDeck ? (
              <>
                <h2
                  className="italic-serif"
                  style={{
                    fontSize: 22,
                    margin: "0 0 8px",
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  {topWeak ? (
                    <>
                      Rebuild <span style={{ color: "var(--warn)" }}>{topWeak.card.concept}</span>
                    </>
                  ) : (
                    <>
                      {state.materialLabel || "Your deck"}{" "}
                      <span style={{ color: "var(--text-dim)" }}>
                        · {deck.length} card{deck.length !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-dim)",
                    margin: "0 0 14px",
                    lineHeight: 1.55,
                  }}
                >
                  {topWeak ? (
                    <>
                      You&apos;ve missed this card{" "}
                      <span className="font-mono" style={{ color: "var(--warn)" }}>
                        {topWeak.count}×
                      </span>{" "}
                      — today&apos;s session will put it first. About {estMinutes} minutes for the
                      full deck.
                    </>
                  ) : state.sessionsCompleted === 0 ? (
                    <>First session gets you a streak of 1 and a read on which concepts stick.</>
                  ) : (
                    <>
                      {state.materialLabel ? `${state.materialLabel} · ` : ""}
                      {deck.length} cards in rotation. ~{estMinutes} minutes.
                    </>
                  )}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn
                    variant="primary"
                    size="lg"
                    icon={Icon.play}
                    onClick={() => router.push("/study")}
                  >
                    Continue today&apos;s study
                  </Btn>
                  <Btn
                    variant="secondary"
                    size="md"
                    icon={Icon.sparkles}
                    onClick={() => setShowPasteModal(true)}
                  >
                    New deck
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <h2
                  className="italic-serif"
                  style={{
                    fontSize: 22,
                    margin: "0 0 8px",
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  Paste any study material to begin.
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-dim)",
                    margin: "0 0 14px",
                    lineHeight: 1.55,
                  }}
                >
                  Lecture notes, textbook pages, a problem set — anything. Axon turns it into 10
                  flashcards in about 20 seconds.
                </p>
                <Btn
                  variant="primary"
                  size="lg"
                  icon={Icon.sparkles}
                  onClick={() => setShowPasteModal(true)}
                >
                  Paste material
                </Btn>
              </>
            )}
          </section>

          {/* Secondary actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {(
              [
                {
                  title: "Live Work",
                  sub: "Paste a problem. Get Socratic hints.",
                  icon: Icon.target,
                  href: "/coach",
                },
                {
                  title: "Tutor Chat",
                  sub: "Ask anything. Material-aware.",
                  icon: Icon.msg,
                  href: "/tutor",
                },
              ] as const
            ).map((row) => (
              <button
                key={row.href}
                onClick={() => router.push(row.href)}
                className="panel"
                style={{
                  padding: "0.9rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-dim)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <row.icon size={18} color="var(--accent)" />
                <div style={{ fontSize: 15, fontWeight: 500 }}>{row.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
                  {row.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside>
          <section className="panel" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Icon.alert size={14} color="var(--warn)" />
              <span className="eyebrow">Weak spots</span>
            </div>
            {weakCards.length > 0 ? (
              weakCards.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "0.6rem 0",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>{w.card.concept}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                        fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                      }}
                    >
                      {w.count} miss{w.count !== 1 ? "es" : ""} · needs rebuild
                    </div>
                  </div>
                  <Chip tone="warn">{w.count}</Chip>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
                Nothing flagged yet. Miss a card in Study and Axon surfaces it here.
              </div>
            )}
          </section>
        </aside>
      </div>

      {showPasteModal && (
        <PasteMaterialModal
          onClose={() => setShowPasteModal(false)}
          update={update}
          state={state}
        />
      )}
    </div>
  );
}
