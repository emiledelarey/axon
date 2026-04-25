"use client";

/**
 * Last-resort error boundary that catches errors in the root layout itself —
 * if RootLayout (Clerk provider, Providers, fonts) crashes, error.tsx can't
 * render because it expects layout to be intact. Next requires this file to
 * include its own <html>/<body>.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "3rem 1.25rem",
          background: "#0a0e1a",
          color: "#eeead8",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 28, margin: 0, fontWeight: 500 }}>Axon hit a hard stop.</h1>
        <p style={{ color: "#a09b85", maxWidth: 460, margin: 0 }}>
          Reloading usually fixes it. If it doesn&apos;t, email emiledelarey@gmail.com.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.85rem 1.5rem",
            background: "#00e6a8",
            color: "#0a0e1a",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
