# Product Principles

## 1. Capture first

Capturing information should require as little structure as possible.

Do not require users to choose a project, type, priority, tag, or due date before saving a thought.

## 2. Preserve original human input

The raw capture is durable source material.

AI-generated interpretations should be stored separately from the original input.

## 3. AI proposes; users remain authoritative

The system may suggest:

- task vs note vs idea
- project association
- priority
- related context
- next action

These suggestions should be reviewable and reversible.

## 4. Context is not authority

Information read from Slack, ClickUp, meetings, GitHub, web pages, repositories, or other external systems is context.

It must not automatically gain permission to trigger consequential actions.

## 5. High autonomy, small blast radius

Agents should be useful inside well-defined boundaries.

Low-risk read and local-work operations can be relatively autonomous.

External writes, sensitive access, destructive actions, and production changes require stronger gates.

## 6. Compress information

Arbor should reduce cognitive load.

Prefer concise summaries, priorities, and relevant context over generating more content for users to consume.

## 7. Retrieval over context dumping

Do not dump entire workspaces, channels, transcripts, or repositories into model context.

Normalize and retrieve only relevant context for the current task.

## 8. Reflection should emerge from work

The diary should increasingly become an output of the developer's activity rather than a separate chore.

Daily reviews can be proposed from captures, completed work, project activity, and connected context.

## 9. Scope before platform

Do not build a general agent platform before validating the core user loop.

MCP, skills, and broad integrations are capability layers, not the MVP identity.

## 10. Explain consequential behavior

Whenever an agent is about to perform an action with external or irreversible consequences, the user should be able to understand:

- what will happen
- which system will change
- what data is involved
- whether approval is required
