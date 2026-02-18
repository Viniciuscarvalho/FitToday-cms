#!/bin/bash
# dangling-links.sh - Find all wiki links that point to non-existent files
# Searches the entire vault for [[wiki links]] and checks if each target exists in records/

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RECORDS_DIR="$VAULT_ROOT/records"

DANGLING_COUNT=0
CHECKED_COUNT=0

# Extract all unique wiki link targets from all .md files
# Handles both [[target]] and [[target|alias]] forms
TARGETS=$(grep -roh '\[\[[^]]*\]\]' "$VAULT_ROOT" --include='*.md' 2>/dev/null \
  | grep -v '.git/' \
  | sed 's/\[\[//;s/\]\]//' \
  | sed 's/|.*//' \
  | sort -u)

while IFS= read -r target; do
  [[ -z "$target" ]] && continue
  CHECKED_COUNT=$((CHECKED_COUNT + 1))

  # Check if target file exists in records/
  TARGET_FILE="$RECORDS_DIR/${target}.md"

  # Also check other common locations (self/, etc.)
  FOUND=false
  for search_dir in "$RECORDS_DIR" "$VAULT_ROOT/self" "$VAULT_ROOT"; do
    if [[ -f "${search_dir}/${target}.md" ]]; then
      FOUND=true
      break
    fi
  done

  if [[ "$FOUND" == false ]]; then
    echo "Dangling: [[${target}]]"
    DANGLING_COUNT=$((DANGLING_COUNT + 1))
  fi
done <<< "$TARGETS"

echo ""
echo "---"
echo "Links checked: $CHECKED_COUNT"
echo "Dangling: $DANGLING_COUNT"
