"""Associating a capture with a project, without a model.

Measured in ADR-008: a small local model either assigned the wrong project or
abstained on everything, depending on prompt wording. It is the wrong job for a
language model. "ask about the rate limit on the tour search endpoint" belongs
to Tourify because the word `tour` is in the project's name, which is a string
comparison, not an inference.

Doing it here rather than in the prompt also means it behaves identically for
every provider, costs nothing, and can be reasoned about when it gets something
wrong.
"""

import re
from typing import Optional, Sequence

# Words that appear in project descriptions but say nothing about which project
# a capture belongs to. Without this, every capture mentioning "app" or "client"
# matches whichever project happens to use the word.
STOPWORDS = frozenset(
    """
    a an and are as at be by for from has have in into is it its of on or that
    the this to was were will with app application client server backend
    frontend project this these those using use used via
    """.split()
)

MIN_TOKEN = 3
#: A prefix has to be substantial before it means anything. Without a floor,
#: "the" prefixes "themes" and every capture matches everything.
MIN_PREFIX = 4

NAME_EXACT = 3
NAME_PREFIX = 2
DESCRIPTION_HIT = 1

#: Below this, the evidence is one incidental word and abstaining is better.
MIN_SCORE = 2


def _tokens(text: Optional[str]) -> list[str]:
    if not text:
        return []
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) >= MIN_TOKEN]


def _prefix_match(a: str, b: str) -> bool:
    """True when one word is a meaningful prefix of the other.

    This is what connects "tour" to "Tourify" -- the capture rarely spells a
    project's name the way the project does.
    """
    if len(a) < MIN_PREFIX and len(b) < MIN_PREFIX:
        return False
    return a.startswith(b) or b.startswith(a)


def score_project(capture_tokens: Sequence[str], name: str, description: Optional[str]) -> int:
    """How strongly a capture points at one project."""
    name_tokens = [t for t in _tokens(name) if t not in STOPWORDS]
    description_tokens = {t for t in _tokens(description) if t not in STOPWORDS}
    # A word already carrying the name's weight should not score twice.
    description_tokens -= set(name_tokens)

    score = 0
    for token in set(capture_tokens):
        if token in STOPWORDS:
            continue
        if token in name_tokens:
            score += NAME_EXACT
        elif any(_prefix_match(token, n) for n in name_tokens):
            score += NAME_PREFIX
        elif token in description_tokens:
            score += DESCRIPTION_HIT
    return score


def match_project(content: str, projects: Sequence) -> Optional[int]:
    """The project this capture belongs to, or None.

    None is a normal answer and the safe one: the inbox shows the proposal for
    review, and a wrong project is more annoying to notice and undo than a
    missing one is to add.

    A tie abstains too. Two projects with equal evidence means the capture does
    not distinguish between them, and picking the lower id would be arbitrary
    dressed up as a decision.
    """
    if not projects:
        return None

    capture_tokens = _tokens(content)
    if not capture_tokens:
        return None

    scored = sorted(
        (
            (score_project(capture_tokens, p.name, getattr(p, "description", None)), p.id)
            for p in projects
        ),
        key=lambda pair: -pair[0],
    )

    best_score, best_id = scored[0]
    if best_score < MIN_SCORE:
        return None
    if len(scored) > 1 and scored[1][0] == best_score:
        return None
    return best_id
