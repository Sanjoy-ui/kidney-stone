import numpy as np
from pathlib import Path
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# Constants
IMG_SIZE = (224, 224)
THRESHOLD = 0.5  # Probability threshold for classification

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "best_model.h5"

class KidneyStoneDetector:
    """A class to handle kidney stone detection on images."""
    
    def __init__(self, model_path=MODEL_PATH):
        """Initialize the detector with the trained model."""
        self.model = self._load_model(model_path)
        self.class_names = ['No Stone', 'Stone']
    
    def _load_model(self, model_path):
        """Load the pre-trained model."""
        if not model_path.exists():
            raise FileNotFoundError(
                f"❌ Model not found at {model_path}. "
                "Please train the model first using train_cnn.py"
            )
        return load_model(model_path)
    
    def preprocess_image(self, img_path):
        """Load and preprocess the image for prediction."""
        # Load and resize image
        img = image.load_img(img_path, target_size=IMG_SIZE)
        
        # Convert to array and preprocess
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        
        return img_array
    
    def predict(self, img_path):
        """Make a prediction on a single image."""
        try:
            # Preprocess the image
            processed_img = self.preprocess_image(img_path)
            
            # Make prediction
            prediction = self.model.predict(processed_img, verbose=0)
            probability = float(prediction[0][0])
            
            # Determine class and confidence
            if probability > THRESHOLD:
                label = self.class_names[1]  # Stone
                confidence = probability
            else:
                label = self.class_names[0]  # No Stone
                confidence = 1.0 - probability
            
            return {
                'label': label,
                'probability': float(probability),
                'confidence': float(confidence) * 100  # as percentage
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'label': 'Error',
                'probability': 0.0,
                'confidence': 0.0
            }

def main():
    """Command-line interface for prediction."""
    import argparse
    
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Detect kidney stones in an image.')
    parser.add_argument('image_path', type=str, help='Path to the image file')
    args = parser.parse_args()
    
    try:
        # Initialize detector
        detector = KidneyStoneDetector()
        
        # Make prediction
        result = detector.predict(args.image_path)
        
        # Print results
        if 'error' in result:
            print(f"❌ Error: {result['error']}")
        else:
            print(f"\n🔍 Prediction Results:")
            print(f"   - Status: {result['label']}")
            print(f"   - Confidence: {result['confidence']:.2f}%")
            print(f"   - Raw Probability: {result['probability']:.4f}")
            
    except Exception as e:
        print(f"❌ An error occurred: {str(e)}")
        print("💡 Make sure you've trained the model first using train_cnn.py")

_CACHED_DETECTOR = None


# For Streamlit integration
def get_stone_detector():
    """Get a pre-configured detector instance for Streamlit."""
    global _CACHED_DETECTOR
    if _CACHED_DETECTOR is None:
        _CACHED_DETECTOR = KidneyStoneDetector()
    return _CACHED_DETECTOR

if __name__ == "__main__":
    main()