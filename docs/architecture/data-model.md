# Data Model

This document defines conceptual entities, not final migration-ready schemas.

## Capture

Represents explicit user input.

Suggested fields:

```text
id
user_id
content
created_at
source               # desktop | mobile | voice | other
processing_status    # pending | processing | interpreted | failed | skipped
client_token         # optional client-supplied idempotency key
```

The original `content` should remain immutable or versioned rather than silently overwritten by AI.

`processing_status` tracks whether the model ran, not what the user decided about
the result. The user's decision lives on `Interpretation.status`. Keeping the two
apart is what makes "interpretation failed" distinguishable from "user dismissed it",
and `failed` is what allows a capture to be retried rather than silently lost.

`client_token` is unique per user and exists so a retried submission — dictation
over bad mobile signal, a double-tapped button — resolves to the existing capture
instead of creating a second one. Implemented in `backend/app/db/models/capture.py`.

## Interpretation

Represents AI-proposed structure for a Capture.

Suggested fields:

```text
id
capture_id
type                 # thought | task | idea | note | blocker
suggested_title
suggested_project_id
suggested_priority
suggested_next_action
confidence
status               # proposed | accepted | edited | dismissed
created_at
```

## Project

Suggested fields:

```text
id
user_id
name
description
status
created_at
updated_at
```

Future project relationships may include:

- GitHub repositories
- ClickUp spaces/lists/tasks
- Slack channels
- meeting collections

## ContextItem

A normalized unit of contextual information.

Suggested fields:

```text
id
user_id
project_id            # nullable
source                 # capture | slack | clickup | github | meeting | diary
source_id              # source-specific durable identifier
type                   # message | task | decision | meeting | commit | issue | note
content
author                 # nullable
timestamp
metadata_json
embedding               # optional
created_at
updated_at
```

## Task

Actionable work accepted out of the inbox. Created only for the actionable
interpretation types — `task` and `blocker`. Accepting a thought, idea, or note
creates no Task: those have no lifecycle, and the Capture plus its accepted
Interpretation already is the note. See ADR-006.

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
due_date                  # nullable, never inferred by a model
source_capture_id         # nullable
source_interpretation_id  # nullable
created_at
updated_at
completed_at              # nullable
```

Both provenance links are nullable and both are kept. `source_capture_id` is the
durable link back to the original thought and survives re-interpretation;
`source_interpretation_id` records which proposal the user actually accepted, and
is null when the user structured the work themselves after dismissing it.

Deliberately not a task manager: no subtasks, dependencies, recurrence, assignees,
or external-system mapping. A ClickUp task is a Context Item, not a Task.

## ContextPacket

A Context Packet may be persisted for reproducibility or assembled ephemerally.

It should record enough provenance to explain which context influenced an Agent Run.

Suggested fields if persisted:

```text
id
agent_run_id
items[]
retrieval_query
created_at
```

## Skill

Suggested fields:

```text
id
name
version
description
instructions
required_capabilities
risk_constraints
```

First-party skills may initially live in code or versioned Markdown rather than the database.

## Implementation status

Capture and Interpretation exist in the backend as of migration `b7c2d914e83a`.
Interpretation is written by the interpreter in
`backend/app/services/interpretation.py`, backed by the Claude API. Without
`ANTHROPIC_API_KEY` set there is no interpreter and captures land in `skipped` —
stored and visible in the inbox, just not structured.

The remaining entities on this page are still conceptual.

Task exists as of migration `c3f81a2b57d9`, per
[ADR-006](../decisions/006-accepted-work-becomes-tasks.md).

The remaining entities on this page are still conceptual.

## AgentRun

Suggested fields:

```text
id
user_id
project_id
skill_id
status
input_summary
model
started_at
completed_at
result_summary
```

## ToolCall

Suggested fields:

```text
id
agent_run_id
tool_name
capability
arguments_redacted
status
started_at
completed_at
```

Sensitive arguments should not be logged in plaintext by default.

## Approval

Suggested fields:

```text
id
user_id
agent_run_id
tool_call_id
capability
decision              # approved | denied | expired
created_at
```

## Existing diary entries

Do not remove the diary domain merely because new Capture models are introduced.

Diary entries represent reflection and historical narrative.

Captures represent raw incoming thought.

They solve different problems.
