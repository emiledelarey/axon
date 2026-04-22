"use client";

import { useState } from "react";
import { API_AVAILABLE, apiGenerateCards } from "@/lib/api";
import { DEMO_DECK, addDeckAsActive, allSubjects, type AppState } from "@/lib/state";
import { Btn } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Icon } from "../ui/Icon";

type Update = (patch: Partial<AppState> | ((s: AppState) => AppState)) => void;
type InputTab = "material" | "focus" | "notes";

export function PasteMaterialModal({
  onClose,
  update,
  state,
}: {
  onClose: () => void;
  update: Update;
  state: AppState;
}) {
  const existingSubjects = allSubjects(state);
  const [subject, setSubject] = useState(existingSubjects[0] || "");
  const [newSubjectMode, setNewSubjectMode] = useState(existingSubjects.length === 0);
  const [newSubject, setNewSubject] = useState("");
  const [material, setMaterial] = useState("");
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");
  const [inputTab, setInputTab] = useState<InputTab>("material");
  const [label, setLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedSubject = newSubjectMode ? newSubject.trim() : subject;

  const handleGenerate = async () => {
    if (!resolvedSubject) {
      setError("Pick or name a subject.");
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
      let cards;
      if (API_AVAILABLE) {
        const result = await apiGenerateCards({ material, focus, notes, count: 10 });
        cards = result.cards;
      } else {
        cards = DEMO_DECK;
      }
      update((s) =>
        addDeckAsActive(s, {
          subject: resolvedSubject,
          material,
          focus,
          notes,
          materialLabel: label.trim(),
          cards,
        }),
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate.");
      setGenerating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <span className="eyebrow">New deck</span>
            <h2
              className="italic-serif"
              style={{ fontSize: 28, margin: "0.25rem 0 0", fontWeight: 400 }}
            >
              File new material.
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              color: "var(--text-dim)",
              padding: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Icon.x size={18} />
          </button>
        </div>

        <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
          Subject
        </label>
        {!newSubjectMode && existingSubjects.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 14,
            }}
          >
            {existingSubjects.map((sub) => {
              const sel = subject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSubject(sub)}
                  style={{
                    padding: "0.45rem 0.9rem",
                    borderRadius: 20,
                    background: sel ? "rgba(0,230,168,0.1)" : "var(--surface)",
                    border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                    color: sel ? "var(--accent)" : "var(--text-dim)",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {sel && <Icon.check size={11} />}
                  {sub}
                </button>
              );
            })}
            <button
              onClick={() => {
                setNewSubjectMode(true);
                setNewSubject("");
              }}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: 20,
                background: "transparent",
                border: "1px dashed var(--border-bright)",
                color: "var(--text-dim)",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon.sparkles size={11} /> New subject
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. Finance, Accounting, Economics"
              maxLength={40}
              autoFocus
              style={{ flex: 1 }}
            />
            {existingSubjects.length > 0 && (
              <Btn
                variant="ghost"
                size="md"
                onClick={() => {
                  setNewSubjectMode(false);
                  setNewSubject("");
                }}
              >
                Cancel
              </Btn>
            )}
          </div>
        )}

        <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
          Week / topic
        </label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Week 5 — WACC"
          maxLength={80}
          style={{ marginBottom: 18 }}
        />

        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div>
              <span className="eyebrow">Your input</span>
              <div style={{ fontSize: 12, color: "var(--text-fade)", marginTop: 2 }}>
                Material is required. Focus and notes make the cards <em>much</em> better.
              </div>
            </div>
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
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "var(--text)" }}>The source text.</strong> Paste lecture
                slides, textbook pages, a problem sheet, or any study material. Min 100 chars.
              </div>
              <textarea
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder={
                  "Paste lecture slides, textbook pages, a problem sheet...\n\nAny text. Axon reads it and extracts the testable concepts."
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
                  {material.length < 100 ? `${100 - material.length} more chars` : "Ready"}
                </span>
                <span>{material.length.toLocaleString()} / 80,000</span>
              </div>
            </div>
          )}

          {inputTab === "focus" && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "var(--text)" }}>What to weight heavily.</strong> Tell Axon
                what your lecturer emphasised, what the exam tends to test, or what you want drilled
                hardest.
              </div>
              <textarea
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder={
                  "e.g.\n- The lecturer said tax shields will be on the exam\n- I keep confusing WACC with cost of equity — drill me on the difference\n- Skip the history part, focus on calculations\n- Treat the elasticity section as the priority"
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
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "var(--text)" }}>Your own notes or summary.</strong> Axon
                reads these to calibrate card depth, spot your misconceptions, and find gaps between
                what you know and what the material covers.
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  "Jot what you took away from the lecture, or paste your own notes...\n\nAxon uses these to see what you've already internalised (and where you might be wrong)."
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
        </div>

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
            marginTop: 20,
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <Btn variant="ghost" size="md" onClick={onClose} disabled={generating}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            size="md"
            icon={generating ? undefined : Icon.sparkles}
            onClick={handleGenerate}
            disabled={!resolvedSubject || material.length < 100 || !label.trim() || generating}
          >
            {generating ? (
              <>
                <Spinner size={12} /> Generating
              </>
            ) : (
              "Generate deck"
            )}
          </Btn>
        </div>
      </div>
    </div>
  );
}
