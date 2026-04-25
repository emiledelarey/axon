import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Axon — won't write your essay; will make you smarter.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic OG card. Generated at build time per route by Next 16's image
 * pipeline — no static asset to keep in sync with the brand. The shell mirrors
 * the dark hero on the landing: serif italic spine, green accent, ambient glow.
 */
export default async function OG() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0a0e1a",
        color: "#eeead8",
        padding: "80px",
        fontFamily: "Georgia, serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient green glow, mirrors the hero radial */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          background: "radial-gradient(circle, rgba(0,230,168,0.18) 0%, rgba(0,230,168,0) 60%)",
          display: "flex",
        }}
      />

      {/* Wordmark + status dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <svg width="40" height="40" viewBox="0 0 24 24">
          <path
            d="M12 2 L4 8 L4 18 L12 22 L20 18 L20 8 Z"
            stroke="#00e6a8"
            strokeWidth="1.8"
            fill="none"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.5" fill="#00e6a8" />
        </svg>
        <span style={{ fontSize: 32, letterSpacing: "0.12em", fontWeight: 600 }}>AXON</span>
      </div>

      {/* Headline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
          marginBottom: 40,
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 22,
            color: "#00e6a8",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 24,
            fontFamily: "monospace",
          }}
        >
          University study companion
        </span>
        <div
          style={{
            fontSize: 96,
            lineHeight: 1.02,
            fontWeight: 400,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Won&apos;t write your essay.</span>
          <span style={{ fontStyle: "italic", color: "#00e6a8" }}>Will make you smarter.</span>
        </div>
      </div>

      {/* URL footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
          color: "#6b6754",
          fontFamily: "monospace",
          letterSpacing: "0.1em",
        }}
      >
        <span>axon.study</span>
        <span>A$20/mo · cancel anytime</span>
      </div>
    </div>,
    { ...size },
  );
}
