---
_schema:
  entity_type: "design-map"
  applies_to: "records/*.md"
  required:
    - description
  optional:
    - type
  enums:
    type:
      - moc
  constraints:
    description:
      max_length: 200
      format: "Brief description of what this project area covers"

# Template fields
description: ""
type: moc
---

# {area-name}

Brief orientation -- what this project area covers and how to navigate it.

## Core Decisions
- [[record]] -- context explaining why this matters here

## Tensions
Unresolved conflicts -- architectural trade-offs not yet decided.

## Open Questions
What is unexplored. Gaps that need decisions.
