"use client";

import { useState } from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import { Btn } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { PasteMaterialModal } from "@/components/modals/PasteMaterialModal";
import { removeDeck, switchToDeck } from "@/lib/state";

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
          <Btn
            variant="primary"
            onClick={() => setShowPasteModal(true)}
            icon={Icon.sparkles}
          >
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
      !confirm(
        `Delete "${state.materialLabel}"? This deck and its error history will be removed.`,
      )
    )
      return;
    update((s) => removeDeck(s, s.activeDeckId!));
  };

  type GroupedEntry = {
    id: string | null;
    materialLabel: string;
    cards: { length: number };
    isActive: boolean;
  };
  const grouped: Record<string, GroupedEntry[]> = {};
  if (deck.length > 0) {
    const sub = state.subject || "General";
    (grouped[sub] = grouped[sub] || []).push({
      id: state.activeDeckId,
      materialLabel: state.materialLabel,
      cards: deck,
      isActive: true,
    });
  }
  state.decks.forEach((d) => {
    const sub = d.subject || "General";
    (grouped[sub] = grouped[sub] || []).push({
      id: d.id,
      materialLabel: d.materialLabel,
      cards: d.cards,
      isActive: false,
    });
  });
  const subjects = Object.keys(grouped).sort();

  return (
    <div
      className="fade-in"
      style={{ padding: "2rem 2.5rem", maxWidth: 1000, margin: "0 auto" }}
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
            style={{ fontSize: 40, margin: "0.5rem 0 0", fontWeight: 400 }}
          >
            {state.subject && (
              <span style={{ color: "var(--text-fade)" }}>{state.subject} · </span>
            )}
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
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {subjects.map((sub) => (
            <div key={sub}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                {sub}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {grouped[sub].map((d) => {
                  if (d.isActive) {
                    return (
                      <div
                        key={d.id ?? "active"}
                        style={{
                          padding: "0.45rem 0.9rem",
                          borderRadius: 20,
                          background: "rgba(0,230,168,0.1)",
                          border: "1px solid var(--accent)",
                          color: "var(--accent)",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Icon.check size={11} />
                        {d.materialLabel}
                        <span
                          className="font-mono"
                          style={{ fontSize: 10, color: "var(--text-dim)" }}
                        >
                          {d.cards.length}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={d.id ?? `inactive-${sub}`}
                      onClick={() => d.id && update((s) => switchToDeck(s, d.id!))}
                      style={{
                        padding: "0.45rem 0.9rem",
                        borderRadius: 20,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text-dim)",
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent-dim)";
                        e.currentTarget.style.color = "var(--text)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--text-dim)";
                      }}
                    >
                      {d.materialLabel}
                      <span
                        className="font-mono"
                        style={{ fontSize: 10, color: "var(--text-fade)" }}
                      >
                        {d.cards.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
                  <div
                    style={{ marginBottom: 14, color: "var(--text)", lineHeight: 1.6 }}
                  >
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
