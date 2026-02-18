#!/bin/bash
# orphan-notes.sh - Find records with no incoming wiki links from other files
# Excludes design maps (type: moc) from orphan detection

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RECORDS_DIR="$VAULT_ROOT/records"

ORPHAN_COUNT=0
CHECKED_COUNT=0

for file in "$RECORDS_DIR"/*.md; do
  [[ -f "$file" ]] || continue

  basename_no_ext="$(basename "$file" .md)"

  # Skip design maps (type: moc)
  if head -20 "$file" | grep -q '^type: moc' 2>/dev/null; then
    continue
  fi

  CHECKED_COUNT=$((CHECKED_COUNT + 1))

  # Search all .md files in the vault for [[basename_no_ext]] links
  # Exclude the file itself
  INCOMING=$(grep -rl "\[\[${basename_no_ext}\]\]" "$VAULT_ROOT" --include='*.md' 2>/dev/null \
    | grep -v '.git/' \
    | grep -v "$file" || true)

  # Also check for aliased links [[basename_no_ext|...]]
  if [[ -z "$INCOMING" ]]; then
    INCOMING=$(grep -rl "\[\[${basename_no_ext}|" "$VAULT_ROOT" --include='*.md' 2>/dev/null \
      | grep -v '.git/' \
      | grep -v "$file" || true)
  fi

  if [[ -z "$INCOMING" ]]; then
    echo "Orphan: ${basename_no_ext}"
    ORPHAN_COUNT=$((ORPHAN_COUNT + 1))
  fi
done

echo ""
echo "---"
echo "Checked: $CHECKED_COUNT records (excluding design maps)"
echo "Orphans: $ORPHAN_COUNT"
