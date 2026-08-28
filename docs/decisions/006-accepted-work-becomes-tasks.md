# ADR-006: Accepted Actionable Interpretations Become Tasks

Status: Accepted

## Context

`roadmap/mvp.md` says accepted interpretations "become structured work or reference
state", and lists `task` and `blocker` among the types an interpretation may assign.
`product/user-flows.md` requires the Today view to surface blockers. `roadmap/mvp.md`
also says Projects organize "captures, tasks, notes, and future external context".

No Task entity exists. `architecture/data-model.md` defines Capture, Interpretation,
Project, ContextItem, ContextPacket, Skill, AgentRun, ToolCall, and Approval — and
nothing an accepted task can land in. The inbox accept flow is blocked on this, and
the dashboard cannot show blockers without it.

The competing pressure is `product/vision.md`, which states DevDiary is not primarily
"a generic todo list". Whatever is added must serve the capture loop without turning
into a task manager.

## Decision

Add a `Task` entity for **actionable** accepted interpretations only — types `task`
and `blocker`.

Non-actionable types — `thought`, `idea`, `note` — do not get a new record. Accepting
one marks the interpretation `accepted`; the Capture plus its accepted Interpretation
already is the note. Those types have no lifecycle, so giving them one would be
inventing state the user never asked for.

Suggested fields:

```text
id
user_id
project_id                # nullable
type                      # task | blocker
title
notes                     # nullable
status                    # open | done | dropped
priority                  # nullable
due_date                  # nullable, never inferred
source_capture_id         # nullable
source_interpretation_id  # nullable
created_at
updated_at
completed_at              # nullable
```

Both provenance links are nullable and both are kept. `source_capture_id` is the
durable link back to the original thought and survives re-interpretation;
`source_interpretation_id` records which specific proposal the user accepted, and is
null when the user structured the work themselves after dismissing the proposal.
Tasks that originate elsewhere — morning planning, a future import — have neither.

`due_date` exists but is never populated by a model. `architecture/agents-and-skills.md`
already states the Process Inbox skill must not invent deadlines.

Scope limits, to keep this from becoming a todo application: no subtasks, no
dependencies, no recurrence, no assignees, no external-system mapping fields.
Integrations remain read-only per ADR-003, so a ClickUp task is a Context Item, not
a Task.

## Consequences

Positive:

- The inbox accept flow is unblocked.
- The Today view can query blockers directly (`type='blocker'`, `status='open'`).
- Provenance runs from task back to the original capture, supporting the
  "why does this work exist" question in `roadmap/future.md`.
- Tasks carry lifecycle state without polluting diary metrics.

Negative:

- A fourth user-facing concept alongside captures, entries, and projects.
- Accept behaves differently by type, which the inbox UI must make legible.
- Ongoing pressure to grow this into a full task manager. The scope limits above
  are the guard, and expanding them should require a new ADR.

## Alternatives considered

**Accepted tasks become Entry rows.** Rejected. `Entry.date` and `Entry.mood` are both
`NOT NULL`, and entries feed the streak, entry count, calendar, and mood averages. A
task is not a dated reflection with a mood, and putting one in that table corrupts
every metric reading from it — the same argument that kept captures out of `entries`.

**Resolved state on the Capture itself.** Rejected. It contradicts Principle 2 and
ADR-002: a Capture is raw source material and must not carry derived authoritative
state. It also assumes every task originates from a capture, which is false for
morning planning and any future import.

**The accepted Interpretation is the task.** Rejected. Principle 3 makes
interpretations proposals, not authoritative state; promoting accepted ones conflates
the two. Re-interpretation also produces several interpretations per capture, leaving
no single answer to which one is the task.

**One `WorkItem` table for all five types.** Rejected as scope not yet earned. It
gives lifecycle fields to thoughts and notes that have no lifecycle. If ideas later
need status tracking, revisit this — it is the natural successor to this decision.

## Follow-up work

Implemented in migration `c3f81a2b57d9`. Accept, edit, and dismiss live at
`PATCH /api/v1/interpretations/{id}`; tasks are read and updated under
`/api/v1/tasks`.

Two behaviours settled during implementation and worth recording here:

- Accepting is reversible. Dismissing a proposal that already produced a Task
  drops that Task, and re-accepting revives it. A Task already marked `done` is
  left alone — changing your mind about a suggestion should not erase work that
  was actually finished.
- `edited` is affirmative, not a third state. It applies the user's changes and
  then behaves like `accepted`, so editing a `note` up to a `task` creates one and
  editing a `task` down to a `note` withdraws it.

Still open:

- No endpoint creates a Task directly. The inbox is the only path in, which keeps
  the capture-first loop primary. Morning planning (`roadmap/fast-follow.md`) will
  need one.
- No frontend.
