"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import type { AppState } from "@/lib/state";
import { Icon, type IconComponent } from "../ui/Icon";
import { AxonMark } from "../ui/AxonMark";
import { Hairline } from "../ui/Hairline";
import { DeckPicker } from "./DeckPicker";

type Update = (patch: Partial<AppState> | ((s: AppState) => AppState)) => void;

type NavItem = { href: string; label: string; icon: IconComponent };

// Student nav. Cohort is off until we have real comparison data (stub
// leaderboard hides behind the /cohort URL for now); Roadmap lives at /roadmap
// for marketing links but it's product-marketing content, not study workflow.
// Both routes still resolve if someone pastes the URL.
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: Icon.bolt },
  { href: "/study", label: "Daily Study", icon: Icon.brain },
  { href: "/coach", label: "Problem Coach", icon: Icon.target },
  { href: "/tutor", label: "Tutor Chat", icon: Icon.msg },
  { href: "/library", label: "Decks", icon: Icon.book },
];

export function Sidebar({
  state,
  update,
  onResetDeck,
  onAddDeck,
}: {
  state: AppState;
  update: Update;
  onResetDeck: () => void;
  onAddDeck: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 200,
        flexShrink: 0,
        height: "100vh",
        background: "var(--bg)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "1rem 0.6rem",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0.25rem 0.75rem",
          marginBottom: 20,
        }}
      >
        <AxonMark size={22} />
        <span
          className="font-display"
          style={{ fontSize: 20, letterSpacing: "0.05em", fontWeight: 600 }}
        >
          AXON
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 9,
            color: "var(--text-fade)",
            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
          }}
        >
          v0
        </span>
      </div>

      <DeckPicker state={state} update={update} onAddDeck={onAddDeck} />

      <div className="eyebrow" style={{ padding: "0 0.75rem 0.5rem", color: "var(--text-fade)" }}>
        Workspace
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0.55rem 0.75rem",
                borderRadius: 6,
                color: active ? "var(--text)" : "var(--text-dim)",
                background: active ? "var(--surface)" : "transparent",
                transition: "all 0.15s",
                fontSize: 13,
                position: "relative",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "var(--text-dim)";
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: -6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 2,
                    height: 14,
                    background: "var(--accent)",
                  }}
                />
              )}
              <item.icon size={15} color={active ? "var(--accent)" : "currentColor"} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", padding: "0 0.75rem" }}>
        <Hairline style={{ marginBottom: 12 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: 28, height: 28 },
              },
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12 }}>{state.name || "You"}</div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-fade)",
                fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
              }}
            >
              {state.deck.length} cards
            </div>
          </div>
        </div>
        <button
          onClick={onResetDeck}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0.5rem",
            fontSize: 11,
            color: "var(--text-fade)",
            width: "100%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Icon.trash size={12} /> Reset deck
        </button>
      </div>
    </aside>
  );
}
