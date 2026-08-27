# ADR-002: Captures and Context Items Are Distinct

Status: Accepted

## Context

DevDiary will eventually receive information from users and external systems.

A developer saying "I think auth refresh is broken" is fundamentally different from a Slack message, ClickUp task, or GitHub pull request retrieved as context.

Conflating these concepts would make provenance, permissions, and UX harder to reason about.

## Decision

Model explicit user input as Captures.

Model normalized internal or external evidence as Context Items.

A Capture may later produce structured work and may also be represented in retrieval, but the original Capture remains a distinct source record.

## Consequences

Positive:

- clear provenance
- easier trust model
- easier explanation of AI reasoning
- cleaner integration architecture
- supports preservation of raw user input

Negative:

- additional domain concepts
- some data may require links between Capture, Interpretation, and Context Item records
