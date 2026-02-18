---
_schema:
  entity_type: "observation"
  applies_to: "ops/observations/*.md"
  required:
    - description
    - category
    - status
    - observed
  optional: []
  enums:
    category:
      - friction
      - surprise
      - process-gap
      - methodology
    status:
      - pending
      - promoted
      - implemented
      - archived
  constraints:
    description:
      max_length: 200
      format: "What happened and what it suggests"

# Template fields
description: ""
category: friction
status: pending
observed: YYYY-MM-DD
---

# {the observation as a prose sentence}

{What happened, why it matters, and what might change}
