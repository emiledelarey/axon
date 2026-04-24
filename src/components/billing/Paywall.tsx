"use client";

import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { UpgradeButton } from "./UpgradeButton";

/**
 * Shared "this is a Pro feature" card. Drop it in place of the gated UI.
 * Intentionally warm rather than aggressive — explain what unlocks, link
 * to Stripe, and show the A$20/mo anchor.
 */
export function Paywall({
  feature,
  blurb,
  bullets,
  children,
}: {
  feature: string;
  blurb: string;
  bullets?: string[];
  children?: ReactNode;
}) {
  return (
    <div
      className="fade-in"
      style={{
        padding: "1.5rem",
        maxWidth: 640,
        margin: "2rem auto",
        border: "1px solid var(--accent-dim)",
        borderRadius: 10,
        background: "rgba(0,230,168,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon.sparkles size={16} color="var(--accent)" />
        <span className="eyebrow" style={{ color: "var(--accent)" }}>
          Axon Pro · A$20/month
        </span>
      </div>
      <h2
        className="italic-serif"
        style={{ fontSize: 26, margin: "0 0 8px", fontWeight: 400, lineHeight: 1.2 }}
      >
        {feature} is a Pro feature.
      </h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>
        {blurb}
      </p>
      {bullets && bullets.length > 0 && (
        <ul
          style={{
            margin: "0 0 18px",
            padding: "0 0 0 18px",
            color: "var(--text)",
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <UpgradeButton />
        <span
          style={{
            fontSize: 11,
            color: "var(--text-fade)",
            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
          }}
        >
          Cancel anytime via Billing.
        </span>
      </div>
      {children}
    </div>
  );
}
