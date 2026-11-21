import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Le français est plein d'apostrophes : React les affiche telles quelles, aucune raison de les échapper.
    rules: { "react/no-unescaped-entities": "off" },
  },
  globalIgnores([
    ".next/**",
    ".next-*/**",
    "out/**",
    "coverage/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
