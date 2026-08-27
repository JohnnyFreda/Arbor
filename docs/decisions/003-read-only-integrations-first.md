# ADR-003: External Integrations Start Read-Only

Status: Accepted

## Context

GitHub, ClickUp, Slack, and meeting systems can provide valuable project context.

External writes introduce substantially more security, trust, UX, and failure-handling complexity than reads.

The core product value can be tested without allowing agents to modify external systems.

## Decision

New external integrations will begin as read-only context sources.

External write capabilities should be introduced only after the related read use case is useful and the permission model is mature enough to make side effects understandable.

## Consequences

Positive:

- smaller blast radius
- faster implementation
- simpler onboarding and permissions
- easier debugging
- lower trust barrier

Negative:

- some workflows remain partially manual
- users may need to copy or approve suggested changes in early versions
