# Agent Instructions

This project's agent guidance lives in [CLAUDE.md](CLAUDE.md).

`AGENTS.md` is kept as a tool-agnostic pointer so agents that look here (Codex, AGENTS.md-aware tools) find the same instructions as Claude Code. Do not duplicate content — edit `CLAUDE.md` only.

> Re-index command: `npx gitnexus analyze --force --skip-agents-md` (the `--skip-agents-md` flag preserves this stub by skipping the gitnexus block in both `AGENTS.md` and `CLAUDE.md`). If you run plain `npx gitnexus analyze`, the duplicate body returns to this file — delete everything between (and including) the `<!-- gitnexus:start -->` / `<!-- gitnexus:end -->` markers to restore the pointer.
