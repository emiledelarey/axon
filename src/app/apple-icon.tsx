import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0e1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 36,
      }}
    >
      <svg width="120" height="120" viewBox="0 0 24 24">
        <path
          d="M12 2 L4 8 L4 18 L12 22 L20 18 L20 8 Z"
          stroke="#00e6a8"
          strokeWidth="1.8"
          fill="none"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.5" fill="#00e6a8" />
      </svg>
    </div>,
    { ...size },
  );
}
