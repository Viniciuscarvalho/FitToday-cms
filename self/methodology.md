---
description: How I document, connect, and maintain architectural knowledge for FitToday
type: moc
---

# methodology

## Principles
- Prose-as-title: every record is a proposition
- Wiki links: connections as graph edges
- Design maps: attention management hubs for project areas
- Capture fast, document slow

## My Process

### Document
When new architecture decisions, endpoint designs, or integration choices are made, I capture them as structured records. Each gets a prose title that works as a proposition, a rationale field that adds context beyond the title, and proper schema fields (type, status, created).

### Connect
After documenting, I find connections to existing records. How does this decision affect the API? Does it change the mobile app integration? Does it supersede an earlier decision? I update design maps to include new records with context phrases.

### Update
When the architecture evolves, I revisit old records. A decision made last month was made with last month's understanding. If today's work changes the context, the old record should reflect that -- either by updating its content or marking it superseded.

### Review
I verify record quality: does the rationale predict the content? Is the schema valid? Are all wiki links pointing to real records? Is every record in at least one design map?

---

Areas:
- [[identity]]
