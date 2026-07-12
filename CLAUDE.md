<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **gingercuisine-app** (1057 symbols, 2345 relationships, 85 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/gingercuisine-app/context` | Codebase overview, check index freshness |
| `gitnexus://repo/gingercuisine-app/clusters` | All functional areas |
| `gitnexus://repo/gingercuisine-app/processes` | All execution flows |
| `gitnexus://repo/gingercuisine-app/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## Project rules

- **Purpose:** Ginger Cuisine pickup ordering site (pay-in-person, no online payment) plus a password-protected staff tablet dashboard for live order tracking.
- **Layout:** `app/` (Next.js App Router routes + `/api`, `/dashboard`), `lib/` (server logic, Prisma client, rate limiting), `prisma/` (schema), `e2e/` (Playwright), `docs/` (setup + archive); `walkthrough.md` is the canonical deep-dive.
- **Build / test:** `npm run dev` · `npm run build` (runs `prisma generate` then `next build`) · `npm run lint` · `npm test` (Vitest) · `npm run e2e` (Playwright).
- **Do / don't:** Payment is always in person — never add an online payment step; server recomputes all prices and gates confirmation pages with per-order view tokens, so keep validation server-side. Global coding standards live in `~/.claude/CLAUDE.md`.

## Operating protocol (post-Fable — added 2026-07-11)

- **This is PRODUCTION** (gingercuisine.ca, real customers): the global **Fable Playbook**
  (`~/.claude/rules/fable-playbook.md`) applies at its strictest — every change runs the
  full loop (build → separate adversarial validator → orchestrator adjudication →
  own-eyes QA at 375px/768px/desktop → merge), and a push to `main` IS a deploy, so
  pushing requires explicit user authorization every time.
- **Before asserting anything about production state**, check the auto-memory
  `project_gingercuisine` first (real domain, env/deploy facts, accepted risks that must
  not be re-flagged) — repo docs record code truth; that memory records ops truth.
- **Known trap class in this stack** (bit both apps): Tailwind v4 `@theme` resolves
  font/custom-property chains at `:root` — next/font variable classes must live on
  `<html>`, and computed-style verification beats visual inspection (sans→sans fallbacks
  are invisible). Verify fonts/colors via getComputedStyle, embeds via network requests
  (an iframe with a 200-rect can still be frame-blocked and empty).
- **Sibling project**: `allatone-app` shares this stack and ports many of these patterns
  with upgrades (atomic audit log, guarded status transitions, DB-native menu) — when
  fixing something here, check whether allatone solved it already, and vice versa.

<!-- skills:start -->
## Available Skills

> Auto-generated by `WORKSPACE/scripts/generate_skills_catalog.py` — do not edit between the skills markers.

### Project skills — `GingerApps/gingercuisine-app/.claude/skills/`

_None — this project uses the inherited global set below._

### Inherited global skills — descriptions in [../../SKILLS.md](../../SKILLS.md)

- **code:** `gitnexus-cli` · `gitnexus-debugging` · `gitnexus-exploring` · `gitnexus-guide` · `gitnexus-impact-analysis` · `gitnexus-pr-review` · `gitnexus-refactoring` · `vercel-react-best-practices`
- **design:** `brandkit` · `design-taste-frontend` · `high-end-visual-design` · `image-to-code` · `impeccable-detector` · `redesign-existing-projects` · `stitch-design-taste` · `ui-ux-pro-max`
- **docs:** `find-docs` · `walkthrough`
- **meta:** `claudescore` · `context-budget` · `find-skills` · `full-output-enforcement` · `session-wrap` · `skill-updater`
- **agents:** `design-reviewer` · `gitnexus-scout` · `type-fixer`
- **plugins:** `karpathy-guidelines`

_Invoke with `/<name>` or read its `SKILL.md`. Full catalog → [../../SKILLS.md](../../SKILLS.md) · canonical index → `~/.claude/skills/INDEX.md`._
<!-- skills:end -->
