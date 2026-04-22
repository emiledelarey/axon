import type { ReactNode } from "react";

type Tone = "default" | "accent" | "warn" | "info" | "danger";

export function Chip({
  children,
  tone = "default",
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  style?: React.CSSProperties;
}) {
  const cls = tone === "default" ? "chip" : `chip chip-${tone}`;
  return (
    <span className={cls} style={style}>
      {children}
    </span>
  );
}
