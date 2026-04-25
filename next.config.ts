import type { NextConfig } from "next";
import path from "node:path";

// Defence-in-depth headers applied to every response. CSP is deliberately
// omitted for v1 — Clerk and Stripe both use third-party origins that need
// careful allowlisting, and shipping a half-tuned CSP that breaks auth would
// be worse than none. Phase-2: build a Report-Only CSP, observe, then enforce.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(self), payment=(), usb=(), bluetooth=()",
  },
];

const nextConfig: NextConfig = {
  // A stray package-lock.json in C:\Users\emile\ confuses Turbopack's root
  // detection. Pin it to this project explicitly.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
