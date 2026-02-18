#!/usr/bin/env bash
# session-orient.sh — Fires on SessionStart
# Reads vault state and presents orientation context

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MARKER="$VAULT_ROOT/.arscontexta"

# Only run inside a vault
[[ -f "$MARKER" ]] || exit 0

echo "## Workspace Structure"

# Show key files (abbreviated tree)
find "$VAULT_ROOT" \( -name "*.md" -o -name "*.yaml" -o -name "*.json" \) \
  -not -path "*/.git/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/.claude/skills/*" \
  -not -path "*/.claude/plugins/*" \
  -not -path "*/fitness-cms/*" \
  -maxdepth 4 \
  | sed "s|$VAULT_ROOT/||" \
  | sort \
  | head -40 \
  | while read -r f; do
    depth=$(echo "$f" | tr -cd '/' | wc -c)
    indent=""
    for ((i=0; i<depth; i++)); do indent="  $indent"; done
    echo "$indent$(basename "$f")"
  done

echo ""
echo "---"
echo ""

# Show goals
if [[ -f "$VAULT_ROOT/self/goals.md" ]]; then
  cat "$VAULT_ROOT/self/goals.md"
fi

echo ""

# Show identity
if [[ -f "$VAULT_ROOT/self/identity.md" ]]; then
  cat "$VAULT_ROOT/self/identity.md"
fi

echo ""

# Show methodology
if [[ -f "$VAULT_ROOT/self/methodology.md" ]]; then
  cat "$VAULT_ROOT/self/methodology.md"
fi

echo ""

# Show derivation rationale summary
if [[ -f "$VAULT_ROOT/ops/methodology/derivation-rationale.md" ]]; then
  head -5 "$VAULT_ROOT/ops/methodology/derivation-rationale.md"
fi

# Show methodology MOC summary
if [[ -f "$VAULT_ROOT/ops/methodology/methodology.md" ]]; then
  head -5 "$VAULT_ROOT/ops/methodology/methodology.md"
fi

# Check reminders
if [[ -f "$VAULT_ROOT/ops/reminders.md" ]]; then
  UNCHECKED=$(grep -c '^\- \[ \]' "$VAULT_ROOT/ops/reminders.md" 2>/dev/null || true)
  if [[ "$UNCHECKED" -gt 0 ]]; then
    echo ""
    echo "## Reminders ($UNCHECKED pending)"
    grep '^\- \[ \]' "$VAULT_ROOT/ops/reminders.md"
  fi
fi

# Check pending tasks
if [[ -f "$VAULT_ROOT/ops/tasks.md" ]]; then
  TASKS=$(grep -c '^\- \[ \]' "$VAULT_ROOT/ops/tasks.md" 2>/dev/null || true)
  if [[ "$TASKS" -gt 0 ]]; then
    echo ""
    echo "## Tasks ($TASKS pending)"
    grep '^\- \[ \]' "$VAULT_ROOT/ops/tasks.md"
  fi
fi
