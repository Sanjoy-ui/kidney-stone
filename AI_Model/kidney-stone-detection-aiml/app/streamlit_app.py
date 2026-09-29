import streamlit as st
import os 
from pathlib import Path
from PIL import Image
import numpy as np
import time

# Add the src directory to the path
import sys
sys.path.append(str(Path(__file__).parent.parent / 'src'))

# Import the detector
from predict_image import get_stone_detector

# Page config
st.set_page_config(
    page_title="Kidney Stone Detection using CNN",
    page_icon="🩺",
    layout="centered",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
def load_css():
    st.markdown("""
    <style>
    .main {
        background-color: #f8f9fa;
    }
    .uploaded-image {
        max-width: 100%;
        border-radius: 10px;
        margin: 1rem 0;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .result-box {
        padding: 1.5rem;
        border-radius: 10px;
        margin: 1rem 0;
        background-color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .stButton>button {
        width: 100%;
        border-radius: 20px;
        padding: 0.5rem 1rem;
        font-weight: 600;
    }
    .stProgress > div > div > div > div {
        background-color: #4CAF50;
    }
    .footer {
        margin-top: 2rem;
        text-align: center;
        color: #6c757d;
        font-size: 0.9rem;
    }
    </style>
    """, unsafe_allow_html=True)

def main():
    # Initialize session state
    if 'uploaded_file' not in st.session_state:
        st.session_state.uploaded_file = None
        
    # Load CSS
    load_css()
    
    # App title and description
    st.title("🩺 Kidney Stone Detection using CNN")
    st.markdown("""
    Upload an ultrasound image of a kidney to detect the presence of kidney stones.
    The model uses deep learning to analyze the image and provide a diagnosis.
    """)
    
    # Initialize the detector
    try:
        detector = get_stone_detector()
        model_loaded = True
    except Exception as e:
        st.error("❌ Error loading the model. Please make sure you've trained the model first.")
        st.error(f"Error details: {str(e)}")
        model_loaded = False
        return
    
    # File uploader with improved UI
    st.markdown("### 📤 Upload Kidney Ultrasound Image")
    uploaded_file = st.file_uploader(
        "",
        type=["jpg", "jpeg", "png"],
        accept_multiple_files=False,
        help="Upload a clear image of a kidney ultrasound scan. Supported formats: JPG, JPEG, PNG",
        key="file_uploader"
    )
    
    # Add some sample images for testing
    with st.expander("💡 Try sample images"):
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Sample Stone Image", key="sample_stone"):
                stone_dir = Path(__file__).parent.parent / "raw_dataset" / "stone"
                if stone_dir.exists() and any(stone_dir.iterdir()):
                    sample_path = next(stone_dir.glob('*'))
                    st.session_state.uploaded_file = sample_path
                    st.rerun()
                else:
                    st.warning("Sample stone images not found. Please upload your own image.")
        with col2:
            if st.button("Sample Normal Image", key="sample_normal"):
                normal_dir = Path(__file__).parent.parent / "raw_dataset" / "no_stone"
                if normal_dir.exists() and any(normal_dir.iterdir()):
                    sample_path = next(normal_dir.glob('*'))
                    st.session_state.uploaded_file = sample_path
                    st.rerun()
                else:
                    st.warning("Sample normal images not found. Please upload your own image.")
    
    # Add a separator
    st.markdown("---")
    
    # Handle file upload or sample selection
    if 'uploaded_file' not in st.session_state:
        st.session_state.uploaded_file = None
    
    # Update session state when a new file is uploaded
    if uploaded_file is not None:
        st.session_state.uploaded_file = uploaded_file
    
    # Display the selected/uploaded image
    if st.session_state.uploaded_file is not None:
        try:
            # Display the uploaded/sample image
            if isinstance(st.session_state.uploaded_file, (str, Path)):
                image = Image.open(st.session_state.uploaded_file)
            else:
                # Handle file upload object
                image = Image.open(st.session_state.uploaded_file)
                st.session_state.uploaded_file.seek(0)  # Reset file pointer
            st.image(
                image,
                caption="Uploaded Image",
                use_column_width=True,
                output_format="PNG"
            )
            
            # Add a predict button
            if st.button("🔍 Analyze Image", key="predict_button"):
                with st.spinner("Analyzing the image..."):
                    # Save the uploaded file temporarily
                    temp_file = Path("temp_image.jpg")
                    image.save(temp_file)
                    
                    # Make prediction
                    progress_bar = st.progress(0)
                    for percent_complete in range(100):
                        time.sleep(0.01)  # Simulate processing time
                        progress_bar.progress(percent_complete + 1)
                    
                    result = detector.predict(temp_file)

                    # Handle prediction errors gracefully
                    if isinstance(result, dict) and 'error' in result and result['error']:
                        st.error("❌ Error during prediction. Please try another image or retrain the model.")
                        st.error(f"Details: {result['error']}")
                        return
                    
                    # Clean up the temporary file
                    if temp_file.exists():
                        temp_file.unlink()
                    
                    # Display results
                    st.subheader("🔍 Analysis Results")
                    
                    with st.container():
                        col1, col2 = st.columns(2)
                        
                        with col1:
                            st.markdown("### Result")
                            if result['label'] == 'Stone':
                                st.error(f"## 🚨 {result['label']} Detected!")
                            else:
                                st.success(f"## ✅ {result['label']}")
                        
                        with col2:
                            st.markdown("### Confidence")
                            confidence = result['confidence']
                            
                            # Color code confidence level
                            if confidence > 80:
                                color = "#28a745"  # Green
                            elif confidence > 60:
                                color = "#ffc107"  # Yellow
                            else:
                                color = "#fd7e14"  # Orange
                            
                            st.markdown(
                                f"<h2 style='color: {color};'>{confidence:.2f}%</h2>",
                                unsafe_allow_html=True
                            )
                    
                    # Show probability meter
                    st.markdown("### Probability Distribution")
                    prob_stone = result['probability'] * 100
                    prob_no_stone = 100 - prob_stone
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("Stone", f"{prob_stone:.1f}%")
                    with col2:
                        st.metric("No Stone", f"{prob_no_stone:.1f}%")
                    
                    st.progress(prob_stone / 100)
                    
        except Exception as e:
            st.error(f"❌ Error processing the image: {str(e)}")
    
    # Add footer with model info
    st.markdown("---")
    st.markdown("""
    <div class="footer">
        <p>Model: MobileNetV2 (fine-tuned for kidney stone detection)</p>
        <p>Input size: 224×224 pixels • Threshold: 50% confidence</p>
        <p>For educational purposes only. Always consult a medical professional for diagnosis.</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()