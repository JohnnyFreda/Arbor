# Architecture Overview

## Current direction

Arbor should evolve incrementally from its existing React/TypeScript frontend, FastAPI/Python backend, and PostgreSQL persistence rather than being rewritten as a new platform.

The architecture should support the MVP directly while leaving room for future context sources, skills, and MCP tools.

## Conceptual architecture

```text
Human Capture
    |
    v
Capture Service ------> PostgreSQL
    |
    v
Interpretation
    |
    +------> structured user state
    |
    v
Context Retrieval <----- Context Items <----- Integrations
    |
    v
Context Packet
    |
    v
Skill + Agent Runtime
    |
    +------> Suggestion
    |
    +------> Proposed Action
                 |
                 v
          Permission Check
                 |
                 v
              Execute
```

## Architectural priorities

1. Capture must be reliable and independent from AI success.
2. Raw user input and AI interpretation must remain distinct.
3. External context should be normalized behind internal interfaces.
4. Retrieval should happen before agent invocation.
5. Permission evaluation should happen before consequential actions.
6. Future MCP support should fit behind the tool/integration layer.
7. Avoid multi-agent complexity until one bounded agent loop proves insufficient.

## Suggested bounded modules

### Capture

Owns creation and retrieval of user-submitted thoughts.

### Interpretation

Owns classification and proposed structure.

### Projects

Owns persistent project grouping and state.

### Context

Owns normalized Context Items, retrieval, and Context Packet assembly.

### Integrations

Owns source-specific adapters for GitHub, ClickUp, Slack, meeting providers, and future MCP sources.

### Agent Runtime

Owns bounded agent executions, selected skills, tool exposure, and execution records.

### Permissions

Owns capability classification, policy evaluation, approval state, and external-write gating.

## Non-goals for early architecture

Do not introduce unless necessary:

- distributed agent workers
- event buses
- microservices
- vector databases separate from PostgreSQL without evidence they are needed
- workflow DSLs
- plugin marketplaces
- arbitrary remote code execution
