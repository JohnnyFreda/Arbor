# Terminology

## Capture

An explicit piece of information submitted by the user.

Examples:

- typed brain dump
- dictated note
- quick mobile thought

A Capture preserves the user's original input.

## Interpretation

AI-generated proposed structure derived from a Capture.

Examples:

- classify as task, idea, note, blocker, or thought
- associate with a project
- suggest priority
- suggest next action

## Context Item

A normalized piece of information learned from an external or internal source.

Examples:

- Slack message
- ClickUp task
- meeting decision
- GitHub pull request
- commit
- prior diary entry

A Context Item is not necessarily user-authored and is not the same as a Capture.

## Context Packet

A bounded set of relevant information assembled for an agent operation.

A Context Packet may contain:

- the current Capture
- project information
- related Context Items
- prior decisions
- task state
- selected repository metadata

## Branch

A line of work. "GA F201 refactor", not "Tourify".

Distinct from a Project, which is where work lives rather than what it is about. A
branch may span projects, or exist before it is clear which one it belongs to.

A *git* branch is called a **ref** everywhere in Arbor, following GitHub's own API.
`branch` unqualified always means this. See [ADR-009](../decisions/009-branches-and-leaves.md).

## Leaf

A normalized piece of evidence from an outside system, hanging off a branch — a Slack
message, a pull request, a meeting decision — with a link back to the original.

A Leaf is what this document calls a **Context Item** below. Same concept, renamed for
the model; the older sections keep the old word deliberately.

## Fallen leaf

A leaf, or a capture, that could not be placed on a branch. The inbox holds these and
nothing else: things are sorted on arrival, and the inbox is where that fails rather
than where everything starts. See [ADR-011](../decisions/011-fallen-leaves.md).

## Project

A persistent workspace grouping related captures, tasks, context, activity, and integrations.

## Skill

A reusable workflow that defines how an agent should perform a job.

Examples:

- Debug Issue
- Review PR
- Process Inbox
- Morning Planning
- End-of-Day Review

Skills describe process and constraints.

## Tool

A capability an agent can invoke.

Examples:

- search ClickUp
- read Slack thread
- inspect GitHub PR
- create task

Tools describe what an agent can access or do.

## Agent Run

One bounded execution of an agent using a goal, context packet, skill, tools, and permissions.

## Permission Policy

Rules that determine which capabilities are always allowed, require approval, or are denied.
