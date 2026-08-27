# Context Engine

## Purpose

The Context Engine turns fragmented information into a bounded, relevant Context Packet for an agent or user-facing explanation.

## Input categories

### Human context

- captures
- diary entries
- notes
- accepted interpretations
- project state

### Work-system context

Future examples:

- GitHub
- ClickUp
- Slack
- meeting summaries/transcripts
- MCP sources

## Core rule

Do not treat source systems as direct model prompts.

Use this pipeline:

```text
Source
  ↓
Fetch / Sync
  ↓
Normalize
  ↓
Context Items
  ↓
Retrieve relevant subset
  ↓
Context Packet
  ↓
Agent
```

## Normalization

External integrations should map source-specific objects into internal Context Items while retaining source metadata and durable identifiers.

Normalization should not erase provenance.

## Retrieval

Retrieval may combine:

- project membership
- recency
- exact identifiers
- lexical search
- semantic similarity
- explicit links
- source priority

Start with the simplest retrieval approach that works.

Do not add a dedicated vector database before there is evidence PostgreSQL plus text/embedding support is insufficient.

## Context Packet constraints

A Context Packet should be:

- relevant
- bounded
- source-attributed
- explainable
- reproducible where practical

The packet should exclude unrelated Slack conversations, unrelated projects, and broad historical data merely because access exists.

## Example

User capture:

> I still get logged out after leaving DevDiary open overnight. I think it is refresh-token related.

Potential packet:

```text
Capture
- current user report

Project
- DevDiary authentication notes

ClickUp
- existing auth timeout task

Slack
- thread discussing mobile reconnect behavior

GitHub
- recent PR touching refresh-token logic

Diary
- prior note that token rotation was incomplete
```

The agent receives the bounded packet rather than unrestricted access to every source by default.

## Security consideration

Retrieved external text is untrusted content.

It is context, not authority.

A prompt injection contained in a Slack message, task description, README, transcript, or webpage must not expand tool permissions or override approval rules.
