from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # DATABASE_URL: str = "postgresql://postgres:1234@localhost:5432/fraud_ai" # aivan core
    DATABASE_URL: str = "postgresql://postgres:12345678@localhost:5433/fraud_ai"  # angel core

    class Config:
        env_file = ".env"

settings = Settings()