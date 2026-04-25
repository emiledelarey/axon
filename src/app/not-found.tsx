import Link from "next/link";
import { AxonMark } from "@/components/ui/AxonMark";

export const metadata = {
  title: "Not found — Axon",
};

export default function NotFound() {
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
      <span
        className="eyebrow"
        style={{
          color: "var(--text-fade)",
          fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
          fontSize: 12,
          letterSpacing: "0.15em",
        }}
      >
        404 · this page is not on the map
      </span>
      <h1
        className="display-serif"
        style={{
          fontSize: "clamp(2.4rem, 6vw, 3.6rem)",
          margin: 0,
          fontWeight: 500,
          maxWidth: 600,
          lineHeight: 1.05,
        }}
      >
        Nothing here. <span className="italic-serif grad-accent">Probably a typo.</span>
      </h1>
      <Link href="/" className="btn btn-primary" style={{ padding: "0.85rem 1.5rem" }}>
        Back to home
      </Link>
    </div>
  );
}
