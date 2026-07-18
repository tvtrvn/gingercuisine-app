# Deferred-majors migration plan — 2026-07-17 (Fable session)

Continuation of `docs/AUDIT-2026-07-11.md` deferred list. This file is the resume
anchor for the loop: if the session dies, a fresh session reads this + git log and
continues from the first unchecked slice.

## GOAL (the loop target)

Work the deferred list slice by slice until **every item is either SHIPPED or
BLOCKED-WITH-EVIDENCE**, meaning:

- [ ] S1 Tooling floor: in-range drift (tailwind 4.3.3, libphonenumber, lucide),
      @types/node 26, ESLint 10 (flat-config compat), remaining npm-audit vulns
      cleared; TypeScript 7 attempted (timeboxed — defer with evidence if the
      Next/typescript-eslint toolchain rejects it)
- [ ] S2 The 5 `set-state-in-effect` refactors (OrderBoard mount fetch + search
      reset, PauseOrdersControl mounted flag + dialog reset,
      useOrderingAvailability mount fetch) + restore the rule to **error**
- [ ] S3 Resend 4 → 6 (lib/email.ts; ctx7 docs first — API surface changed)
- [ ] S4 next 16.1.6 → 16.2.x + react/react-dom 19.2.7 + eslint-config-next
      16.2.10 (exact-pin bumps; full gate + visual QA 375/768/1280)
- [ ] S5 Zod 3 → 4 (lib/validation.ts + every API edge; ctx7 migration guide;
      validation tests must bite on the new error shapes)
- [ ] S6 Prisma 6 → 7 — **research go/no-go FIRST** (does Prisma 7 fully support
      MongoDB? ctx7 + changelog). GO → migrate (schema, client, config, db push
      semantics). NO-GO → document evidence in AUDIT doc and defer permanently.
- [ ] S7 Close-out: AUDIT doc deferred list emptied/annotated, walkthrough tech
      table updated, memory updated, final report.

DONE = all boxes checked, `npm outdated` shows no majors except documented
blocks, `npm audit` clean or documented, lint rule at error, full gate green.

## Rules of engagement

- Branch: `upgrade/deferred-majors-jul17`. One commit per slice, checkpoint style.
- Gate per slice (no exceptions): `tsc --noEmit` · `eslint .` (0 errors) ·
  `vitest run` (all pass) · `npm run build` · `npx playwright test` (23/23 — hours
  are pinned). UI-touching slices (S2, S4) add own-eyes QA at 375/768/1280.
- Builder ≠ validator: S2/S4/S5/S6 get a separate Opus adversarial validator
  before their commit. S1/S3 are validated by the mechanical gate + orchestrator
  review (small surface).
- Version-sensitive research (Resend 6, Zod 4, Prisma 7, TS 7) goes through ctx7
  (find-docs), not memory.
- An attempted slice that fails its gate gets ONE fix cycle; still failing →
  revert the slice, mark BLOCKED-WITH-EVIDENCE, move on. Never ship a red gate.
- Prisma slice extra bar: order-create + status PATCH exercised against the real
  test DB via e2e before commit (the money path talks to Mongo through Prisma).
- Push/deploy cadence (user decision 2026-07-17): **two deploys** — one after
  S1–S5 pass their gates, then Prisma 7 (S6) as its own isolated deploy. Each
  push still gets explicit user authorization at that moment.

## Reorder (2026-07-17, on evidence)

`npm audit --json` shows next 16.1.6 carries ~19 advisories (HIGH: request
smuggling, RSC cache poisoning, image-API DoS, middleware bypass…) ALL fixed by
stable 16.2.10 (non-major), which also clears the transitive postcss moderate.
So the framework bump is a SECURITY slice and runs right after S1; ESLint 10
folds into it (peer-compatible, plugin stack ships with eslint-config-next).
Execution order: **S1-lite (drift) → S4 (security stack) → S2 → S3 → S5 →
TS-7 timebox → S6 → S7.** @types/node stays on 20 deliberately: local+deploy
runtime is Node 20/22; types for unreleased Node 26 would be wrong, not fresh.
Recommend an immediate security deploy after S4 (cadence may become 3 deploys —
user re-authorizes at that point).

## Slice log (append as executed)

- **S1 SHIPPED** (2026-07-17): in-range drift (tailwind 4.3.3, libphonenumber
  1.13.9, lucide 1.25). @types/node RE-TARGETED: stays 20 to match the actual
  Node runtime (local v20.20.0, no engines pin) — types for unreleased Node 26
  would be wrong, not fresh. Item closed.
- **S4 SHIPPED as security slice** (2026-07-17): next 16.2.10 + react/react-dom
  19.2.7 + eslint-config-next 16.2.10 — clears all ~19 next advisories. Full
  gate green incl. e2e 23/23, computed-style font check, image naturalWidth.
  Residual accepted risk: next's vendored postcss<8.5.10 (build-time, own CSS
  only; clears when Next bumps).
  **ESLint 10 BLOCKED-WITH-EVIDENCE**: eslint-plugin-react 7.37.5 (latest
  upstream, vendored by config-next) uses removed context.getFilename() and
  peers eslint ≤ ^9.7 — no ESLint-10 support exists in the ecosystem yet.
  Reverted to eslint 9.39.5. Recheck when eslint-plugin-react peers ^10.
