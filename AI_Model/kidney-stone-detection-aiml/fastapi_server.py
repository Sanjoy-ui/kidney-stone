from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import tempfile
from pathlib import Path
import uvicorn
import sys
from datetime import datetime

# Add src directory to path
sys.path.append(str(Path(__file__).parent / 'src'))

from predict_image import get_stone_detector

app = FastAPI(
    title="Kidney Stone Detection API",
    description="API for detecting kidney stones in ultrasound images using CNN",
    version="1.0.0"
)

# Add CORS middleware to allow requests from Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (configure as needed)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the detector at startup
detector = None

@app.on_event("startup")
async def startup_event():
    global detector
    try:
        detector = get_stone_detector()
        print("✅ Model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint - API status"""
    return {
        "status": "running",
        "service": "Kidney Stone Detection API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": detector is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Predict kidney stone presence in an ultrasound image.

    Request:
    - file: Image file (jpg, jpeg, png)

    Response:
    - label: 'Stone' or 'No Stone'
    - probability: Raw probability value (0-1)
    - confidence: Confidence percentage (0-100)
    - heatmap_overlay: Base64 data URL of Grad-CAM attention heatmap overlay
    - raw_heatmap: Base64 data URL of raw Jet colormap
    - gradcam_layer: Last convolutional layer utilized (e.g. out_relu)
    """

    if detector is None:
        raise HTTPException(
            status_code=500,
            detail="Model not loaded. Please check server logs."
        )

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {allowed_types}"
        )

    try:
        # Create a temporary file to save the uploaded image
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
            # Save the uploaded file
            shutil.copyfileobj(file.file, tmp_file)
            temp_path = tmp_file.name

        # Make prediction with Grad-CAM visualization
        result = detector.predict(temp_path, include_gradcam=True)

        # Clean up temporary file
        Path(temp_path).unlink()

        # Check for errors during prediction
        if 'error' in result and result['error']:
            raise HTTPException(
                status_code=400,
                detail=f"Prediction error: {result['error']}"
            )

        gradcam_info = result.get('gradcam', {})

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "prediction": {
                    "label": result['label'],
                    "probability": result['probability'],
                    "confidence": result['confidence'],
                    "heatmap_overlay": gradcam_info.get("overlay_image"),
                    "raw_heatmap": gradcam_info.get("raw_heatmap"),
                    "gradcam_layer": gradcam_info.get("layer_used"),
                    "gradcam_success": gradcam_info.get("success", False)
                },
                "timestamp": datetime.now().isoformat()
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during prediction: {str(e)}"
        )

@app.post("/predict-batch")
async def predict_batch(files: list[UploadFile] = File(...)):
    """
    Predict kidney stone presence in multiple ultrasound images.

    Request:
    - files: List of image files (jpg, jpeg, png)

    Response:
    - results: List of predictions for each image
    - processed_count: Number of successfully processed images
    """

    if detector is None:
        raise HTTPException(
            status_code=500,
            detail="Model not loaded. Please check server logs."
        )

    results = []
    processed_count = 0

    for file in files:
        try:
            # Validate file type
            allowed_types = {"image/jpeg", "image/png", "image/jpg"}
            if file.content_type not in allowed_types:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": f"Invalid file type. Allowed: {allowed_types}"
                })
                continue

            # Create a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
                shutil.copyfileobj(file.file, tmp_file)
                temp_path = tmp_file.name

            # Make prediction
            result = detector.predict(temp_path)

            # Clean up
            Path(temp_path).unlink()

            if 'error' in result and result['error']:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": result['error']
                })
            else:
                results.append({
                    "filename": file.filename,
                    "success": True,
                    "prediction": {
                        "label": result['label'],
                        "probability": result['probability'],
                        "confidence": result['confidence']
                    }
                })
                processed_count += 1

        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })

    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "processed_count": processed_count,
            "total_count": len(files),
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.get("/info")
async def get_info():
    """Get API and model information"""
    return {
        "service": "Kidney Stone Detection API",
        "version": "1.0.0",
        "model": "MobileNetV2 (fine-tuned)",
        "input_size": "224x224 pixels",
        "classes": ["No Stone", "Stone"],
        "threshold": 0.5,
        "endpoints": {
            "/predict": "POST - Single image prediction",
            "/predict-batch": "POST - Multiple images prediction",
            "/health": "GET - Health check",
            "/info": "GET - API information"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
