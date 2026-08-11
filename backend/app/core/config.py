"""Application configuration using pydantic-settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: str = "development"
    debug: bool = True
    log_level: str = "INFO"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # Database
    database_path: str = "./recon.db"

    # Reconnaissance
    request_timeout: int = 15
    max_redirects: int = 10

    # Rate limiting
    rate_limit_per_minute: int = 10

    @property
    def cors_origins(self) -> List[str]:
        """Parse allowed origins from comma-separated string."""
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
