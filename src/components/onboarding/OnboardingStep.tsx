import type { ReactNode } from "react";
import { AxonMark } from "../ui/AxonMark";

export function OnboardingStep({
  step,
  total,
  title,
  sub,
  children,
}: {
  step: number;
  total: number;
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div
      className="fade-in"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "1.75rem 2.5rem",
      }}
    >
      <header style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AxonMark size={22} />
          <span
            className="font-display"
            style={{ fontSize: 20, letterSpacing: "0.05em", fontWeight: 600 }}
          >
            AXON
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 30,
                height: 2,
                background: i < step ? "var(--accent)" : "var(--border)",
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </header>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 720,
          margin: "0 auto",
          width: "100%",
          paddingTop: 0,
        }}
      >
        <span className="eyebrow" style={{ textAlign: "center", marginBottom: 14 }}>
          Step {step} of {total}
        </span>
        <h2
          className="italic-serif"
          style={{
            fontSize: 30,
            textAlign: "center",
            margin: "0 0 0.5rem",
            fontWeight: 400,
            lineHeight: 1.15,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 14,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {sub}
        </p>
        {children}
      </div>
    </div>
  );
}
