#!/usr/bin/env bash
# SessionStart hook: replay this project's persisted memory into Claude's
# context so future sessions pick up where the last one left off.
#
# Memory lives in:
#   ~/.claude/projects/<sanitized-project-path>/memory/
# where <sanitized-project-path> is the absolute project path with '/' -> '-'.
#
# The hook prints a single JSON object to stdout — Claude Code reads
# `hookSpecificOutput.additionalContext` and injects it into the session.
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
SAFE_NAME="$(printf '%s' "$PROJECT_DIR" | tr '/' '-')"
MEMDIR="${HOME}/.claude/projects/${SAFE_NAME}/memory"

[ -d "$MEMDIR" ] || exit 0

python3 - "$MEMDIR" <<'PY'
import json, os, sys
memdir = sys.argv[1]
parts = []

index_path = os.path.join(memdir, "MEMORY.md")
if os.path.isfile(index_path):
    with open(index_path) as f:
        body = f.read().rstrip()
    if body:
        parts.append("## MEMORY.md (index)\n\n" + body)

for name in sorted(os.listdir(memdir)):
    if not name.endswith(".md") or name == "MEMORY.md":
        continue
    path = os.path.join(memdir, name)
    if not os.path.isfile(path):
        continue
    with open(path) as f:
        body = f.read().rstrip()
    if body:
        parts.append(f"## {name}\n\n" + body)

if not parts:
    sys.exit(0)

context = (
    "=== Persisted memory for gingercuisine-app ===\n"
    "(Loaded by .claude/hooks/load-memory.sh at SessionStart. "
    "Update via the auto-memory system.)\n\n"
    + "\n\n".join(parts)
)

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": context,
    }
}))
PY
