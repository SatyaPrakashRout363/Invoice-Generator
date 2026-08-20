---
name: architecture-design
description: Turn approved docs/requirements.md into docs/architecture.md
---

Input:
approved docs/requirements.md

Procedure:
1. Read docs/requirements.md in full.
2. Read the existing codebase modules the story will touch.
3. Enumerate at least one alternative approach per major decision, and state why it was rejected.
4. Specify data model changes (fields, tables, schemas).
5. Specify component boundaries (files/modules changed, new interfaces).
6. Specify integration points (external services, APIs, existing subsystems).
7. List risks and mitigations.
8. Cross-check every requirement in docs/requirements.md is addressed; flag any that isn't.
9. Write docs/architecture.md.
