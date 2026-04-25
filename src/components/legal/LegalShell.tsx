"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AxonMark } from "@/components/ui/AxonMark";

/**
 * Shared shell for /privacy and /terms. Reuses the design tokens (italic-serif
 * headlines, JetBrains Mono eyebrows, dark panels) so legal pages feel like
 * the same product, not a stock terms-of-service template.
 *
 * Has to unlock body overflow on mount because the in-app shell hard-locks it
 * for single-viewport behaviour. Same trick the LandingPage uses.
 */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflowY;
    document.body.style.overflowY = "auto";
    return () => {
      document.body.style.overflowY = prev;
    };
  }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0.9rem 1.5rem",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "var(--text)",
          }}
        >
          <AxonMark size={22} />
          <span
            className="font-display"
            style={{ fontSize: 20, letterSpacing: "0.05em", fontWeight: 600 }}
          >
            AXON
          </span>
        </Link>
      </header>

      <main
        className="container"
        style={{
          maxWidth: 720,
          padding: "clamp(2.5rem, 5vw, 4rem) 1.25rem",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <span className="eyebrow" style={{ color: "var(--accent)" }}>
            Last updated · {updated}
          </span>
          <h1
            className="display-serif"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              lineHeight: 1.05,
              margin: "0.5rem 0 0",
              fontWeight: 500,
            }}
          >
            {title}
          </h1>
        </div>

        <article
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--text)",
          }}
        >
          {children}
        </article>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "2rem 1.5rem",
          textAlign: "center",
        }}
      >
        <div
          className="eyebrow"
          style={{
            color: "var(--text-fade)",
            display: "flex",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <Link href="/privacy" style={{ color: "var(--text-fade)" }}>
            Privacy
          </Link>
          <span>·</span>
          <Link href="/terms" style={{ color: "var(--text-fade)" }}>
            Terms
          </Link>
          <span>·</span>
          <span>© {new Date().getFullYear()} Napkin Group</span>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
      <h2
        className="display-serif"
        style={{
          fontSize: "clamp(1.3rem, 2vw, 1.55rem)",
          margin: 0,
          fontWeight: 500,
          color: "var(--text)",
        }}
      >
        {title}
      </h2>
      <div className="legal-prose" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

export function LegalEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="panel"
      style={{
        padding: "0.9rem 1rem",
        borderLeft: "2px solid var(--accent)",
        background: "var(--surface)",
        fontSize: 13,
        color: "var(--text-dim)",
      }}
    >
      <span className="eyebrow" style={{ color: "var(--accent)", marginRight: 8 }}>
        TL;DR
      </span>
      {children}
    </div>
  );
}
