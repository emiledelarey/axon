import type { IconComponent } from "./Icon";

export function StatTile({
  label,
  value,
  sub,
  accent = "var(--accent)",
  icon: IconEl,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: IconComponent;
}) {
  return (
    <div className="panel" style={{ padding: "0.75rem 1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span className="eyebrow">{label}</span>
        {IconEl && <IconEl size={14} color="var(--text-dim)" />}
      </div>
      <div className="italic-serif" style={{ fontSize: 22, color: accent, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-dim)",
            marginTop: 6,
            fontFamily: "var(--font-jet), 'JetBrains Mono', monospace",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
