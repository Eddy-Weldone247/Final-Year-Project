from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import predictor
from .config import settings
from .schemas import (
    CategoryForecastResponse,
    ForecastRequest,
    SpendingForecast,
    TrainResponse,
)

app = FastAPI(
    title="ExpenSee ML Service",
    version="1.0.0",
    description="Linear-regression spending forecasts consumed by the Express backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "expensee-ml"}


@app.post("/train", response_model=TrainResponse)
def train(req: ForecastRequest) -> TrainResponse:
    """Fit the daily-spending model and return its metrics + coefficients."""
    return predictor.train_summary(req.transactions)


@app.post("/predict/spending", response_model=SpendingForecast)
def predict_spending(req: ForecastRequest) -> SpendingForecast:
    """Forecast total + per-day spending over `horizon_days` (use 7 or 30)."""
    return predictor.forecast_spending(req)


@app.post("/predict/category", response_model=CategoryForecastResponse)
def predict_category(req: ForecastRequest) -> CategoryForecastResponse:
    """Forecast spending per category over `horizon_days`."""
    return predictor.forecast_categories(req)
