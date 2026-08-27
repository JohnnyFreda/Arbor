# Fast Follow

These features should follow only after the core capture and organization loop feels useful.

## GitHub integration

Start read-only.

Potential context:

- repositories
- commits
- issues
- pull requests
- activity

Projects may link to one or more GitHub repositories.

Primary value:

- project state
- recent activity
- decision trail
- context for agent investigation

## ClickUp integration

Start read-only.

Potential context:

- assigned tasks
- descriptions
- comments
- status
- relevant docs
- due dates

Primary value:

- connect personal thoughts to existing tracked work
- identify duplicates or existing tasks
- provide task history to agents

## Context retrieval

Normalize integration data into Context Items.

Retrieve only relevant context for each operation rather than sending entire source histories to the model.

## Dedicated voice capture

Move beyond reliance on OS dictation.

Potential flow:

> Voice → Transcription → Capture → Interpretation

Requirements:

- preserve transcript
- make capture reliable even if interpretation fails
- support quick one-handed use

## Morning planning

Generate a proposed daily plan from:

- outstanding work
- projects
- captures
- deadlines
- relevant external context

Optimize for a small number of meaningful outcomes rather than task count.

## Better session handoff

At the end of a work session, summarize:

- what changed
- what remains incomplete
- where work stopped
- first recommended action for the next session
