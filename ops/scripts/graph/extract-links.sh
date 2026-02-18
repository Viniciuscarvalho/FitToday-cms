#!/bin/bash
# extract-links.sh - Extract all [[wiki links]] from a given note
# Usage: extract-links.sh "note title"

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
RECORDS_DIR="$VAULT_ROOT/records"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 \"note title\""
  exit 1
fi

NOTE_TITLE="$1"
NOTE_FILE="$RECORDS_DIR/${NOTE_TITLE}.md"

if [[ ! -f "$NOTE_FILE" ]]; then
  echo "ERROR: File not found: $NOTE_FILE"
  exit 1
fi

echo "Outgoing links from [[${NOTE_TITLE}]]:"

# Extract all [[...]] links, stripping the brackets and any alias
grep -o '\[\[[^]]*\]\]' "$NOTE_FILE" 2>/dev/null \
  | sed 's/\[\[//;s/\]\]//' \
  | sed 's/|.*//' \
  | sort -u \
  | while read -r link; do
    TARGET="$RECORDS_DIR/${link}.md"
    if [[ -f "$TARGET" ]]; then
      echo "  [[${link}]]"
    else
      # Check self/ and root as fallbacks
      FOUND=false
      for search_dir in "$VAULT_ROOT/self" "$VAULT_ROOT"; do
        if [[ -f "${search_dir}/${link}.md" ]]; then
          echo "  [[${link}]]"
          FOUND=true
          break
        fi
      done
      if [[ "$FOUND" == false ]]; then
        echo "  [[${link}]]  (MISSING)"
      fi
    fi
  done
