from pydantic_settings import BaseSettings
from pydantic import Field, computed_field
from typing import List
import json


def _parse_cors_origins(value: str) -> List[str]:
    s = (value or "").strip()
    if not s:
        return []
    try:
        out = json.loads(s)
        return [str(x).strip() for x in out] if isinstance(out, list) else [s]
    except json.JSONDecodeError:
        return [origin.strip() for origin in s.split(",") if origin.strip()]


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/arbor"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Interpretation. Without a key there is no interpreter and captures land
    # in `skipped` -- stored and visible, just not structured. See
    # app/services/interpretation.py.
    # auto | ollama | claude | none. `auto` prefers a configured local model,
    # then a Claude key, then nothing. Configuration decides -- nothing probes
    # the network, so behaviour is predictable. See ADR-008.
    INTERPRETER_PROVIDER: str = "auto"

    # Local inference. Setting OLLAMA_MODEL is what turns the local path on.
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = ""
    # Generous: loading weights on a cold model measured ~37s on a laptop CPU,
    # and interpretation runs in the background where nobody is waiting.
    OLLAMA_TIMEOUT_SECONDS: float = 180.0

    ANTHROPIC_API_KEY: str = ""
    INTERPRETER_MODEL: str = "claude-opus-5"
    INTERPRETER_MAX_TOKENS: int = 4096

    # CORS: read from env as plain string to avoid pydantic parsing; expose as list via computed field
    cors_origins_raw: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
        validation_alias="CORS_ORIGINS",
    )
    
    @computed_field
    @property
    def CORS_ORIGINS(self) -> List[str]:
        return _parse_cors_origins(self.cors_origins_raw)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


