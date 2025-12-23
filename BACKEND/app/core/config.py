from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:12345678@localhost:5433/fraud_ai"

    class Config:
        env_file = ".env"

settings = Settings()