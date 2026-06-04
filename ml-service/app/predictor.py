"""Spending forecasting with scikit-learn Linear Regression.

The service is stateless: each request carries the user's transactions, a daily
expense series is built, a LinearRegression (time trend + day-of-week features)
is fit, and future days are predicted. Errors (MAE / RMSE / R2) are reported on a
held-out tail split when there is enough data, otherwise in-sample.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from .config import settings
from .schemas import (
    CategoryForecast,
    CategoryForecastResponse,
    DailyPoint,
    ForecastRequest,
    Metrics,
    SpendingForecast,
    TrainResponse,
    TransactionIn,
)


def _daily_series(transactions: list[TransactionIn], category: str | None = None) -> pd.Series:
    """Daily EXPENSE totals as a date-indexed series, gaps filled with 0."""
    rows = [
        {"date": t.date, "amount": float(t.amount)}
        for t in transactions
        if t.type == "EXPENSE" and (category is None or t.category == category)
    ]
    if not rows:
        return pd.Series(dtype=float)
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    daily = df.groupby("date")["amount"].sum().sort_index()
    full_range = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    return daily.reindex(full_range, fill_value=0.0)


def _features(dates: pd.DatetimeIndex, start_ordinal: int) -> np.ndarray:
    """Feature matrix: linear time trend + one-hot day-of-week (always 7 cols)."""
    trend = np.array([d.toordinal() - start_ordinal for d in dates], dtype=float).reshape(-1, 1)
    dow = np.zeros((len(dates), 7), dtype=float)
    for i, d in enumerate(dates):
        dow[i, d.weekday()] = 1.0
    return np.hstack([trend, dow])


def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Metrics:
    if len(y_true) == 0:
        return Metrics()
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    # R2 is undefined for a single point or a constant target.
    r2: float | None = None
    if len(y_true) >= 2 and float(np.ptp(y_true)) > 0:
        r2 = round(float(r2_score(y_true, y_pred)), 4)
    return Metrics(mae=round(mae, 2), rmse=round(rmse, 2), r2=r2)


def _fit(daily: pd.Series) -> tuple[LinearRegression | None, int, Metrics, str]:
    """Fit a model on the daily series; returns (model, start_ordinal, metrics, method)."""
    n = len(daily)
    if n == 0:
        return None, 0, Metrics(), "no_data"
    start = int(daily.index.min().toordinal())
    if n < 2:
        return None, start, Metrics(), "mean_fallback"

    features = _features(daily.index, start)
    target = daily.values.astype(float)

    if n >= settings.min_train_points:
        split = int(n * 0.8)
        evaluated = LinearRegression().fit(features[:split], target[:split])
        preds = np.clip(evaluated.predict(features[split:]), 0, None)
        metrics = _metrics(target[split:], preds)
        method = "linear_regression"
    else:
        evaluated = LinearRegression().fit(features, target)
        preds = np.clip(evaluated.predict(features), 0, None)
        metrics = _metrics(target, preds)
        method = "linear_regression_insample"

    # Refit on the full history for forecasting.
    model = LinearRegression().fit(features, target)
    return model, start, metrics, method


def _forecast(daily: pd.Series, horizon: int) -> tuple[list[tuple[pd.Timestamp, float]], float, Metrics, int, str]:
    """Returns (daily_points, total, metrics, n_samples, method)."""
    n = len(daily)
    model, start, metrics, method = _fit(daily)

    if n == 0:
        future = pd.date_range(pd.Timestamp.now().normalize() + pd.Timedelta(days=1), periods=horizon)
        return [(d, 0.0) for d in future], 0.0, metrics, 0, method

    future = pd.date_range(daily.index.max() + pd.Timedelta(days=1), periods=horizon)

    if model is None:  # mean fallback (1 data point)
        mean = round(float(daily.mean()), 2)
        return [(d, mean) for d in future], round(mean * horizon, 2), metrics, n, method

    preds = np.clip(model.predict(_features(future, start)), 0, None)
    points = [(d, round(float(p), 2)) for d, p in zip(future, preds)]
    return points, round(float(preds.sum()), 2), metrics, n, method


def forecast_spending(req: ForecastRequest) -> SpendingForecast:
    daily = _daily_series(req.transactions)
    points, total, metrics, n, method = _forecast(daily, req.horizon_days)
    return SpendingForecast(
        horizon_days=req.horizon_days,
        predicted_total=total,
        daily_average=round(total / req.horizon_days, 2) if req.horizon_days else 0.0,
        daily=[DailyPoint(date=d.date(), predicted=p) for d, p in points],
        metrics=metrics,
        n_samples=n,
        method=method,
    )


def forecast_categories(req: ForecastRequest) -> CategoryForecastResponse:
    categories = sorted(
        {t.category for t in req.transactions if t.type == "EXPENSE" and t.category}
    )
    results: list[CategoryForecast] = []
    for category in categories:
        daily = _daily_series(req.transactions, category=category)
        _, total, metrics, n, method = _forecast(daily, req.horizon_days)
        results.append(
            CategoryForecast(
                category=category,
                predicted_total=total,
                daily_average=round(total / req.horizon_days, 2) if req.horizon_days else 0.0,
                metrics=metrics,
                n_samples=n,
                method=method,
            )
        )
    results.sort(key=lambda c: c.predicted_total, reverse=True)
    return CategoryForecastResponse(horizon_days=req.horizon_days, categories=results)


def train_summary(transactions: list[TransactionIn]) -> TrainResponse:
    daily = _daily_series(transactions)
    model, _, metrics, method = _fit(daily)
    if model is not None:
        slope = round(float(model.coef_[0]), 4)
        intercept = round(float(model.intercept_), 2)
    else:
        slope = 0.0
        intercept = round(float(daily.mean()), 2) if len(daily) else 0.0
    return TrainResponse(
        n_samples=len(daily),
        metrics=metrics,
        slope_per_day=slope,
        intercept=intercept,
        method=method,
    )
