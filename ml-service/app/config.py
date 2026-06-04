import os


class Settings:
    """Runtime configuration from environment variables."""

    port: int = int(os.getenv("PORT", "8000"))
    allowed_origins: list[str] = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    # Minimum daily data points before we hold out a test split for metrics.
    min_train_points: int = int(os.getenv("MIN_TRAIN_POINTS", "10"))


settings = Settings()
