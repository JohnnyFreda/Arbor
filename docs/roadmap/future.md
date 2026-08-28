# Future Direction

## MCP capability layer

Allow users to connect MCP servers and expose their tools to Arbor under a common permission model.

MCP should expand capability without becoming the product's identity.

## Slack context

Use relevant messages and threads as project memory.

Potential uses:

- retrieve prior discussions
- connect decisions to implementation
- surface unresolved questions
- explain why work exists

Start read-only.

## Meeting intelligence

Integrate AI meeting-summary or transcript systems.

Normalize useful outputs such as:

- decisions
- action items
- open questions
- technical constraints
- ownership

## Skills

Support reusable workflows such as:

- Debug Issue
- Review PR
- Plan Feature
- Investigate Production Error
- Prepare Release
- Process Inbox
- Morning Planning
- End-of-Day Review
- Meeting Preparation

Skills define how work is performed.

Tools define what the agent can access.

## Permission system

Classify capabilities by blast radius.

Candidate levels:

- READ
- LOCAL_WRITE
- EXTERNAL_WRITE
- SENSITIVE
- PRODUCTION

Policies can map capabilities to:

- Always Allow
- Ask First
- Never Allow

## Decision history

Reconstruct the history of a feature or decision using:

- user captures
- Slack
- meetings
- ClickUp
- GitHub
- agent activity
- diary entries

This should answer questions such as:

- Why did we build this this way?
- Who raised this constraint?
- What changed after the meeting?
- Where did I leave off?

## Mobile expansion

Explore:

- PWA installability
- home-screen quick capture
- mobile widgets
- share sheet
- dedicated voice capture
- native app only if platform constraints justify it

## Agent actions

After read-only context is trusted, gradually support controlled actions such as:

- create ClickUp task
- create GitHub branch
- open pull request
- draft Slack response

Consequential actions should remain permission-gated.

## Community skills

A future ecosystem may allow users to create and share skills.

Do not pursue a marketplace until first-party skills and permission boundaries are mature.
