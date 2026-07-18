import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 2026-07-17: at error severity so NEW set-state-in-effect mistakes are
      // hard failures. The 5 long-standing mount-bootstrap/portal-flag/reset
      // effects (OrderBoard, PauseOrdersControl, useOrderingAvailability) are
      // vetted legitimate patterns and carry per-line justified disables —
      // restructuring them was judged worse than the disease (see
      // docs/DEFERRED_PLAN-2026-07-17.md S2).
      "react-hooks/set-state-in-effect": "error",
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
