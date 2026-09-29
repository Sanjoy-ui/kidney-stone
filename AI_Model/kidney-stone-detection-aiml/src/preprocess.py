import os
import numpy as np
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split
import shutil
from pathlib import Path
from tqdm import tqdm

# Constants
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
SEED = 42
TEST_SPLIT = 0.2  # 20% for test
VAL_SPLIT = 0.2   # 20% of training for validation

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent  # Project root
RAW_DATA_DIR = BASE_DIR / "raw_dataset_clean"  # Raw images
PROCESSED_DIR = BASE_DIR / "preprocessed_data"  # For saving numpy arrays
DATA_DIR = BASE_DIR / "data"  # For train/val/test splits
TRAIN_DIR = DATA_DIR / "train"
VAL_DIR = DATA_DIR / "val"
TEST_DIR = DATA_DIR / "test"


def setup_directories():
    """Set up directory structure for processed data."""
    print("\n📂 Setting up directory structure...")
    
    # Remove existing directories if they exist
    for directory in [DATA_DIR, PROCESSED_DIR]:
        if directory.exists():
            shutil.rmtree(directory)
            print(f"  - Cleared existing directory: {directory}")
    
    # Create new directory structure
    directories = [
        PROCESSED_DIR,
        TRAIN_DIR, TRAIN_DIR/"stone", TRAIN_DIR/"no_stone",
        VAL_DIR, VAL_DIR/"stone", VAL_DIR/"no_stone",
        TEST_DIR, TEST_DIR/"stone", TEST_DIR/"no_stone"
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"  - Created directory: {directory}")
    
    print("✓ Directory structure created")


def verify_raw_dataset():
    """Verify raw dataset structure and content."""
    print("🔍 Verifying dataset structure...")
    
    # Check if raw_dataset exists
    if not RAW_DATA_DIR.exists():
        raise FileNotFoundError(
            f"❌ Error: raw_dataset folder not found at: {RAW_DATA_DIR}\n"
            "Please ensure you have the following structure:\n"
            "project/\n"
            "├── raw_dataset/\n"
            "│   ├── stone/\n"
            "│   └── no_stone/"
        )
    
    # Check class directories
    class_dirs = ["stone", "no_stone"]
    missing_dirs = [cls for cls in class_dirs if not (RAW_DATA_DIR / cls).exists()]
    
    if missing_dirs:
        raise FileNotFoundError(
            f"❌ Missing class folders: {', '.join(missing_dirs)}\n"
            f"Expected structure: {RAW_DATA_DIR}/{{stone,no_stone}}/"
        )
    
    # Check if directories have images
    for cls in class_dirs:
        img_count = len(list((RAW_DATA_DIR / cls).glob("*.jpg")) + 
                      list((RAW_DATA_DIR / cls).glob("*.jpeg")) + 
                      list((RAW_DATA_DIR / cls).glob("*.png")))
        
        if img_count == 0:
            raise FileNotFoundError(
                f"❌ No images found in {RAW_DATA_DIR/cls}/\n"
                "Supported formats: .jpg, .jpeg, .png"
            )
        
        print(f"✓ Found {img_count} images in {cls} class")


def split_dataset():
    """Split the dataset into train, validation, and test sets."""
    print("\n🔄 Splitting dataset into train, validation, and test sets...")
    
    for class_name in ['stone', 'no_stone']:
        class_dir = RAW_DATA_DIR / class_name
        image_files = list(class_dir.glob('*.jpg')) + list(class_dir.glob('*.png')) + list(class_dir.glob('*.jpeg'))
        
        # Split into train, validation, and test
        train_files, val_test_files = train_test_split(
            image_files, 
            test_size=TEST_SPLIT + VAL_SPLIT, 
            random_state=SEED
        )
        val_files, test_files = train_test_split(
            val_test_files, 
            test_size=TEST_SPLIT / (TEST_SPLIT + VAL_SPLIT), 
            random_state=SEED
        )
        
        # Copy files to respective directories
        for file in train_files:
            shutil.copy2(file, TRAIN_DIR / class_name / file.name)
        for file in val_files:
            shutil.copy2(file, VAL_DIR / class_name / file.name)
        for file in test_files:
            shutil.copy2(file, TEST_DIR / class_name / file.name)


def create_generators():
    """Create and configure data generators with augmentation."""
    print("\n🔄 Creating data generators...")
    
    # Data augmentation for training
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode="nearest"
    )
    
    # Validation and test generators (only rescaling)
    test_datagen = ImageDataGenerator(rescale=1./255)
    
    print("\n📊 Dataset statistics:")
    
    # Training generator
    train_ds = train_datagen.flow_from_directory(
        TRAIN_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="binary",
        shuffle=True,
        seed=SEED
    )
    
    # Validation generator
    val_ds = test_datagen.flow_from_directory(
        VAL_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="binary",
        shuffle=False
    )
    
    # Test generator
    test_ds = test_datagen.flow_from_directory(
        TEST_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="binary",
        shuffle=False
    )
    
    # Print class indices
    print("\n🔢 Class mapping:", train_ds.class_indices)
    
    return train_ds, val_ds, test_ds


def save_preprocessed_data(train_ds, val_ds, test_ds):
    """Save preprocessed data as numpy arrays for faster loading."""
    print("\n💾 Saving preprocessed data...")
    
    def save_dataset(dataset, name):
        """Helper to save dataset as numpy arrays."""
        x, y = [], []
        for i in tqdm(range(len(dataset)), desc=f"Processing {name}"):
            batch_x, batch_y = dataset[i]
            x.append(batch_x)
            y.append(batch_y)
            
            # Break if we've gone through all batches
            if (i + 1) * BATCH_SIZE >= dataset.samples:
                break
                
        x = np.vstack(x)
        y = np.hstack(y)
        
        np.save(PROCESSED_DIR / f"X_{name}.npy", x)
        np.save(PROCESSED_DIR / f"y_{name}.npy", y)
        print(f"  ✓ Saved {name}: {x.shape[0]} samples")
    
    # Save each dataset
    save_dataset(train_ds, "train")
    save_dataset(val_ds, "val")
    save_dataset(test_ds, "test")
    
    print(f"\n✅ Preprocessed data saved to: {PROCESSED_DIR}")


def main():
    print("\n" + "="*60)
    print("🚀 KIDNEY STONE DETECTION - DATA PREPROCESSING")
    print("="*60 + "\n")
    
    try:
        # 1. Verify dataset structure
        verify_raw_dataset()
        
        # 2. Set up directory structure
        setup_directories()
        
        # 3. Split dataset
        split_dataset()
        
        # 4. Create data generators
        train_ds, val_ds, test_ds = create_generators()
        
        # 5. Save preprocessed data
        save_preprocessed_data(train_ds, val_ds, test_ds)
        
        # Print summary
        print("\n" + "="*60)
        print("🎉 PREPROCESSING COMPLETE!")
        print("="*60)
        print(f"\n📊 Dataset Summary:")
        print(f"  - Training samples:   {train_ds.samples:>6}")
        print(f"  - Validation samples:  {val_ds.samples:>6}")
        print(f"  - Test samples:       {test_ds.samples:>6}")
        print(f"\n💡 Next steps:")
        print("  1. Run train.py to train your model")
        print(f"  2. Your preprocessed data is ready at: {PROCESSED_DIR}")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\n💡 Troubleshooting:")
        print(f"  - Check that {RAW_DATA_DIR} contains 'stone' and 'no_stone' folders")
        print("  - Ensure you have read/write permissions in the project directory")
        print("  - Verify that image files have .jpg, .jpeg, or .png extensions")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())