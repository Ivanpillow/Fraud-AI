from fastapi import FastAPI
# from app.db.session import engine
# from app.db.base import Base
# from app.models import transaction 
from fastapi.middleware.cors import CORSMiddleware
from app.routers import transactions
import uvicorn
import os

app = FastAPI(
    title="FraudAI",
    description="FraudAI Backend API",
    version="1.0.0"
)

# Base.metadata.create_all(bind=engine)

# Configuración de CORS para permitir peticiones desde el frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],  
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.include_router(transactions.router)



if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("PORT", 8000)))