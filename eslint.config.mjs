import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierConfig,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow `_`-prefixed unused args in callbacks (onChunk signatures, etc.)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // React 19's experimental purity rule flags Date.now()/new Date() even
      // inside handler closures. Those aren't render-time calls — they only
      // fire on user interaction — so the rule produces false positives. Can
      // revisit when the rule stabilises in a future React minor.
      "react-hooks/purity": "off",
    },
  },
];

export default config;
