---
engine_version: "0.2.0"
research_snapshot: "2026-02-18"
generated_at: "2026-02-18T12:00:00Z"
platform: claude-code
kernel_version: "1.0"

dimensions:
  granularity: moderate
  organization: flat
  linking: explicit
  processing: moderate
  navigation: 3-tier
  maintenance: condition-based
  schema: moderate
  automation: full

active_blocks:
  - wiki-links
  - atomic-notes
  - mocs
  - processing-pipeline
  - schema
  - maintenance
  - self-evolution
  - methodology-knowledge
  - session-rhythm
  - templates
  - ethical-guardrails
  - helper-functions
  - graph-analysis
  - self-space

coherence_result: passed

vocabulary:
  notes: "records"
  inbox: "inbox"
  archive: "archived"
  ops: "ops"
  note: "record"
  note_plural: "records"
  description: "rationale"
  topics: "areas"
  relevant_notes: "relevant records"
  topic_map: "design map"
  hub: "hub"
  reduce: "document"
  reflect: "connect"
  reweave: "update"
  verify: "review"
  validate: "audit"
  rethink: "reassess"
  cmd_reduce: "/document"
  cmd_reflect: "/connect"
  cmd_reweave: "/update"
  cmd_verify: "/review"
  cmd_rethink: "/reassess"

  extraction_categories:
    - name: "architecture-decisions"
      what_to_find: "Why the system is structured this way"
      output_type: "record"
    - name: "endpoint-specs"
      what_to_find: "What each API endpoint does and why"
      output_type: "record"
    - name: "integration-docs"
      what_to_find: "How third-party services are integrated"
      output_type: "record"
    - name: "feature-specs"
      what_to_find: "What features do and how they work"
      output_type: "record"
    - name: "platform-decisions"
      what_to_find: "iOS/Android specific choices"
      output_type: "record"
    - name: "data-models"
      what_to_find: "How data is structured and why"
      output_type: "record"

platform_hints:
  context: fork
  allowed_tools:
    - Read
    - Write
    - Edit
    - Bash
    - Glob
    - Grep
  semantic_search_tool: null

personality:
  warmth: neutral
  opinionatedness: neutral
  formality: professional
  emotional_awareness: task-focused
---
