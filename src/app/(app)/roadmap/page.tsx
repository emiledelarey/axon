"use client";

export default function RoadmapPage() {
  const phases = [
    {
      label: "Live now · Q2 2026",
      live: true,
      items: [
        { t: "Daily Study", desc: "Spaced repetition + error-classified micro-lessons" },
        { t: "Live Work", desc: "Real-time problem coaching, Closer Command engine" },
        { t: "Tutor Chat", desc: "Socratic AI, course-aware, never writes your assignment" },
        { t: "Concept graphs", desc: "Accounting, Finance, Economics, Management Accounting" },
      ],
    },
    {
      label: "Q3 2026",
      live: false,
      items: [
        { t: "Voice mode", desc: "Live Work v2 — speak the working, hear the hints" },
        { t: "Live Write", desc: "Essay companion with rubric alignment — never ghost-writes" },
        { t: "Mock Exam mode", desc: "Timed past-paper drills against cohort average" },
      ],
    },
    {
      label: "Q4 2026",
      live: false,
      items: [
        { t: "Teacher Portal", desc: "Observer dashboard for lecturers and tutors" },
        { t: "National expansion", desc: "UQ, QUT, UTS, Monash, UNSW, Melbourne" },
        { t: "White-label", desc: "Branded institutional editions" },
      ],
    },
    {
      label: "2027 +",
      live: false,
      items: [
        { t: "Law vertical", desc: "AustLII-powered, case-law concept graphs" },
        { t: "Engineering", desc: "Circuit, mech, structural units" },
        { t: "Med vertical", desc: "PubMed-powered, pre-clinical and clinical" },
      ],
    },
  ];

  return (
    <div className="fade-in" style={{ padding: "2rem 2.5rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <span className="eyebrow">Public roadmap</span>
        <h1
          className="italic-serif"
          style={{ fontSize: 48, margin: "0.5rem 0 0.75rem", fontWeight: 400 }}
        >
          What ships, and when.
        </h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 16,
            maxWidth: 640,
            margin: 0,
          }}
        >
          We ship the MVP first. Nothing below &quot;Live now&quot; exists yet — this roadmap is a
          promise, not a product list. Dates are targets, not guarantees.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {phases.map((ph, i) => (
          <div
            key={i}
            className="panel"
            style={{
              padding: "1.5rem",
              background: ph.live ? "var(--surface-2)" : "var(--surface)",
              borderColor: ph.live ? "var(--accent)" : "var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 16,
              }}
            >
              {ph.live && <span className="status-dot live" />}
              <span
                className="eyebrow"
                style={{ color: ph.live ? "var(--accent)" : "var(--text-dim)" }}
              >
                {ph.label}
              </span>
            </div>
            {ph.items.map((item, j) => (
              <div key={j} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{item.t}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
