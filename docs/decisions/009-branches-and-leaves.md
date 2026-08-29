# ADR-009: Branches and Leaves

Status: Accepted

## Context

The MVP is complete. Everything Arbor holds is either something the user typed — a
Capture, a Task, a diary Entry — or a Project grouping those together.

Project is the only grouping there is, and it is coarse. "Arbor" and "Tourify" are
where work lives, not what the work is about. A refactor that runs for three weeks,
touches two repositories, and was argued out in Slack before anyone opened an editor
has nowhere to live except as scattered rows that happen to share a project id.

`roadmap/future.md` already describes the capability this is missing, under Decision
history: reconstruct the history of a feature using captures, Slack, meetings,
ClickUp, GitHub, and diary entries, to answer "why did we build this this way".

But it describes it as a **query** — something reconstructed on demand. That is
expensive, lossy, and only ever as good as that day's retrieval. The same question
asked twice can get two different answers, and nothing improves between them.

A durable grouping accumulates instead. Every source attached to it makes the answer
permanently better, and the work of noticing that two things belong together is done
once, by the person who already knew.

## Decision

Two new entities, named for the product.

### Branch

A line of work. "GA F201 refactor", not "Tourify".

```text
id
user_id
project_id          # nullable
title
summary             # nullable
status              # open | resolved | dropped
created_at
updated_at
```

`project_id` is nullable on purpose. A branch may span two repositories, or start
before it is clear where it belongs. Forcing a project at creation is the same
friction ADR-001 rejected at capture time, one level up.

### Leaf

A normalized piece of evidence hanging off a branch — a Slack message, a ClickUp
task, a meeting decision, a pull request.

```text
id
user_id
source              # github | slack | clickup | meeting | web
source_id           # durable identifier in that system
type                # commit | pull_request | issue | message | task | decision | note
title               # nullable
content
author              # nullable
url                 # link back to the source; see below
occurred_at
metadata_json
created_at
```

**A Leaf is what ADR-002 and the architecture documents call a Context Item.** Same
concept, renamed for the metaphor. Those documents keep the old name, as ADR-007
established for the product rename: they record what was decided when, and rewriting
them would invent a history where it was always called a Leaf.

### The link back to the source lives on the leaf

Following a leaf to the thing it came from — the actual Slack message, the actual pull
request — is the payoff for a branch having accumulated anything. It matters in the
interface, and it is still just the `url` column above.

It gets no name and no entity of its own. Naming it would invite a table for it, and
one leaf has one source. If that ever stops being true — a meeting with both a
transcript and a recording — it becomes a table then, on evidence rather than on
symmetry.

### Normalize what is foreign, link what is native

`architecture/data-model.md` lists `capture` and `diary` among Context Item sources,
which implies the user's own words get normalized copies. They should not.

Slack and GitHub need normalizing because their shapes are alien to Arbor. Captures,
Tasks and Entries are already in the right shape, and copying them into leaves would
store the user's own words twice — two records that can drift, against Principle 2's
instruction to preserve original human input.

So a branch links to leaves *and* to native rows, by real foreign keys, through one
small join table per kind. More tables, no duplication, and the raw capture stays the
single record it is supposed to be.

### Git branches are refs

The one real cost of this naming. Arbor is about to read GitHub, where "branch" is
already taken.

GitHub's own API does not use the word: a pull request has `head.ref` and `base.ref`.
Arbor follows it. **Anywhere a git branch appears — code, schema, UI copy, docs — it
is a ref.** `branch` unqualified always means the Arbor entity.

## Consequences

Positive:

- The product's structure matches its name, and the interface has a visual language
  that falls out of the data model rather than being decorated onto it.
- Decision history stops being a query that re-derives an answer and becomes a record
  that improves every time something is attached.
- GitHub integration has somewhere to land. Without this, pull requests would arrive
  as a standalone feature needing retrofitting the moment a second source existed.
- A branch spanning two projects is expressible, which a project-only model cannot do.

Negative:

- "Branch" is ambiguous in a tool that reads git. The ref convention above contains it
  but does not eliminate it; conversation between people is not bound by a naming rule.
- Leaves are a second name for Context Items, so the older architecture documents and
  ADR-002 use a word the code does not. That is recorded, not accidental, and should
  not be "fixed" by a later rename pass.
- More entities to keep coherent, and a per-kind join table is more schema than a
  single polymorphic one.
- Attaching things is manual to begin with. A branch nobody feeds is an empty branch,
  and the feature is worth nothing until attaching is nearly free.

## Alternatives considered

**Thread, or Topic.** Both avoid the git collision, and Thread is how developers
already talk about a line of work. Rejected because Branch and Leaf together give the
model a coherent visual language and Thread and Leaf do not, and because the collision
is containable by a naming rule that GitHub's own API already follows.

**Leaving decision history as a query.** It is what `future.md` currently describes and
it needs no schema. Rejected: an answer that is recomputed each time cannot get better,
and the expensive part is knowing which scattered rows are related, which the user
already knows at the moment they attach one.

**Normalizing everything into leaves, including captures.** One uniform join table and
one retrieval path. Rejected because it duplicates the user's own words, and Principle 2
makes the raw capture the durable record. Foreign data earns normalization; native data
does not.

**Giving the source link its own name and entity.** The metaphor extends naturally to
a third thing, and that was the reason to be suspicious of it. One leaf has one source
link; a name would have been decoration that later justified a table.

## Follow-up work

- Attaching a capture or a leaf to a branch has to be nearly frictionless, or branches
  stay empty. Worth designing before building the entities.
- Whether a branch can be suggested rather than only created by hand is open, and is a
  separate decision from this one.
