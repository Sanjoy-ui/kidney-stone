

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Configuration
const API_BASE_URL = process.env.ML_API_URL || 'http://localhost:8000';

/**
 * Predict kidney stone presence from a single image
 */
export async function predictImage(imagePath) {
  try {
    const form = new FormData();
    // Ensure the key 'file' matches your FastAPI parameter: file: UploadFile = File(...)
    form.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(`${API_BASE_URL}/predict`, form, {
      headers: {
        ...form.getHeaders(), // Important: Spread the headers for boundary settings
      },
      timeout: 30000, 
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.response?.data,
    };
  }
}

/**
 * Predict kidney stone presence from multiple images
 */
export async function predictBatch(imagePaths) {
  try {
    const form = new FormData();
    imagePaths.forEach((path) => {
      // Note: your FastAPI endpoint must be set to accept List[UploadFile]
      form.append('files', fs.createReadStream(path));
    });

    const response = await axios.post(`${API_BASE_URL}/predict-batch`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 60000,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.response?.data,
    };
  }
}

/**
 * Check if the ML API is available
 */
export async function checkHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('ML API health check failed:', error.message);
    return false;
  }
}

/**
 * Get API information
 */
export async function getAPIInfo() {
  try {
    const response = await axios.get(`${API_BASE_URL}/info`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get API info:', error.message);
    return null;
  }
}