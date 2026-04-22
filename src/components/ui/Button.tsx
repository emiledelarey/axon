import type { ReactNode } from "react";
import type { IconComponent } from "./Icon";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  onClick?: () => void;
  icon?: IconComponent;
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
};

const SIZES: Record<Size, React.CSSProperties> = {
  sm: { padding: "0.5rem 0.9rem", fontSize: 12 },
  md: { padding: "0.75rem 1.25rem", fontSize: 13 },
  lg: { padding: "1rem 1.75rem", fontSize: 14 },
};

export function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick,
  icon: IconEl,
  disabled,
  style,
  type = "button",
}: Props) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      style={{ ...SIZES[size], ...style }}
    >
      {IconEl && <IconEl size={14} />}
      {children}
    </button>
  );
}
