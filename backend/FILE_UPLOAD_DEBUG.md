/**
 * Debugging Guide - File Upload Issues
 */

// ====================================
// POSTMAN SETUP - CORRECT WAY
// ====================================

/* 
1. SINGLE FILE UPLOAD:
   - Method: POST
   - URL: http://localhost:5876/api/v1/user/predict
   - Headers: 
     * Authorization: Bearer <your-token>
   - Body: form-data
     * Key: image (type: File)
     * Value: Select your image file

2. MULTIPLE FILES UPLOAD:
   - Method: POST
   - URL: http://localhost:5876/api/v1/user/predict-multiple
   - Headers:
     * Authorization: Bearer <your-token>
   - Body: form-data
     * Key: images (type: File)
     * Value: Select first image
     * Key: images (type: File)
     * Value: Select second image
     * (Repeat for up to 5 files)

⚠️ IMPORTANT:
- Field name for SINGLE: "image"
- Field name for MULTIPLE: "images" (plural)
- Make sure Authorization header is set
- Body type must be "form-data", NOT "raw"
*/

// ====================================
// CURL COMMANDS - TEST LOCALLY
// ====================================

// Get auth token first
curl -X POST http://localhost:5876/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"password123"}' \
  -c cookies.txt

// Single image
curl -X POST http://localhost:5876/api/v1/user/predict \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@/path/to/image.jpg" \
  -b cookies.txt

// Multiple images
curl -X POST http://localhost:5876/api/v1/user/predict-multiple \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -b cookies.txt

// ====================================
// COMMON ERRORS & FIXES
// ====================================

Error: "Cannot read properties of undefined (reading 'length')"
Fix: Make sure you're sending files in form-data, not raw JSON

Error: "No file uploaded"
Fix: Check field name matches (image for single, images for multiple)

Error: "File size exceeds limit"
Fix: Use images smaller than 10MB

Error: "Invalid file type"
Fix: Upload JPG, PNG, or WebP images only

Error: "Unauthorized"
Fix: Include valid Authorization header with JWT token

// ====================================
// NODE.JS TEST SCRIPT
// ====================================

import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

const API_URL = 'http://localhost:5876/api/v1/user';
const TOKEN = 'your_jwt_token_here';

async function testSinglePredict() {
    try {
        const form = new FormData();
        form.append('image', fs.createReadStream('./test_image.jpg'));

        const response = await axios.post(`${API_URL}/predict`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        console.log('✅ Single predict success:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function testMultiplePredict() {
    try {
        const form = new FormData();
        form.append('images', fs.createReadStream('./image1.jpg'));
        form.append('images', fs.createReadStream('./image2.jpg'));

        const response = await axios.post(`${API_URL}/predict-multiple`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        console.log('✅ Multiple predict success:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run tests
testSinglePredict();
testMultiplePredict();
