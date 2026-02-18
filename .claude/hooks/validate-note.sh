#!/usr/bin/env bash
# validate-note.sh — Fires on PostToolUse(Write)
# Validates that written .md files in records/ have proper schema

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MARKER="$VAULT_ROOT/.arscontexta"

# Only run inside a vault
[[ -f "$MARKER" ]] || exit 0

# Get the file path from the tool input
FILE_PATH="${TOOL_INPUT_FILE_PATH:-}"

# Only validate markdown files in records/
[[ "$FILE_PATH" == "$VAULT_ROOT/records/"*.md ]] || exit 0

# Check for YAML frontmatter
if ! head -1 "$FILE_PATH" | grep -q '^---$'; then
  echo "WARNING: $FILE_PATH is missing YAML frontmatter"
  exit 0
fi

# Check for description field
if ! grep -q '^description:' "$FILE_PATH"; then
  echo "WARNING: $FILE_PATH is missing 'description' field in frontmatter"
fi

# Check for Areas/Topics footer
if ! grep -q '^Areas:' "$FILE_PATH" && ! grep -q '^Topics:' "$FILE_PATH"; then
  echo "WARNING: $FILE_PATH is missing Areas/Topics footer section"
fi
