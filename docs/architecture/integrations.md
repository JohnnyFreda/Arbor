# Integrations

## Principle

Integrations are sources of context and capabilities.

They should not automatically imply permission to act.

## Integration maturity model

### Phase 1: Read-only context

Examples:

- read GitHub activity
- search ClickUp tasks
- read Slack threads
- read meeting summaries

### Phase 2: Proposed actions

Examples:

- draft a ClickUp task
- draft a Slack reply
- prepare a branch or PR description

### Phase 3: Permission-gated writes

Examples:

- create task
- create branch
- open PR
- send message

### Phase 4: High-risk actions

Examples:

- merge
- deploy
- modify production

These should remain heavily restricted or unsupported unless there is a compelling product reason.

## GitHub

First external developer integration should likely be GitHub because it directly supports the developer-dashboard use case.

Start read-only.

Potential resources:

- repositories
- commits
- issues
- pull requests
- activity

## ClickUp

Use as structured work context.

Start read-only.

Potential resources:

- tasks
- status
- descriptions
- comments
- documents
- due dates

## Slack

Use primarily as searchable decision and discussion context.

Start read-only.

Avoid broad ingestion when a scoped search or channel/project mapping is sufficient.

## Meeting summary providers

Integrate providers that expose useful machine-readable meeting summaries or transcripts.

Normalize:

- decisions
- action items
- questions
- constraints
- project references

## MCP

MCP is a future capability layer.

DevDiary should be able to map MCP-exposed tools into its internal capability and permission model.

Do not let arbitrary MCP tool descriptions bypass DevDiary's own permission policies.

## Source mapping

A Project may eventually map to selected external sources, such as:

```text
Project: DevDiary
- GitHub: johnnyfreda/devdiary
- ClickUp: DevDiary list
- Slack: #devdiary
- Meetings: DevDiary project collection
```

Explicit project/source mapping can improve retrieval quality and privacy.
