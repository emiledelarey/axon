"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AxonMark } from "@/components/ui/AxonMark";

/**
 * Runtime error boundary. Renders when a route handler or page throws past its
 * own try/catch. Keeps the brand voice instead of dumping a stack trace —
 * users can retry or bail to the landing.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook here when Sentry / Vercel error tracking is wired in (Phase 3).
    console.error("page error:", error);
  }, [error]);

  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        textAlign: "center",
        gap: 24,
      }}
    >
      <AxonMark size={32} />
      <span className="eyebrow" style={{ color: "var(--danger)" }}>
        Something broke
      </span>
      <h1
        className="display-serif"
        style={{
          fontSize: "clamp(2rem, 5vw, 3rem)",
          margin: 0,
          fontWeight: 500,
          maxWidth: 540,
          lineHeight: 1.1,
        }}
      >
        That didn&apos;t work. <span className="italic-serif grad-accent">Mind trying again?</span>
      </h1>
      <p style={{ color: "var(--text-dim)", maxWidth: 460, margin: 0 }}>
        We logged what happened. If it keeps breaking, email{" "}
        <a href="mailto:emiledelarey@gmail.com" style={{ color: "var(--accent)" }}>
          emiledelarey@gmail.com
        </a>
        .
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={reset} className="btn btn-primary" style={{ padding: "0.85rem 1.5rem" }}>
          Try again
        </button>
        <Link href="/" className="btn btn-ghost" style={{ padding: "0.85rem 1.5rem" }}>
          Back to home
        </Link>
      </div>
      {error.digest ? (
        <code
          style={{
            fontSize: 11,
            color: "var(--text-fade)",
            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
          }}
        >
          ref · {error.digest}
        </code>
      ) : null}
    </div>
  );
}
