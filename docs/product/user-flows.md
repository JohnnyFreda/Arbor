# Primary User Flows

## 1. Quick capture

1. User opens DevDiary on desktop, mobile, PWA, or future widget.
2. User types or dictates an unstructured thought.
3. User submits without selecting metadata.
4. DevDiary stores the original Capture immediately.
5. AI optionally proposes structure.
6. User may accept, edit, or dismiss the interpretation later.

The capture operation should succeed even if AI interpretation fails.

## 2. Process inbox

1. User opens the Inbox.
2. DevDiary groups unprocessed captures.
3. AI suggests classifications and project associations.
4. User can accept all, review individually, edit, or dismiss.
5. Accepted interpretations become structured work or reference state.

## 3. Dashboard / Today

The Today view should surface a compact representation of:

- important outcomes
- active projects
- blockers
- inbox state
- recent activity
- agent suggestions

The dashboard should help users start work rather than become another maintenance surface.

## 4. Project context

1. User opens a project.
2. DevDiary shows current status and relevant captures.
3. Connected sources contribute relevant context.
4. DevDiary may surface unresolved questions, decisions, blockers, and next actions.

## 5. Agent investigation

1. User selects or creates a problem.
2. DevDiary builds a Context Packet.
3. Agent uses a suitable Skill.
4. Read-only tools are used as permitted.
5. Agent returns a concise diagnosis or proposal.
6. User may approve a follow-up action.

## 6. End-of-day review

1. DevDiary gathers the day's captures, completed items, and relevant project activity.
2. AI proposes a concise diary entry.
3. User reviews or edits it.
4. User saves the final entry.

The review should include unfinished work and a suggested first action for the next session.

## 7. Future external action

1. Agent proposes an external action.
2. DevDiary shows the target system and blast-radius category.
3. Permission policy is evaluated.
4. If approval is required, the user explicitly approves.
5. DevDiary executes the action and records the result.
