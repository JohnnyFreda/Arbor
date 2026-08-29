# ADR-012: GitHub Access Uses a Per-User Personal Access Token

Status: Accepted

## Context

GitHub is Arbor's first external integration. [ADR-003](003-read-only-integrations-first.md)
says it starts read-only, and `architecture/permissions.md` puts credentials in the
SENSITIVE class: denied unless a narrowly defined feature requires them, and protected
by structural isolation rather than by instructions.

A GitHub App would be the right answer for a product with real users. It is also
weeks of work — registration, installation flow, webhook endpoint, token exchange and
refresh — for a single-developer tool that does not yet know whether the integration
is worth having.

## Decision

A **Personal Access Token**, stored per user, encrypted at rest.

### Per user, not one token in the environment

A single token in an environment variable is simpler and keeps the secret out of the
database entirely. It is also the wrong shape here, and dangerously so.

Arbor has a shared guest account. Its address and password are published in the
README so anyone can try the demo. If GitHub access came from one server-side token,
every visitor to that account would inherit the owner's GitHub access and could pull
private repositories into a shared, public workspace with one click.

So credentials belong to a user, and **the guest account cannot hold one**. Connecting
a credential is refused for it outright, not merely left unconfigured — the demo
account is not a place where a mistake should be possible.

### Encrypted at rest, and write-only

The token is encrypted with Fernet before it is stored, using a key supplied as
`CREDENTIAL_ENCRYPTION_KEY`. `cryptography` is already present via
`python-jose[cryptography]`, so this adds no dependency.

Without that key, connecting a credential fails rather than falling back to plaintext.
Failing closed is the point: a misconfigured deployment must not silently start
storing secrets in the clear, and "it worked" is otherwise indistinguishable from
"it worked badly".

The token is never returned by the API and never logged. A connection can be created,
tested, and deleted; it cannot be read back. What the API exposes is metadata — that a
connection exists, which account it belongs to, when it was last used.

Encryption at rest protects against a database dump, which is the realistic exposure
for a hosted Postgres instance. It does not protect against a compromised host, where
the key is also present, and this document should not be read as claiming otherwise.

### Read-only is enforced by the token, not by our code

The scopes Arbor asks for are read-only: repository metadata, contents, pull requests
and issues. A fine-grained token restricted to the repositories the user wants to
connect.

That matters more than it sounds. ADR-003's read-only posture is a promise about our
behaviour, and a promise is only as good as every future change to the code. A token
that cannot write is a property of the credential itself — the structural isolation
`permissions.md` asks for, rather than a rule someone has to keep remembering.

### Only the adapter sees it

The token is read inside the GitHub adapter and nowhere else. Interpreters, the agent
path, and anything that builds prompts never receive it and have no route to it. If a
component does not need a credential, it does not get one.

### Sync is on demand, to begin with

The user asks for a sync and waits for it. No scheduler, no background worker, and no
free-tier cron that fails silently at 3am.

This is deliberately the least capable option. It means the user is present when a
sync fails, which is exactly when a first integration's failures should be visible.
The nightly GitHub Actions workflow that already reseeds the demo is where scheduled
syncing would go later, once the failure modes are known rather than guessed.

Re-syncing is safe: leaves carry a unique constraint on
`(user_id, source, source_id)`, so the same pull request seen twice updates one row
rather than growing a second.

### Repositories map to projects

A project may link to several repositories, so the mapping is its own table rather
than a column. `integrations.md` already sketches this shape.

## Consequences

Positive:

- Days of work rather than weeks, on an integration whose value is still unproven.
- The read-only guarantee is a property of the token, so it survives changes to our
  code that a convention would not.
- The guest account is structurally unable to hold a credential, so the most likely
  way to leak one is closed rather than documented.

Negative:

- The user creates and pastes a token by hand, which is worse onboarding than an OAuth
  flow, and they must remember to rotate or revoke it themselves.
- Arbor holds a secret it could avoid holding. Encryption reduces the blast radius of
  a database leak; it does not make the choice free.
- A PAT carries the user's own identity and permissions, so its blast radius is
  whatever that user can reach, bounded only by the scopes they chose. A GitHub App
  could be granted less.
- `CREDENTIAL_ENCRYPTION_KEY` is now something a deployment must have and must not
  lose. Losing it does not lose data, but every stored credential becomes unreadable
  and has to be reconnected.

## Alternatives considered

**A GitHub App.** The right answer eventually: scoped installation permissions,
revocable centrally, no user-held secret, and webhooks instead of polling. Rejected
for now on cost, and this decision should be revisited before Arbor has users who are
not its author.

**One token in an environment variable.** Simplest, and no secret in the database.
Rejected because the shared public guest account would inherit it. That is not a
theoretical risk; it is one click from the demo's front page.

**Storing the token in plaintext.** Rejected. It is one `pg_dump` from being everyone's
problem, and `permissions.md` is explicit that secrets get structural protection.

**Asking for the token on every sync.** No stored secret at all, which is genuinely
the safest option. Rejected as unusable: it forecloses scheduled syncing entirely and
makes the feature something you have to fetch a password manager to use.

## Follow-up work

- Rotation and revocation are manual. A connection that has stopped working should say
  so plainly rather than failing each sync in the same anonymous way.
- Scheduled syncing, once on-demand has shown what goes wrong.
- Whether a leaf that Arbor synced should be deleted when the user disconnects the
  source is unresolved, and is a data-retention question rather than a security one.
