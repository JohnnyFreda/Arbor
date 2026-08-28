"""Project association without a model.

The cases that matter are the ones ADR-008 measured a small model failing:
matching a project the capture only half-names, and abstaining when the
capture does not point anywhere.
"""

from dataclasses import dataclass
from typing import Optional

import pytest

from app.services.project_matching import match_project, score_project, _tokens


@dataclass
class P:
    id: int
    name: str
    description: Optional[str] = None


TOURIFY = P(1, "Tourify", "Live-music tour finder. FastAPI + PostGIS backend, Expo client.")
ARBOR = P(2, "Arbor", "This app. Daily logging, mood tracking, insights.")
PORTFOLIO = P(3, "Portfolio", "Personal site and project write-ups.")
LEARNING = P(4, "Learning", "Reading, courses, and side experiments.")
ALL = [TOURIFY, ARBOR, PORTFOLIO, LEARNING]


# --- the cases a 3B model got wrong --------------------------------------


def test_partial_name_matches_the_project():
    """"tour search endpoint" -> Tourify. The word is in the name."""
    assert match_project("ask about the rate limit on the tour search endpoint", ALL) == TOURIFY.id


def test_exact_name_matches():
    assert match_project("the arbor inbox needs pagination", ALL) == ARBOR.id


def test_two_description_words_match():
    """Description words are weak alone and sufficient together."""
    assert match_project("the tour finder is slow again", ALL) == TOURIFY.id


def test_one_description_word_abstains_by_design():
    """A single description word is not enough, deliberately.

    "expo" points only at Tourify and would be a good match. But so does
    "site" point only at Portfolio, and "the site was slow today" should not
    be filed anywhere. Nothing cheap separates a product name from a generic
    noun, so both abstain rather than tuning the threshold until one favoured
    example passes and the other quietly breaks.
    """
    assert match_project("expo build fails on the CI runner only", ALL) is None
    assert match_project("the site was slow today", ALL) is None


def test_case_and_punctuation_do_not_matter():
    assert match_project("TOURIFY: rate limits?", ALL) == TOURIFY.id


# --- abstaining ----------------------------------------------------------


def test_a_capture_naming_nothing_abstains():
    assert match_project("the coffee machine is broken again", ALL) is None


def test_a_single_incidental_word_is_not_enough():
    """"site" appears in Portfolio's description but points nowhere on its own."""
    assert match_project("the site was slow today", ALL) is None


def test_a_tie_abstains():
    """Equal evidence means the capture does not distinguish them.

    Picking the lower id would be arbitrary dressed up as a decision.
    """
    a = P(1, "Alpha", "shared word here")
    b = P(2, "Beta", "shared word here")
    assert match_project("something about the shared word here", [a, b]) is None


def test_no_projects_abstains():
    assert match_project("anything at all", []) is None


def test_empty_capture_abstains():
    assert match_project("", ALL) is None


def test_stopwords_alone_never_match():
    """Without a stoplist every capture mentioning "app" matches Arbor."""
    assert match_project("the app and the client and the backend", ALL) is None


# --- the scoring itself --------------------------------------------------


def test_name_outranks_description():
    tokens = _tokens("tourify expo")
    assert score_project(tokens, "Tourify", None) > score_project(tokens, "Other", "expo client")


def test_short_words_do_not_prefix_match():
    """A prefix floor stops "the" matching "themes" and everything matching."""
    assert match_project("the the the", [P(1, "Themes", None)]) is None


@pytest.mark.parametrize("text", ["Tourify", "tourify", "  Tourify!  "])
def test_name_match_is_robust_to_formatting(text):
    assert match_project(f"note about {text}", ALL) == TOURIFY.id
