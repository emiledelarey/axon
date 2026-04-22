"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Btn } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatTile } from "@/components/ui/StatTile";
import { Icon } from "@/components/ui/Icon";
import { PasteMaterialModal } from "@/components/modals/PasteMaterialModal";
import { computeCohort } from "@/lib/cohort";

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
  const ranked = computeCohort(state.xp, state.streak);
  const userRank = ranked.find((p) => p.isUser)?.rank ?? 0;

  return (
    <div className="fade-in" style={{ padding: "2.5rem", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
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
            fontSize: 56,
            margin: "0.5rem 0 0.25rem",
            lineHeight: 1.05,
            fontWeight: 400,
          }}
        >
          {greeting}
          {state.name ? `, ${state.name}` : ""}.
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 17, margin: 0, maxWidth: 620 }}>
          {weakCards.length > 0 ? (
            <>
              Your weakest concept right now is{" "}
              <span className="italic-serif" style={{ color: "var(--warn)" }}>
                {weakCards[0].card.concept}
              </span>
              . That&apos;s where we&apos;ll start today.
            </>
          ) : deck.length === 0 ? (
            <>No deck yet. Paste material to generate cards.</>
          ) : state.sessionsCompleted === 0 ? (
            <>
              Your deck has{" "}
              <span className="italic-serif" style={{ color: "var(--accent)" }}>
                {deck.length} cards
              </span>{" "}
              ready. Start with Daily Study — it takes about 8 minutes.
            </>
          ) : (
            <>Nice work keeping the streak alive. {deck.length} cards in rotation.</>
          )}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 40,
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
          sub={
            deck.length > 0
              ? `~${Math.ceil(deck.length * 0.8)} min to review`
              : "Generate your deck"
          }
          accent="var(--info)"
          icon={Icon.layers}
        />
        <StatTile
          label="Cohort rank"
          value={`#${userRank}`}
          sub={`of ${ranked.length}`}
          accent="var(--rose)"
          icon={Icon.trophy}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        <section className="panel" style={{ padding: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <span className="eyebrow">Today&apos;s options</span>
              <h2
                className="italic-serif"
                style={{ fontSize: 26, margin: "0.25rem 0 0", fontWeight: 400 }}
              >
                Three ways in.
              </h2>
            </div>
            <Btn
              variant="secondary"
              size="sm"
              icon={Icon.sparkles}
              onClick={() => setShowPasteModal(true)}
            >
              New deck
            </Btn>
          </div>

          {[
            {
              n: "01",
              title: "Daily Study",
              sub: `${deck.length} cards · flashcards + error classifier`,
              t: `~${Math.ceil(deck.length * 0.8)} min`,
              href: "/study",
              disabled: deck.length === 0,
              live: deck.length > 0,
            },
            {
              n: "02",
              title: "Live Work",
              sub: "Paste a problem you're stuck on. AI coaches you through.",
              t: "as long as needed",
              href: "/coach",
              disabled: false,
              live: false,
            },
            {
              n: "03",
              title: "Tutor Chat",
              sub: "Ask anything. Socratic. Knows your material.",
              t: "unlimited",
              href: "/tutor",
              disabled: false,
              live: false,
            },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "1rem 0",
                borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                opacity: row.disabled ? 0.5 : 1,
              }}
            >
              <span className="font-mono" style={{ color: "var(--text-fade)", fontSize: 11 }}>
                {row.n}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{row.title}</span>
                  {row.live && <Chip tone="accent">Ready</Chip>}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{row.sub}</div>
              </div>
              <span className="font-mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {row.t}
              </span>
              <Btn
                variant="secondary"
                size="sm"
                icon={Icon.chevronRight}
                onClick={() => router.push(row.href)}
                disabled={row.disabled}
              >
                Open
              </Btn>
            </div>
          ))}

          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <Btn
              variant="primary"
              size="lg"
              icon={Icon.play}
              onClick={() => router.push("/study")}
              disabled={deck.length === 0}
            >
              Start today&apos;s study
            </Btn>
          </div>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon.alert size={14} color="var(--warn)" />
              <span className="eyebrow">Weak spots</span>
            </div>
            {weakCards.length > 0 ? (
              weakCards.map((w, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.6rem 0" }}
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
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
                Nothing flagged yet. Miss a card in Study and Axon surfaces it here.
              </div>
            )}
          </section>

          <section className="panel" style={{ padding: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon.users size={14} color="var(--text-dim)" />
                <span className="eyebrow">Cohort · this week</span>
              </div>
              <button
                onClick={() => router.push("/cohort")}
                style={{
                  fontSize: 11,
                  color: "var(--accent)",
                  fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                All →
              </button>
            </div>
            {ranked.slice(0, 5).map((p) => (
              <div
                key={p.rank}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0.4rem 0",
                  color: p.isUser ? "var(--text)" : "var(--text-dim)",
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    width: 18,
                    color: p.rank <= 3 ? "var(--accent)" : "var(--text-fade)",
                  }}
                >
                  #{p.rank}
                </span>
                <div
                  style={{
                    flex: 1,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {p.crown && <Icon.crown size={10} color="var(--warn)" />}
                  <span
                    style={{
                      fontWeight: p.isUser ? 500 : 400,
                      color: p.isUser ? "var(--accent)" : undefined,
                    }}
                  >
                    {p.name}
                  </span>
                </div>
                <span className="font-mono" style={{ fontSize: 11 }}>
                  {p.xp.toLocaleString()}
                </span>
              </div>
            ))}
          </section>
        </div>
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
