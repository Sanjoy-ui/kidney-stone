# FastAPI Kidney Stone Detection Server

This FastAPI server provides endpoints for kidney stone detection using the trained CNN model.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python fastapi_server.py
```

The API will start at `http://localhost:8000`

### 3. Access API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
```bash
GET /health
```
Returns server and model status.

### Get API Info
```bash
GET /info
```
Returns API version, model details, and available endpoints.

### Single Image Prediction
```bash
POST /predict
Content-Type: multipart/form-data

Body:
- file: <image file>
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "label": "Stone" or "No Stone",
    "probability": 0.85,
    "confidence": 85.0
  },
  "timestamp": "2026-04-23T12:34:56.789123"
}
```

### Batch Prediction
```bash
POST /predict-batch
Content-Type: multipart/form-data

Body:
- files: <multiple image files>
```

**Response:**
```json
{
  "success": true,
  "processed_count": 3,
  "total_count": 3,
  "results": [
    {
      "filename": "image1.jpg",
      "success": true,
      "prediction": {
        "label": "Stone",
        "probability": 0.92,
        "confidence": 92.0
      }
    }
  ],
  "timestamp": "2026-04-23T12:34:56.789123"
}
```

## Usage Examples

### Using cURL
```bash
# Single image prediction
curl -X POST "http://localhost:8000/predict" \
  -F "file=@/path/to/image.jpg"

# Batch prediction
curl -X POST "http://localhost:8000/predict-batch" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg"

# Health check
curl http://localhost:8000/health

# Get API info
curl http://localhost:8000/info
```

### Using Python
```python
import requests

# Single prediction
with open("image.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post("http://localhost:8000/predict", files=files)
    print(response.json())

# Batch prediction
with open("image1.jpg", "rb") as f1, open("image2.jpg", "rb") as f2:
    files = {"files": [f1, f2]}
    response = requests.post("http://localhost:8000/predict-batch", files=files)
    print(response.json())
```

### From Node.js Backend
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Single image prediction
const predictImage = async (imagePath) => {
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));
  
  const response = await axios.post(
    'http://localhost:8000/predict',
    form,
    { headers: form.getHeaders() }
  );
  
  return response.data;
};

// Usage
predictImage('/path/to/image.jpg')
  .then(result => console.log(result))
  .catch(err => console.error(err));
```

## Configuration

### Change Server Port
Edit the `fastapi_server.py` file and modify the `port` parameter in the `if __name__ == "__main__":` block:

```python
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,  # Change this
        log_level="info"
    )
```

### Change CORS Settings
Modify the `allow_origins` in the middleware for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Successful prediction
- `400`: Bad request (invalid image format, etc.)
- `500`: Server error (model loading issue, etc.)

All errors include a `detail` field with error information.

## Performance Notes

- Model inference time: ~1-2 seconds per image
- Maximum file size: 25MB (default FastAPI limit)
- Supported formats: JPG, JPEG, PNG

## Troubleshooting

### Model Not Found
```
Error loading model: Model not found at .../best_model.h5
```
Solution: Train the model first using `train_cnn.py`

### Port Already in Use
```
Address already in use
```
Solution: Change the port number or kill the process using the port

### CORS Error
If you get CORS errors from frontend, ensure the `allow_origins` is configured correctly for your domain.

## Running in Production

For production deployment:

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker fastapi_server:app --bind 0.0.0.0:8000
```

## License
Same as the main project.
