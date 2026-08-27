# ADR-004: MCP Is a Capability Layer, Not the MVP

Status: Accepted

## Context

DevDiary eventually needs access to external developer systems including GitHub, ClickUp, Slack, meeting tools, and potentially local development tools.

MCP provides a standardized mechanism for exposing many capabilities to AI systems.

Building general MCP orchestration immediately would significantly expand MVP scope and security complexity.

## Decision

DevDiary will initially implement only the integrations needed to validate the core product loop.

MCP will later become a general capability layer behind DevDiary's integration, capability, and permission abstractions.

The architecture should avoid assumptions that prevent MCP adoption, but MVP features should not depend on arbitrary MCP connectivity.

## Consequences

Positive:

- smaller MVP
- faster validation
- simpler security model
- easier product focus

Negative:

- some early integrations may require dedicated adapters
- general extensibility arrives later
