"use client";

import type { AppState } from "@/lib/state";
import { Icon } from "../ui/Icon";
import { Hairline } from "../ui/Hairline";

export function Topbar({ state }: { state: AppState }) {
  return (
    <header
      style={{
        height: 56,
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        background: "var(--bg)",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="status-dot live" />
        <span className="eyebrow">Session · active</span>
      </div>
      <Hairline style={{ width: 1, height: 16, background: "var(--border)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon.flame size={14} color="var(--warn)" />
          <span className="italic-serif" style={{ fontSize: 16, color: "var(--warn)" }}>
            {state.streak}
          </span>
          <span className="eyebrow">day streak</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon.sparkles size={14} color="var(--accent)" />
          <span className="italic-serif" style={{ fontSize: 16, color: "var(--accent)" }}>
            {state.xp.toLocaleString()}
          </span>
          <span className="eyebrow">XP</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon.layers size={14} color="var(--info)" />
          <span className="italic-serif" style={{ fontSize: 16, color: "var(--info)" }}>
            {state.deck.length}
          </span>
          <span className="eyebrow">cards</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div className="font-mono hide-mobile" style={{ fontSize: 11, color: "var(--text-fade)" }}>
        {new Date()
          .toLocaleDateString("en-AU", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
          .toUpperCase()}
      </div>
    </header>
  );
}
