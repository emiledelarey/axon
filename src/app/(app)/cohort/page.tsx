"use client";

import { useAppState } from "@/components/providers/AppStateProvider";
import { Icon } from "@/components/ui/Icon";
import { computeCohort } from "@/lib/cohort";

export default function CohortPage() {
  const { state } = useAppState();
  const ranked = computeCohort(state.xp, state.streak);

  // Empty state — intentional per the Perplexity brief. We don't show fake
  // rank data; we tell the student what's coming and what we're waiting on.
  if (!ranked) {
    return (
      <div
        className="fade-in"
        style={{
          padding: "1.25rem 1.5rem",
          maxWidth: 640,
          margin: "0 auto",
          textAlign: "center",
          paddingTop: 80,
        }}
      >
        <Icon.users size={28} color="var(--text-fade)" />
        <h1
          className="italic-serif"
          style={{
            fontSize: 28,
            margin: "14px 0 6px",
            fontWeight: 400,
          }}
        >
          Cohort benchmarking — coming soon.
        </h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 13,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Once enough students are running daily sessions, this page shows how your streak, XP, and
          accuracy compare against your course cohort. We won&apos;t show you placeholder rankings —
          you&apos;ll see real numbers or nothing.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: "1.25rem 1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">Cohort leaderboard · this week</span>
        <h1
          className="italic-serif"
          style={{ fontSize: 30, margin: "0.35rem 0 0", fontWeight: 400 }}
        >
          {ranked.length} student{ranked.length === 1 ? "" : "s"} this week.
        </h1>
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
              borderBottom: p.rank < ranked.length ? "1px solid var(--border)" : "none",
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
                  <div className="font-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
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
