from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import Base
from app.db.session import engine
from app.core.config import settings
from app.routers import fraud_feedback, qr_transactions, transactions, auth_router, users_management_router, roles_router, merchants_management_router
from app.routers import metrics, notifications
from app.models.user import User
from app.models.transaction import Transaction
from app.models.fraud_prediction import FraudPrediction
import uvicorn
import os


cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
cors_origin_regex = r"https://.*\.vercel\.app"



Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FraudAI",
    description="FraudAI Backend API",
    version="1.0.0"
)


# Configuración de CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(transactions.router)
app.include_router(qr_transactions.router)
app.include_router(metrics.router)
app.include_router(notifications.router)
app.include_router(fraud_feedback.router)
app.include_router(users_management_router.router)
app.include_router(roles_router.router)
app.include_router(merchants_management_router.router)


@app.get("/")
def root():
    return {"message": "FraudAI Backend activo", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health():
    return {"status": "ok"}




if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))