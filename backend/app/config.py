from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "sqlite+aiosqlite:///./infowatch.db"
    secret_key: str = "change-me-in-production-use-long-random-string"

    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_subscriber_email: str = "admin@example.com"

    nvd_api_key: str = ""  # Optional: raises rate limit from 5/30s to 50/30s

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        # Convert postgresql:// to postgresql+asyncpg:// if needed
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url


settings = Settings()
