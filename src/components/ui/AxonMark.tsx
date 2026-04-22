export function AxonMark({
  size = 20,
  animated = false,
}: {
  size?: number;
  animated?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: "block" }}
    >
      <path
        d="M12 2 L4 8 L4 18 L12 22 L20 18 L20 8 Z"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
        fill="var(--accent)"
        className={animated ? "pulse" : ""}
      />
    </svg>
  );
}
