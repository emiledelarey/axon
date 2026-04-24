"use client";

import { useState } from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Btn } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { PasteMaterialModal } from "@/components/modals/PasteMaterialModal";
import { removeDeck, switchToDeck } from "@/lib/state";
import type { Card } from "@/lib/api-types";

/**
 * Parses the timestamp Axon embeds in every deck id (`deck_${Date.now()}`) and
 * returns a short human-readable date. Falls back to "—" if the id doesn't
 * follow that format (demo decks, legacy state).
 */
function deckCreatedLabel(id: string | null): string {
  if (!id) return "—";
  const match = id.match(/^deck_(\d+)$/);
  if (!match) return "—";
  const ts = Number(match[1]);
  if (!Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

/** Top-N weak concepts for a deck, sorted by miss count. */
function topWeakConcepts(
  cards: Card[],
  errorsByCard: Record<string, number>,
  limit = 2,
): Array<{ concept: string; count: number }> {
  return Object.entries(errorsByCard || {})
    .map(([id, count]) => {
      const card = cards.find((c) => c.id === id);
      return card && count > 0 ? { concept: card.concept, count } : null;
    })
    .filter((x): x is { concept: string; count: number } => x !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default function LibraryPage() {
  const { state, update } = useAppState();
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const deck = state.deck || [];
  const totalDecks = (deck.length > 0 ? 1 : 0) + state.decks.length;

  if (deck.length === 0 && state.decks.length === 0) {
    return (
      <>
        <div
          className="fade-in"
          style={{
            padding: "2rem",
            maxWidth: 600,
            margin: "0 auto",
            textAlign: "center",
            paddingTop: 80,
          }}
        >
          <Icon.layers size={32} color="var(--text-fade)" />
          <h2
            className="italic-serif"
            style={{
              fontSize: 32,
              marginTop: 16,
              marginBottom: 8,
              fontWeight: 400,
            }}
          >
            No deck yet.
          </h2>
          <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>
            Paste material to generate 10 cards.
          </p>
          <Btn variant="primary" onClick={() => setShowPasteModal(true)} icon={Icon.sparkles}>
            Paste material
          </Btn>
        </div>
        {showPasteModal && (
          <PasteMaterialModal
            onClose={() => setShowPasteModal(false)}
            update={update}
            state={state}
          />
        )}
      </>
    );
  }

  const handleDelete = () => {
    if (!state.activeDeckId) return;
    if (
      !confirm(`Delete "${state.materialLabel}"? This deck and its error history will be removed.`)
    )
      return;
    update((s) => removeDeck(s, s.activeDeckId!));
  };

  return (
    <div
      className="fade-in"
      style={{ padding: "1.25rem 1.5rem", maxWidth: 1000, margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <span className="eyebrow">Your decks · {totalDecks}</span>
          <h1
            className="italic-serif"
            style={{ fontSize: 28, margin: "0.35rem 0 0", fontWeight: 400 }}
          >
            {state.subject && <span style={{ color: "var(--text-fade)" }}>{state.subject} · </span>}
            {state.materialLabel || "Unnamed deck"}
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "8px 0 0" }}>
            {deck.length} card{deck.length !== 1 ? "s" : ""} in this deck
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn
            variant="secondary"
            size="md"
            icon={Icon.sparkles}
            onClick={() => setShowPasteModal(true)}
          >
            Add new deck
          </Btn>
          {deck.length > 0 && (
            <Btn variant="ghost" size="md" icon={Icon.trash} onClick={handleDelete}>
              Delete deck
            </Btn>
          )}
        </div>
      </div>

      {totalDecks > 1 && (
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {(() => {
            type Entry = {
              id: string | null;
              subject: string;
              materialLabel: string;
              cards: Card[];
              errorsByCard: Record<string, number>;
              isActive: boolean;
            };
            const entries: Entry[] = [];
            if (deck.length > 0) {
              entries.push({
                id: state.activeDeckId,
                subject: state.subject || "General",
                materialLabel: state.materialLabel,
                cards: deck,
                errorsByCard: state.errorsByCard || {},
                isActive: true,
              });
            }
            state.decks.forEach((d) =>
              entries.push({
                id: d.id,
                subject: d.subject || "General",
                materialLabel: d.materialLabel,
                cards: d.cards,
                errorsByCard: d.errorsByCard || {},
                isActive: false,
              }),
            );
            const grouped = entries.reduce<Record<string, Entry[]>>((acc, e) => {
              (acc[e.subject] ||= []).push(e);
              return acc;
            }, {});
            const subjects = Object.keys(grouped).sort();

            return subjects.map((sub) => (
              <div key={sub}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  {sub}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 10,
                  }}
                >
                  {grouped[sub].map((d) => {
                    const weak = topWeakConcepts(d.cards, d.errorsByCard);
                    const card = (
                      <div
                        key={d.id ?? `entry-${sub}-${d.isActive}`}
                        onClick={() => {
                          if (!d.isActive && d.id) update((s) => switchToDeck(s, d.id!));
                        }}
                        style={{
                          padding: "0.75rem 0.9rem",
                          borderRadius: 8,
                          background: d.isActive ? "rgba(0,230,168,0.06)" : "var(--surface)",
                          border: `1px solid ${d.isActive ? "var(--accent)" : "var(--border)"}`,
                          cursor: d.isActive ? "default" : "pointer",
                          transition: "all 0.15s",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          minWidth: 0,
                        }}
                        onMouseEnter={(e) => {
                          if (!d.isActive) e.currentTarget.style.borderColor = "var(--accent-dim)";
                        }}
                        onMouseLeave={(e) => {
                          if (!d.isActive) e.currentTarget.style.borderColor = "var(--border)";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: d.isActive ? "var(--accent)" : "var(--text)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {d.materialLabel || "Unnamed"}
                          </div>
                          {d.isActive && <Chip tone="accent">Active</Chip>}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            fontSize: 10,
                            color: "var(--text-fade)",
                            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        >
                          <span>{d.cards.length} cards</span>
                          <span>·</span>
                          <span>{deckCreatedLabel(d.id)}</span>
                        </div>
                        {weak.length > 0 && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--warn)",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Icon.alert size={10} />
                            <span>Weak: {weak.map((w) => w.concept).join(", ")}</span>
                          </div>
                        )}
                      </div>
                    );
                    return card;
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      <div className="panel" style={{ overflow: "hidden" }}>
        {deck.map((card, i) => {
          const expanded = expandedId === card.id;
          const errorCount = state.errorsByCard?.[card.id] || 0;
          return (
            <div
              key={card.id}
              style={{
                borderBottom: i < deck.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <button
                onClick={() => setExpandedId(expanded ? null : card.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "1rem 1.5rem",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                <span
                  className="font-mono"
                  style={{ fontSize: 11, color: "var(--text-fade)", width: 30 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="italic-serif"
                    style={{ fontSize: 16, color: "var(--accent)", marginBottom: 2 }}
                  >
                    {card.concept}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-dim)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {card.front}
                  </div>
                </div>
                {errorCount > 0 && (
                  <Chip tone="warn">
                    {errorCount} miss{errorCount !== 1 ? "es" : ""}
                  </Chip>
                )}
                <Icon.chevronRight
                  size={14}
                  color="var(--text-fade)"
                  style={{
                    transform: expanded ? "rotate(90deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {expanded && (
                <div
                  className="fade-in"
                  style={{ padding: "0 1.5rem 1.5rem 3.25rem", fontSize: 13 }}
                >
                  <div className="eyebrow" style={{ marginBottom: 6 }}>
                    Question
                  </div>
                  <div style={{ marginBottom: 14, color: "var(--text)", lineHeight: 1.6 }}>
                    {card.question}
                  </div>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>
                    Answer
                  </div>
                  <div
                    className="italic-serif"
                    style={{ fontSize: 18, color: "var(--accent)", marginBottom: 14 }}
                  >
                    {card.answer}
                  </div>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>
                    Working
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 12,
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      padding: "0.75rem",
                      borderRadius: 6,
                      color: "var(--text-dim)",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {card.working}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
