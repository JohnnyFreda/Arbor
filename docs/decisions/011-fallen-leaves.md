# ADR-011: The Inbox Is for Fallen Leaves

Status: Accepted

## Context

The inbox today holds unprocessed captures. That works because the user wrote every
item in it: the queue is exactly as long as the number of thoughts they had.

GitHub is about to change that. A repository produces hundreds of commits, and every
future source — Slack, ClickUp, meetings, and eventually agents reporting work back —
produces more. An inbox that everything lands in stops being a review surface and
becomes a queue somebody else fills, which the user is then obliged to empty.

That is the failure [ADR-010](010-not-a-task-board.md) rules out, arriving through a
different door. A board at least does not generate its own rows.

## Decision

**Things are sorted on arrival. The inbox is where they land when that fails.**

A leaf that finds its branch is attached to it and never enters the inbox. One that
does not has fallen, and the inbox is the ground beneath the tree — a last resort,
not the front door.

The rule is the same for everything, whatever produced it:

- **Captures.** After interpretation, match the capture against existing branches. A
  confident match attaches it. Anything else falls.
- **Leaves.** Matched at sync time, by the same rule. A commit whose message names
  something a branch is about belongs on that branch without being filed there.
- **Agent output, later.** An agent that finishes a job reports back onto the branch
  it was working on. It already knows; nothing should have to be sorted afterwards.

### Falling is cheaper than misfiling

The matcher stays shy, and abstains on weak evidence — the same posture already taken
for project association in [ADR-008](008-local-interpretation.md).

A fallen leaf costs the user one glance at the inbox. A misfiled one is worse than
either: it is wrong somewhere they are not looking, it corrupts the record a branch
exists to be, and correcting it is maintenance — the thing this product does not ask
for. When the evidence is thin, drop it on the ground.

### The inbox is clearable without filing

Not everything belongs to a branch, and most things do not. "The coffee machine is
broken again" has no branch and never will. An item must be dismissable from the
inbox without being attached to something, or the inbox becomes a nag that demands
every stray thought be filed somewhere it does not fit.

### It should shrink as the tree grows

This is the property that makes the design worth having. The more branches exist, the
more arriving evidence matches one, and the less reaches the ground. An inbox that
gets quieter as the product is used more is the opposite of every queue that has ever
been abandoned.

If it does not behave that way in practice, the matching is wrong and this decision
should be revisited rather than defended.

## Consequences

Positive:

- Volume from integrations lands on branches instead of in a queue, so connecting a
  second source makes Arbor more useful rather than more demanding.
- One rule covers captures, leaves and agent output, so each new source inherits the
  behaviour instead of inventing its own.
- The inbox keeps a clear job: what could not be placed, and nothing else.

Negative:

- The inbox becomes heterogeneous. It holds captures needing a decision *and* leaves
  needing a home, which are different problems shown in one place, and the interface
  has to make that legible rather than hiding it.
- Automatic attachment is the system acting without being asked. It is bounded by
  being deterministic, visible and reversible — detaching removes the link and
  nothing else — but it is still a departure from Principle 3's "AI proposes, user
  remains authoritative", and is accepted knowingly for a match that is a string
  comparison rather than a judgement.
- A shy matcher means some things fall that should not have. That is the intended
  trade and it will still be irritating.

## Alternatives considered

**One inbox everything lands in, sorted by hand.** The current shape, extended.
Rejected: it does not survive the first integration, and it turns the user into a
filing clerk for a queue they did not fill.

**A separate inbox per source.** Rejected as multiplying the problem. Three quiet
queues are worse than one, because none of them is ever obviously done.

**Sync everything but surface nothing unmatched.** Tempting, and it keeps the inbox
empty. Rejected because silently discarding evidence the user might have wanted is a
worse failure than showing them a short list, and it hides a broken matcher instead
of exposing it.

## Follow-up work

- The current inbox shows captures only, and its rule is "undecided". It needs to
  become "unplaced", covering leaves too.
- Whether an item can need both a decision and a branch, and how that reads in one
  list, is an interface question this decision does not answer.
- Matching a capture against branches reuses the project matcher's approach but not
  its code; branch titles are freer text than project names and may need different
  scoring.
