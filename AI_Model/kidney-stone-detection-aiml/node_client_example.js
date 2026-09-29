/**
 * Example: How to call FastAPI from Node.js Backend
 *
 * This file demonstrates how to call the Kidney Stone Detection API
 * from your Node.js backend and handle the responses.
 */

const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.ML_API_URL || 'http://localhost:8000';

/**
 * Predict kidney stone presence from a single image
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<object>} Prediction result
 */
async function predictImage(imagePath) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(`${API_BASE_URL}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 30000, // 30 second timeout
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
 * @param {string[]} imagePaths - Array of image file paths
 * @returns {Promise<object>} Batch prediction results
 */
async function predictBatch(imagePaths) {
  try {
    const form = new FormData();
    imagePaths.forEach((path) => {
      form.append('files', fs.createReadStream(path));
    });

    const response = await axios.post(`${API_BASE_URL}/predict-batch`, form, {
      headers: form.getHeaders(),
      timeout: 60000, // 60 second timeout for batch
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
 * @returns {Promise<boolean>} True if API is healthy
 */
async function checkHealth() {
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
 * @returns {Promise<object>} API metadata
 */
async function getAPIInfo() {
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

// Export functions
module.exports = {
  predictImage,
  predictBatch,
  checkHealth,
  getAPIInfo,
};

// Example usage (uncomment to test)
/*
(async () => {
  // Check if API is available
  const isHealthy = await checkHealth();
  console.log('API Health:', isHealthy);

  if (isHealthy) {
    // Get API info
    const info = await getAPIInfo();
    console.log('API Info:', info);

    // Predict single image
    const result = await predictImage('./test_image.jpg');
    console.log('Prediction:', result);
  }
})();
*/
