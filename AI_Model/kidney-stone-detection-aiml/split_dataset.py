import os
import shutil
import random
from pathlib import Path

def create_directory(path):
    """Create directory if it doesn't exist."""
    os.makedirs(path, exist_ok=True)

def get_files(directory, extensions=('.jpg', '.jpeg', '.png')):
    """Get all image files from directory with given extensions."""
    return [f for f in os.listdir(directory) 
            if f.lower().endswith(extensions) and os.path.isfile(os.path.join(directory, f))]

def split_dataset():
    # Set paths
    base_dir = Path(__file__).parent
    raw_dir = base_dir / 'raw_dataset'
    data_dir = base_dir / 'data'
    
    # Check if raw dataset exists
    if not raw_dir.exists():
        print(f"Error: Directory '{raw_dir}' not found.")
        print("Please create a 'raw_dataset' folder with 'stone' and 'no_stone' subfolders.")
        return
    
    # Define categories and splits
    categories = ['stone', 'no_stone']
    splits = ['train', 'test']
    
    # Create destination directories
    for split in splits:
        for category in categories:
            create_directory(data_dir / split / category)
    
    # Process each category
    for category in categories:
        source_dir = raw_dir / category
        
        # Skip if source directory doesn't exist
        if not source_dir.exists():
            print(f"Warning: Directory '{source_dir}' not found. Skipping...")
            continue
            
        # Get all image files
        files = get_files(source_dir)
        if not files:
            print(f"No image files found in {source_dir}")
            continue
            
        # Shuffle files randomly
        random.shuffle(files)
        
        # Calculate split index (80% train, 20% test)
        split_idx = int(0.8 * len(files))
        train_files = files[:split_idx]
        test_files = files[split_idx:]
        
        # Function to move files to destination
        def move_files(files, split):
            for file in files:
                src = source_dir / file
                dst = data_dir / split / category / file
                if not dst.exists():  # Avoid overwriting
                    shutil.copy2(src, dst)
            return len(files)
        
        # Move files to respective directories
        train_count = move_files(train_files, 'train')
        test_count = move_files(test_files, 'test')
        
        # Print summary
        print(f"\n{category.upper()} Summary:")
        print(f"Total images: {len(files)}")
        print(f"Train: {train_count} images")
        print(f"Test: {test_count} images")
    
    print("\nDataset splitting completed successfully!")

if __name__ == "__main__":
    print("Starting dataset splitting...")
    split_dataset()
