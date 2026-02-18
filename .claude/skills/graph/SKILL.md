---
name: graph
description: Interactive knowledge graph analysis. Routes natural language questions to graph scripts, interprets results in domain vocabulary, and suggests concrete actions. Triggers on "/graph", "/graph health", "/graph triangles", "find synthesis opportunities", "graph analysis".
version: "1.0"
generated_from: "arscontexta-v1.6"
user-invocable: true
context: fork
model: sonnet
allowed-tools: Read, Grep, Glob, Bash
argument-hint: "[operation] [target] — operations: health, triangles, bridges, clusters, hubs, siblings, forward, backward, query"
---

## Runtime Configuration (Step 0 — before any processing)

Read these files to configure domain-specific behavior:

1. **`ops/derivation-manifest.md`** — vocabulary mapping, platform hints
   - Use `vocabulary.notes` for the records folder name
   - Use `vocabulary.note` / `vocabulary.note_plural` for record type references
   - Use `vocabulary.topic_map` / `vocabulary.topic_map_plural` for design map references
   - Use `vocabulary.cmd_reflect` for connection-finding command name
   - Use `vocabulary.cmd_reweave` for backward-pass command name

2. **`ops/config.yaml`** — for graph thresholds (design map size limits, orphan thresholds)

If no derivation file exists, use universal terms (records, design maps, etc.).

---

## EXECUTE NOW

**Target: $ARGUMENTS**

Parse the operation from arguments:
- If arguments match a known operation: route to that operation
- If arguments are a natural language question: map to the closest operation (see Interactive Mode)
- If no arguments: enter interactive mode

**START NOW.** Route to the appropriate operation.

---

## Philosophy

**The graph IS the knowledge. This skill makes it visible.**

Individual records are valuable, but their connections create compound value. /graph reveals the structural properties of those connections — where the graph is dense, where it is sparse, where it is fragile, and where synthesis opportunities hide.

Every operation produces two things: **findings** (what the analysis reveals) and **actions** (what to do about it). Never dump raw data. Always interpret results with record rationales and domain context. Always suggest specific next steps.

---

## Operations

### /graph health

Full graph health report: density, orphans, dangling links, coverage.

**Step 1: Collect raw metrics**

```bash
# Count total records (excluding design maps)
NOTES_DIR="records"
TOTAL=$(ls -1 "$NOTES_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
MOC_COUNT=$(grep -rl '^type: moc' "$NOTES_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
NOTE_COUNT=$((TOTAL - MOC_COUNT))

# Count all wiki links
LINK_COUNT=$(grep -ohP '\[\[[^\]]+\]\]' "$NOTES_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')

# Calculate link density
# Density = actual_links / possible_links
# possible_links = N * (N - 1) for directed graph
echo "Density: $LINK_COUNT / ($NOTE_COUNT * ($NOTE_COUNT - 1))"

# Find orphan records (zero incoming links)
for f in "$NOTES_DIR"/*.md; do
  NAME=$(basename "$f" .md)
  INCOMING=$(grep -rl "\[\[$NAME\]\]" "$NOTES_DIR"/ 2>/dev/null | grep -v "$f" | wc -l | tr -d ' ')
  [[ "$INCOMING" -eq 0 ]] && echo "ORPHAN: $NAME"
done

# Find dangling links (links to non-existent files)
grep -ohP '\[\[([^\]]+)\]\]' "$NOTES_DIR"/*.md 2>/dev/null | sort -u | while read -r link; do
  NAME=$(echo "$link" | sed 's/\[\[//;s/\]\]//')
  [[ ! -f "$NOTES_DIR/$NAME.md" ]] && echo "DANGLING: $NAME"
done

# Design map coverage: % of records appearing in at least one design map's Core Ideas
COVERED=0
for f in "$NOTES_DIR"/*.md; do
  NAME=$(basename "$f" .md)
  # Skip design maps themselves
  grep -q '^type: moc' "$f" 2>/dev/null && continue
  # Check if any design map links to this record
  if grep -rl '^type: moc' "$NOTES_DIR"/*.md 2>/dev/null | xargs grep -l "\[\[$NAME\]\]" >/dev/null 2>&1; then
    COVERED=$((COVERED + 1))
  fi
done
echo "Coverage: $COVERED / $NOTE_COUNT"
```

If graph helper scripts exist in `ops/scripts/graph/`, use them instead of inline analysis:
- `ops/scripts/graph/link-density.sh` for density metrics
- `ops/scripts/graph/orphan-notes.sh` for orphan detection
- `ops/scripts/graph/dangling-links.sh` for dangling link detection

**Step 2: Interpret and present**

```
--=={ graph health }==--

  records: [N] (plus [M] design maps)
  Connections: [N] (avg [X] per record)
  Graph density: [0.XX]
  design map coverage: [N]% of records appear in at least one design map

  Orphans ([N]):
    - [[orphan name]] — [rationale from YAML]
    → Suggestion: Run /connect to find connections

  Dangling Links ([N]):
    - [[missing name]] — referenced from [[source record]]
    → Suggestion: Create the record or remove the link

  design map Sizes:
    - [[design map name]]: [N] records [OK | WARN: approaching split threshold | WARN: consider merging]

  Overall: [HEALTHY | NEEDS ATTENTION | FRAGMENTED]
```

**Density benchmarks:**

| Density | Interpretation |
|---------|---------------|
| < 0.02 | Sparse — records exist but connections are thin |
| 0.02-0.06 | Healthy — growing network with meaningful connections |
| 0.06-0.15 | Dense — well-connected, watch for over-linking |
| > 0.15 | Very dense — verify connections are genuine, not noise |

### /graph triangles

Find synthesis opportunities — open triadic closures where A links to B and A links to C, but B does not link to C.

**Step 1: Build adjacency data**

```bash
# For each record, extract outgoing wiki links
for f in "$NOTES_DIR"/*.md; do
  NAME=$(basename "$f" .md)
  LINKS=$(grep -oP '\[\[([^\]]+)\]\]' "$f" 2>/dev/null | sed 's/\[\[//;s/\]\]//' | sort -u)
  echo "FROM:$NAME"
  echo "$LINKS" | while read -r target; do
    [[ -n "$target" ]] && echo "  TO:$target"
  done
done
```

If `ops/scripts/graph/find-triangles.sh` exists, use it directly.

**Step 2: Find open triangles**

For each record A with outgoing links to B and C:
1. Check if B links to C (in either direction)
2. Check if C links to B (in either direction)
3. If neither link exists: this is an open triangle (synthesis opportunity)

**Step 3: Evaluate and rank**

For each open triangle:
1. Read rationales of BOTH unlinked records
2. Assess: is there a genuine conceptual relationship that the common parent suggests?
3. Rank by potential value: how surprising and useful would the connection be?

**Step 4: Present top findings**

```
--=={ graph triangles }==--

  Found [N] synthesis opportunities — pairs of records that share
  a common reference but do not reference each other:

  1. [[record B]] and [[record C]]
     Common parent: [[record A]]
     B: "[rationale]"
     C: "[rationale]"
     → These may benefit from a connection because [specific reasoning
        about WHY B and C might relate through A's lens]
     → Action: Run /connect on [[record B]] to evaluate

  2. [[record D]] and [[record E]]
     Common parent: [[record F]]
     ...

  [Show top 10. If more exist: "[N] more triangles found. Show all? (yes/no)"]
```

**Filter out trivial triangles:** Skip pairs where:
- Both are in the same design map (they may already be related through the design map without direct links)
- One is a design map itself (design maps link to everything, triangles with design maps are noise)
- The rationales suggest no conceptual overlap

### /graph bridges

Identify structurally critical records whose removal would disconnect graph regions.

**Step 1: Build adjacency list**

Build a bidirectional adjacency list from all wiki links in records/.

If `ops/scripts/graph/find-bridges.sh` exists, use it directly.

**Step 2: Find bridge nodes**

A bridge record is one where:
- Removing it (and its links) would split a connected component into two or more components
- It is the SOLE connection between clusters of records

Implementation: For each record, temporarily remove it and check if the remaining graph has more connected components.

**Step 3: Present findings**

```
--=={ graph bridges }==--

  Found [N] bridge records — structurally critical nodes whose
  removal would disconnect graph regions:

  1. [[bridge record]] — connects [N] records on one side to [M] on the other
     Rationale: "[rationale]"
     Cluster A: [[record1]], [[record2]], ...
     Cluster B: [[record3]], [[record4]], ...
     → Risk: If this record becomes stale, [N+M] records
       lose their connection path
     → Action: Consider adding parallel connections between the clusters

  [If no bridges: "No bridge records found. The graph has redundant paths between
   all connected regions. This is healthy."]
```

### /graph clusters

Discover connected components and area boundaries.

**Step 1: Build adjacency list**

Build a bidirectional adjacency list from all wiki links.

If `ops/scripts/graph/find-clusters.sh` exists, use it directly.

**Step 2: Find connected components**

Use BFS/DFS to find all connected components:
1. Start with any unvisited record
2. Traverse all reachable records via wiki links (bidirectional)
3. Mark as one component
4. Repeat until all records visited

**Step 3: Analyze clusters**

For each cluster:
- Size (number of records)
- Key records (highest link count within cluster)
- Area coverage (which design maps are represented)
- Isolation level (how many links cross cluster boundaries)

**Step 4: Present findings**

```
--=={ graph clusters }==--

  Found [N] connected components:

  Cluster 1: [size] records
    Key nodes: [[record1]] (8 links), [[record2]] (6 links)
    Areas: [[area A]], [[area B]]
    Cross-cluster links: [N]
    → This cluster is [well-connected | isolated | a hub]

  Cluster 2: [size] records
    ...

  Isolated records ([N]):
    - [[isolated record]] — [rationale]
    → Action: Run /connect to find connections

  [If 1 cluster: "All records are in one connected component.
   The graph is fully connected. This is healthy."]
```

### /graph hubs

Rank records by influence — most-linked-to (authorities) and most-linking-from (hubs).

**Step 1: Count links**

```bash
# Authority score: incoming links per record
for f in "$NOTES_DIR"/*.md; do
  NAME=$(basename "$f" .md)
  INCOMING=$(grep -rl "\[\[$NAME\]\]" "$NOTES_DIR"/ 2>/dev/null | grep -v "$f" | wc -l | tr -d ' ')
  echo "AUTH:$INCOMING:$NAME"
done | sort -t: -k2 -rn | head -10

# Hub score: outgoing links per record
for f in "$NOTES_DIR"/*.md; do
  NAME=$(basename "$f" .md)
  OUTGOING=$(grep -oP '\[\[[^\]]+\]\]' "$f" 2>/dev/null | wc -l | tr -d ' ')
  echo "HUB:$OUTGOING:$NAME"
done | sort -t: -k2 -rn | head -10
```

If `ops/scripts/graph/influence-flow.sh` exists, use it directly.

**Step 2: Identify synthesizers**

Synthesizer records score high on BOTH metrics — they absorb many inputs (high authority) and produce many outputs (high hub). These are the most structurally important records in the graph.

**Step 3: Present findings**

```
--=={ graph hubs }==--

  Top Authorities (most-linked-to):
    1. [[record]] — [N] incoming links — "[rationale]"
    2. [[record]] — [N] incoming links — "[rationale]"
    ...

  Top Hubs (most-linking-from):
    1. [[record]] — [N] outgoing links — "[rationale]"
    2. [[record]] — [N] outgoing links — "[rationale]"
    ...

  Synthesizers (high on both — structurally important):
    1. [[record]] — [N] in / [M] out — "[rationale]"
    ...

  [If no clear synthesizers: "No records score high on both metrics.
   This suggests the graph has separate input and output layers."]
```

### /graph siblings [[area]]

Find unconnected records within an area — records sharing the same design map but not linking to each other.

**Step 1: Read the specified design map**

Find and read the design map matching the argument. Extract all records linked in Core Ideas.

**Step 2: Check pairwise connections**

For each pair of records in the design map:
1. Does A link to B? (grep for `[[B]]` in A's file)
2. Does B link to A? (grep for `[[A]]` in B's file)
3. If neither: this is an unconnected sibling pair

If `ops/scripts/graph/topic-siblings.sh` exists, use it with the area argument.

**Step 3: Evaluate pairs**

For each unconnected pair:
- Read both rationales
- Assess whether a connection SHOULD exist
- Rate as: likely connection, possible connection, appropriately separate

**Step 4: Present findings**

```
--=={ graph siblings: [[area]] }==--

  design map [[area]] has [N] records.
  Found [M] unconnected sibling pairs:

  Likely connections:
    1. [[record A]] and [[record B]]
       A: "[rationale]"
       B: "[rationale]"
       → [Why these likely relate]

  Possible connections:
    2. [[record C]] and [[record D]]
       ...

  Appropriately separate: [N] pairs — no connection needed

  → Action: Run /connect on the "likely" pairs
```

### /graph forward [[record]] [depth]

N-hop forward traversal from a record. Default depth: 2.

**Step 1: Start from the specified record**

Read the record and extract all outgoing wiki links (hop 1).

If `ops/scripts/graph/n-hop-forward.sh` exists, use it with the record and depth arguments.

**Step 2: Traverse**

For each linked record:
1. Read it and extract its outgoing wiki links (hop 2)
2. Continue to specified depth
3. Track visited records to avoid cycles

**Step 3: Present as annotated tree**

```
--=={ forward traversal: [[record]] (depth [N]) }==--

  [[root record]] — "[rationale]"
    ├── [[link 1]] — "[rationale]"
    │   ├── [[link 1a]] — "[rationale]"
    │   └── [[link 1b]] — "[rationale]"
    ├── [[link 2]] — "[rationale]"
    │   └── [[link 2a]] — "[rationale]"
    └── [[link 3]] — "[rationale]"

  Reached [N] records in [depth] hops.
  Dead ends (no outgoing links): [[record X]], [[record Y]]
  Cycles detected: [[record]] → ... → [[record]] (skipped)
```

### /graph backward [[record]] [depth]

N-hop backward traversal to a record. Default depth: 2.

**Step 1: Start from the specified record**

Find all records that link TO this record (hop 1).

```bash
NAME="[record name]"
grep -rl "\[\[$NAME\]\]" "$NOTES_DIR"/*.md 2>/dev/null
```

If `ops/scripts/graph/recursive-backlinks.sh` exists, use it with the record and depth arguments.

**Step 2: Traverse backward**

For each linking record:
1. Find what links to IT (hop 2)
2. Continue to specified depth
3. Track visited records to avoid cycles

**Step 3: Present as annotated tree**

```
--=={ backward traversal: [[record]] (depth [N]) }==--

  [[root record]] — "[rationale]"
    ├── [[referrer 1]] — "[rationale]"
    │   ├── [[referrer 1a]] — "[rationale]"
    │   └── [[referrer 1b]] — "[rationale]"
    ├── [[referrer 2]] — "[rationale]"
    │   └── [[referrer 2a]] — "[rationale]"
    └── [[referrer 3]] — "[rationale]"

  [N] records lead to [[root record]] within [depth] hops.
  Entry points (no incoming links): [[record X]], [[record Y]]
```

### /graph query [field] [value]

Schema-level YAML query across records.

**Step 1: Parse field and value**

Supported query patterns:

| Query | Ripgrep Pattern | Purpose |
|-------|----------------|---------|
| `areas [[X]]` | `rg '^areas:.*\[\[X\]\]'` | Find records in an area |
| `type tension` | `rg '^type: tension'` | Find records by type |
| `methodology X` | `rg '^methodology:.*X'` | Find records by tradition |
| `status open` | `rg '^status: open'` | Find records by status |
| `created 2026-02` | `rg '^created: 2026-02'` | Find records by date range |
| `source [[X]]` | `rg '^source:.*\[\[X\]\]'` | Find records from a source |

**Step 2: Execute query**

```bash
rg "^{field}:.*{value}" "$NOTES_DIR"/*.md -l 2>/dev/null
```

For each matching file, extract the rationale for context.

**Step 3: Present results**

```
--=={ graph query: {field} = {value} }==--

  Found [N] records:

  1. [[record name]] — "[rationale]"
  2. [[record name]] — "[rationale]"
  ...

  Distribution:
    [If querying areas: how many per sub-area]
    [If querying type: breakdown by status]
    [If querying methodology: breakdown by tradition]
```

---

## Interactive Mode

If no arguments provided:

1. Ask: "What would you like to know about your knowledge graph?"
2. Map natural language to operation:

| User Says | Maps To | Why |
|-----------|---------|-----|
| "Where should I look for connections?" | triangles | Finding synthesis opportunities |
| "What are my most important records?" | hubs | Authority/hub ranking |
| "Are there isolated areas?" | clusters | Connected component detection |
| "How healthy is my graph?" | health | Full health report |
| "What bridges my areas?" | bridges | Bridge record identification |
| "What connects to [[X]]?" | backward [[X]] | Backward traversal |
| "Where does [[X]] lead?" | forward [[X]] | Forward traversal |
| "Show me records about [area]" | query areas [[area]] | Schema query |
| "What needs connecting in [area]?" | siblings [[area]] | Unconnected sibling pairs |

3. Run the mapped operation
4. After presenting results, offer follow-up: "Want to explore any of these further?"

---

## Output Rules

- **Never dump raw data.** Always interpret results with record rationales and context.
- **Always suggest actions.** "Run /connect on these pairs" or "Consider adding a bridge record about X."
- **Use domain vocabulary** for all labels and descriptions — record, design map, etc.
- **For large result sets,** summarize top findings (max 10) and offer to show more: "[N] more results. Show all? (yes/no)"
- **Include density benchmarks** for context — "your density of 0.04 is in the healthy range."
- **Distinguish structural from semantic.** Graph analysis reveals structural properties. Semantic judgment about WHETHER connections should exist requires /connect.

---

## Edge Cases

### Small Vault (<10 records)

Report metrics but contextualize: "With [N] records, graph analysis provides limited insight. Graph operations become more valuable as the knowledge graph grows. Current metrics are baseline measurements."

All operations still run — they just produce less data.

### No Graph Scripts Available

If `ops/scripts/graph/` does not exist or individual scripts are missing, implement the analysis inline using grep, file reads, and bash loops as shown in each operation's steps. The inline implementations are complete — scripts are optimization, not requirements.

### No ops/derivation-manifest.md

Use universal vocabulary (records, design maps, etc.). All operations work identically.

### Empty Records Directory

Report: "No records found in records/. Start by capturing content to build your knowledge graph."

### Record Not Found (for forward/backward/siblings)

If the specified record or design map does not exist:
1. Search for partial matches: `ls "$NOTES_DIR"/*{query}*.md 2>/dev/null`
2. If matches found: "Did you mean: [[match1]], [[match2]]?"
3. If no matches: "record '[[name]]' not found. Check the name and try again."
