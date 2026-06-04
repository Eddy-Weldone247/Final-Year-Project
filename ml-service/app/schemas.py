from datetime import date as DateType
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TransactionIn(BaseModel):
    date: DateType
    amount: float
    type: Literal["INCOME", "EXPENSE"] = "EXPENSE"
    category: Optional[str] = None


class ForecastRequest(BaseModel):
    transactions: list[TransactionIn]
    horizon_days: int = Field(default=7, ge=1, le=365)


class Metrics(BaseModel):
    """Regression error metrics. `r2` is null when undefined (e.g. constant series)."""

    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None


class DailyPoint(BaseModel):
    date: DateType
    predicted: float


class SpendingForecast(BaseModel):
    horizon_days: int
    predicted_total: float
    daily_average: float
    daily: list[DailyPoint]
    metrics: Metrics
    n_samples: int
    method: str


class CategoryForecast(BaseModel):
    category: str
    predicted_total: float
    daily_average: float
    metrics: Metrics
    n_samples: int
    method: str


class CategoryForecastResponse(BaseModel):
    horizon_days: int
    categories: list[CategoryForecast]


class TrainResponse(BaseModel):
    n_samples: int
    metrics: Metrics
    slope_per_day: float
    intercept: float
    method: str
