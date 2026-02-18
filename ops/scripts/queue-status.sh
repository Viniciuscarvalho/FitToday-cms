#!/bin/bash
# queue-status.sh - Read ops/queue/queue.json and report task status
# Shows pending/in-progress/done counts and lists stalled batches

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
QUEUE_FILE="$VAULT_ROOT/ops/queue/queue.json"

if [[ ! -f "$QUEUE_FILE" ]]; then
  echo "ERROR: Queue file not found: $QUEUE_FILE"
  exit 1
fi

echo "=== Queue Status ==="
echo ""

# Count tasks by status
PENDING=$(jq '[.tasks[] | select(.status == "pending")] | length' "$QUEUE_FILE" 2>/dev/null || echo 0)
IN_PROGRESS=$(jq '[.tasks[] | select(.status == "in-progress")] | length' "$QUEUE_FILE" 2>/dev/null || echo 0)
DONE=$(jq '[.tasks[] | select(.status == "done")] | length' "$QUEUE_FILE" 2>/dev/null || echo 0)
TOTAL=$(jq '.tasks | length' "$QUEUE_FILE" 2>/dev/null || echo 0)

echo "Pending:     $PENDING"
echo "In-progress: $IN_PROGRESS"
echo "Done:        $DONE"
echo "Total:       $TOTAL"

# Check for stalled batches (in-progress tasks with no recent updates)
# A batch is considered stalled if it has been in-progress for more than 2 sessions
# We approximate this by checking for tasks that have a started_at timestamp older than 2 days
echo ""
echo "=== Stalled Batches ==="

STALLED=$(jq -r '
  .tasks[]
  | select(.status == "in-progress")
  | select(.started_at != null)
  | select(
      (now - ((.started_at // "1970-01-01T00:00:00Z") | fromdateiso8601)) > (2 * 86400)
    )
  | "  Stalled: \(.id // .name // "unnamed") (started: \(.started_at))"
' "$QUEUE_FILE" 2>/dev/null || true)

if [[ -n "$STALLED" ]]; then
  echo "$STALLED"
else
  # Also flag any in-progress tasks without a started_at as potentially stalled
  MISSING_START=$(jq -r '
    .tasks[]
    | select(.status == "in-progress")
    | select(.started_at == null)
    | "  Warning: \(.id // .name // "unnamed") is in-progress but has no started_at timestamp"
  ' "$QUEUE_FILE" 2>/dev/null || true)

  if [[ -n "$MISSING_START" ]]; then
    echo "$MISSING_START"
  else
    echo "  No stalled batches detected."
  fi
fi

# Show maintenance conditions if defined
echo ""
echo "=== Maintenance Conditions ==="
jq -r '
  .maintenance_conditions // {} | to_entries[] |
  "  \(.key): threshold=\(.value.threshold), speed=\(.value.consequence_speed)"
' "$QUEUE_FILE" 2>/dev/null || echo "  No maintenance conditions defined."
