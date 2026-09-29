import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

# Constants
IMG_SIZE = (224, 224)
BATCH_SIZE = 32

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
TEST_DIR = DATA_DIR / "test"

# Class names
CLASS_NAMES = ['no_stone', 'stone']

def load_test_data():
    """Load and preprocess test data."""
    print("📊 Loading test data...")
    
    # Create test data generator (only rescaling, no augmentation)
    test_datagen = ImageDataGenerator(rescale=1./255)
    
    test_generator = test_datagen.flow_from_directory(
        TEST_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary',
        shuffle=False  # Important: don't shuffle for consistent evaluation
    )
    
    return test_generator

def load_trained_model():
    """Load the pre-trained model."""
    model_path = MODEL_DIR / 'best_model.h5'
    
    if not model_path.exists():
        raise FileNotFoundError(
            f"❌ Model not found at {model_path}. "
            "Please train the model first using train_cnn.py"
        )
    
    print(f"🔍 Loading model from {model_path}...")
    return load_model(model_path)

def plot_confusion_matrix(y_true, y_pred, class_names):
    """Plot and save confusion matrix."""
    # Calculate confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    
    # Create figure
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=class_names,
        yticklabels=class_names
    )
    
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    
    # Save the figure
    output_path = MODEL_DIR / 'confusion_matrix_eval.png'
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    
    return output_path

def save_evaluation_report(y_true, y_pred, class_names, accuracy, output_path):
    """Save evaluation metrics to a text file."""
    # Generate classification report
    report = classification_report(y_true, y_pred, target_names=class_names)
    
    # Calculate additional metrics
    precision = precision_score(y_true, y_pred, average='weighted')
    recall = recall_score(y_true, y_pred, average='weighted')
    f1 = f1_score(y_true, y_pred, average='weighted')
    
    # Format the report
    report_text = f"""
    ============================
    MODEL EVALUATION REPORT
    ============================
    
    Accuracy: {accuracy:.4f}
    Precision: {precision:.4f}
    Recall: {recall:.4f}
    F1-Score: {f1:.4f}
    
    ----------------------------
    Classification Report:
    {report}
    
    ============================
    """.format(accuracy=accuracy, precision=precision, recall=recall, f1=f1, report=report)
    
    # Save to file
    with open(output_path, 'w') as f:
        f.write(report_text)
    
    return output_path

def main():
    print("\n" + "="*60)
    print("🔍 KIDNEY STONE DETECTION - MODEL EVALUATION")
    print("="*60 + "\n")
    
    try:
        # Load the trained model
        model = load_trained_model()
        
        # Load test data
        test_generator = load_test_data()
        
        # Get true labels
        y_true = test_generator.classes
        
        # Generate predictions
        print("\n🔮 Generating predictions...")
        y_pred_probs = model.predict(test_generator, verbose=1)
        y_pred = (y_pred_probs > 0.5).astype(int).flatten()
        
        # Calculate accuracy
        accuracy = accuracy_score(y_true, y_pred)
        
        # Plot and save confusion matrix
        cm_path = plot_confusion_matrix(y_true, y_pred, CLASS_NAMES)
        
        # Save evaluation report
        report_path = MODEL_DIR / 'evaluation_report.txt'
        save_evaluation_report(y_true, y_pred, CLASS_NAMES, accuracy, report_path)
        
        # Print summary
        print("\n" + "="*60)
        print("✅ EVALUATION COMPLETE!")
        print("="*60)
        print(f"\n📊 Model Accuracy: {accuracy:.4f}")
        print(f"📝 Report saved to: {report_path}")
        print(f"📊 Confusion matrix saved to: {cm_path}")
        
        # Print classification report to console
        print("\n📋 Classification Report:")
        print(classification_report(y_true, y_pred, target_names=CLASS_NAMES))
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\n💡 Troubleshooting:")
        print(f"  1. Make sure you've run 'python src/preprocess.py' first")
        print(f"  2. Then run 'python src/train_cnn.py' to train the model")
        print(f"  3. Check that {TEST_DIR} contains the test images")
        return 1
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())