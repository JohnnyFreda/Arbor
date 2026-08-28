from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime
from typing import Optional, List, Literal


CaptureSourceLiteral = Literal["desktop", "mobile", "voice", "other"]
ProcessingStatusLiteral = Literal[
    "pending", "processing", "interpreted", "failed", "skipped"
]
InterpretationTypeLiteral = Literal["thought", "task", "idea", "note", "blocker"]
InterpretationStatusLiteral = Literal["proposed", "accepted", "edited", "dismissed"]


class CaptureCreate(BaseModel):
    """Everything optional except the thought itself.

    No project, type, priority, or date is required at capture time -- that is
    the whole point of ADR-001.
    """

    content: str = Field(min_length=1, max_length=20000)
    source: CaptureSourceLiteral = "desktop"
    client_token: Optional[str] = Field(default=None, max_length=128)

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, v: str) -> str:
        # Preserve the user's text as typed; only reject whitespace-only input.
        if not v.strip():
            raise ValueError("content must not be blank")
        return v


class InterpretationResponse(BaseModel):
    id: int
    capture_id: int
    type: InterpretationTypeLiteral
    suggested_title: Optional[str] = None
    suggested_project_id: Optional[int] = None
    suggested_priority: Optional[str] = None
    suggested_next_action: Optional[str] = None
    confidence: Optional[float] = None
    status: InterpretationStatusLiteral
    model: Optional[str] = None
    created_at: datetime

    # Read from the row and then dropped from the response. Clients are not
    # asked to decide whether a number is trustworthy -- an uncalibrated one
    # simply never reaches them.
    confidence_is_calibrated: bool = Field(default=True, exclude=True)

    @model_validator(mode="after")
    def withhold_uncalibrated_confidence(self):
        """Confidence stays a stored value until the provider earns it.

        A small local model emits ~0.9 for everything, including answers it got
        wrong. Rendering that as a percentage would put a fabricated certainty
        in the one place the product asks to be trusted, so it is not sent at
        all. The value stays in the database, which is what any future
        calibration work will need.
        """
        if not self.confidence_is_calibrated:
            self.confidence = None
        return self

    class Config:
        from_attributes = True


class CaptureResponse(BaseModel):
    id: int
    user_id: int
    content: str
    source: CaptureSourceLiteral
    processing_status: ProcessingStatusLiteral
    created_at: datetime
    updated_at: datetime
    interpretation: Optional[InterpretationResponse] = None

    class Config:
        from_attributes = True


class ProposedInterpretation(BaseModel):
    """Structured output expected back from an interpreter.

    Validated before it reaches the database; a model that returns an
    unsupported type or an out-of-range confidence is rejected rather than
    stored. See docs/development/testing.md.
    """

    type: InterpretationTypeLiteral
    suggested_title: Optional[str] = Field(default=None, max_length=200)
    suggested_project_id: Optional[int] = None
    suggested_priority: Optional[str] = Field(default=None, max_length=32)
    suggested_next_action: Optional[str] = Field(default=None, max_length=2000)
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
