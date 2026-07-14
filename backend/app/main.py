from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth as auth_router
from .routers import bridges as bridges_router
from .routers import predictions as predictions_router
from .routers import analytics as analytics_router
from .routers import notifications as notifications_router
from . import seed

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BridgeGuard AI API",
    description="Bridge Load Capacity Prediction & Structural Health Monitoring backend.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(bridges_router.router)
app.include_router(predictions_router.router)
app.include_router(analytics_router.router)
app.include_router(notifications_router.router)


@app.on_event("startup")
def on_startup():
    seed.run_seed_if_needed()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "BridgeGuard AI API"}
