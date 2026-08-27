# Testing Strategy

## Priorities

Testing should focus first on the boundaries where trust can break:

- preserving raw captures
- AI interpretation validation
- project association behavior
- external context normalization
- permission enforcement
- external action approval

## Capture tests

Verify:

- a Capture is stored even if AI interpretation fails
- original content is preserved
- duplicate submissions are handled intentionally
- mobile-sized requests use the same persistence behavior as desktop

## Interpretation tests

Verify:

- only supported types are accepted
- invalid structured model output is rejected or repaired safely
- user edits override model proposals
- dismissed proposals do not become authoritative state

## Context tests

Verify:

- source provenance is preserved
- project scoping is respected
- unrelated context is not included in retrieval when filters should exclude it
- malformed external content cannot alter permission rules

## Permission tests

Verify:

- READ tools work when allowed
- EXTERNAL_WRITE tools cannot run when approval is required but absent
- denied capabilities remain denied even when prompt/context asks otherwise
- approval applies only to the intended action scope

## Agent-run tests

Where possible, test deterministic boundaries around the model rather than only snapshotting free-form output.

Examples:

- tool exposure
- context packet contents
- schema validation
- permission evaluation
- action execution state machine
