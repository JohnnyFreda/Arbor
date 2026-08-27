# Definition of Done

A feature is not complete merely because the UI renders or the model returns plausible output.

## Required

- behavior matches the relevant roadmap scope
- relevant automated tests pass
- lint/typecheck pass where applicable
- error states are handled
- changed behavior is documented when necessary
- no known secrets are logged or exposed
- permission boundaries are respected

## For AI features

Also verify:

- original user data is not lost when model processing fails
- structured outputs are validated
- confidence or uncertainty is surfaced where useful
- AI suggestions remain reversible when they are not authoritative

## For integrations

Also verify:

- source authentication errors are handled
- source identifiers/provenance are retained
- read-only integrations do not accidentally expose write operations
- data is scoped to the intended user/project

## For external actions

Also verify:

- capability class is correct
- permission policy is checked outside the prompt
- user approval is captured when required
- result state is verified after execution
- action is auditable without storing secrets

## Before merge

Review the final diff and ask:

1. Did this solve the documented problem?
2. Did scope expand unnecessarily?
3. Did this create a durable architectural decision that needs an ADR?
4. Could a future agent understand why this code exists from the docs?
