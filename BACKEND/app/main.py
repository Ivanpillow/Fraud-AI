from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(
    title="FraudAI",
    description="FraudAI Backend API",
    version="1.0.0"
)

# Nuevo endpoint de ejemplo
@app.get("/hello")
def read_root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("PORT", 8000)))