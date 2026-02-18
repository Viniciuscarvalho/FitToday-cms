#!/bin/bash
# reconcile.sh - Evaluate maintenance conditions from queue.json
# Checks orphans, dangling links, inbox age, observation/tension counts
# Outputs which conditions are fired

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPTS_DIR="$VAULT_ROOT/ops/scripts"
QUEUE_FILE="$VAULT_ROOT/ops/queue/queue.json"

if [[ ! -f "$QUEUE_FILE" ]]; then
  echo "ERROR: Queue file not found: $QUEUE_FILE"
  exit 1
fi

echo "=== Reconciliation Report ==="
echo ""

FIRED_COUNT=0

# --- orphan_records ---
echo "Checking: orphan_records..."
ORPHAN_OUTPUT=$("$SCRIPTS_DIR/orphan-notes.sh" 2>/dev/null)
ORPHAN_COUNT=$(echo "$ORPHAN_OUTPUT" | grep '^Orphan:' | wc -l | tr -d ' ')
THRESHOLD=$(jq -r '.maintenance_conditions.orphan_records.threshold // "none"' "$QUEUE_FILE" 2>/dev/null)

if [[ "$THRESHOLD" == "any" && "$ORPHAN_COUNT" -gt 0 ]]; then
  echo "  FIRED: orphan_records ($ORPHAN_COUNT orphan(s) found)"
  echo "$ORPHAN_OUTPUT" | grep '^Orphan:' | sed 's/^/    /'
  FIRED_COUNT=$((FIRED_COUNT + 1))
else
  echo "  OK: orphan_records ($ORPHAN_COUNT orphan(s))"
fi

# --- dangling_links ---
echo ""
echo "Checking: dangling_links..."
DANGLING_OUTPUT=$("$SCRIPTS_DIR/dangling-links.sh" 2>/dev/null)
DANGLING_COUNT=$(echo "$DANGLING_OUTPUT" | grep '^Dangling:' | wc -l | tr -d ' ')
THRESHOLD=$(jq -r '.maintenance_conditions.dangling_links.threshold // "none"' "$QUEUE_FILE" 2>/dev/null)

if [[ "$THRESHOLD" == "any" && "$DANGLING_COUNT" -gt 0 ]]; then
  echo "  FIRED: dangling_links ($DANGLING_COUNT dangling link(s) found)"
  echo "$DANGLING_OUTPUT" | grep '^Dangling:' | sed 's/^/    /'
  FIRED_COUNT=$((FIRED_COUNT + 1))
else
  echo "  OK: dangling_links ($DANGLING_COUNT dangling link(s))"
fi

# --- inbox_pressure ---
echo ""
echo "Checking: inbox_pressure..."
INBOX_DIR="$VAULT_ROOT/inbox"
THRESHOLD=$(jq -r '.maintenance_conditions.inbox_pressure.threshold // "none"' "$QUEUE_FILE" 2>/dev/null)

if [[ -d "$INBOX_DIR" ]]; then
  # Check for files older than the threshold
  DAYS=3
  if [[ "$THRESHOLD" =~ ^([0-9]+)_days$ ]]; then
    DAYS="${BASH_REMATCH[1]}"
  fi

  OLD_INBOX=$(find "$INBOX_DIR" -name '*.md' -mtime "+${DAYS}" 2>/dev/null | wc -l | tr -d ' ')
  TOTAL_INBOX=$(find "$INBOX_DIR" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')

  if [[ "$OLD_INBOX" -gt 0 ]]; then
    echo "  FIRED: inbox_pressure ($OLD_INBOX file(s) older than ${DAYS} days, $TOTAL_INBOX total)"
    FIRED_COUNT=$((FIRED_COUNT + 1))
  else
    echo "  OK: inbox_pressure ($TOTAL_INBOX file(s), none older than ${DAYS} days)"
  fi
else
  echo "  OK: inbox_pressure (no inbox directory)"
fi

# --- observations_pending ---
echo ""
echo "Checking: observations_pending..."
OBS_DIR="$VAULT_ROOT/ops/observations"
THRESHOLD=$(jq -r '.maintenance_conditions.observations_pending.threshold // 0' "$QUEUE_FILE" 2>/dev/null)

if [[ -d "$OBS_DIR" ]]; then
  OBS_COUNT=$(find "$OBS_DIR" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
else
  OBS_COUNT=0
fi

if [[ "$OBS_COUNT" -ge "$THRESHOLD" && "$THRESHOLD" -gt 0 ]]; then
  echo "  FIRED: observations_pending ($OBS_COUNT observations, threshold: $THRESHOLD)"
  FIRED_COUNT=$((FIRED_COUNT + 1))
else
  echo "  OK: observations_pending ($OBS_COUNT observations, threshold: $THRESHOLD)"
fi

# --- tensions_pending ---
echo ""
echo "Checking: tensions_pending..."
TENS_DIR="$VAULT_ROOT/ops/tensions"
THRESHOLD=$(jq -r '.maintenance_conditions.tensions_pending.threshold // 0' "$QUEUE_FILE" 2>/dev/null)

if [[ -d "$TENS_DIR" ]]; then
  TENS_COUNT=$(find "$TENS_DIR" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
else
  TENS_COUNT=0
fi

if [[ "$TENS_COUNT" -ge "$THRESHOLD" && "$THRESHOLD" -gt 0 ]]; then
  echo "  FIRED: tensions_pending ($TENS_COUNT tensions, threshold: $THRESHOLD)"
  FIRED_COUNT=$((FIRED_COUNT + 1))
else
  echo "  OK: tensions_pending ($TENS_COUNT tensions, threshold: $THRESHOLD)"
fi

# --- schema_violations ---
echo ""
echo "Checking: schema_violations..."
SCHEMA_OUTPUT=$("$SCRIPTS_DIR/validate-schema.sh" 2>/dev/null || true)
FAIL_COUNT=$(echo "$SCHEMA_OUTPUT" | grep '^ *FAIL' | wc -l | tr -d ' ')
THRESHOLD=$(jq -r '.maintenance_conditions.schema_violations.threshold // "none"' "$QUEUE_FILE" 2>/dev/null)

if [[ "$THRESHOLD" == "any" && "$FAIL_COUNT" -gt 0 ]]; then
  echo "  FIRED: schema_violations ($FAIL_COUNT record(s) failing validation)"
  echo "$SCHEMA_OUTPUT" | grep '^ *FAIL' | sed 's/^/    /'
  FIRED_COUNT=$((FIRED_COUNT + 1))
else
  echo "  OK: schema_violations ($FAIL_COUNT failure(s))"
fi

# --- Summary ---
echo ""
echo "=== Summary ==="
echo "Conditions fired: $FIRED_COUNT"

if [[ "$FIRED_COUNT" -gt 0 ]]; then
  echo "Action required: maintenance conditions need attention."
  exit 1
else
  echo "All conditions OK."
fi
