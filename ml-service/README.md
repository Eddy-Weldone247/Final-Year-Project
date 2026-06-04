# ExpenSee ML Service

A standalone **FastAPI** microservice that forecasts spending with **scikit-learn
Linear Regression** (pandas/numpy for data prep). It is **stateless** — the Express
backend sends the user's transactions on each request; the service builds a daily
expense series, fits a model (time trend + day-of-week features), and returns
predictions plus error metrics (**MAE, RMSE, R²**).

## Run

Requires Python 3.10+.

```bash
cd ml-service
python -m venv .venv
# Windows:  .venv\Scripts\activate     macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive docs at http://localhost:8000/docs.

## Endpoints

All forecast endpoints take the same body: `{ "transactions": [...], "horizon_days": N }`
where each transaction is `{ "date": "YYYY-MM-DD", "amount": 25.5, "type": "EXPENSE"|"INCOME", "category": "FOOD" }`.

| Method | Path | Purpose | Maps to feature |
| --- | --- | --- | --- |
| GET | `/health` | liveness | — |
| POST | `/train` | fit model, return **metrics** + slope/intercept | Train Linear Regression model |
| POST | `/predict/spending` | per-day + total forecast for `horizon_days` | Next 7 days (`horizon_days=7`) / Next 30 days (`horizon_days=30`) |
| POST | `/predict/category` | forecast per category for `horizon_days` | Predict category spending |

Every response includes a `metrics` object `{ mae, rmse, r2 }` (`r2` is `null` when
undefined, e.g. a constant series), `n_samples`, and a `method`
(`linear_regression`, `linear_regression_insample`, or `mean_fallback` when data is
too sparse).

### Example

```bash
curl -X POST http://localhost:8000/predict/spending \
  -H "Content-Type: application/json" \
  -d '{"horizon_days":7,"transactions":[
        {"date":"2026-05-01","amount":30,"type":"EXPENSE","category":"FOOD"},
        {"date":"2026-05-02","amount":12,"type":"EXPENSE","category":"TRANSPORT"}
      ]}'
```

## How it works

- **Daily series**: EXPENSE transactions grouped by day, missing days filled with 0.
- **Features**: linear time trend + one-hot day-of-week (captures weekly rhythm).
- **Metrics**: held-out tail split (last 20%) once there are `MIN_TRAIN_POINTS`
  (default 10) days; otherwise in-sample. The model is then refit on all history
  before forecasting. Negative predictions are clipped to 0.
- **Category forecast**: the same pipeline run per category.

## Consumed by the Express backend

The Express API calls this service (it gathers the authenticated user's transactions
from PostgreSQL and forwards them). Configure the URL in `backend/.env`:

```
ML_SERVICE_URL=http://localhost:8000
```

Express wraps these in a stored **prediction** layer (`backend/src/services/prediction.service.ts`):
`POST /api/predictions/forecast?days=7|30`, `POST /api/predictions/category`,
`POST /api/predictions/train` (generate + persist), and `GET /api/predictions` /
`GET /api/predictions/latest?kind=&days=` to read stored results.
