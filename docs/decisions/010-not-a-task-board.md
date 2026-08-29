# ADR-010: Arbor Is Not a Task Board

Status: Accepted

## Context

Arbor now has Tasks with a status, and Branches with a status. Both are one small
step from the shape of every project management tool: columns, drag handles,
assignees, estimates, sprints, and a user whose main relationship with the product is
keeping the board tidy.

That shape is a local maximum and it is easy to fall into. Each addition is
individually reasonable — a priority field, then a due date, then a filter, then a
board view — and the destination is a tool that costs more attention than it returns.
`product/vision.md` already says Arbor is not primarily a generic todo list, and
`product/user-flows.md` says the dashboard "should help users start work rather than
become another maintenance surface". Neither is specific enough to stop the drift,
because the drift never arrives as "let's build a Jira clone".

The distinction that actually matters is **what the user's main gesture is**. In a
board, it is moving work between states. That is administration: the user maintains a
model of reality, by hand, and the tool's value depends on how diligently they do it.

## Decision

**Arbor's primary interaction is not moving work around.**

Branches move because evidence arrives — a leaf is attached, a capture is sorted, and
later, an agent finishes a job and reports back. Not because someone dragged
something. A branch's liveness is a fact about what happened to it, not a field
somebody remembered to update.

Three consequences follow, and they are the point of writing this down:

**Activity is recorded, not maintained.** A branch tracks when something last happened
to it, separately from when its row was last edited. Editing a title is not activity;
attaching a leaf is. What surfaces on the dashboard is ordered by that, so the branches
that moved are the branches the user sees.

**Status is a small vocabulary, and mostly for closing.** `open | resolved | dropped`
is the whole set, and it stays that. There are no in-progress states, because a state
machine the user hand-cranks is the board this decision exists to avoid.

**One gesture to finish, never a workflow to manage.** Ticking a task done on the
dashboard is inside this line: it is terminal, it takes one action, and it does not
ask the user to model anything. Columns, drag and drop, per-state transitions,
assignees, estimates and sprint planning are all outside it.

### The line, concretely

In:

- Capturing, and sorting the inbox
- Attaching evidence to a branch
- Finishing a task in one gesture
- A dashboard that says what deserves attention today
- A durable record of context, including context that turned out not to matter

Out:

- Board or kanban views, columns, drag and drop
- In-progress or custom statuses, workflow configuration
- Assignees, estimates, story points, sprints, velocity
- Anything whose value depends on the user keeping it up to date

## Consequences

Positive:

- The product has a stated boundary that a specific proposal can be tested against,
  rather than a general preference that loses every individual argument.
- Effort goes into what makes a branch move on its own — integrations, interpretation,
  and eventually agents — rather than into surfaces for managing state by hand.
- The dashboard has one job, which `user-flows.md` already asked for and this makes
  enforceable: align the user, do not accumulate chores.

Negative:

- Some genuinely useful things are now out of scope. A user who wants a board will not
  find one here, and that is a real cost accepted on purpose.
- "Not a task board" is easier to state than to hold. The pressure arrives one
  reasonable field at a time, and this document only helps if it is actually consulted
  when the next one is proposed.
- Deriving liveness from activity means Arbor is only as alive as its integrations. A
  branch fed by nothing looks dead, and correctly so — but that puts the burden on
  sources arriving, not on the user tidying.

## Alternatives considered

**Say nothing and rely on taste.** Rejected. The drift is made of individually
defensible steps, and taste loses those arguments one at a time.

**Remove Task status entirely** so nothing can be moved at all. Rejected as an
overcorrection: a task that cannot be finished is worse than one that can, and
`roadmap/mvp.md` needs blockers and open work to be distinguishable on the dashboard.

**Let branches be closed only automatically**, never by hand. Rejected for now — the
signals to do that well do not exist yet, and a branch the user cannot close is a
branch that nags forever.

## Follow-up work

- Suggesting a branch is resolved, once there are enough signals to do it honestly,
  rather than waiting for the user to notice.
- Attaching still requires the user to know two things are related. Proposing
  attachments is where this decision earns its keep, and is a separate decision.
