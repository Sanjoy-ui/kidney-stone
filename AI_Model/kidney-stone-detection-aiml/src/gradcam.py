"""
Grad-CAM (Gradient-weighted Class Activation Mapping) Utility
Computes activation heatmaps for MobileNetV2 kidney stone detection models.
"""

import base64
import io
from pathlib import Path
from typing import Dict, Any, Optional

import cv2
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing import image

IMG_SIZE = (224, 224)
DEFAULT_CONV_LAYER = "out_relu"


def generate_gradcam_heatmap(
    model: tf.keras.Model,
    img_path: str,
    last_conv_layer_name: str = DEFAULT_CONV_LAYER,
    pred_index: Optional[int] = None
) -> np.ndarray:
    """
    Computes a 2D Grad-CAM heatmap normalized between 0.0 and 1.0.
    """
    # 1. Preprocess image for MobileNetV2
    img = image.load_img(img_path, target_size=IMG_SIZE)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    processed_img = preprocess_input(img_array)

    # 2. Build multi-output gradient model
    target_layer = model.get_layer(last_conv_layer_name)
    grad_model = tf.keras.models.Model(
        inputs=model.inputs,
        outputs=[target_layer.output, model.output]
    )

    # 3. Compute gradients of target output w.r.t. feature maps
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(processed_img)
        # Binary classification with 1 sigmoid output unit
        if predictions.shape[-1] == 1:
            loss = predictions[:, 0]
        else:
            if pred_index is None:
                pred_index = tf.argmax(predictions[0])
            loss = predictions[:, pred_index]

    # Gradients of the output class score w.r.t. the convolutional feature maps
    grads = tape.gradient(loss, conv_outputs)

    # Global Average Pooling of the gradients (importance weights)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weight the channels by gradient importance
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # Apply ReLU (we only care about positive evidence for the class)
    heatmap = tf.maximum(heatmap, 0.0)

    # Normalize heatmap between 0 and 1
    max_val = tf.math.reduce_max(heatmap)
    if max_val > 0:
        heatmap = heatmap / max_val
    else:
        heatmap = tf.zeros_like(heatmap)

    return heatmap.numpy()


def generate_gradcam_overlay(
    model: tf.keras.Model,
    img_path: str,
    last_conv_layer_name: str = DEFAULT_CONV_LAYER,
    alpha: float = 0.40,
    colormap: int = cv2.COLORMAP_JET
) -> Dict[str, Any]:
    """
    Generates both raw heatmap and superimposed visual attention overlay.
    Returns base64 encoded data URLs suitable for web transmission.
    """
    try:
        # Load original image to retain exact native resolution
        orig_img = Image.open(img_path).convert("RGB")
        orig_w, orig_h = orig_img.size
        orig_np = np.array(orig_img)

        # 1. Compute 2D heatmap
        heatmap = generate_gradcam_heatmap(model, img_path, last_conv_layer_name)

        # 2. Resize heatmap to original image dimensions
        heatmap_resized = cv2.resize(heatmap, (orig_w, orig_h))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        # 3. Apply color map (JET: Blue=Low, Red=High attention)
        colored_heatmap_bgr = cv2.applyColorMap(heatmap_uint8, colormap)
        colored_heatmap_rgb = cv2.cvtColor(colored_heatmap_bgr, cv2.COLOR_BGR2RGB)

        # 4. Superimpose heatmap onto original ultrasound image
        overlay = cv2.addWeighted(orig_np, 1.0 - alpha, colored_heatmap_rgb, alpha, 0)

        # 5. Encode images to Base64 JPEG data URLs
        def to_base64_data_url(img_array_rgb: np.ndarray) -> str:
            pil_image = Image.fromarray(img_array_rgb)
            buffer = io.BytesIO()
            pil_image.save(buffer, format="JPEG", quality=90)
            encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
            return f"data:image/jpeg;base64,{encoded}"

        overlay_data_url = to_base64_data_url(overlay)
        raw_heatmap_data_url = to_base64_data_url(colored_heatmap_rgb)

        return {
            "success": True,
            "layer_used": last_conv_layer_name,
            "overlay_image": overlay_data_url,
            "raw_heatmap": raw_heatmap_data_url,
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "layer_used": last_conv_layer_name,
            "overlay_image": None,
            "raw_heatmap": None,
            "error": str(e)
        }
