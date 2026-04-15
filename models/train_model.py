from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "ride_data.csv"
MODEL_PATH = ROOT / "models" / "model.pkl"

PEAK_HOURS = {7, 8, 9, 10, 17, 18, 19, 20, 21}
FEATURES = [
    "hour",
    "day_of_week",
    "is_weekend",
    "is_peak_hour",
    "hour_sin",
    "hour_cos",
    "location",
    "location_bucket",
    "geo_cluster",
    "latitude",
    "longitude",
]
NUMERIC_FEATURES = ["hour", "day_of_week", "is_weekend", "is_peak_hour", "hour_sin", "hour_cos", "latitude", "longitude"]
CATEGORICAL_FEATURES = ["location", "location_bucket", "geo_cluster"]


def location_bucket(location: str) -> str:
    normalized = location.strip().lower()
    if any(token in normalized for token in ["airport", "station", "terminal"]):
        return "transit"
    if any(token in normalized for token in ["downtown", "midtown", "central", "business"]):
        return "core"
    if any(token in normalized for token in ["suburb", "residential", "outskirts"]):
        return "residential"
    return "other"


def geo_cluster(latitude: float, longitude: float) -> str:
    return f"{round(float(latitude), 1):.1f}_{round(float(longitude), 1):.1f}"


def build_preprocessor() -> ColumnTransformer:
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ]
    )


def train_regressor(X_train: pd.DataFrame, y_train: pd.Series, model_type: str) -> Pipeline:
    preprocessor = build_preprocessor()

    if model_type == "linear":
        model = LinearRegression()
    elif model_type == "rf":
        model = RandomForestRegressor(
            n_estimators=300,
            random_state=42,
            min_samples_split=4,
            n_jobs=-1,
        )
    else:
        raise ValueError(f"Unsupported model_type={model_type}")

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )
    pipeline.fit(X_train, y_train)
    return pipeline


def evaluate(name: str, model: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> dict[str, float]:
    preds = model.predict(X_test)
    rmse = float(root_mean_squared_error(y_test, preds))
    mae = float(mean_absolute_error(y_test, preds))
    return {"name": name, "rmse": rmse, "mae": mae}


def load_dataset(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df = df.copy()
    for col in ["hour", "day_of_week", "location", "latitude", "longitude", "demand", "supply"]:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    df["location"] = df["location"].astype(str).str.strip().str.lower()
    df["is_weekend"] = (df["day_of_week"].astype(int) >= 5).astype(int)
    df["is_peak_hour"] = df["hour"].astype(int).isin(PEAK_HOURS).astype(int)
    df["hour_sin"] = np.sin((2 * np.pi * df["hour"].astype(float)) / 24)
    df["hour_cos"] = np.cos((2 * np.pi * df["hour"].astype(float)) / 24)
    df["location_bucket"] = df["location"].apply(location_bucket)
    df["geo_cluster"] = df.apply(lambda row: geo_cluster(row["latitude"], row["longitude"]), axis=1)

    return df


def train() -> None:
    print("Training local model profile (high accuracy, larger artifact size)...")
    dataset = load_dataset(DATA_PATH)

    X = dataset[FEATURES]
    y_demand = dataset["demand"]
    y_supply = dataset["supply"]

    X_train, X_test, y_demand_train, y_demand_test = train_test_split(
        X, y_demand, test_size=0.2, random_state=42
    )
    _, _, y_supply_train, y_supply_test = train_test_split(
        X, y_supply, test_size=0.2, random_state=42
    )

    baseline_demand = train_regressor(X_train, y_demand_train, model_type="linear")
    baseline_supply = train_regressor(X_train, y_supply_train, model_type="linear")

    advanced_demand = train_regressor(X_train, y_demand_train, model_type="rf")
    advanced_supply = train_regressor(X_train, y_supply_train, model_type="rf")

    results = [
        evaluate("demand_linear", baseline_demand, X_test, y_demand_test),
        evaluate("supply_linear", baseline_supply, X_test, y_supply_test),
        evaluate("demand_rf", advanced_demand, X_test, y_demand_test),
        evaluate("supply_rf", advanced_supply, X_test, y_supply_test),
    ]

    print("Model metrics:")
    for result in results:
        print(f"- {result['name']}: RMSE={result['rmse']:.3f}, MAE={result['mae']:.3f}")

    artifact = {
        "demand_model": advanced_demand,
        "supply_model": advanced_supply,
        "feature_columns": FEATURES,
        "train_rows": int(dataset.shape[0]),
        "locations": np.sort(dataset["location"].astype(str).str.lower().unique()).tolist(),
        "metrics": {
            "demand": evaluate("demand_rf", advanced_demand, X_test, y_demand_test),
            "supply": evaluate("supply_rf", advanced_supply, X_test, y_supply_test),
        },
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)
    model_size_mb = MODEL_PATH.stat().st_size / (1024 * 1024)
    print(f"Saved model artifact to: {MODEL_PATH} ({model_size_mb:.2f}MB)")


if __name__ == "__main__":
    train()
