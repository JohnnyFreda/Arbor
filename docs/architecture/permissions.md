# Permissions and Guardrails

## Goal

Make agents useful without giving them unnecessary authority.

The preferred principle is:

> High autonomy inside a small blast radius.

## Capability classes

### READ

Examples:

- read project state
- search Slack
- inspect GitHub issues
- read ClickUp tasks

Default posture: broadly allowed when the source has been explicitly connected and scoped.

### LOCAL_WRITE

Examples:

- update Arbor internal suggestions
- modify permitted local project files in a future local agent environment

Default posture: allowed within well-defined workspace boundaries.

### EXTERNAL_WRITE

Examples:

- create ClickUp task
- send Slack message
- open GitHub PR
- change external calendar state

Default posture: ask first.

### SENSITIVE

Examples:

- secrets
- credentials
- private keys
- broad account settings

Default posture: deny unless a narrowly defined feature explicitly requires access.

### PRODUCTION

Examples:

- deploy
- merge to protected branch
- modify production database
- change infrastructure

Default posture: deny or require strong explicit approval.

## Policy states

Capabilities may map to:

- Always Allow
- Ask First
- Never Allow

## Approval UX

Before an approval, show:

- proposed action
- target system
- relevant object or destination
- blast-radius category
- significant side effects

Avoid vague confirmations such as "Allow agent?"

## Prompt injection

External content must never be able to change permission state.

Examples of untrusted content include:

- Slack messages
- task descriptions
- meeting transcripts
- repository files
- issue bodies
- webpages

Tool permission must come from Arbor policy, not from text inside retrieved context.

## Secrets

Prefer structural isolation over behavioral instructions.

If an agent does not need a credential, it should not be given access to it.

## Auditability

Future external tool calls should record:

- agent run
- capability
- target system
- approval decision if applicable
- success/failure

Avoid logging secret values.
