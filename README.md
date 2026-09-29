# 🩺 NephroScan AI — AI-Powered Kidney Stone Detection Platform

An enterprise-ready, end-to-end clinical diagnostic web application for rapid, automated kidney stone detection from Ultrasound and CT scan imagery using deep learning convolutional neural networks (MobileNetV2 CNN).

NephroScan AI combines a high-performance **FastAPI Deep Learning Microservice**, a secure **Node.js/Express REST API**, and a modern **Next.js 16 (React 19)** web interface with patient dashboards, automated medical PDF report generation, and dual-layer JWT & Google OAuth authentication.

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture & System Flow](#-architecture--system-flow)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & How to Run](#-installation--how-to-run)
  - [1. AI Model Microservice (FastAPI)](#1-ai-model-microservice-fastapi)
  - [2. Backend API Service (Express.js)](#2-backend-api-service-expressjs)
  - [3. Frontend Web Application (Next.js)](#3-frontend-web-application-nextjs)
- [Environment Configuration](#-environment-configuration)
- [API Endpoints Reference](#-api-endpoints-reference)
- [🌐 Free Cloud Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Clinical Disclaimer](#-clinical-disclaimer)

---

## 🔬 About the Project

Kidney stone disease (Nephrolithiasis) affects over 10% of the global population. Accurate and early diagnosis through ultrasound or computed tomography (CT) scans is vital to prevent severe renal damage, hydronephrosis, and excruciating pain.

**NephroScan AI** streamlines the clinical diagnostic workflow:
1. **Medical Imagery Ingestion**: Clinicians or patients upload renal ultrasound or abdominal CT scans.
2. **AI Computer Vision Inference**: The scan is analyzed by a custom-trained **MobileNetV2 Transfer Learning CNN**, producing a binary diagnosis (`Stone Detected` vs `No Stone`) with sub-2-second inference latency.
3. **Clinical Interpretation**: Confidence scoring, severity classification, and automated diagnostic findings are generated.
4. **Persistent Patient Records**: Test history is securely logged to MongoDB and Cloudinary.
5. **Instant Clinical Report PDF**: One-click download of clinical summaries ready for physician review.

---

## 🚀 Key Features

* **⚡ Real-Time AI Inference**: Deep learning MobileNetV2 architecture trained on labeled renal imaging datasets with high accuracy and confidence metric output.
* **📊 Clinical Patient & Clinician Dashboard**:
  * Real-time metrics (Total Scans Run, Completed Reports, CNN Service Health).
  * Mobile-responsive diagnostic scan history with thumbnail previews and severity badges.
  * Direct session rehydration so scan reports persist across page refreshes and visits.
* **📄 Automated Medical PDF Generation**: Instant generation of standardized clinical reports (compiled on the fly via PDFKit) with patient demographics, scan metadata, AI confidence, and diagnostic findings.
* **🔐 Dual-Layer Secure Authentication**:
  * Email & Password registration with OTP email verification (Nodemailer).
  * Google Firebase OAuth 2.0 with backend Google Identity verification.
  * Dual-layer persistence: Secure HTTP-Only cookies (`accessToken`, `refreshToken`) + browser `localStorage` with silent background token renewal.
* **🛡️ Security & Rate Limiting**: Dedicated rate limiting for authentication (100 reqs/15m) and general APIs (300 reqs/15m), Zod schema input validation, and password hashing via bcryptjs.
* **📱 Fully Responsive Design**: Optimized for desktops, tablets, and smartphones using Tailwind CSS v4 and fluid typography.

---

## 🛠️ Technology Stack

### Frontend (`client/`)
| Technology | Description |
| :--- | :--- |
| **Next.js 16 (App Router)** | Modern React framework with server-side rendering and client streaming |
| **React 19** | Latest UI component model |
| **TypeScript** | Strict static typing for enterprise maintainability |
| **Tailwind CSS v4** | Next-generation CSS framework with custom medical color tokens |
| **Framer Motion / Motion** | Micro-interactions and smooth page transitions |
| **Firebase Client SDK v11** | Google OAuth authentication integration |
| **Lucide React & Tabler Icons** | Accessible clinical and navigational icons |
| **React Dropzone** | Medical scan drag-and-drop file uploader |

### Backend API (`backend/`)
| Technology | Description |
| :--- | :--- |
| **Node.js (ES Modules)** | Asynchronous server runtime |
| **Express 5** | High-throughput REST API framework |
| **MongoDB & Mongoose 9** | NoSQL database for users, scan metadata, and diagnostic reports |
| **Redis & Bull Queue** | In-memory caching and background job worker queues |
| **Cloudinary SDK** | Secure cloud storage for medical scans and thumbnails |
| **PDFKit** | Programmatic vector PDF compilation for diagnostic clinical summaries |
| **Nodemailer** | SMTP email transport for OTP security codes |
| **JWT & bcryptjs** | Stateless access/refresh token rotation and password hashing |
| **Express Rate Limit** | Brute-force protection and API abuse mitigation |
| **Zod** | Runtime request payload validation |

### AI Model Microservice (`AI_Model/`)
| Technology | Description |
| :--- | :--- |
| **Python 3.9 - 3.11** | Core AI development runtime |
| **FastAPI** | High-performance asynchronous REST microservice |
| **Uvicorn** | Lightning-fast ASGI web server |
| **TensorFlow / Keras 2.x** | MobileNetV2 Deep Learning Convolutional Neural Network |
| **OpenCV & Pillow (PIL)** | Medical image preprocessing, normalization, and resizing |
| **NumPy & Pandas** | Tensor matrix operations and data pipeline processing |
| **Streamlit** | Interactive diagnostic testing playground (`streamlit_app.py`) |

---

## 🔄 Architecture & System Flow

```
[ Next.js 16 Web Client ] (Port 3000)
         │
         │ HTTP / Multipart Form-Data (Scan Upload + JWT / Cookies)
         ▼
[ Express.js REST API ] (Port 5876)
   ├── Auth Controller (JWT Rotation, Google Identity Verification)
   ├── Cloudinary Service (Encrypted Medical Scan Storage)
   ├── MongoDB (User Profiles, Diagnostic Records, History)
   ├── PDFKit Generator (Clinical Diagnostic PDF Reports)
   │
   │ HTTP POST /predict (Raw Scan Buffer)
   ▼
[ FastAPI AI Inference Engine ] (Port 8000)
   └── MobileNetV2 CNN Model (Image Normalization -> 224x224 -> Inference -> Probability Score)
```

---

## 📁 Project Structure

```
KidneyStone/
├── AI_Model/
│   └── kidney-stone-detection-aiml/
│       ├── fastapi_server.py         # FastAPI inference microservice (Port 8000)
│       ├── streamlit_app.py          # Interactive testing UI
│       ├── models/                   # Pretrained weights (.h5 / .keras)
│       ├── src/
│       │   ├── predict_image.py      # Core inference & detection pipeline
│       │   └── preprocess.py         # Image normalization & resizing
│       ├── requirements.txt          # Python dependencies
│       └── run_fastapi.sh            # One-click startup script
│
├── backend/
│   ├── index.js                      # Express application entrypoint (Port 5876)
│   ├── config/                       # DB, Redis, and Token configurations
│   ├── controllers/
│   │   ├── auth.controller.js        # Signup, login, OAuth, and token refresh
│   │   ├── dashboard.controller.js   # Clinical stats and report fetching
│   │   └── ml_service.controller.js  # AI service proxy and diagnosis handler
│   ├── middlewares/                  # Auth guards, file validators, rate limiters
│   ├── model/                        # Mongoose schemas (User, Report)
│   ├── routes/                       # Express route definitions
│   ├── utils/                        # PDFKit generators, Cloudinary uploaders, ratelimits
│   └── package.json
│
├── client/
│   ├── app/
│   │   ├── page.tsx                  # Landing page (Hero, Features, Pricing, Testimonials)
│   │   ├── layout.tsx                # Root layout with AuthProvider & metadata
│   │   ├── globals.css               # Tailwind CSS v4 tokens and theme utilities
│   │   ├── diagnose/page.tsx         # Scan upload & real-time diagnosis page
│   │   ├── dashboard/page.tsx        # Responsive patient clinical history dashboard
│   │   ├── login/page.tsx            # Login portal
│   │   ├── register/page.tsx         # User registration portal
│   │   ├── components/               # Reusable UI components (Navbar, Pricing, Cards)
│   │   ├── context/                  # AuthContext with silent token renewal
│   │   └── config/firebase.ts        # Firebase OAuth client initialization
│   └── package.json
│
└── README.md                         # Project documentation
```

---

## ⚙️ Prerequisites

Before running the project locally, ensure you have the following installed:

* **Node.js**: Version `18.x` or `20.x` LTS ([Download](https://nodejs.org/))
* **Package Manager**: `pnpm` (recommended: `npm install -g pnpm`) or `npm`
* **Python**: Version `3.9`, `3.10`, or `3.11` ([Download](https://www.python.org/))
* **MongoDB**: A local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI
* **Redis**: Local Redis server (`brew install redis` on macOS) or a cloud Redis instance (optional for basic scan execution, required for Bull worker queues)

---

## 🚀 Installation & How to Run

To run the complete NephroScan AI ecosystem locally, start the three services in separate terminal windows.

### 1. AI Model Microservice (FastAPI)

1. Navigate to the AI service directory:
   ```bash
   cd AI_Model/kidney-stone-detection-aiml
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows:
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Start the FastAPI microservice:
   ```bash
   uvicorn fastapi_server:app --host 0.0.0.0 --port 8000 --reload
   ```
   * The AI service will be live at: **`http://localhost:8000`**
   * Interactive API docs (Swagger): **`http://localhost:8000/docs`**

---

### 2. Backend API Service (Express.js)

1. Open a new terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in `backend/` (refer to the [Environment Configuration](#backend-env) section below).

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   * The backend API will be live at: **`http://localhost:5876`**

---

### 3. Frontend Web Application (Next.js)

1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies with `pnpm`:
   ```bash
   pnpm install
   ```

3. Configure frontend environment variables:
   Verify `client/.env.local` contains the backend URL and Firebase keys.

4. Start the Next.js development server:
   ```bash
   pnpm dev
   ```
   * The web application will be live at: **`http://localhost:3000`**

---

## 🔑 Environment Configuration

### Backend `.env` (`backend/.env`)

```env
PORT=5876
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/kidney-stone
REDIS_URL=redis://localhost:6379

# AI Microservice URL
ML_API_URL=http://localhost:8000

# Authentication & JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary (Medical Scan Cloud Storage)
CLOUDINARY_USERNAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service (OTP Verification via Nodemailer)
EMAIL=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Firebase Identity Verification for OAuth
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Client `.env.local` (`client/.env.local`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5876

# Firebase OAuth Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAULKvju0fxNMVNA5jvRG2TUGjZBIwIC_I
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kidney-stone-82e13.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kidney-stone-82e13
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kidney-stone-82e13.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=202989694059
NEXT_PUBLIC_FIREBASE_APP_ID=1:202989694059:web:28757f6d423c7771ca152e
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-QZ9ZCW5Y8Y
```

---

## 📡 API Endpoints Reference

### Authentication Endpoints (`/api/v1/auth`)
* `POST /api/v1/auth/signup` — Create a new clinician/patient account.
* `POST /api/v1/auth/login` — Authenticate with email and password.
* `POST /api/v1/auth/google` — Authenticate via Firebase Google OAuth.
* `POST /api/v1/auth/refresh-token` — Silent renewal of access token.
* `GET  /api/v1/auth/me` — Retrieve active authenticated user profile.
* `ALL  /api/v1/auth/logout` — Clear session cookies and revoke tokens.
* `POST /api/v1/auth/forgot-password` — Send password reset OTP.
* `POST /api/v1/auth/reset-password/:token` — Complete password reset with token.

### Clinical & Diagnostic Endpoints (`/api/v1/user`)
* `POST /api/v1/user/diagnose` — Upload ultrasound/CT scan image; triggers inference from AI model and persists report.
* `GET  /api/v1/user/reports` — Fetch list of user's past diagnostic scans.
* `GET  /api/v1/user/report/:id` — Retrieve full diagnostic scan details by report ID.

### Dashboard Endpoints (`/api/v1/dashboard`)
* `GET  /api/v1/dashboard/getdata` — Retrieve aggregate statistics (total scans, completed reports) and recent report summaries.
* `POST /api/v1/dashboard/download-report/:reportId` — Generate and download medical PDF summary.

### AI Microservice Endpoints (`http://localhost:8000`)
* `GET  /` — Microservice status and version.
* `GET  /health` — CNN model load status and runtime health.
* `POST /predict` — Accepts multipart image file, returns binary classification & confidence score.

---

## ⚕️ Clinical Disclaimer

> **IMPORTANT**: NephroScan AI is an assistive decision-support research tool designed to demonstrate computer vision capabilities in renal imaging. It is **not** a substitute for certified radiological evaluation, formal pathology, or professional clinical consultation. Final diagnostic determinations should always be verified by a licensed radiologist or healthcare provider.
