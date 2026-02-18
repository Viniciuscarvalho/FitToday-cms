---
_schema:
  entity_type: "source-capture"
  applies_to: "inbox/*.md"
  required:
    - description
  optional:
    - source_type
    - created
  enums:
    source_type:
      - documentation
      - code-review
      - discussion
      - research
      - manual
  constraints:
    description:
      max_length: 200
      format: "What this source is and why it matters"

# Template fields
description: ""
source_type: manual
created: YYYY-MM-DD
---

# {source title or brief description}

{Raw content, notes, links, or observations to be processed into records}

## Key Points
- {point 1}
- {point 2}

## Processing Notes
{What records should be extracted from this source}
