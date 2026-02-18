#!/usr/bin/env bash
# session-capture.sh — Fires on Stop
# Captures session state for continuity across sessions

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MARKER="$VAULT_ROOT/.arscontexta"

# Only run inside a vault
[[ -f "$MARKER" ]] || exit 0

SESSIONS_DIR="$VAULT_ROOT/ops/sessions"
mkdir -p "$SESSIONS_DIR"

SESSION_ID="${CLAUDE_CONVERSATION_ID:-$(date +%Y%m%d-%H%M%S)}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Capture current session state
cat > "$SESSIONS_DIR/current.json" <<EOF
{
  "session_id": "$SESSION_ID",
  "last_activity": "$TIMESTAMP",
  "vault_root": "$VAULT_ROOT"
}
EOF
