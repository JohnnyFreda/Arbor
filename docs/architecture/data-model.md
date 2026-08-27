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
processing_status
```

The original `content` should remain immutable or versioned rather than silently overwritten by AI.

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
