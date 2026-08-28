# ADR-007: Rename DevDiary to Arbor

Status: Accepted

## Context

[ADR-005](005-diary-to-workspace.md) expanded the product from a developer journal into a
developer operating workspace. The name did not follow.

"DevDiary" describes an artifact — a diary — and the diary is now one surface among
several. A developer meeting the name would reasonably expect a journaling app, and
would not expect capture, an inbox, AI-proposed structure, tasks, or eventually agents
acting inside a permission model. The name had stopped describing the product and started
misdescribing it, which is worse than a name that is merely bland.

A name is also cheapest to change now. The project is pre-launch, single-developer, and
the only external surfaces are a demo deployment and a repository — both renameable
without breaking anyone's workflow. That cost only grows.

## Decision

The product is named **Arbor**.

The reasoning is the same shape as the product: scattered capture growing into structure,
roots to branches. It also survives the roadmap — a name about growth and structure still
fits when agents act on the work, whereas a name about record-keeping would not.

### What the rename covers

Source, tests, configuration, user-facing copy, and current documentation.

### What it deliberately does not cover

**Accepted ADRs in `docs/decisions/`.** An ADR records what was decided and when. ADR-005
decided something about a product then named DevDiary; rewriting it would invent a history
in which the name was always Arbor, and destroy the very context the record exists to
preserve. ADR-001 through ADR-006 keep the old name in their Context sections. This ADR is
the record of the change instead.

**`docs/archive/`.** Same reasoning. Superseded material describes what was true when it
was written.

The old name appearing in those files is therefore correct, not an oversight. It should
not be "fixed" by a future rename pass.

**Alembic revision identifiers.** Opaque identifiers, not names. Rewriting them would break
the migration chain on any database that has already run them.

## Consequences

Positive:

- The name describes the product again, and keeps describing it as the roadmap advances.
- Done pre-launch, so no user-facing breakage and no redirect to maintain.
- The archive and decision history stay truthful.

Negative:

- The GitHub repository, the Vercel project, the Render service, and the demo domain are
  still named `dev-diary`. Until those are renamed the repository and its deployments
  disagree, and `README.md` documents intended URLs rather than live ones.
- Renaming the repository invalidates existing clones' `origin` remote.
- Search results, links, and any bookmarks pointing at the old demo URL will break when the
  deployment is renamed.
- Anyone reading the ADRs or archive will encounter the old name and needs this record to
  explain why.

## Follow-up work

Sequenced deliberately, because each step changes a live URL:

1. Rename the Vercel project, then update `CORS_ORIGINS` on Render to the new frontend URL.
2. Rename the Render service, then update `VITE_API_URL` on Vercel to the new backend URL.
3. Rename the GitHub repository and update the `origin` remote locally.
4. Update the demo links in `README.md` to the URLs that then exist.

Until step 4, `README.md` should carry the URLs that are actually live.
