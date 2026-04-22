"use client";

import { useState } from "react";
import { switchToDeck, type AppState } from "@/lib/state";
import { Icon } from "../ui/Icon";

type Update = (patch: Partial<AppState> | ((s: AppState) => AppState)) => void;

export function DeckPicker({
  state,
  update,
  onAddDeck,
}: {
  state: AppState;
  update: Update;
  onAddDeck: () => void;
}) {
  const [open, setOpen] = useState(false);
  const totalDecks =
    (state.deck && state.deck.length > 0 ? 1 : 0) + state.decks.length;

  if (totalDecks === 0) {
    return (
      <button
        onClick={onAddDeck}
        style={{
          padding: "0.6rem 0.75rem",
          marginBottom: 16,
          background: "var(--surface)",
          borderRadius: 6,
          border: "1px dashed var(--border-bright)",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--text-dim)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        <Icon.sparkles size={12} color="var(--accent)" />
        <span>Add your first deck</span>
      </button>
    );
  }

  type GroupedEntry = {
    id: string | null;
    materialLabel: string;
    cards: { length: number };
    isActive: boolean;
  };
  const grouped: Record<string, GroupedEntry[]> = {};
  if (state.deck && state.deck.length > 0) {
    const sub = state.subject || "General";
    (grouped[sub] = grouped[sub] || []).push({
      id: state.activeDeckId,
      materialLabel: state.materialLabel,
      cards: state.deck,
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
    <div style={{ position: "relative", marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "0.5rem 0.75rem",
          background: "var(--surface)",
          borderRadius: 6,
          border: `1px solid ${open ? "var(--accent-dim)" : "var(--border)"}`,
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.15s",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="eyebrow"
            style={{ fontSize: 9, marginBottom: 2, color: "var(--text-fade)" }}
          >
            Active deck · {totalDecks} total
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {state.subject
              ? `${state.subject} · ${state.materialLabel}`
              : state.materialLabel || "Unnamed"}
          </div>
        </div>
        <Icon.chevronDown
          size={14}
          color="var(--text-dim)"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {open && (
        <div
          className="fade-in"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border-bright)",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 50,
            maxHeight: 360,
            overflowY: "auto",
            padding: 4,
          }}
        >
          {subjects.map((sub, si) => (
            <div key={sub} style={{ marginBottom: si < subjects.length - 1 ? 4 : 0 }}>
              <div
                className="eyebrow"
                style={{
                  padding: "0.5rem 0.6rem 0.25rem",
                  fontSize: 9,
                  color: "var(--text-fade)",
                }}
              >
                {sub}
              </div>
              {grouped[sub].map((d) => {
                if (d.isActive) {
                  return (
                    <div
                      key={d.id ?? "active"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0.45rem 0.6rem",
                        borderRadius: 4,
                        background: "rgba(0,230,168,0.08)",
                        fontSize: 12,
                        color: "var(--accent)",
                      }}
                    >
                      <Icon.check size={12} />
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {d.materialLabel || "Unnamed"}
                      </div>
                      <span
                        className="font-mono"
                        style={{ fontSize: 10, color: "var(--text-fade)" }}
                      >
                        {d.cards.length}
                      </span>
                    </div>
                  );
                }
                return (
                  <button
                    key={d.id ?? `inactive-${sub}`}
                    onClick={() => {
                      if (d.id) update((s) => switchToDeck(s, d.id!));
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0.45rem 0.6rem",
                      borderRadius: 4,
                      background: "transparent",
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--text-dim)",
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-2)";
                      e.currentTarget.style.color = "var(--text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-dim)";
                    }}
                  >
                    <div style={{ width: 12 }} />
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {d.materialLabel || "Unnamed"}
                    </div>
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
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <button
            onClick={() => {
              onAddDeck();
              setOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0.5rem 0.6rem",
              borderRadius: 4,
              background: "transparent",
              width: "100%",
              textAlign: "left",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "var(--accent)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,230,168,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon.sparkles size={12} />
            <span>Add new deck</span>
          </button>
        </div>
      )}
    </div>
  );
}
