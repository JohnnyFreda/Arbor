from pydantic import BaseModel, Field, model_validator
from typing import Optional, Literal

from app.schemas.capture import InterpretationTypeLiteral


DecisionLiteral = Literal["accepted", "edited", "dismissed"]


class InterpretationDecision(BaseModel):
    """The user's verdict on a proposal, plus any edits made to it.

    `accepted` takes the proposal as-is. `edited` takes it with the supplied
    changes applied -- both are affirmative and produce a Task when the
    resulting type is actionable. `dismissed` produces nothing and reverses a
    Task this proposal created earlier, so accepting is not a one-way door.
    """

    status: DecisionLiteral
    type: Optional[InterpretationTypeLiteral] = None
    suggested_title: Optional[str] = Field(default=None, max_length=200)
    suggested_project_id: Optional[int] = None
    suggested_priority: Optional[str] = Field(default=None, max_length=32)
    suggested_next_action: Optional[str] = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def edits_belong_with_an_edit(self):
        edit_fields = (
            self.type,
            self.suggested_title,
            self.suggested_project_id,
            self.suggested_priority,
            self.suggested_next_action,
        )
        if self.status != "edited" and any(f is not None for f in edit_fields):
            raise ValueError(
                "field changes require status 'edited'; "
                "use 'accepted' to take the proposal as-is"
            )
        return self
