# FastAPI Integration Guide - Kidney Stone Detection

## Project Architecture

```
Backend (Node.js - Express)  ←→  FastAPI (Python)  ←→  ML Model (TensorFlow)
├─ /api/v1/predict                 ├─ /predict           └─ best_model.h5
└─ HTTP Request                     └─ HTTP Response
```

## 📋 Setup Instructions

### Step 1: Install FastAPI Dependencies

```bash
cd AI_Model/kidney-stone-detection-aiml

# Install all required packages
pip install -r requirements.txt
```

### Step 2: Verify Model Files

Ensure the trained model exists:
```bash
ls -la models/best_model.h5
```

If the model doesn't exist, train it first:
```bash
python3 train_cnn.py
```

### Step 3: Start the FastAPI Server

**Option A: Using shell script (Recommended)**
```bash
./run_fastapi.sh
# Or with custom port:
./run_fastapi.sh 8001
```

**Option B: Direct Python**
```bash
python3 fastapi_server.py
```

The server will start at `http://localhost:8000`

### Step 4: Verify API is Running

Open in browser or use curl:
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2026-04-23T12:34:56.789123"
}
```

## 🔌 Backend Integration

### In Your Node.js Backend

#### 1. Install Required Package
```bash
cd backend
npm install form-data axios
```

#### 2. Create ML API Client Module

Create `backend/utils/mlClient.js`:

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

class MLClient {
  static async predictImage(imagePath) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(imagePath));

      const response = await axios.post(`${ML_API_URL}/predict`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });

      return {
        success: true,
        data: response.data.prediction,
      };
    } catch (error) {
      console.error('ML API Error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async checkHealth() {
    try {
      const response = await axios.get(`${ML_API_URL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = MLClient;
```

#### 3. Create API Route in Backend

Create/Update `backend/routes/predict.route.js`:

```javascript
import express from 'express';
import MLClient from '../utils/mlClient.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/v1/predict
 * Predict kidney stone in uploaded image
 */
router.post('/stone', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Call ML API
    const prediction = await MLClient.predictImage(req.file.path);

    if (!prediction.success) {
      return res.status(500).json({ error: prediction.error });
    }

    // Return prediction to frontend
    res.json({
      success: true,
      prediction: prediction.data,
      message: prediction.data.label === 'Stone' 
        ? '⚠️ Kidney Stone Detected!' 
        : '✅ No Stone Detected'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### 4. Register Route in `index.js`

```javascript
import predictRouter from "./routes/predict.route.js";

// ... existing code ...

app.use("/api/v1/predict", predictRouter);
```

#### 5. Add ML_API_URL to `.env`

```env
ML_API_URL=http://localhost:8000
```

### Usage Flow

```
1. Frontend uploads image → Node.js Backend
2. Backend saves image to /uploads
3. Backend calls FastAPI with image
4. FastAPI:
   - Loads image
   - Preprocesses (224x224)
   - Runs through CNN model
   - Returns prediction JSON
5. Backend sends result to Frontend
6. Frontend displays result to user
```

## 📊 Response Format

### Successful Prediction
```json
{
  "success": true,
  "prediction": {
    "label": "Stone",
    "probability": 0.92,
    "confidence": 92.0
  },
  "timestamp": "2026-04-23T12:34:56.789123"
}
```

### Error Response
```json
{
  "detail": "Invalid file type. Allowed: {'image/jpeg', 'image/png', 'image/jpg'}"
}
```

## 🧪 Testing

### Test with cURL
```bash
# Single image
curl -X POST "http://localhost:8000/predict" \
  -F "file=@test_image.jpg"

# Batch
curl -X POST "http://localhost:8000/predict-batch" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg"
```

### Test with Python
```python
import requests

with open("test_image.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post("http://localhost:8000/predict", files=files)
    print(response.json())
```

### Test with Node.js
```javascript
const MLClient = require('./utils/mlClient');

MLClient.predictImage('./test_image.jpg')
  .then(result => console.log(result))
  .catch(err => console.error(err));
```

## ⚙️ Configuration

### Environment Variables

```env
# In backend/.env
ML_API_URL=http://localhost:8000
ML_API_TIMEOUT=30000

# In AI_Model/.env (optional)
PORT=8000
LOG_LEVEL=info
```

### Port Configuration

To run FastAPI on different port:

```bash
# Edit fastapi_server.py
# Change: port=8000 to desired port

./run_fastapi.sh 8001
```

Then update backend `.env`:
```env
ML_API_URL=http://localhost:8001
```

## 🚀 Production Deployment

### Using Gunicorn + Uvicorn

```bash
# Install gunicorn
pip install gunicorn

# Run with multiple workers
gunicorn -w 4 -k uvicorn.workers.UvicornWorker \
  fastapi_server:app \
  --bind 0.0.0.0:8000 \
  --access-logfile -
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "fastapi_server.py"]
```

Build and run:
```bash
docker build -t kidney-stone-api .
docker run -p 8000:8000 kidney-stone-api
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Model not found` | Run `python3 train_cnn.py` to train model |
| `Port already in use` | Use different port: `./run_fastapi.sh 8001` |
| `Module not found` | Install dependencies: `pip install -r requirements.txt` |
| `CORS error` | Ensure `allow_origins` includes your backend URL |
| `Timeout error` | Model inference is slow, increase timeout to 60000ms |

## 📝 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check |
| GET | `/info` | API information |
| POST | `/predict` | Single image prediction |
| POST | `/predict-batch` | Multiple images prediction |

## 📚 Documentation

- FastAPI Docs: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`

## ✅ Checklist

- [ ] Python 3.8+ installed
- [ ] TensorFlow and dependencies installed
- [ ] Model file exists at `models/best_model.h5`
- [ ] FastAPI server running on port 8000
- [ ] Node.js backend can reach FastAPI
- [ ] ML_API_URL configured in `.env`
- [ ] Test prediction working end-to-end

## 📞 Support

For issues:
1. Check server logs: `tail -f /path/to/logs/`
2. Verify API health: `curl http://localhost:8000/health`
3. Check model exists: `ls -la models/best_model.h5`
4. Verify connectivity: `curl http://localhost:8000/docs`
