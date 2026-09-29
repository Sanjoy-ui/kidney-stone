# Kidney Stone Detection using CNN

This project implements a deep learning model to detect kidney stones in ultrasound images using Convolutional Neural Networks (CNN) with transfer learning.

## Features

- **Data Preprocessing**: Handles image resizing, normalization, and data augmentation
- **Model Training**: Uses MobileNetV2 with transfer learning
- **Evaluation**: Provides comprehensive metrics and visualizations
- **Web Interface**: User-friendly Streamlit web app
- **Command-line Tools**: For batch prediction and evaluation

## Project Structure

```
├── app/
│   └── streamlit_app.py    # Web interface
├── data/                   # Processed dataset (created during preprocessing)
├── models/                 # Saved models and training history
├── preprocessed_data/      # Preprocessed numpy arrays
├── raw_dataset/            # Original dataset
│   ├── stone/              # Kidney stone images
│   └── no_stone/           # Normal kidney images
├── src/
│   ├── preprocess.py       # Data preprocessing
│   ├── train_cnn.py        # Model training
│   ├── evaluate.py         # Model evaluation
│   └── predict_image.py    # Single image prediction
├── requirements.txt        # Python dependencies
└── run_pipeline.py         # Complete pipeline script
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd KIDNEY-STONE-DETECTION-USING-AIML
   ```

2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### 1. Run Complete Pipeline

```bash
python run_pipeline.py
```

This will:
1. Preprocess the data
2. Train the model
3. Evaluate the model
4. Optionally launch the web app

### 2. Run Individual Components

#### Data Preprocessing
```bash
python src/preprocess.py
```

#### Model Training
```bash
python src/train_cnn.py
```

#### Model Evaluation
```bash
python src/evaluate.py
```

#### Web Application
```bash
streamlit run app/streamlit_app.py
```

### 3. Predict on a Single Image

```bash
python src/predict_image.py path/to/your/image.jpg
```

## Dataset

Place your dataset in the following structure:
```
raw_dataset/
├── stone/       # Kidney stone images
└── no_stone/    # Normal kidney images
```

## Model Architecture

- **Base Model**: MobileNetV2 with pre-trained weights (ImageNet)
- **Input Size**: 224x224 pixels
- **Output**: Binary classification (Stone/No Stone)
- **Optimizer**: Adam (learning rate = 1e-4)
- **Loss Function**: Binary Cross-Entropy

## Results

Model performance metrics will be saved in the `models/` directory after training and evaluation.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Dataset: [Your dataset source]
- TensorFlow/Keras for deep learning framework
- Streamlit for the web interface..
