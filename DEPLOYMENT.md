# Kapido Deployment Guide

## Backend (Render)

### Prerequisites
- Render account with git repository connected
- MongoDB Atlas cluster (free tier OK)

### Step 1: Deploy Backend Service

1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service:
   - **Root Directory**: `backend`
   - **Runtime**: Python
   - **Build Command**: `python -m pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. Set Environment Variables in Render dashboard:
   ```
   PYTHON_VERSION=3.12.9
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=kapido
   MONGODB_COLLECTION=predictions
   ALLOWED_ORIGINS=https://your-kapido-app.vercel.app,http://localhost:3000
   MODEL_PATH=/var/data/model.pkl  # (if using persistent disk for model file)
   ```

5. Save and deploy. Note the backend URL: `https://kapido-backend.onrender.com`

### Step 2: Model File Setup (Optional)

If your model.pkl is not in the repository:

1. Create a Render Persistent Disk (see Render docs)
2. Upload model.pkl to `/var/data/model.pkl`
3. Set `MODEL_PATH=/var/data/model.pkl` in env vars

**Note**: If model is missing, the API returns HTTP 503 with a clear message instead of crashing.

---

## Frontend (Vercel)

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel

### Step 1: Deploy Frontend

1. Go to [vercel.com](https://vercel.com)
2. Import your repository (GitHub sync)
3. Select "Frontend" as root directory
4. Vercel auto-detects Next.js 16

### Step 2: Set Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_API_BASE_URL=https://kapido-backend.onrender.com
```

**Replace `kapido-backend.onrender.com` with your actual Render backend URL.**

### Step 3: Deploy

Push to main branch or manually trigger deploy in Vercel dashboard.

---

## Troubleshooting

### Frontend API Timeout (AxiosError: timeout of 10000ms exceeded)

**Problem**: Frontend can't reach backend or backend is slow.

**Check**:
1. Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly in Vercel dashboard
2. Test backend health: `curl https://kapido-backend.onrender.com/health`
3. Wait 30-60s for Render free tier to spin up (cold start)
4. Check Render logs for errors

### CSS Preload Warning

**Browser console**: "The resource ... was preloaded using link preload but not used within a few seconds"

**Cause**: Minor Next.js 16 + Tailwind v4 optimization. **Not critical.**

**Solution**: Ignore (this is a known issue with Tailwind v4 in Next.js and does not affect functionality).

### Model Not Found (HTTP 503)

**Problem**: `GET /predict` returns 503 "Model artifact is not available"

**Cause**: `model.pkl` not found at `MODEL_PATH`.

**Solution**:
1. Train model: `python models/train_model.py` (creates `models/model.pkl`)
2. Upload to Render (persistent disk) or commit to repo (if small)
3. Set `MODEL_PATH` env var to correct location
4. Redeploy backend

---

## Local Development

### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Create .env in backend/
MONGODB_URI=your_mongodb_uri
ALLOWED_ORIGINS=http://localhost:3000

# Train model first
python models/train_model.py

# Run backend
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`

### Frontend

```powershell
cd frontend

# Create .env.local from template
copy .env.local.template .env.local

npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Environment Variables Summary

### Backend (set in Render dashboard)
| Variable | Example | Required |
|----------|---------|----------|
| PYTHON_VERSION | 3.12.9 | Yes |
| MONGODB_URI | `mongodb+srv://...` | Yes |
| MONGODB_DB | kapido | Yes |
| MONGODB_COLLECTION | predictions | Yes |
| ALLOWED_ORIGINS | `https://app.vercel.app,http://localhost:3000` | Yes |
| MODEL_PATH | `/var/data/model.pkl` | Yes |

### Frontend (set in Vercel dashboard)
| Variable | Example | Required |
|----------|---------|----------|
| NEXT_PUBLIC_API_BASE_URL | `https://kapido-backend.onrender.com` | Yes |

---

## Production Checklist

- [ ] Backend deployed on Render with Python 3.12.9
- [ ] MongoDB Atlas URI set in backend env vars
- [ ] Model file uploaded or trained on Render
- [ ] Frontend deployed on Vercel
- [ ] Frontend `NEXT_PUBLIC_API_BASE_URL` points to Render backend
- [ ] CORS `ALLOWED_ORIGINS` includes frontend URL
- [ ] Test `/health` endpoint returns `{"status": "ok"}`
- [ ] Test `/predict` endpoint with sample request
- [ ] Monitor Render and Vercel logs for errors
