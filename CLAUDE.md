# Arbor

Arbor is a developer operating workspace that turns unstructured human thought and fragmented development context into structured, actionable work.

It grew out of a developer journal, and that v1 code is what currently ships: entries,
projects, tags, calendar, insights, and auth. The workspace concepts described in `docs/`
are largely not implemented yet. Inspect the existing code before assuming a concept exists,
and do not remove the diary domain — it is retained deliberately. See
`docs/decisions/005-diary-to-workspace.md`.

Superseded documents live in `docs/archive/`. They are historical reference, not authority.

## Before implementing features

Read:

- `docs/product/vision.md`
- `docs/roadmap/mvp.md`
- `docs/architecture/overview.md`

For agent, context, integration, or permission work also read:

- `docs/architecture/context-engine.md`
- `docs/architecture/agents-and-skills.md`
- `docs/architecture/integrations.md`
- `docs/architecture/permissions.md`

For decisions that affect architecture or scope, read relevant ADRs in `docs/decisions/`.
`005-diary-to-workspace.md` explains why the product scope changed and is useful background
for the other ADRs, which all assume it.

## Product principles

- Capture should be effortless.
- Preserve the user's original input.
- Do not require users to manually structure information the system can safely infer.
- AI interpretations are proposals, not authoritative state.
- Context and action are separate concerns.
- Prefer high autonomy inside a small blast radius.
- Consequential external actions should require explicit user approval.
- Do not silently expand MVP scope to support future architecture.

## Engineering workflow

Before coding:

1. Identify the relevant roadmap item.
2. Read applicable product and architecture docs.
3. Read relevant ADRs.
4. Inspect the existing implementation before proposing replacements.
5. Flag significant architectural deviations before implementing them.

Before finishing:

1. Run relevant tests.
2. Run lint/typecheck.
3. Review the diff.
4. Update documentation when behavior, scope, or architecture changed.
5. Add an ADR for durable architectural decisions.
6. State anything that was not verified.

## Agent behavior

Prefer useful execution over long explanations.

Distinguish clearly between:

- facts
- assumptions
- recommendations

Do not claim work was completed unless it was actually verified.
