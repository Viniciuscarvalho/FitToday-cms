#!/bin/bash
# link-density.sh - Measure outgoing wiki link density per record
# Counts total outgoing [[wiki links]] per record, reports average, flags zero-link records

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RECORDS_DIR="$VAULT_ROOT/records"

TOTAL_LINKS=0
FILE_COUNT=0
ZERO_LINK_FILES=()

echo "=== Link Density Report ==="
echo ""

for file in "$RECORDS_DIR"/*.md; do
  [[ -f "$file" ]] || continue

  basename_no_ext="$(basename "$file" .md)"
  FILE_COUNT=$((FILE_COUNT + 1))

  # Count outgoing wiki links in this file
  LINK_COUNT=$(grep -o '\[\[[^]]*\]\]' "$file" 2>/dev/null | wc -l | tr -d ' ')

  TOTAL_LINKS=$((TOTAL_LINKS + LINK_COUNT))

  if [[ "$LINK_COUNT" -eq 0 ]]; then
    ZERO_LINK_FILES+=("$basename_no_ext")
  fi

  printf "  %-40s %3d links\n" "$basename_no_ext" "$LINK_COUNT"
done

echo ""
echo "---"

if [[ "$FILE_COUNT" -gt 0 ]]; then
  # Use awk for floating point division
  AVG=$(awk "BEGIN { printf \"%.1f\", $TOTAL_LINKS / $FILE_COUNT }")
  echo "Total records: $FILE_COUNT"
  echo "Total outgoing links: $TOTAL_LINKS"
  echo "Average links per record: $AVG"
else
  echo "No records found."
fi

if [[ ${#ZERO_LINK_FILES[@]} -gt 0 ]]; then
  echo ""
  echo "WARNING: Records with 0 outgoing links:"
  for f in "${ZERO_LINK_FILES[@]}"; do
    echo "  - $f"
  done
fi
