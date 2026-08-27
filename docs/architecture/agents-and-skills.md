# Agents and Skills

## Initial approach

Use one capable bounded agent runtime before introducing multi-agent orchestration.

Complexity should be added only when a concrete workflow requires it.

## Agent responsibilities

An agent may:

- interpret a goal
- use a Context Packet
- follow a selected Skill
- invoke allowed tools
- produce suggestions
- propose actions
- verify results when tools permit

## Skills

A Skill defines how an agent should accomplish a repeatable job.

A Skill should describe:

- objective
- required context
- allowed tools or capabilities
- ordered workflow where helpful
- verification expectations
- stop conditions
- actions that require approval

## Example: Debug Issue

```text
Objective:
Diagnose a reported software issue and propose the smallest credible fix.

Workflow:
1. Read the issue and relevant project context.
2. Search related history.
3. Inspect relevant code or changes if available.
4. Form a hypothesis.
5. Verify the hypothesis where practical.
6. Propose a fix.
7. Do not perform external writes without approval.
```

## Example: Process Inbox

```text
Objective:
Reduce unprocessed Captures into useful structured proposals.

Rules:
- preserve original captures
- do not invent deadlines
- avoid turning every thought into a task
- suggest project associations only when confidence is reasonable
- surface ambiguity rather than hiding it
```

## Tool vs Skill

Tool:

> `clickup.search_tasks()`

Skill:

> Search relevant task history, compare it with the current capture, identify duplicates, and summarize the relationship.

Tools provide capabilities.

Skills encode operating procedure.

## Agent modes

### Investigate

Read and diagnose. No changes.

### Work

Modify permitted local state and verify results.

### Propose

Prepare consequential external actions but do not execute them without approval.

## Verification

Agents should not equate plausible output with completed work.

Skills that change state should define verification requirements such as:

- run tests
- check API response
- inspect resulting diff
- re-read created object
- confirm expected state transition
