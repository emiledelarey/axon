"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AxonMark } from "../ui/AxonMark";
import { Chip } from "../ui/Chip";
import { Icon, type IconComponent } from "../ui/Icon";

/**
 * Public landing page shown to signed-out visitors at /.
 * Anti-ghostwriting manifesto hero → six feature sections → pricing anchor
 * → footer. Reuses the app's existing design tokens (italic-serif headlines,
 * JetBrains Mono eyebrows, green accent, dark panels) so the page feels like
 * the same product, not a marketing template.
 */
export function LandingPage() {
  // Root layout hard-locks body overflow for the in-app shell. The landing
  // needs to scroll vertically, so we unlock on mount and restore on unmount
  // (keeps the /dashboard shell's single-viewport behaviour intact if a user
  // signs in without a hard reload).
  useEffect(() => {
    const prev = document.body.style.overflowY;
    document.body.style.overflowY = "auto";
    return () => {
      document.body.style.overflowY = prev;
    };
  }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <TopNav />
      <Hero />
      <FeatureSections />
      <PricingSlice />
      <Footer />
    </div>
  );
}

/* ---------------------------------------------------------------- Top nav */

function TopNav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(10,14,26,0.85)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.9rem 1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AxonMark size={22} />
          <span
            className="font-display"
            style={{ fontSize: 20, letterSpacing: "0.05em", fontWeight: 600 }}
          >
            AXON
          </span>
          <span className="eyebrow hide-mobile" style={{ marginLeft: 8 }}>
            university study companion
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/sign-in" className="btn btn-ghost" style={{ fontSize: 12 }}>
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="btn btn-primary"
            style={{ fontSize: 12, padding: "0.5rem 1rem" }}
          >
            Start free <Icon.arrowRight size={12} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------- Hero */

function Hero() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "clamp(2.5rem, 6vw, 4rem) 1.25rem",
      }}
    >
      <div className="noise" />
      {/* Ambient green glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(0,230,168,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="fade-in"
        style={{
          position: "relative",
          maxWidth: 900,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="status-dot live" />
          <span className="eyebrow" style={{ color: "var(--accent)" }}>
            For students who actually want to learn
          </span>
        </div>

        <h1
          className="display-serif"
          style={{
            fontSize: "clamp(2.8rem, 8.5vw, 6rem)",
            lineHeight: 0.98,
            margin: 0,
            fontWeight: 400,
          }}
        >
          Won&apos;t write your essay.
          <br />
          <span className="italic-serif grad-accent">Will make you smarter.</span>
        </h1>

        <Link
          href="/sign-up"
          className="btn btn-primary"
          style={{ padding: "1.1rem 2rem", fontSize: 16, borderRadius: 8 }}
        >
          Start free <Icon.arrowRight size={16} />
        </Link>

        <a
          href="#features"
          className="eyebrow"
          style={{
            color: "var(--text-fade)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Scroll <Icon.chevronDown size={11} />
        </a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Feature sections */

type Feature = {
  eyebrow: string;
  headline: string;
  spineSpan: string;
  description: string;
  icon: IconComponent;
  mock: (props: { label: string }) => React.ReactElement;
};

const FEATURES: Feature[] = [
  {
    eyebrow: "Daily Study",
    headline: "Remembers what you forget.",
    spineSpan: "forget",
    description:
      "Spaced repetition on your own notes — weak concepts resurface before the exam, not after.",
    icon: Icon.brain,
    mock: StudyMock,
  },
  {
    eyebrow: "Mock Exam",
    headline: "You vs. the clock.",
    spineSpan: "the clock",
    description:
      "Timed full-length practice with self-graded review, so exam day feels like the tenth take, not the first.",
    icon: Icon.trophy,
    mock: ExamMock,
  },
  {
    eyebrow: "Problem Coach",
    headline: "Hints. Never answers.",
    spineSpan: "Hints.",
    description:
      "Paste your working. It points at the flaw in your reasoning and makes you fix it yourself.",
    icon: Icon.target,
    mock: CoachMock,
  },
  {
    eyebrow: "Live Write",
    headline: "Coaches. Doesn't write.",
    spineSpan: "Coaches.",
    description:
      "Scores your draft against the rubric and presses on the weak arguments — no sentences get written for you.",
    icon: Icon.lightbulb,
    mock: WriteMock,
  },
  {
    eyebrow: "Tutor Chat",
    headline: "Reads your slides. Quizzes you.",
    spineSpan: "Quizzes you",
    description:
      "Drop in your course materials and it quizzes you back instead of monologuing a Wikipedia summary.",
    icon: Icon.msg,
    mock: TutorMock,
  },
  {
    eyebrow: "Voice Mode",
    headline: "Just talk to it.",
    spineSpan: "Just talk",
    description:
      "Think out loud while you walk, cook, or pace the room — every feature above works hands-free.",
    icon: Icon.volume,
    mock: VoiceMock,
  },
];

function FeatureSections() {
  return (
    <div id="features">
      {FEATURES.map((f, i) => (
        <FeatureRow
          key={f.eyebrow}
          feature={f}
          index={i}
          total={FEATURES.length}
          reverse={i % 2 === 1}
        />
      ))}
    </div>
  );
}

function FeatureRow({
  feature,
  index,
  total,
  reverse,
}: {
  feature: Feature;
  index: number;
  total: number;
  reverse: boolean;
}) {
  const Mock = feature.mock;
  const num = String(index + 1).padStart(2, "0");
  const totalStr = String(total).padStart(2, "0");
  return (
    <section
      style={{
        padding: "clamp(3rem, 7vw, 5rem) 1.25rem",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className={`container feature-grid${reverse ? " reverse" : ""}`}>
        <div
          className="feature-text"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              color: "var(--text-fade)",
              fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
            }}
          >
            <span
              style={{
                fontSize: "clamp(2.4rem, 5vw, 3.2rem)",
                color: "var(--accent)",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {num}
            </span>
            <span style={{ fontSize: 11, letterSpacing: "0.15em" }}>/ {totalStr}</span>
            <span className="eyebrow" style={{ color: "var(--text-dim)", marginLeft: "auto" }}>
              <feature.icon size={11} /> {feature.eyebrow}
            </span>
          </div>
          <h3
            className="display-serif"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.05,
            }}
          >
            {feature.headline.split(feature.spineSpan).map((chunk, idx, arr) =>
              idx < arr.length - 1 ? (
                <span key={idx}>
                  {chunk}
                  <span className="italic-serif grad-accent">{feature.spineSpan}</span>
                </span>
              ) : (
                <span key={idx}>{chunk}</span>
              ),
            )}
          </h3>
          <p
            style={{
              fontSize: "clamp(0.95rem, 1.15vw, 1.05rem)",
              lineHeight: 1.55,
              color: "var(--text-dim)",
              maxWidth: "38ch",
              margin: 0,
            }}
          >
            {feature.description}
          </p>
        </div>

        <div className="feature-mock">
          <div
            className="eyebrow"
            style={{
              color: "var(--text-fade)",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              aria-hidden
              style={{ width: 18, height: 1, background: "var(--border-bright)" }}
            />
            <span>Preview · live from the app</span>
          </div>
          <Mock label={feature.eyebrow.toLowerCase().replace(/\s+/g, "_")} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Mocks */

function MockFrame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div
      className="panel"
      style={{
        padding: 0,
        position: "relative",
        boxShadow: "0 40px 80px -40px rgba(0,230,168,0.15)",
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      {/* Title bar: chrome dots + file-tab label, visually separating the preview from the heading above */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0.55rem 0.85rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          <span
            style={{ width: 8, height: 8, borderRadius: 4, background: "var(--border-bright)" }}
          />
          <span
            style={{ width: 8, height: 8, borderRadius: 4, background: "var(--border-bright)" }}
          />
          <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--accent-dim)" }} />
        </div>
        {label ? (
          <span
            style={{
              fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
              fontSize: 11,
              color: "var(--text-dim)",
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </span>
        ) : null}
      </div>
      <div style={{ padding: "1rem" }}>{children}</div>
    </div>
  );
}

function StudyMock({ label }: { label: string }) {
  return (
    <MockFrame label={label}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <Chip tone="accent">
          <span className="status-dot live" /> Card 3 / 10
        </Chip>
        <Chip>Concept · WACC</Chip>
      </div>
      <div style={{ padding: "1.5rem 0.5rem" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Question
        </div>
        <div
          className="italic-serif"
          style={{ fontSize: 20, lineHeight: 1.35, marginBottom: 16, color: "var(--text)" }}
        >
          If equity is 60%, debt 40%, Re = 12%, Rd = 6%, tax 30% — what&apos;s the WACC?
        </div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Your answer
        </div>
        <div
          style={{
            padding: "0.7rem 0.9rem",
            border: "1px solid var(--border-bright)",
            borderRadius: 6,
            fontSize: 13,
            color: "var(--text-dim)",
            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
          }}
        >
          Type your answer…<span className="pulse">|</span>
        </div>
      </div>
    </MockFrame>
  );
}

function ExamMock({ label }: { label: string }) {
  return (
    <MockFrame label={label}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <Chip tone="info">Question 7 of 10</Chip>
        <div
          style={{
            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
            fontSize: 18,
            color: "var(--warn)",
            letterSpacing: "0.08em",
          }}
        >
          00:42
        </div>
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Question
      </div>
      <p className="italic-serif" style={{ fontSize: 17, lineHeight: 1.4, margin: "0 0 18px" }}>
        Explain how a tax shield affects the weighted cost of debt.
      </p>
      <textarea
        readOnly
        rows={3}
        placeholder="Write your answer…"
        style={{ fontSize: 13, resize: "none" }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <Chip>← Prev</Chip>
        <Chip>Flag</Chip>
        <Chip tone="accent">Next →</Chip>
      </div>
    </MockFrame>
  );
}

function CoachMock({ label }: { label: string }) {
  const chipRow: Array<{ label: string; active?: boolean }> = [
    { label: "Check logic", active: true },
    { label: "Check formula" },
    { label: "Check arithmetic" },
    { label: "Give hint" },
  ];
  return (
    <MockFrame label={label}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        My working
      </div>
      <div
        className="font-mono"
        style={{
          fontSize: 12,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "0.7rem 0.85rem",
          color: "var(--text-dim)",
          lineHeight: 1.6,
          marginBottom: 10,
        }}
      >
        E/V = 0.6, D/V = 0.4
        <br />
        WACC = 0.6 × 12% + 0.4 × 6% × (1 − 0.3)
        <br />
        WACC = 7.2% + 1.68% = <span style={{ color: "var(--accent)" }}>8.88%</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {chipRow.map((c) => (
          <span
            key={c.label}
            style={{
              padding: "0.3rem 0.7rem",
              borderRadius: 14,
              fontSize: 11,
              fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
              border: `1px solid ${c.active ? "var(--accent)" : "var(--border-bright)"}`,
              color: c.active ? "var(--accent)" : "var(--text-dim)",
              background: c.active ? "rgba(0,230,168,0.08)" : "transparent",
            }}
          >
            {c.label}
          </span>
        ))}
      </div>
      <div
        className="slide-right"
        style={{
          padding: "0.65rem 0.8rem",
          borderLeft: "2px solid var(--accent)",
          background: "var(--bg)",
          borderRadius: 4,
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        <span className="eyebrow" style={{ color: "var(--accent)" }}>
          Coach
        </span>
        <div style={{ marginTop: 4 }}>
          Your reasoning is pointed the right way — weights sum to 1, debt has the tax adjustment.
          Where did the <em>pre</em>-tax 6% come from?
        </div>
      </div>
    </MockFrame>
  );
}

function WriteMock({ label }: { label: string }) {
  const chips = ["Plan", "Test thesis", "Find gaps", "Check rubric", "Improve para", "Challenge"];
  return (
    <MockFrame label={label}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        Rubric alignment
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {[
          { k: "Argument structure", pct: 82 },
          { k: "Evidence use", pct: 64 },
          { k: "Counter-argument", pct: 40 },
        ].map((r) => (
          <div key={r.k}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--text-dim)",
                fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
                marginBottom: 3,
              }}
            >
              <span>{r.k}</span>
              <span style={{ color: "var(--accent)" }}>{r.pct}%</span>
            </div>
            <div className="signal-bar">
              <div
                className="signal-fill fill-bar"
                style={{
                  width: `${r.pct}%`,
                  background: r.pct >= 70 ? "var(--accent)" : "var(--warn)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {chips.map((c) => (
          <span
            key={c}
            style={{
              padding: "0.3rem 0.7rem",
              borderRadius: 14,
              fontSize: 11,
              fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
              border: "1px solid var(--border-bright)",
              color: "var(--text-dim)",
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </MockFrame>
  );
}

function TutorMock({ label }: { label: string }) {
  return (
    <MockFrame label={label}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            alignSelf: "flex-end",
            maxWidth: "82%",
            padding: "0.65rem 0.9rem",
            borderRadius: 10,
            background: "var(--surface-2)",
            border: "1px solid var(--border-bright)",
            fontSize: 13,
          }}
        >
          Can you explain elasticity like I&apos;ve never seen it before?
        </div>
        <div
          className="slide-right"
          style={{
            alignSelf: "flex-start",
            maxWidth: "82%",
            padding: "0.65rem 0.9rem",
            borderRadius: 10,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <span className="eyebrow" style={{ color: "var(--accent)" }}>
            Axon
          </span>
          <div style={{ marginTop: 4 }}>
            Before I explain — quick check. If the price of coffee doubles and you still buy the
            same amount, what does that tell you about <em>your</em> demand?
            <span className="pulse">▍</span>
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

function VoiceMock({ label }: { label: string }) {
  const bars = [18, 28, 42, 60, 74, 52, 38, 64, 80, 46, 32, 22];
  return (
    <MockFrame label={label}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "0.5rem 0.2rem 1rem" }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 6px rgba(0,230,168,0.15)",
          }}
        >
          <Icon.mic size={18} color="var(--bg)" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 3,
              height: 40,
            }}
          >
            {bars.map((h, i) => (
              <span
                key={i}
                style={{
                  width: 3,
                  height: `${h}%`,
                  background: "var(--accent)",
                  borderRadius: 2,
                  opacity: 0.35 + (h / 80) * 0.65,
                }}
              />
            ))}
          </div>
          <div
            className="eyebrow"
            style={{ color: "var(--accent)", marginTop: 6, display: "flex", gap: 6 }}
          >
            <span className="status-dot live" /> Listening
          </div>
        </div>
      </div>
      <div
        style={{
          padding: "0.7rem 0.85rem",
          borderRadius: 6,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          fontSize: 13,
          color: "var(--text-dim)",
          fontStyle: "italic",
          lineHeight: 1.55,
        }}
      >
        &ldquo;So my WACC calculation is sixty percent equity at twelve percent, plus forty percent
        debt at six percent after tax…&rdquo;
      </div>
    </MockFrame>
  );
}

/* -------------------------------------------------------------- Pricing slice */

function PricingSlice() {
  return (
    <section
      style={{
        padding: "clamp(3rem, 6vw, 6rem) 1.25rem",
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span className="eyebrow">Pricing · one tier, one price</span>
          <h2
            className="display-serif"
            style={{
              fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)",
              margin: "0.5rem 0 0",
              fontWeight: 400,
            }}
          >
            Free to start. <span className="italic-serif grad-accent">A$20</span> to go serious.
          </h2>
        </div>

        <div className="pricing-grid">
          <PriceCard
            title="Free"
            price="A$0"
            period="/forever"
            features={[
              "1 active deck",
              "Daily Study — unlimited",
              "Problem Coach — text mode",
              "Tutor Chat — 30 msgs/month",
            ]}
          />
          <PriceCard
            title="Axon Pro"
            price="A$20"
            period="/month"
            highlight
            features={[
              "Unlimited decks",
              "Mock Exam · Live Write · Voice",
              "Problem Coach — text + voice",
              "Tutor Chat — unlimited",
              "Every future Pro feature",
            ]}
          />
        </div>

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link
            href="/sign-up"
            className="btn btn-primary"
            style={{ padding: "0.95rem 1.6rem", fontSize: 14 }}
          >
            Start free — no card required <Icon.arrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PriceCard({
  title,
  price,
  period,
  features,
  highlight,
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className="panel"
      style={{
        padding: "1.5rem",
        borderColor: highlight ? "var(--accent)" : "var(--border)",
        background: highlight ? "rgba(0,230,168,0.03)" : "var(--surface)",
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <span
          className="eyebrow"
          style={{ color: highlight ? "var(--accent)" : "var(--text-dim)" }}
        >
          {title}
        </span>
      </div>
      <div
        className={highlight ? "display-serif grad-accent" : "display-serif"}
        style={{ fontSize: 38, lineHeight: 1, marginBottom: 16, fontWeight: 400 }}
      >
        {price}
        <span
          style={{
            fontSize: 14,
            color: "var(--text-dim)",
            marginLeft: 6,
            fontFamily: "var(--font-plex), sans-serif",
            WebkitTextFillColor: "var(--text-dim)",
          }}
        >
          {period}
        </span>
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {features.map((f) => (
          <li
            key={f}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 13,
              color: "var(--text)",
            }}
          >
            <Icon.check
              size={14}
              color={highlight ? "var(--accent)" : "var(--text-dim)"}
              style={{ marginTop: 3, flexShrink: 0 }}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- Footer */

function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "3rem 1.5rem",
        background: "var(--bg)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AxonMark size={22} />
          <span
            className="font-display"
            style={{ fontSize: 20, letterSpacing: "0.05em", fontWeight: 600 }}
          >
            AXON
          </span>
        </div>
        <p
          className="italic-serif"
          style={{ fontSize: 17, color: "var(--text-dim)", margin: 0, maxWidth: 520 }}
        >
          Built for university students who want to learn — not cheat. Sydney-based.
        </p>
        <Link
          href="/sign-up"
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: "0.55rem 1.1rem" }}
        >
          Start free <Icon.arrowRight size={12} />
        </Link>
        <div
          className="eyebrow"
          style={{
            color: "var(--text-fade)",
            marginTop: 8,
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "center",
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
          <span>·</span>
          <span>A$20/mo · cancel anytime</span>
        </div>
      </div>
    </footer>
  );
}
