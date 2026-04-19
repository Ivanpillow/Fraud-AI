from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "" 
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://fraud-ai-ashy.vercel.app"
    
    # Detectar ambiente: Railway usa RAILWAY_ENVIRONMENT_NAME
    ENV: str = os.getenv("RAILWAY_ENVIRONMENT_NAME", "development")
    
    # En producción (Railway), usar HTTPS y SameSite=none
    COOKIE_SECURE: bool = ENV == "production"
    COOKIE_SAMESITE: str = "none" if ENV == "production" else "lax"

    # class Config:
    #     env_file = ".env"
    #     extra = "ignore"
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()