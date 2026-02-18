#!/bin/bash
# rename-note.sh - Rename a record and update all wiki links across the vault
# Usage: rename-note.sh "old title" "new title"

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RECORDS_DIR="$VAULT_ROOT/records"

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 \"old title\" \"new title\""
  exit 1
fi

OLD_TITLE="$1"
NEW_TITLE="$2"
OLD_FILE="$RECORDS_DIR/${OLD_TITLE}.md"
NEW_FILE="$RECORDS_DIR/${NEW_TITLE}.md"

# Verify old file exists
if [[ ! -f "$OLD_FILE" ]]; then
  echo "ERROR: Source file not found: $OLD_FILE"
  exit 1
fi

# Verify new file does not exist
if [[ -f "$NEW_FILE" ]]; then
  echo "ERROR: Target file already exists: $NEW_FILE"
  exit 1
fi

# Rename the file with git mv
echo "Renaming: $OLD_TITLE -> $NEW_TITLE"
cd "$VAULT_ROOT"
git mv "$OLD_FILE" "$NEW_FILE"

# Update all wiki links across the vault (all .md files)
echo "Updating wiki links..."
LINK_COUNT=0

while IFS= read -r file; do
  if grep -q "\[\[${OLD_TITLE}\]\]" "$file" 2>/dev/null; then
    sed -i '' "s|\[\[${OLD_TITLE}\]\]|[[${NEW_TITLE}]]|g" "$file"
    LINK_COUNT=$((LINK_COUNT + 1))
    echo "  Updated: $file"
  fi
  # Also handle aliased links: [[old title|alias]]
  if grep -q "\[\[${OLD_TITLE}|" "$file" 2>/dev/null; then
    sed -i '' "s|\[\[${OLD_TITLE}||\[\[${NEW_TITLE}||g" "$file"
    echo "  Updated alias in: $file"
  fi
done < <(find "$VAULT_ROOT" -name '*.md' -not -path '*/.git/*')

echo "Updated links in $LINK_COUNT file(s)."

# Verify no broken links remain
echo ""
echo "Verifying no references to old title remain..."
REMAINING=$(grep -rl "\[\[${OLD_TITLE}\]\]" "$VAULT_ROOT" --include='*.md' 2>/dev/null | grep -v '.git/' || true)

if [[ -n "$REMAINING" ]]; then
  echo "WARNING: Broken links still found in:"
  echo "$REMAINING"
  exit 1
else
  echo "PASS: No broken links to [[${OLD_TITLE}]] remain."
fi
