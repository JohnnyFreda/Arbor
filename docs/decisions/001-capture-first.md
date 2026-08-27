# ADR-001: Capture First

Status: Accepted

## Context

Developers frequently have useful thoughts that are not yet well-formed tasks.

Traditional productivity systems add friction by requiring metadata at capture time.

DevDiary's strongest differentiated interaction is converting unstructured human thought into proposed structure afterward.

## Decision

The primary input model will be capture-first.

Users can save unstructured input without selecting project, type, priority, tags, or deadlines.

AI interpretation happens after the raw Capture has been stored.

## Consequences

Positive:

- lower capture friction
- better mobile experience
- supports dictation naturally
- preserves ideas before they are fully structured
- gives AI a clear normalization role

Negative:

- inbox processing becomes necessary
- classification errors must be reviewable
- data model must distinguish raw input from derived structure
