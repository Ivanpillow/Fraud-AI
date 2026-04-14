from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # DATABASE_URL: str = "postgresql://postgres:1234@localhost:5432/fraud_ai" # aivan core
    DATABASE_URL: str = "postgresql://postgres:12345678@localhost:5433/fraud_ai"  # angel core
    # DATABASE_URL: str = "postgresql://postgres:12345678@localhost:5432/fraudai"  # angel LAPTOP core

    # DATABASE_URL: str = ""
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()