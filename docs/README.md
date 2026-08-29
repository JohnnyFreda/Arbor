# Arbor Documentation

This directory is the source of truth for product intent, roadmap, architecture, and durable engineering decisions.

Start with `product/vision.md`, then `roadmap/mvp.md` for the current boundary.

## Product

- `product/vision.md` — what Arbor is and why it exists
- `product/principles.md` — product and UX rules
- `product/terminology.md` — canonical language and domain concepts
- `product/user-flows.md` — primary user journeys

## Roadmap

- `roadmap/mvp.md` — current product boundary
- `roadmap/fast-follow.md` — next capabilities after MVP validation
- `roadmap/future.md` — longer-term agent platform direction

## Architecture

- `architecture/overview.md`
- `architecture/data-model.md`
- `architecture/context-engine.md`
- `architecture/agents-and-skills.md`
- `architecture/integrations.md`
- `architecture/permissions.md`

## Decisions

Architecture Decision Records (ADRs) live in `decisions/`.

Use an ADR when a decision is likely to matter months later and a future developer or agent could reasonably ask, "Why was this built this way?"

- `decisions/005-diary-to-workspace.md` — why Arbor expanded beyond a journal. Read this first for background.
- `decisions/006-accepted-work-becomes-tasks.md` — where accepted interpretations land.
- `decisions/007-rename-to-arbor.md` — why the product is called Arbor, and why the ADRs and archive still say DevDiary.
- `decisions/008-local-interpretation.md` — interpretation must be able to run locally, with the measurements behind it.
- `decisions/009-branches-and-leaves.md` — grouping work into branches, with evidence as leaves.
- `decisions/010-not-a-task-board.md` — the boundary. Branches move because evidence arrives, not because someone maintains them.
- `decisions/011-fallen-leaves.md` — things are sorted on arrival; the inbox is where that fails.

## Development

- `development/conventions.md`
- `development/testing.md`
- `development/definition-of-done.md`
- `development/testing-looking-ahead.md` — manual test steps for the diary "Looking Ahead" feature

## Archive

Superseded documents live in `archive/` for historical reference only. They are not authoritative.
