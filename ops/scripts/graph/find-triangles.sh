#!/bin/bash
# find-triangles.sh - Find open triadic closures in the wiki link graph
# A links to B, A links to C, but B and C don't link to each other
# These represent potential connections worth exploring

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
RECORDS_DIR="$VAULT_ROOT/records"

# Build adjacency list: for each record, extract its outgoing links
declare -A LINKS

for file in "$RECORDS_DIR"/*.md; do
  [[ -f "$file" ]] || continue
  NAME="$(basename "$file" .md)"

  # Extract outgoing links
  TARGETS=$(grep -o '\[\[[^]]*\]\]' "$file" 2>/dev/null \
    | sed 's/\[\[//;s/\]\]//' \
    | sed 's/|.*//' \
    | sort -u \
    | tr '\n' ',' || true)

  LINKS["$NAME"]="$TARGETS"
done

echo "=== Open Triadic Closures ==="
echo "(A -> B, A -> C, but B -/-> C and C -/-> B)"
echo ""

TRIANGLE_COUNT=0

# For each node A
for A in "${!LINKS[@]}"; do
  IFS=',' read -ra A_TARGETS <<< "${LINKS[$A]}"

  # For each pair (B, C) in A's outgoing links
  for ((i=0; i<${#A_TARGETS[@]}; i++)); do
    B="${A_TARGETS[$i]}"
    [[ -z "$B" ]] && continue

    for ((j=i+1; j<${#A_TARGETS[@]}; j++)); do
      C="${A_TARGETS[$j]}"
      [[ -z "$C" ]] && continue

      # Check if B links to C
      B_LINKS_C=false
      if [[ -n "${LINKS[$B]:-}" ]]; then
        if echo "${LINKS[$B]}" | grep -q "\\b${C}\\b" 2>/dev/null; then
          B_LINKS_C=true
        fi
      fi

      # Check if C links to B
      C_LINKS_B=false
      if [[ -n "${LINKS[$C]:-}" ]]; then
        if echo "${LINKS[$C]}" | grep -q "\\b${B}\\b" 2>/dev/null; then
          C_LINKS_B=true
        fi
      fi

      if [[ "$B_LINKS_C" == false && "$C_LINKS_B" == false ]]; then
        echo "  $A -> $B, $A -> $C  (but $B and $C are unlinked)"
        TRIANGLE_COUNT=$((TRIANGLE_COUNT + 1))
      fi
    done
  done
done

echo ""
echo "---"
echo "Open triads found: $TRIANGLE_COUNT"
