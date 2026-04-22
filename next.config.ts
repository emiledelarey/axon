import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray package-lock.json in C:\Users\emile\ confuses Turbopack's root
  // detection. Pin it to this project explicitly.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
