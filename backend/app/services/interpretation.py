"""The interpretation seam.

Slice 1 ships the boundary, not a model. `get_interpreter()` returns None until
a provider is configured, which leaves captures in the `skipped` state -- stored,
intact, and visible in the inbox, just not yet structured.

Wiring a real provider means implementing `interpret()` and returning an
instance from `get_interpreter()`. Nothing else in the capture path changes.
"""

from typing import Optional, Protocol

from app.schemas.capture import ProposedInterpretation


class Interpreter(Protocol):
    """Turns raw capture text into a proposed structure.

    Implementations should raise on failure rather than returning a degraded
    guess. A raised exception marks the capture `failed` and leaves it for
    retry; a silently wrong proposal is harder for the user to notice.
    """

    name: str

    def interpret(self, content: str) -> ProposedInterpretation:
        ...


def get_interpreter() -> Optional[Interpreter]:
    """Return the configured interpreter, or None if there isn't one.

    No AI provider is configured yet -- see docs/roadmap/mvp.md. Tests
    monkeypatch this to exercise the success and failure paths.
    """
    return None
