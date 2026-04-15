# Kapido

Kapido is a production-ready ride demand-supply mismatch analysis platform.

It predicts ride demand, estimates driver supply, computes the gap (`Demand - Supply`), and visualizes shortage zones on a map.

## Tech Stack

- Frontend: Next.js App Router, Tailwind CSS, Axios, Leaflet (react-leaflet)
- Backend: FastAPI, Uvicorn
- Machine Learning: scikit-learn, pandas, numpy, joblib
- Database: MongoDB Atlas (free tier) via PyMongo
- Hosting: Vercel (frontend), Render or Railway (backend), MongoDB Atlas

## Project Structure

```txt
kapido/
├── backend/
│   ├── app/
│   │   ├── db/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── .env.local.example
├── models/
│   ├── train_model.py
│   ├── predict.py
│   └── model.pkl (generated)
├── data/
│   └── ride_data.csv
├── notebooks/
└── README.md
```

## 1. ML Training

Train the model artifact (`models/model.pkl`) before running the backend.

```bash
cd models
python train_model.py
```

Training pipeline includes:
- Missing value handling (median/most-frequent imputation)
- Feature engineering columns: `hour`, `day_of_week`, `location`, `latitude`, `longitude`
- Baseline model: Linear Regression
- Advanced model: Random Forest Regressor
- Evaluation metrics: RMSE and MAE
- Export: joblib artifact at `models/model.pkl`

## 2. Backend Setup (FastAPI)

Prerequisite:
- Use Python 3.11, 3.12, or 3.13 for backend setup. Python 3.14 currently causes `scikit-learn`/`scipy` source-build failures on Windows in this stack.

```bash
cd backend
# Recommended on Windows (creates a 3.12 venv)
py -3.12 -m venv .venv
# Or if `python` already points to 3.11-3.13:
# python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

Create environment file:

```bash
cp .env.example .env
```

Configure `.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=kapido
MONGODB_COLLECTION=predictions
MODEL_PATH=../models/model.pkl
ALLOWED_ORIGINS=http://localhost:3000
```

Run backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Backend API Endpoints

- `GET /predict?hour=8&location=downtown&latitude=12.97&longitude=77.59`
  - Response:
  ```json
  {
    "demand": 123.45,
    "supply": 98.76,
    "gap": 24.69,
    "severity": "medium",
    "explanations": ["Demand currently exceeds active driver supply."],
    "recommendations": ["Reposition nearby idle drivers toward downtown."]
  }
  ```

- `POST /store-prediction`
  - Body:
  ```json
  {
    "timestamp": "2026-04-07T09:30:00.000Z",
    "hour": 8,
    "location": "downtown",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "demand": 123.45,
    "supply": 98.76,
    "gap": 24.69
  }
  ```

- `GET /history?limit=100`
  - Returns historical prediction records from MongoDB

- `GET /analytics/hourly-trends?limit_hours=24`
  - Returns hourly average demand, supply, gap, and shortage rate

- `GET /analytics/location-trends?min_occurrences=2`
  - Returns location hotspots and severity levels

- `GET /analytics/day-of-week`
  - Returns day-wise mismatch trends and peak shortage days

- `GET /analytics/gap-distribution?limit=10000`
  - Returns shortage distribution buckets and gap percentiles (P50/P90/P95)

- `GET /analytics/time-series?limit=500`
  - Returns chronological demand/supply/gap points for timeline charts

- `GET /analytics/model-validation?max_rows=1500`
  - Returns MAE/RMSE and anomaly checks on the model artifact

## 3. Frontend Setup (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Configure `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Run frontend:

```bash
npm run dev
```

Open `http://localhost:3000`

## 4. MongoDB Atlas Setup (Free Tier)

1. Create a free cluster in MongoDB Atlas.
2. Create a database user.
3. Add your IP to Network Access.
4. Copy the connection string.
5. Put it in `backend/.env` as `MONGODB_URI`.

### Collection

`predictions`

Document shape:

```json
{
  "timestamp": "Date",
  "hour": 8,
  "location": "downtown",
  "demand": 123.45,
  "supply": 98.76,
  "gap": 24.69
}
```

## 5. Deployment (Free)

### Frontend on Vercel

1. Push repository to GitHub.
2. Import `frontend` as project in Vercel.
3. Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://<your-backend-url>`
4. Deploy.

### Backend on Render

1. Create a new Web Service from GitHub repo.
2. Root directory: `backend`
3. Build command:
   - `pip install -r requirements.txt`
4. Start command:
   - `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars from `backend/.env.example`.

### Alternative: Railway

- Set service root to `backend`
- Use same install/start commands as above
- Add identical environment variables

## 6. Reproducibility Notes

- Use pinned versions in `backend/requirements.txt`.
- Keep `data/ride_data.csv` and retrain by running `python models/train_model.py`.
- Commit generated `models/model.pkl` if deterministic deployment is preferred.
- For production-grade model iteration, version model artifacts (e.g., timestamped `.pkl` files).

## 7. Development Workflow

1. Train model.
2. Start FastAPI backend.
3. Start Next.js frontend.
4. Run predictions from home page.
5. Review dashboard metrics and map heat zones.
6. Inspect stored history from `GET /history`.
