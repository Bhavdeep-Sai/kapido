import type { Node } from "@xyflow/react";

export type WorkflowNodeCategory = "frontend" | "backend" | "database" | "analytics" | "offline" | "external";

export type WorkflowNodeData = {
  title: string;
  summary: string;
  codeRef: string;
  details: string[];
  category: WorkflowNodeCategory;
};

export type WorkflowModuleCard = {
  title: string;
  summary: string;
  files: string[];
  status: string;
};

export type WorkflowEndpointCard = {
  method: string;
  path: string;
  purpose: string;
  status: "used in dashboard" | "available" | "support";
};

export type WorkflowStep = {
  title: string;
  summary: string;
  files: string[];
  functions: string[];
  endpoints: string[];
  notes: string[];
};

export type WorkflowEdgeSpec = {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: "primary" | "supporting" | "offline";
};

export const workflowHighlights = [
  "Users enter an hour and a location, then the home page routes the request to the dashboard with query parameters.",
  "The dashboard calls the prediction API, persists the result, and then loads hourly, location, day-of-week, distribution, time-series, and validation analytics.",
  "Prediction logic is split into feature engineering, model inference, and rule-based explanation generation.",
  "MongoDB stores prediction history and powers the aggregation endpoints.",
  "Offline scripts generate the ride dataset and train the model artifact used by the backend.",
] as const;

export const workflowModules: WorkflowModuleCard[] = [
  {
    title: "Frontend runtime",
    summary:
      "Home, dashboard, form, charts, map preview, prediction card, and the typed API wrapper that orchestrates the user flow.",
    files: [
      "frontend/app/page.tsx",
      "frontend/app/dashboard/page.tsx",
      "frontend/components/InputForm.tsx",
      "frontend/components/CoordinateMapPreview.tsx",
      "frontend/components/PredictionCard.tsx",
      "frontend/components/TrendCharts.tsx",
      "frontend/components/MapView.tsx",
      "frontend/lib/api.ts",
      "frontend/lib/location-coordinates.ts",
    ],
    status: "Used by the live UI",
  },
  {
    title: "Backend runtime",
    summary:
      "FastAPI routes, predictor service, feature builder, insight rules, history storage, analytics aggregation, and validation logic.",
    files: [
      "backend/app/main.py",
      "backend/app/routes/prediction.py",
      "backend/app/services/predictor.py",
      "backend/app/services/preprocess.py",
      "backend/app/services/insights_service.py",
      "backend/app/services/history_service.py",
      "backend/app/services/analytics_service.py",
      "backend/app/services/validation_service.py",
      "backend/app/db/mongo.py",
      "backend/app/models/schemas.py",
    ],
    status: "Active API layer",
  },
  {
    title: "Offline model lifecycle",
    summary:
      "The data generator expands ride_data.csv and the training script produces the model.pkl artifact consumed by PredictorService.",
    files: ["data/generate_ride_data.js", "models/train_model.py", "data/ride_data.csv", "models/model.pkl"],
    status: "Manual maintenance flow",
  },
  {
    title: "External services",
    summary:
      "MongoDB Atlas stores prediction history, and Leaflet renders OpenStreetMap tiles for the preview map and result map.",
    files: ["backend/app/db/mongo.py", "frontend/components/CoordinateMapPreview.tsx", "frontend/components/MapView.tsx"],
    status: "Runtime dependencies",
  },
] as const;

export const workflowEndpoints: WorkflowEndpointCard[] = [
  {
    method: "GET",
    path: "/predict",
    purpose: "Validates hour, location, and optional coordinates, then returns demand, supply, gap, severity, explanations, and recommendations.",
    status: "used in dashboard",
  },
  {
    method: "POST",
    path: "/store-prediction",
    purpose: "Writes the prediction snapshot to MongoDB and backfills explanations and recommendations if they are missing.",
    status: "used in dashboard",
  },
  {
    method: "GET",
    path: "/history",
    purpose: "Returns stored prediction records sorted by newest first.",
    status: "used in dashboard",
  },
  {
    method: "GET",
    path: "/analytics/hourly-trends",
    purpose: "Aggregates stored predictions into hourly averages, shortage rates, and peak shortage hours.",
    status: "used in dashboard",
  },
  {
    method: "GET",
    path: "/analytics/location-trends",
    purpose: "Groups stored predictions by location and returns hotspots plus severity labels.",
    status: "used in dashboard",
  },
  {
    method: "GET",
    path: "/analytics/day-of-week",
    purpose: "Aggregates mismatch metrics by day index (0-6) and identifies peak shortage days.",
    status: "used in dashboard",
  },
  {
    method: "GET",
    path: "/analytics/gap-distribution",
    purpose: "Returns percentile and bucket distribution of demand-supply gaps.",
    status: "used in dashboard",
  },
  {
    method: "GET",
    path: "/analytics/time-series",
    purpose: "Returns time-ordered prediction history for charting.",
    status: "used in dashboard",
  },
  {
    method: "GET",
    path: "/analytics/model-validation",
    purpose: "Evaluates the current model artifact against data/ride_data.csv and returns MAE, RMSE, and anomaly notes.",
    status: "used in dashboard",
  },
  {
    method: "GET",
    path: "/health",
    purpose: "Returns the API health status.",
    status: "support",
  },
] as const;

export const workflowSteps: WorkflowStep[] = [
  {
    title: "1. Enter the analysis inputs",
    summary:
      "The user chooses an hour and types a location in InputForm. The component searches the local location index, resolves coordinates, and stores the last run in localStorage.",
    files: ["frontend/components/InputForm.tsx", "frontend/lib/location-coordinates.ts"],
    functions: ["findLocationMatches", "resolveLocationCoordinates", "getLocationCoordinates"],
    endpoints: [],
    notes: [
      "CoordinateMapPreview lets the user click or drag the map pin to override the resolved position.",
      "The location index is a hardcoded dictionary, so matches are local and deterministic.",
    ],
  },
  {
    title: "2. Route the request to the dashboard",
    summary:
      "The home page builds a query string from the submitted hour, location, latitude, and longitude, then navigates to /dashboard.",
    files: ["frontend/app/page.tsx"],
    functions: ["handleSubmit", "useRouter"],
    endpoints: [],
    notes: [
      "The dashboard reads query parameters through useSearchParams.",
      "If the required inputs are missing, the dashboard shows an error instead of calling the backend.",
    ],
  },
  {
    title: "3. Request a prediction",
    summary:
      "DashboardPage calls getPrediction, which sends GET /predict with the chosen hour, location, latitude, and longitude.",
    files: ["frontend/app/dashboard/page.tsx", "frontend/lib/api.ts", "backend/app/routes/prediction.py"],
    functions: ["getPrediction", "predict"],
    endpoints: ["GET /predict"],
    notes: [
      "FastAPI validates the hour and geo bounds before handing off to PredictorService.",
      "The route is the main runtime entrypoint for a single analysis run.",
    ],
  },
  {
    title: "4. Build features and score the models",
    summary:
      "PredictorService loads the saved model artifact, build_features creates temporal and geographic features, and the demand and supply models score the request.",
    files: ["backend/app/services/predictor.py", "backend/app/services/preprocess.py", "models/train_model.py"],
    functions: ["PredictorService.predict", "build_features"],
    endpoints: [],
    notes: [
      "The service aligns the generated frame to the artifact feature_columns when they exist.",
      "Predictions are clipped at zero before the gap is computed.",
    ],
  },
  {
    title: "5. Produce the explanation layer",
    summary:
      "InsightService turns the numeric gap into severity, explanation strings, and recommended actions using the threshold rules and peak-hour logic.",
    files: ["backend/app/services/insights_service.py"],
    functions: ["InsightService.generate"],
    endpoints: [],
    notes: [
      "Gap thresholds drive the severity labels high, medium, low, and balanced.",
      "Peak hours and low driver availability can add extra explanation text and recommendations.",
    ],
  },
  {
    title: "6. Persist the result and refresh analytics",
    summary:
      "The dashboard posts the prediction snapshot to MongoDB, then loads hourly trends, location trends, and model validation metrics in parallel.",
    files: [
      "frontend/app/dashboard/page.tsx",
      "frontend/lib/api.ts",
      "backend/app/routes/prediction.py",
      "backend/app/services/history_service.py",
      "backend/app/services/analytics_service.py",
      "backend/app/services/validation_service.py",
      "backend/app/db/mongo.py",
    ],
    functions: ["storePrediction", "getHourlyTrends", "getLocationTrends", "getModelValidation"],
    endpoints: [
      "POST /store-prediction",
      "GET /analytics/hourly-trends",
      "GET /analytics/location-trends",
      "GET /analytics/model-validation",
    ],
    notes: [
      "HistoryService writes to the predictions collection and uses the shared MongoDB client.",
      "AnalyticsService aggregates stored predictions to compute shortages and hotspots.",
      "ValidationService scores the model against data/ride_data.csv and returns anomaly notes.",
    ],
  },
  {
    title: "7. Render the operational view",
    summary:
      "PredictionCard, MapView, TrendCharts, and the validation monitor turn the API responses into an analyst-friendly dashboard.",
    files: [
      "frontend/app/dashboard/page.tsx",
      "frontend/components/PredictionCard.tsx",
      "frontend/components/MapView.tsx",
      "frontend/components/TrendCharts.tsx",
    ],
    functions: ["PredictionCard", "MapView", "BarTrendChart", "LineTrendChart", "DualLineTrendChart"],
    endpoints: [],
    notes: [
      "MapView renders OpenStreetMap tiles through react-leaflet.",
      "The dashboard also prepares a map center from the resolved location coordinates and any returned hotspots.",
    ],
  },
  {
    title: "8. Refresh the offline model lifecycle",
    summary:
      "The data generator expands ride_data.csv and train_model.py produces the model.pkl artifact used by PredictorService.",
    files: ["data/generate_ride_data.js", "models/train_model.py", "models/model.pkl", "data/ride_data.csv"],
    functions: ["main", "train"],
    endpoints: [],
    notes: [
      "This is a manual maintenance path, not an automatic background job.",
      "Validation reads the same dataset path that the training pipeline uses.",
    ],
  },
] as const;

export const workflowDiagramNodes: Node<WorkflowNodeData>[] = [
  {
    id: "user-input",
    type: "workflowNode",
    position: { x: 0, y: 0 },
    data: {
      title: "User input",
      summary: "Select an hour, type a location, and adjust the map pin if needed.",
      codeRef: "frontend/components/InputForm.tsx",
      details: ["Hour slider", "Location search", "Map pin override"],
      category: "frontend",
    },
  },
  {
    id: "location-resolver",
    type: "workflowNode",
    position: { x: 460, y: -100 },
    data: {
      title: "Location resolver",
      summary: "Normalizes the input and resolves stable coordinates from the local location dictionary.",
      codeRef: "frontend/lib/location-coordinates.ts",
      details: ["findLocationMatches", "resolveLocationCoordinates", "getLocationCoordinates"],
      category: "frontend",
    },
  },
  {
    id: "dashboard-router",
    type: "workflowNode",
    position: { x: 880, y: 20 },
    data: {
      title: "Dashboard router",
      summary: "Pushes the request into /dashboard with query parameters.",
      codeRef: "frontend/app/page.tsx",
      details: ["useRouter", "handleSubmit"],
      category: "frontend",
    },
  },
  {
    id: "predict-route",
    type: "workflowNode",
    position: { x: 1300, y: 60 },
    data: {
      title: "GET /predict",
      summary: "Validates the query and hands the request to PredictorService.",
      codeRef: "backend/app/routes/prediction.py",
      details: ["hour validation", "latitude and longitude bounds", "FastAPI dependency injection"],
      category: "backend",
    },
  },
  {
    id: "feature-builder",
    type: "workflowNode",
    position: { x: 1750, y: -100 },
    data: {
      title: "Feature builder",
      summary: "Adds time and location features before the model scores the request.",
      codeRef: "backend/app/services/preprocess.py",
      details: ["hour_sin", "hour_cos", "is_peak_hour", "location_bucket", "geo_cluster"],
      category: "backend",
    },
  },
  {
    id: "predictor-service",
    type: "workflowNode",
    position: { x: 2240, y: 40 },
    data: {
      title: "PredictorService",
      summary: "Loads model.pkl, aligns the feature columns, and scores demand and supply.",
      codeRef: "backend/app/services/predictor.py",
      details: ["joblib load", "clamp to zero", "gap = demand - supply"],
      category: "backend",
    },
  },
  {
    id: "insight-service",
    type: "workflowNode",
    position: { x: 2760, y: -100 },
    data: {
      title: "InsightService",
      summary: "Turns the numeric gap into severity, explanations, and recommendations.",
      codeRef: "backend/app/services/insights_service.py",
      details: ["gap thresholds", "peak hour rules", "weekend context", "low supply checks"],
      category: "analytics",
    },
  },
  {
    id: "prediction-card",
    type: "workflowNode",
    position: { x: 3280, y: 40 },
    data: {
      title: "Prediction payload",
      summary: "Returns demand, supply, gap, severity, explanations, and recommendations to the dashboard.",
      codeRef: "frontend/app/dashboard/page.tsx",
      details: ["PredictionResult", "PredictionCard"],
      category: "frontend",
    },
  },
  {
    id: "store-prediction",
    type: "workflowNode",
    position: { x: 360, y: 460 },
    data: {
      title: "POST /store-prediction",
      summary: "Persists the completed analysis snapshot to MongoDB.",
      codeRef: "backend/app/routes/prediction.py",
      details: ["Backfills missing explanations", "Backfills missing recommendations"],
      category: "backend",
    },
  },
  {
    id: "history-service",
    type: "workflowNode",
    position: { x: 880, y: 420 },
    data: {
      title: "HistoryService",
      summary: "Inserts and reads stored prediction records.",
      codeRef: "backend/app/services/history_service.py",
      details: ["insert_one", "find().sort().limit()"],
      category: "backend",
    },
  },
  {
    id: "mongo-db",
    type: "workflowNode",
    position: { x: 1300, y: 480 },
    data: {
      title: "MongoDB predictions collection",
      summary: "Stores prediction history and supports aggregation queries.",
      codeRef: "backend/app/db/mongo.py",
      details: ["timestamp index", "location/hour index", "gap indexes"],
      category: "database",
    },
  },
  {
    id: "analytics-service",
    type: "workflowNode",
    position: { x: 1720, y: 660 },
    data: {
      title: "AnalyticsService",
      summary: "Builds hourly trends, location trends, and hotspot summaries from stored predictions.",
      codeRef: "backend/app/services/analytics_service.py",
      details: ["aggregate pipelines", "shortage thresholds", "time-series retrieval"],
      category: "analytics",
    },
  },
  {
    id: "validation-service",
    type: "workflowNode",
    position: { x: 2140, y: 440 },
    data: {
      title: "ValidationService",
      summary: "Scores the model against data/ride_data.csv and emits MAE, RMSE, and anomaly notes.",
      codeRef: "backend/app/services/validation_service.py",
      details: ["feature frame rebuild", "anomaly detection", "dataset sampling"],
      category: "analytics",
    },
  },
  {
    id: "dashboard-views",
    type: "workflowNode",
    position: { x: 2960, y: 550 },
    data: {
      title: "Dashboard views",
      summary: "PredictionCard, MapView, TrendCharts, and validation panels render the returned data.",
      codeRef: "frontend/components/*",
      details: ["Charts", "Map overlay", "Validation monitor"],
      category: "frontend",
    },
  },
  {
    id: "osm-tiles",
    type: "workflowNode",
    position: { x: 3380, y: 860 },
    data: {
      title: "OpenStreetMap tiles",
      summary: "Leaflet pulls map tiles for the preview map and the result map.",
      codeRef: "frontend/components/CoordinateMapPreview.tsx",
      details: ["react-leaflet", "tile server URL"],
      category: "external",
    },
  },
  {
    id: "data-generator",
    type: "workflowNode",
    position: { x: 880, y: 800 },
    data: {
      title: "generate_ride_data.js",
      summary: "Expands ride_data.csv with additional synthetic rows across India and Andhra Pradesh.",
      codeRef: "data/generate_ride_data.js",
      details: ["Andhra Pradesh districts", "Chittoor areas", "10,000 generated rows"],
      category: "offline",
    },
  },
  {
    id: "train-model",
    type: "workflowNode",
    position: { x: 1720, y: 1050 },
    data: {
      title: "train_model.py",
      summary: "Builds the feature matrix, trains the demand and supply regressors, and saves model.pkl.",
      codeRef: "models/train_model.py",
      details: ["RandomForestRegressor", "feature_columns", "joblib dump"],
      category: "offline",
    },
  },
  {
    id: "model-artifact",
    type: "workflowNode",
    position: { x: 2560, y: 1000 },
    data: {
      title: "models/model.pkl",
      summary: "Serialized artifact loaded by PredictorService at runtime.",
      codeRef: "models/model.pkl",
      details: ["demand_model", "supply_model", "feature_columns"],
      category: "offline",
    },
  },
] as const;

export const workflowDiagramEdges: WorkflowEdgeSpec[] = [
  { id: "edge-input-resolver", source: "user-input", target: "location-resolver", label: "typed location", kind: "primary" },
  { id: "edge-resolver-router", source: "location-resolver", target: "dashboard-router", label: "resolved coordinates", kind: "primary" },
  { id: "edge-router-predict", source: "dashboard-router", target: "predict-route", label: "GET /predict", kind: "primary" },
  { id: "edge-predict-feature", source: "predict-route", target: "feature-builder", label: "validate + derive features", kind: "primary" },
  { id: "edge-feature-predictor", source: "feature-builder", target: "predictor-service", label: "feature frame", kind: "primary" },
  { id: "edge-predictor-insight", source: "predictor-service", target: "insight-service", label: "demand, supply, gap", kind: "primary" },
  { id: "edge-insight-payload", source: "insight-service", target: "prediction-card", label: "severity + text", kind: "primary" },
  { id: "edge-payload-store", source: "prediction-card", target: "store-prediction", label: "storePrediction()", kind: "supporting" },
  { id: "edge-store-history", source: "store-prediction", target: "history-service", label: "POST /store-prediction", kind: "primary" },
  { id: "edge-history-mongo", source: "history-service", target: "mongo-db", label: "insert_one / find", kind: "primary" },
  { id: "edge-mongo-analytics", source: "mongo-db", target: "analytics-service", label: "aggregate pipelines", kind: "primary" },
  { id: "edge-mongo-validation", source: "mongo-db", target: "validation-service", label: "dataset-linked checks", kind: "supporting" },
  { id: "edge-analytics-dashboard", source: "analytics-service", target: "dashboard-views", label: "hourly + location trends", kind: "primary" },
  { id: "edge-validation-dashboard", source: "validation-service", target: "dashboard-views", label: "MAE / RMSE / anomalies", kind: "primary" },
  { id: "edge-dashboard-osm", source: "dashboard-views", target: "osm-tiles", label: "Leaflet tiles", kind: "supporting" },
  { id: "edge-generator-train", source: "data-generator", target: "train-model", label: "ride_data.csv", kind: "offline" },
  { id: "edge-train-artifact", source: "train-model", target: "model-artifact", label: "joblib dump", kind: "offline" },
  { id: "edge-artifact-predictor", source: "model-artifact", target: "predictor-service", label: "MODEL_PATH", kind: "offline" },
] as const;
