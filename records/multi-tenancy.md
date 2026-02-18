---
description: Design map for trainer isolation, student management, and multi-tenant data architecture
type: moc
---

# multi-tenancy

FitToday serves multiple personal trainers, each with their own students. This map tracks how data is isolated between trainers, how student-trainer relationships work, and how the system scales across tenants.

## Core Decisions
(Records will be added here as tenancy model is documented)

## Tensions
(Unresolved multi-tenancy trade-offs)

## Open Questions
- Can a student belong to multiple trainers?
- How is trainer data isolated at the database level?
- What happens to student data when a trainer churns?

---

Areas:
- [[index]]
