#!/bin/bash
# validate-schema.sh - Validate all records/*.md against required frontmatter fields
# Required: description
# Reports PASS/WARN/FAIL per file with a summary at the end

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RECORDS_DIR="$VAULT_ROOT/records"

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0
TOTAL=0

echo "=== Schema Validation Report ==="
echo ""

for file in "$RECORDS_DIR"/*.md; do
  [[ -f "$file" ]] || continue

  basename_no_ext="$(basename "$file" .md)"
  TOTAL=$((TOTAL + 1))
  STATUS="PASS"
  ISSUES=()

  # Check for frontmatter delimiters
  FIRST_LINE=$(head -1 "$file")
  if [[ "$FIRST_LINE" != "---" ]]; then
    STATUS="FAIL"
    ISSUES+=("missing frontmatter block")
  else
    # Extract frontmatter (between first and second ---)
    FRONTMATTER=$(awk '/^---$/{n++; next} n==1{print} n==2{exit}' "$file")

    # Check required field: description
    if ! echo "$FRONTMATTER" | grep -q '^description:'; then
      STATUS="FAIL"
      ISSUES+=("missing required field: description")
    else
      # Check if description is empty
      DESC_VALUE=$(echo "$FRONTMATTER" | grep '^description:' | sed 's/^description:[[:space:]]*//')
      if [[ -z "$DESC_VALUE" ]]; then
        STATUS="WARN"
        ISSUES+=("description is empty")
      fi
    fi

    # Check recommended field: type
    if ! echo "$FRONTMATTER" | grep -q '^type:'; then
      if [[ "$STATUS" == "PASS" ]]; then
        STATUS="WARN"
      fi
      ISSUES+=("missing recommended field: type")
    fi
  fi

  # Report result
  case "$STATUS" in
    PASS)
      PASS_COUNT=$((PASS_COUNT + 1))
      printf "  PASS  %-40s\n" "$basename_no_ext"
      ;;
    WARN)
      WARN_COUNT=$((WARN_COUNT + 1))
      printf "  WARN  %-40s  %s\n" "$basename_no_ext" "$(IFS='; '; echo "${ISSUES[*]}")"
      ;;
    FAIL)
      FAIL_COUNT=$((FAIL_COUNT + 1))
      printf "  FAIL  %-40s  %s\n" "$basename_no_ext" "$(IFS='; '; echo "${ISSUES[*]}")"
      ;;
  esac
done

echo ""
echo "=== Summary ==="
echo "Total: $TOTAL"
echo "PASS:  $PASS_COUNT"
echo "WARN:  $WARN_COUNT"
echo "FAIL:  $FAIL_COUNT"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi
