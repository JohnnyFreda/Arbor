# ADR-008: Interpretation Must Be Able to Run Locally

Status: Accepted

## Context

Interpretation currently runs against the Claude API. That works, but it makes two
assumptions the product should not require: that the user is willing to pay per capture,
and that the user is willing to send captures to a third party.

The second assumption is the heavier one. Captures are the rawest input in the system —
half-formed thoughts, frustrations, security worries, things said about colleagues and
employers before they have been edited into anything presentable. `product/principles.md`
already argues for limiting blast radius, and ADR-003 keeps integrations read-only for the
same instinct: minimise what leaves. Sending every unedited thought to an external service
is the largest data-egress decision in the product, and it was made implicitly.

The first assumption matters too, at a smaller scale. A developer tool that costs money
per thought discourages the exact behaviour the product depends on — capturing freely,
without judging whether a thought is worth recording.

The interpreter is already behind a seam. `get_interpreter()` returns something with an
`interpret()` method, and nothing in the capture path knows which implementation answered.

## Decision

Local interpretation is a supported, first-class configuration, not a fallback.

Arbor supports three interpreter providers, chosen by configuration rather than by runtime
discovery:

```text
INTERPRETER_PROVIDER = auto | ollama | claude | none
```

`auto` resolves in order: Ollama when a local model is configured, then Claude when an API
key is present, then none. Explicit values override. Nothing probes the network to decide —
configuration determines the provider, so behaviour is predictable and testable.

Local inference runs through Ollama, using its schema-constrained `format` parameter. The
same JSON Schema already generated for the Claude path is sent to Ollama, so structural
validity is guaranteed by constrained decoding rather than by the model's willingness to
follow instructions.

**Prompts are per-provider, not shared.** This is not a nicety; measurement below shows a
prompt written for a frontier model actively harming a small one. Each provider gets a
prompt written for it, and they are allowed to diverge.

Every provider stays behind the existing `Interpreter` protocol, and every failure mode
stays the one already defined: a raised exception marks the capture `failed` and leaves it
retryable. A local model that is slow, absent, or unloaded costs the user a proposal, never
the thought.

## Measurement

Benchmarked before adopting, on the development machine (2-core i7-7500U, 15 GB RAM, no
usable GPU — 2 GB VRAM), against `qwen2.5:3b` with the production JSON Schema and nine
captures: the six seeded ones plus three probes whose correct answers are null.

Nine captures is a small sample and the expected labels are one person's judgement. These
numbers are directional, not a benchmark suite.

| | Claude-tuned prompt | Prompt written for a small model |
|---|---|---|
| Schema valid | 9/9 | 9/9 |
| Type agreement | 3/9 | 7/9 |
| Abstained on project when correct | 3/3 | 3/3 |
| Abstained on priority when correct | 7/7 | 7/7 |
| Latency, median | 11.0s | 10.1s |
| Confidence range | 0.90–1.00 | 0.80–1.00 |

Cold start is ~37s to load weights, then ~10s per capture.

Three findings changed the shape of this decision:

**The prompt mattered more than the model.** Same model, same schema, same captures:
3/9 to 7/9 from rewriting the prompt alone. The production prompt says "Not every thought
is a task… Over-classifying as `task` produces a todo list the developer did not ask for."
A frontier model weighs that against the rest of the instruction. `qwen2.5:3b` applied it
literally and classified zero of four tasks as tasks, including "need to remember to call
the dentist". Small models over-apply negative instructions; they need an ordered decision
rule and examples instead.

**Abstention was not the problem.** It was expected to be the main failure — small models
are supposed to dislike answering null. It abstained correctly on every case where null was
right. It over-abstains if anything.

**Latency is far better than assumed.** ~10s, not the 20–45s estimated. Comfortably inside
a background task the user never waits on.

## Consequences

Positive:

- Captures can be interpreted without leaving the machine, at zero marginal cost, offline.
  For a tool built around unedited personal input, that is a meaningful posture.
- Type classification and titles are good enough that the inbox beats entering metadata by
  hand, which is the bar `roadmap/mvp.md` actually sets — proposals are reviewed, and a
  wrong type costs one dropdown change.
- The provider seam gets a second real implementation, which is the only way to learn
  whether it was an abstraction or just indirection.

Negative:

- **Confidence from a small model is not meaningful.** Measured range was 0.80–1.00,
  including 0.90 on a capture it classified wrongly. Confidently wrong is worse than
  uncertain, and the inbox renders confidence as a percentage specifically to surface
  ambiguity — so an uncalibrated number there is a lie in the one place the product asks
  to be trusted. Resolved by withholding it: `interpretations.confidence_is_calibrated`
  records at write time whether the producing provider had earned it, and the API omits
  `confidence` entirely when it has not. The value stays on the row, because calibrating
  anything later needs it. Clients are never asked to judge whether a number is
  trustworthy.
- **Project association does not work well from a small model.** It either assigned the
  wrong project or abstained on every capture depending on prompt wording. This is likely
  the wrong job for a language model at all: "tour search endpoint" maps to Tourify by
  substring match against project names and descriptions, which no model is needed for.
  Treat project association as a separate, non-AI problem.
- Two prompt targets to maintain, and they will drift apart deliberately.
- Ollama is an external process that can be absent or unloaded. Covered by the existing
  `failed` path, but it is now a supported configuration breakable from outside the app.
- The hosted demo cannot run a local model on free-tier infrastructure, and must not carry
  a live API key on a shared public guest account. The deployed demo therefore keeps seeded
  proposals and no live interpreter. Local and hosted behave differently by design, and the
  docs should say so rather than leaving it surprising.

## Alternatives considered

**Claude only, and accept the cost and egress.** Rejected as the sole option. It remains
the best-quality path and stays fully supported, but making it mandatory decides an
important privacy question on the user's behalf.

**Bundle a model in-process (llama-cpp-python).** Rejected. It puts model weights, native
build dependencies, and hardware tuning inside the application, and blocks the worker
during inference. Ollama already solves model management and runs out of process.

**One shared prompt across providers.** Rejected by measurement. It is what produced 3/9.

**An OpenAI-compatible endpoint instead of Ollama's native API.** Ollama exposes one, and
this stays an easy future addition for LM Studio or llama.cpp users. Ollama's native API is
used first because its `format` parameter accepts a full JSON Schema, which is the property
this design depends on.

## Follow-up work

Done: confidence is withheld from the API until the provider earns it
(`d5a90c1f7b42`).

Outstanding:

- Move project association out of the model and into lexical matching against project names
  and descriptions, for every provider.
- Re-run this measurement against Claude on the same nine captures. The local numbers have
  nothing to be compared to yet.
- Grow the capture set beyond nine before treating any of this as a regression test.
