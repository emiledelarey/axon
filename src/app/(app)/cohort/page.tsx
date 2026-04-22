"use client";

import { useAppState } from "@/components/providers/AppStateProvider";
import { Icon } from "@/components/ui/Icon";
import { computeCohort } from "@/lib/cohort";

export default function CohortPage() {
  const { state } = useAppState();
  const ranked = computeCohort(state.xp, state.streak);

  return (
    <div
      className="fade-in"
      style={{ padding: "2rem 2.5rem", maxWidth: 900, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow">Cohort leaderboard · this week</span>
        <h1
          className="italic-serif"
          style={{ fontSize: 44, margin: "0.5rem 0 0", fontWeight: 400 }}
        >
          Beta users · {ranked.length} so far.
        </h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 14,
            maxWidth: 600,
            marginTop: 12,
          }}
        >
          While Axon is in beta, you&apos;re ranked against the first students to try it.
          Ship a study session, climb the board.
        </p>
      </div>

      <div className="panel" style={{ padding: "1.5rem" }}>
        {ranked.map((p) => (
          <div
            key={p.rank}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 100px 80px",
              gap: 16,
              padding: "1rem 0",
              borderBottom:
                p.rank < ranked.length ? "1px solid var(--border)" : "none",
              alignItems: "center",
              background: p.isUser ? "rgba(0,230,168,0.04)" : "transparent",
              margin: p.isUser ? "0 -1.5rem" : 0,
              paddingLeft: p.isUser ? "1.5rem" : 0,
              paddingRight: p.isUser ? "1.5rem" : 0,
              borderLeft: p.isUser ? "2px solid var(--accent)" : "none",
            }}
          >
            <div
              className="italic-serif"
              style={{
                fontSize: 22,
                color: p.rank <= 3 ? "var(--accent)" : "var(--text-fade)",
              }}
            >
              #{p.rank}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {p.crown && <Icon.crown size={14} color="var(--warn)" />}
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: p.isUser ? 600 : 400,
                    color: p.isUser ? "var(--accent)" : "var(--text)",
                  }}
                >
                  {p.name}
                </div>
                {p.isUser && (
                  <div
                    className="font-mono"
                    style={{ fontSize: 10, color: "var(--text-dim)" }}
                  >
                    That&apos;s you
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "flex-end",
              }}
            >
              <Icon.flame size={11} color="var(--warn)" />
              <span className="font-mono" style={{ fontSize: 13 }}>
                {p.streak}
              </span>
            </div>
            <div
              className="italic-serif"
              style={{
                fontSize: 18,
                textAlign: "right",
                color: "var(--accent)",
              }}
            >
              {p.xp.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
