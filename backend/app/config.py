from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    # Environment
    ENVIRONMENT: str = "dev"  # dev | prod
    CORS_ORIGINS: str = "http://localhost:3000"  # comma-separated

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/interview_copilot"

    # OpenAI API
    OPENAI_API_KEY: str = ""
    OPENAI_API_BASE: str = "https://api.penguinsaichat.dpdns.org/v1"
    OPENAI_MODEL: str = "gpt-5.3-codex"

    # Cloudflare R2
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "interview-copilot"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "prod"

    @property
    def llm_api_key(self) -> str:
        return self.OPENAI_API_KEY

    @property
    def llm_api_base(self) -> str:
        return self.OPENAI_API_BASE

    @property
    def llm_model(self) -> str:
        return self.OPENAI_MODEL

    @property
    def llm_provider(self) -> str:
        return "openai" if self.OPENAI_API_KEY else "mock"

    @property
    def is_mock_mode(self) -> bool:
        return not self.OPENAI_API_KEY


settings = Settings()
