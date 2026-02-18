#!/bin/bash
# backlinks.sh - Find all files containing [[note title]] wiki links
# Usage: backlinks.sh "note title" [--count]

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

COUNT_ONLY=false
NOTE_TITLE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --count)
      COUNT_ONLY=true
      shift
      ;;
    *)
      NOTE_TITLE="$1"
      shift
      ;;
  esac
done

if [[ -z "$NOTE_TITLE" ]]; then
  echo "Usage: $0 \"note title\" [--count]"
  exit 1
fi

# Find all files containing [[note title]] or [[note title|alias]]
RESULTS=$(grep -rl "\[\[${NOTE_TITLE}\]\]\|\[\[${NOTE_TITLE}|" "$VAULT_ROOT" --include='*.md' 2>/dev/null \
  | grep -v '.git/' \
  | sort || true)

if [[ "$COUNT_ONLY" == true ]]; then
  if [[ -z "$RESULTS" ]]; then
    echo "0"
  else
    echo "$RESULTS" | wc -l | tr -d ' '
  fi
else
  if [[ -z "$RESULTS" ]]; then
    echo "No backlinks found for [[${NOTE_TITLE}]]"
  else
    echo "Backlinks to [[${NOTE_TITLE}]]:"
    echo "$RESULTS"
  fi
fi
