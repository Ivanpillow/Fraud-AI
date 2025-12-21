from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/fraud_ai"

    class Config:
        env_file = ".env"

settings = Settings()