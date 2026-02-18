#!/usr/bin/env bash
# auto-commit.sh — Fires async on PostToolUse(Write)
# Auto-commits vault changes to preserve history

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MARKER="$VAULT_ROOT/.arscontexta"

# Only run inside a vault
[[ -f "$MARKER" ]] || exit 0

# Get the file path from the tool input
FILE_PATH="${TOOL_INPUT_FILE_PATH:-}"

# Only auto-commit vault files (records/, self/, ops/, templates/, manual/)
case "$FILE_PATH" in
  "$VAULT_ROOT/records/"*|"$VAULT_ROOT/self/"*|"$VAULT_ROOT/ops/"*|"$VAULT_ROOT/templates/"*|"$VAULT_ROOT/manual/"*|"$VAULT_ROOT/inbox/"*)
    ;;
  *)
    exit 0
    ;;
esac

cd "$VAULT_ROOT"

# Stage only vault files
git add records/ self/ ops/ templates/ manual/ inbox/ 2>/dev/null || true

# Check if there are staged changes
if git diff --cached --quiet 2>/dev/null; then
  exit 0
fi

# Commit with descriptive message
BASENAME=$(basename "$FILE_PATH")
git commit -m "vault: update $BASENAME" --no-verify 2>/dev/null || true
