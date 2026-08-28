# MVP

## Goal

Validate that developers find value in the loop:

> Capture → Interpret → Organize → Suggest → Reflect

The MVP should prove the interaction model before Arbor becomes a general agent platform.

## Included

### Universal Capture

Users can quickly submit unstructured thoughts.

Requirements:

- desktop-friendly
- mobile-friendly
- minimal interaction
- works well with normal mobile OS dictation
- original input is preserved
- capture does not require classification first

### Inbox

Unprocessed captures live in a simple inbox.

Users can review AI-proposed interpretations and choose to accept, edit, or dismiss them.

### AI Interpretation

The system may classify captures as:

- thought
- task
- idea
- note
- blocker

It may suggest:

- project association
- priority
- next action
- related existing items

Interpretations are proposals, not authoritative state.

### Developer Dashboard

The primary dashboard should emphasize:

- today's important outcomes
- inbox state
- active projects
- blockers
- recent activity
- concise agent suggestions

### Projects

Projects provide persistent organization for captures, tasks, notes, and future external context.

### Daily Review

Arbor can generate a proposed end-of-day summary from:

- captures
- completed work
- project state
- user notes

The user reviews the proposed diary entry before saving it.

### Existing Arbor capabilities

Preserve and integrate useful existing functionality where practical, including:

- diary entries
- project organization
- tags where still valuable
- calendar/history views
- progress/streak data where it supports reflection rather than gamified noise

## Explicitly not MVP

- arbitrary MCP servers
- Slack integration
- meeting transcript integration
- autonomous external writes
- multi-agent orchestration
- skill marketplace
- workflow builder
- production deployment agents
- broad enterprise permissions system
- native mobile application

## MVP success criteria

The MVP is successful if a developer can:

1. Capture thoughts faster than manually creating structured tasks.
2. Trust the system not to lose or rewrite the original thought.
3. Get useful proposed organization with minimal cleanup.
4. Open the dashboard and understand what deserves attention.
5. End a work session with useful persistent context for the next session.
