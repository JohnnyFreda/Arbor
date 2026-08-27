# ADR-005: DevDiary Becomes a Developer Operating Workspace

Status: Accepted

## Context

DevDiary v1 shipped as a developer journal: authenticated users log dated entries with
mood, tags, projects, a calendar view, and streak/insight statistics. That product works,
but it only captures what a developer remembers to write down after the fact, and it
requires the user to structure every entry by hand at the moment of writing.

The more valuable problem sits next to it. Developer context is fragmented across notes,
task trackers, chat, meetings, repositories, and pull requests, and the reasoning behind a
technical decision is usually split across several of them. Meanwhile developers generate
useful unstructured thought all day — a bug hypothesis, a blocker, a follow-up — that
never survives contact with a form that demands a project, a type, and a due date first.

The existing journal domain already models the reflective half of that loop. It does not
model the incoming half, and it has no concept of external context or of agents acting on
the user's behalf.

## Decision

DevDiary expands from a developer journal into a developer operating workspace organized
around the loop:

> Capture -> Understand -> Plan -> Execute -> Reflect

AI becomes the normalization layer between unstructured human thought and structured
computer state, rather than a feature bolted onto entry authoring.

This decision is evolutionary, not a rewrite. The existing React/TypeScript frontend,
FastAPI/Python backend, and PostgreSQL persistence carry forward, and new domain concepts
are added alongside the current schema.

The diary domain is retained deliberately. Diary entries model reflection and historical
narrative; Captures model raw incoming thought. They solve different problems, and
collapsing them would lose both. See `docs/architecture/data-model.md`.

## Consequences

Positive:

- The product addresses context fragmentation, not just record-keeping.
- Capture friction drops far enough to be useful on mobile and by dictation.
- Existing journal, project, tag, and calendar functionality retains a clear role.
- Integrations and agent capability have a coherent home in the architecture.

Negative:

- The domain model grows substantially: Capture, Interpretation, Context Item,
  Context Packet, Agent Run, Tool Call, Approval, Permission Policy.
- Product surface area expands, which raises the risk of scope creep. The MVP boundary in
  `docs/roadmap/mvp.md` and Principle 9 ("scope before platform") exist to contain it.
- Trust becomes a first-class engineering concern rather than an afterthought, because the
  system now proposes structure and will eventually act on external systems.
- v1 documentation describing DevDiary as a mood-and-tags journal is superseded.

## Follow-up work

- ADR-001 through ADR-004 elaborate the input model, provenance model, integration posture,
  and MCP position that follow from this decision.
- The v1 design document is retained for historical reference at `docs/archive/v1-specs.txt`.
