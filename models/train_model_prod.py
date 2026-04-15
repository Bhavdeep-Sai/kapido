from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Any

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
MODEL_LOCAL_PATH = ROOT / "models" / "model.pkl"
MODEL_PROD_PATH = ROOT / "models" / "model_prod.pkl"

PEAK_HOURS = {7, 8, 9, 10, 17, 18, 19, 20, 21}
RANDOM_STATE = 42
TARGET_SIZE_MB = 20.0
HARD_LIMIT_SIZE_MB = 50.0

# Keep local features broad for best accuracy.
LOCAL_FEATURES = [
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
LOCAL_NUMERIC_FEATURES = [
    "hour",
    "day_of_week",
    "is_weekend",
    "is_peak_hour",
    "hour_sin",
    "hour_cos",
    "latitude",
    "longitude",
]
LOCAL_CATEGORICAL_FEATURES = ["location", "location_bucket", "geo_cluster"]

# Production feature set intentionally reduces one-hot cardinality.
PROD_FEATURES = [
    "hour",
    "day_of_week",
    "is_weekend",
    "is_peak_hour",
    "hour_sin",
    "hour_cos",
    "location_bucket",
    "latitude",
    "longitude",
]
PROD_NUMERIC_FEATURES = [
    "hour",
    "day_of_week",
    "is_weekend",
    "is_peak_hour",
    "hour_sin",
    "hour_cos",
    "latitude",
    "longitude",
]
PROD_CATEGORICAL_FEATURES = ["location_bucket"]


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


def build_preprocessor(numeric_features: list[str], categorical_features: list[str]) -> ColumnTransformer:
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
            ("num", numeric_pipeline, numeric_features),
            ("cat", categorical_pipeline, categorical_features),
        ]
    )


def train_regressor(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    numeric_features: list[str],
    categorical_features: list[str],
    estimator: Any,
) -> Pipeline:
    preprocessor = build_preprocessor(numeric_features=numeric_features, categorical_features=categorical_features)
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", estimator),
        ]
    )
    pipeline.fit(X_train, y_train)
    return pipeline


def evaluate(model: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> dict[str, float]:
    preds = model.predict(X_test)
    rmse = float(root_mean_squared_error(y_test, preds))
    mae = float(mean_absolute_error(y_test, preds))
    return {"rmse": rmse, "mae": mae}


def estimate_artifact_size_mb(artifact: dict[str, Any], compress: int | None) -> float:
    with tempfile.TemporaryDirectory() as tmpdir:
        temp_path = Path(tmpdir) / "artifact.pkl"
        if compress is None:
            joblib.dump(artifact, temp_path)
        else:
            joblib.dump(artifact, temp_path, compress=compress)
        return temp_path.stat().st_size / (1024 * 1024)


def build_artifact(
    demand_model: Pipeline,
    supply_model: Pipeline,
    feature_columns: list[str],
    dataset: pd.DataFrame,
    metrics: dict[str, Any],
    profile_name: str,
) -> dict[str, Any]:
    return {
        "demand_model": demand_model,
        "supply_model": supply_model,
        "feature_columns": feature_columns,
        "train_rows": int(dataset.shape[0]),
        "locations": np.sort(dataset["location"].astype(str).str.lower().unique()).tolist(),
        "metrics": metrics,
        "profile": profile_name,
    }


def train_local_reference(
    dataset: pd.DataFrame,
    X_train_local: pd.DataFrame,
    X_test_local: pd.DataFrame,
    y_demand_train: pd.Series,
    y_demand_test: pd.Series,
    y_supply_train: pd.Series,
    y_supply_test: pd.Series,
) -> dict[str, Any]:
    demand_model = train_regressor(
        X_train_local,
        y_demand_train,
        numeric_features=LOCAL_NUMERIC_FEATURES,
        categorical_features=LOCAL_CATEGORICAL_FEATURES,
        estimator=RandomForestRegressor(
            n_estimators=300,
            min_samples_split=4,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    )
    supply_model = train_regressor(
        X_train_local,
        y_supply_train,
        numeric_features=LOCAL_NUMERIC_FEATURES,
        categorical_features=LOCAL_CATEGORICAL_FEATURES,
        estimator=RandomForestRegressor(
            n_estimators=300,
            min_samples_split=4,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    )

    demand_metrics = evaluate(demand_model, X_test_local, y_demand_test)
    supply_metrics = evaluate(supply_model, X_test_local, y_supply_test)
    artifact = build_artifact(
        demand_model=demand_model,
        supply_model=supply_model,
        feature_columns=LOCAL_FEATURES,
        dataset=dataset,
        metrics={"demand": demand_metrics, "supply": supply_metrics},
        profile_name="local_reference",
    )
    return {
        "name": "local_rf_large",
        "artifact": artifact,
        "demand": demand_metrics,
        "supply": supply_metrics,
        "mean_rmse": (demand_metrics["rmse"] + supply_metrics["rmse"]) / 2.0,
        "mean_mae": (demand_metrics["mae"] + supply_metrics["mae"]) / 2.0,
        "size_mb": estimate_artifact_size_mb(artifact, compress=None),
    }


def train_prod_candidate(
    candidate_name: str,
    estimator_factory,
    dataset: pd.DataFrame,
    X_train_prod: pd.DataFrame,
    X_test_prod: pd.DataFrame,
    y_demand_train: pd.Series,
    y_demand_test: pd.Series,
    y_supply_train: pd.Series,
    y_supply_test: pd.Series,
) -> dict[str, Any]:
    demand_model = train_regressor(
        X_train_prod,
        y_demand_train,
        numeric_features=PROD_NUMERIC_FEATURES,
        categorical_features=PROD_CATEGORICAL_FEATURES,
        estimator=estimator_factory(),
    )
    supply_model = train_regressor(
        X_train_prod,
        y_supply_train,
        numeric_features=PROD_NUMERIC_FEATURES,
        categorical_features=PROD_CATEGORICAL_FEATURES,
        estimator=estimator_factory(),
    )

    demand_metrics = evaluate(demand_model, X_test_prod, y_demand_test)
    supply_metrics = evaluate(supply_model, X_test_prod, y_supply_test)
    artifact = build_artifact(
        demand_model=demand_model,
        supply_model=supply_model,
        feature_columns=PROD_FEATURES,
        dataset=dataset,
        metrics={"demand": demand_metrics, "supply": supply_metrics},
        profile_name=f"production_{candidate_name}",
    )
    return {
        "name": candidate_name,
        "artifact": artifact,
        "demand": demand_metrics,
        "supply": supply_metrics,
        "mean_rmse": (demand_metrics["rmse"] + supply_metrics["rmse"]) / 2.0,
        "mean_mae": (demand_metrics["mae"] + supply_metrics["mae"]) / 2.0,
        "size_mb": estimate_artifact_size_mb(artifact, compress=3),
    }


def pick_best_candidate(candidates: list[dict[str, Any]]) -> dict[str, Any]:
    in_target = [c for c in candidates if c["size_mb"] <= TARGET_SIZE_MB]
    if in_target:
        return min(in_target, key=lambda c: (c["mean_rmse"], c["size_mb"]))

    under_hard_limit = [c for c in candidates if c["size_mb"] <= HARD_LIMIT_SIZE_MB]
    if under_hard_limit:
        return min(under_hard_limit, key=lambda c: (c["mean_rmse"], c["size_mb"]))

    return min(candidates, key=lambda c: (c["size_mb"], c["mean_rmse"]))


def train() -> None:
    dataset = load_dataset(DATA_PATH)

    X_local = dataset[LOCAL_FEATURES]
    X_prod = dataset[PROD_FEATURES]
    y_demand = dataset["demand"]
    y_supply = dataset["supply"]

    train_idx, test_idx = train_test_split(dataset.index, test_size=0.2, random_state=RANDOM_STATE)

    X_train_local = X_local.loc[train_idx]
    X_test_local = X_local.loc[test_idx]
    X_train_prod = X_prod.loc[train_idx]
    X_test_prod = X_prod.loc[test_idx]

    y_demand_train = y_demand.loc[train_idx]
    y_demand_test = y_demand.loc[test_idx]
    y_supply_train = y_supply.loc[train_idx]
    y_supply_test = y_supply.loc[test_idx]

    print("Training local reference model (high accuracy, larger size)...")
    local_reference = train_local_reference(
        dataset,
        X_train_local,
        X_test_local,
        y_demand_train,
        y_demand_test,
        y_supply_train,
        y_supply_test,
    )

    print("Training production candidates (size-optimized)...")
    prod_candidates = [
        train_prod_candidate(
            candidate_name="linear",
            estimator_factory=lambda: LinearRegression(),
            dataset=dataset,
            X_train_prod=X_train_prod,
            X_test_prod=X_test_prod,
            y_demand_train=y_demand_train,
            y_demand_test=y_demand_test,
            y_supply_train=y_supply_train,
            y_supply_test=y_supply_test,
        ),
        train_prod_candidate(
            candidate_name="rf_compact",
            estimator_factory=lambda: RandomForestRegressor(
                n_estimators=60,
                max_depth=12,
                min_samples_leaf=4,
                max_features="sqrt",
                random_state=RANDOM_STATE,
                n_jobs=-1,
            ),
            dataset=dataset,
            X_train_prod=X_train_prod,
            X_test_prod=X_test_prod,
            y_demand_train=y_demand_train,
            y_demand_test=y_demand_test,
            y_supply_train=y_supply_train,
            y_supply_test=y_supply_test,
        ),
    ]

    selected = pick_best_candidate(prod_candidates)

    # Store quick comparison info directly in production artifact.
    selected["artifact"]["comparison"] = {
        "local_reference": {
            "name": local_reference["name"],
            "mean_rmse": local_reference["mean_rmse"],
            "mean_mae": local_reference["mean_mae"],
            "size_mb": local_reference["size_mb"],
        },
        "production_selected": {
            "name": selected["name"],
            "mean_rmse": selected["mean_rmse"],
            "mean_mae": selected["mean_mae"],
            "size_mb": selected["size_mb"],
        },
    }

    MODEL_PROD_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(selected["artifact"], MODEL_PROD_PATH, compress=3)

    print("\n=== Local vs Production Comparison ===")
    print(
        f"Local  | model={local_reference['name']:<16} "
        f"RMSE={local_reference['mean_rmse']:.3f} "
        f"MAE={local_reference['mean_mae']:.3f} "
        f"size~{local_reference['size_mb']:.2f}MB"
    )
    for candidate in prod_candidates:
        print(
            f"Prod   | model={candidate['name']:<16} "
            f"RMSE={candidate['mean_rmse']:.3f} "
            f"MAE={candidate['mean_mae']:.3f} "
            f"size~{candidate['size_mb']:.2f}MB"
        )

    print("\nSelected production model:")
    print(
        f"- {selected['name']} (RMSE={selected['mean_rmse']:.3f}, "
        f"MAE={selected['mean_mae']:.3f}, size~{selected['size_mb']:.2f}MB)"
    )

    if selected["size_mb"] > HARD_LIMIT_SIZE_MB:
        print(
            f"WARNING: Selected model is {selected['size_mb']:.2f}MB, over hard limit "
            f"({HARD_LIMIT_SIZE_MB:.0f}MB). Consider reducing trees/depth further."
        )
    elif selected["size_mb"] > TARGET_SIZE_MB:
        print(
            f"NOTE: Selected model is above target ({TARGET_SIZE_MB:.0f}MB) but within hard limit "
            f"({HARD_LIMIT_SIZE_MB:.0f}MB)."
        )

    print(f"Saved optimized production artifact to: {MODEL_PROD_PATH}")
    print(f"Existing local artifact path remains: {MODEL_LOCAL_PATH}")


if __name__ == "__main__":
    train()