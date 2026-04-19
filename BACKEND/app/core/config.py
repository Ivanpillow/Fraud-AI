from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = ""
    # DATABASE_URL: str = "postgresql://postgres:12345678@localhost:5433/fraud_ai"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://fraud-ai-ashy.vercel.app"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # class Config:
    #     env_file = ".env"
    #     extra = "ignore"
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()