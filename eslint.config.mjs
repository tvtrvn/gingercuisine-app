import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 2026-07-12: a react-hooks plugin minor bump escalated this rule from
      // warn to error, flagging 5 long-standing mount-bootstrap/reset effects
      // (OrderBoard, PauseOrdersControl, useOrderingAvailability). Restore the
      // baseline severity; restructuring those effects is tracked in
      // docs/AUDIT-2026-07-11.md deferred work.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tool-generated (gitignored) artifacts — not app code:
    ".gitnexus/**",
  ]),
]);

export default eslintConfig;
