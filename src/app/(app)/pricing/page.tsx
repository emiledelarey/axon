"use client";

import { useAppState } from "@/components/providers/AppStateProvider";
import { UpgradeButton } from "@/components/billing/UpgradeButton";
import { Btn } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { isPro } from "@/lib/entitlements";

const FREE_FEATURES = [
  "1 active deck",
  "Daily Study — unlimited",
  "Problem Coach — text mode",
  "Tutor Chat — 30 messages/month",
  "Library — view your deck",
];

const PRO_FEATURES = [
  "Unlimited decks",
  "Daily Study — unlimited + typed-recall mode",
  "Problem Coach — text + voice, TTS replay",
  "Mock Exam Mode — timed past-paper drills",
  "Live Write — rubric-aware essay coach",
  "Tutor Chat — unlimited",
  "Voice Mode — speech-to-text + read-aloud hints",
  "Every future Pro feature as it ships",
];

export default function PricingPage() {
  const { state } = useAppState();
  const pro = isPro(state);

  const manageBilling = async () => {
    const res = await fetch("/api/billing-portal", {
      method: "POST",
      credentials: "same-origin",
    });
    const body = (await res.json()) as { url?: string; error?: string };
    if (body.url) window.location.href = body.url;
    else alert(body.error || "Could not open billing portal.");
  };

  return (
    <div className="fade-in" style={{ padding: "1.25rem 1.5rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <span className="eyebrow">Pricing · one tier, one price</span>
        <h1
          className="italic-serif"
          style={{ fontSize: 32, margin: "0.35rem 0 0", fontWeight: 400 }}
        >
          Free to try. A$20/month to go serious.
        </h1>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 13,
            lineHeight: 1.55,
            margin: "8px 0 0",
            maxWidth: 620,
          }}
        >
          Free tier covers the daily study habit. Pro unlocks the deeper tools — Mock Exam, essay
          coaching, voice mode, unlimited tutor. Cancel anytime from Billing.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section
          className="panel"
          style={{
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="eyebrow">Free</span>
            {!pro && <Chip tone="accent">Current</Chip>}
          </div>
          <div
            className="italic-serif"
            style={{ fontSize: 34, lineHeight: 1, marginBottom: 14, fontWeight: 500 }}
          >
            A$0
            <span
              style={{
                fontSize: 13,
                color: "var(--text-dim)",
                marginLeft: 6,
                fontFamily: "var(--font-plex), sans-serif",
              }}
            >
              /forever
            </span>
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {FREE_FEATURES.map((f) => (
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
                <Icon.check size={14} color="var(--text-dim)" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 18 }}>
            <Btn variant="secondary" size="md" disabled>
              {pro ? "Below current plan" : "Current plan"}
            </Btn>
          </div>
        </section>

        <section
          className="panel"
          style={{
            padding: "1.25rem",
            borderColor: "var(--accent)",
            background: "rgba(0,230,168,0.03)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="eyebrow" style={{ color: "var(--accent)" }}>
              Axon Pro
            </span>
            {pro && <Chip tone="accent">Current</Chip>}
          </div>
          <div
            className="italic-serif grad-accent"
            style={{
              fontSize: 34,
              lineHeight: 1,
              marginBottom: 14,
              fontWeight: 500,
            }}
          >
            A$20
            <span
              style={{
                fontSize: 13,
                color: "var(--text-dim)",
                marginLeft: 6,
                fontFamily: "var(--font-plex), sans-serif",
                WebkitTextFillColor: "var(--text-dim)",
              }}
            >
              /month
            </span>
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {PRO_FEATURES.map((f) => (
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
                <Icon.sparkles size={14} color="var(--accent)" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 18 }}>
            {pro ? (
              <Btn variant="secondary" size="md" icon={Icon.chevronRight} onClick={manageBilling}>
                Manage billing
              </Btn>
            ) : (
              <UpgradeButton size="md" />
            )}
          </div>
        </section>
      </div>

      <p
        style={{
          color: "var(--text-fade)",
          fontSize: 11,
          fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
          marginTop: 20,
          textAlign: "center",
        }}
      >
        Prices in Australian dollars. GST inclusive. Cancel anytime. Payments processed by Stripe.
      </p>
    </div>
  );
}
