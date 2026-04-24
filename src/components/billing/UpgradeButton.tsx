"use client";

import { useState } from "react";
import { Btn } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Icon } from "../ui/Icon";

/**
 * Opens Stripe Checkout for Axon Pro and redirects the browser on success.
 * Shared across the Pricing page, Paywall cards, and the Sidebar's upgrade
 * chip so the CTA flow is one place.
 */
export function UpgradeButton({
  label = "Upgrade to Pro",
  size = "md",
  variant = "primary",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        throw new Error(body.error || "Could not start checkout.");
      }
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Btn
        variant={variant}
        size={size}
        icon={loading ? undefined : Icon.sparkles}
        onClick={onClick}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner size={12} /> Opening Stripe…
          </>
        ) : (
          label
        )}
      </Btn>
      {error && (
        <div
          style={{
            fontSize: 11,
            color: "var(--danger)",
            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
