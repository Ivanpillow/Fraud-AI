from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = ""
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://fraud-ai-ashy.vercel.app"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()