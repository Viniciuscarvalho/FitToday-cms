---
_schema:
  entity_type: "record"
  applies_to: "records/*.md"
  required:
    - description
  optional:
    - type
    - status
    - created
    - modified
    - superseded_by
  enums:
    type:
      - architecture
      - endpoint
      - integration
      - feature
      - platform
      - data-model
    status:
      - active
      - superseded
      - deprecated
  constraints:
    description:
      max_length: 200
      format: "One sentence adding context beyond the title -- scope, mechanism, or implication"
    superseded_by:
      format: "Wiki link to the record that replaces this one"

# Template fields
description: ""
type: architecture
status: active
created: YYYY-MM-DD
---

# {prose-as-title -- a proposition about an architecture decision, endpoint design, or integration choice}

{Content: the reasoning, alternatives considered, implementation details, and implications}

---

Relevant Notes:
- [[related record]] -- relationship context

Areas:
- [[relevant-design-map]]
