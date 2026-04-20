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

    # Blockchain simulated provider settings
    BC_PROVIDER_NAME: str = "fake_blockchain"
    BC_REQUIRED_CONFIRMATIONS: int = 2
    BC_CONFIRMATION_MIN_SECONDS: int = 3
    BC_CONFIRMATION_MAX_SECONDS: int = 8
    BC_INTERNAL_WEBHOOK_SECRET: str = "dev_bc_webhook_secret"
    BC_INTERNAL_WEBHOOK_URL: str = "http://127.0.0.1:8000/bc-transactions/webhook/internal"

    # class Config:
    #     env_file = ".env"
    #     extra = "ignore"
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()