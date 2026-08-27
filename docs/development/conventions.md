# Development Conventions

## General

Prefer incremental changes over rewrites.

Preserve existing behavior unless a roadmap item explicitly replaces it.

## Documentation

Update docs when:

- product scope changes
- an architectural boundary changes
- a new durable concept is introduced
- an important decision would be surprising to a future developer

Use ADRs for durable architectural choices.

## API design

Prefer explicit resource boundaries for core concepts such as:

- captures
- interpretations
- projects
- context items
- agent runs

Avoid leaking source-specific integration schemas through the entire application.

## AI behavior

AI output should be treated as fallible structured proposals.

Where practical:

- validate structured output
- retain provenance
- make interpretations reversible
- handle model failure without losing user data

## Error handling

Capture persistence should not depend on successful AI processing.

External integration failures should degrade gracefully and identify which source could not be retrieved.

## Security

Do not log secrets.

Do not place external-write authority inside prompt text.

Keep permission checks in application logic.
