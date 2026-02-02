from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import Base
from app.db.session import engine
from app.routers import fraud_feedback, qr_transactions, transactions
from app.routers import metrics
from app.models.user import User
from app.models.transaction import Transaction
from app.models.fraud_prediction import FraudPrediction
import uvicorn
import os



Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FraudAI",
    description="FraudAI Backend API",
    version="1.0.0"
)


# Configuración de CORS para permitir peticiones desde el frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],  
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.include_router(transactions.router)
app.include_router(metrics.router)
app.include_router(fraud_feedback.router)
app.include_router(qr_transactions.router)



if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("PORT", 8000)))