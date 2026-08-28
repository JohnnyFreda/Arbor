# Agent Operating Rules

This file defines default rules for AI agents working in the Arbor repository.

## Allowed without approval

- Read files in this repository.
- Search the repository.
- Modify source, tests, and documentation within this repository.
- Run project-local tests, lint, type checks, builds, and formatting tools.
- Add project-local dependencies when required by an approved implementation.
- Create local implementation notes and documentation.

## Ask first

- Major architectural rewrites.
- Database migrations that could destroy or irreversibly transform data.
- CI/CD changes.
- Infrastructure changes.
- External API writes.
- Creating, updating, or deleting external tasks, messages, issues, or resources.
- Installing or removing system packages.
- Changing authentication or secret-management strategy.

## Never without explicit instruction

- Read secrets outside this repository.
- Read or modify `~/.ssh`, `~/.gnupg`, browser profiles, password stores, or unrelated user files.
- Push to remotes.
- Force push.
- Merge pull requests.
- Deploy production.
- Modify production data.
- Perform destructive filesystem operations outside the repository.

## Working modes

### Investigate

Inspect and diagnose. Do not change files unless explicitly asked.

### Work

Modify files inside the repository as needed. Test and verify the result.

### Propose

Prepare a plan, draft, or external action, but do not execute consequential external writes.

## Completion checklist

Before declaring a task complete:

1. Run relevant tests.
2. Run lint/typecheck where available.
3. Review changed files.
4. Check that the implementation matches documented scope.
5. Update docs if behavior or architecture changed.
6. Report any unverified assumptions or remaining risk.
