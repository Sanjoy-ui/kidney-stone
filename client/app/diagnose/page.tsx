"use client";

import { useState, useEffect, useRef, ChangeEvent, DragEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileUpload } from "@/app/components/ui/fileupload";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  ArrowLeft,
  Upload,
  Brain,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Printer,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  Sparkles,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
} from "lucide-react";

interface DiagnosisMetrics {
  detectionStatus: string;
  confidenceScore: string;
  riskIndex: string;
  inferenceTime: string;
  modelUsed: string;
  scanType: string;
  patientName: string;
  patientAge: string;
  timestamp: string;
}

interface DiagnosisResult {
  diagnosis: string;
  isStone: boolean;
  confidence: number;
  severity: string;
  summary: string;
  findings: string[];
  recommendations: string[];
  precautions: string[];
  imageUrl: string | null;
  reportId: string | null;
  metrics: DiagnosisMetrics;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5876";

export default function DiagnosePage() {
  const { user, authFetch, logout } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanType, setScanType] = useState<string>("Ultrasound");
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<string>("Unspecified");
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  // Auto-fill patient name from logged-in account if available
  useEffect(() => {
    if (user?.username && !patientName) {
      setPatientName(user.username);
    }
  }, [user, patientName]);

  // Restore scan report after page refresh or load by reportId in URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const reportIdParam = urlParams.get("reportId");

    if (reportIdParam) {
      const loadReportFromApi = async () => {
        try {
          setLoading(true);
          const res = await authFetch(`${BACKEND_URL}/api/v1/dashboard/report/${reportIdParam}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              setResult(json.data);
              if (json.data.imageUrl) {
                setPreviewUrl(json.data.imageUrl);
              }
              sessionStorage.setItem("currentScanReport", JSON.stringify(json.data));
              return;
            }
          }
        } catch (e) {
          console.warn("Failed to load report from API:", e);
        } finally {
          setLoading(false);
        }
      };
      loadReportFromApi();
      return;
    }

    // Fallback: check sessionStorage if user refreshed after scanning
    const cached = sessionStorage.getItem("currentScanReport");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.diagnosis) {
          setResult(parsed);
          if (parsed.imageUrl) {
            setPreviewUrl(parsed.imageUrl);
          }
        }
      } catch (_) {}
    }
  }, [authFetch]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, JPEG, or PNG).");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit.");
      return;
    }

    setError(null);
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("currentScanReport");
      const cleanUrl = window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, "", cleanUrl);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload an ultrasound or CT scan image to analyze.");
      return;
    }

    if (!agreedToTerms) {
      setError("Please check and accept the diagnostic Terms of Use and Privacy Policy conditions to run analysis.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("scanType", scanType);
    formData.append("agreedToTerms", "true");
    if (patientName.trim()) formData.append("patientName", patientName.trim());
    if (patientAge.trim()) formData.append("patientAge", patientAge.trim());
    formData.append("patientGender", patientGender);

    try {
      const response = await authFetch(`${BACKEND_URL}/api/v1/user/diagnose`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to analyze image. Please verify backend services.");
      }

      setResult(data.data);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("currentScanReport", JSON.stringify(data.data));
        if (data.data.reportId) {
          const newUrl = `${window.location.pathname}?reportId=${data.data.reportId}`;
          window.history.replaceState({ path: newUrl }, "", newUrl);
        }
      }
    } catch (err: unknown) {
      console.error("Diagnosis request error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Could not connect to the diagnosis service. Ensure backend and model servers are active.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ProtectedRoute
      title="Kidney Stone Scan Dashboard"
      description="Access to real-time renal scan analysis, AI stone detection, and clinical diagnostic reports is protected. Please log in with your verified account."
    >
      <div className="min-h-screen w-full bg-[#f8fafc] text-[#334155] overflow-x-hidden">
        {/* Central Boxed Container */}
        <div className="boxed-container mx-auto max-w-[1240px] px-3 sm:px-6 py-4 sm:py-8">
          
          {/* Navigation Bar */}
          <header className="w-full flex items-center justify-between pb-4 sm:pb-6 border-b border-[#90e0ef]/50 gap-2">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <Image
                src="/mainLogo.png"
                alt="Health Care Medical Company"
                width={150}
                height={65}
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
                priority
              />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 print:hidden">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#90e0ef]/70 text-xs font-semibold text-[#03045e] shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-[#caf0f8] text-[#0077b6] flex items-center justify-center font-bold text-[10px]">
                    {user.username?.charAt(0).toUpperCase() || "P"}
                  </div>
                  <span className="truncate max-w-[130px]">{user.username}</span>
                </div>
              )}

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#0077b6] hover:text-[#03045e] transition-colors px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-[#caf0f8]/40"
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                title="Sign out of clinical dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>

              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#0077b6] hover:text-[#03045e] transition-colors px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-[#caf0f8]/40"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Home</span>
              </Link>
            </div>
          </header>

        {/* Page Title */}
        <div className="py-5 sm:py-8 text-left">
          <div className="inline-flex items-center gap-1.5 med-pill mb-2.5 text-xs">
            <Brain className="w-3.5 h-3.5 text-[#0077b6]" />
            <span>Real-time Clinical Diagnosis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#03045e] tracking-tight leading-tight">
            AI Kidney Stone Detection & Patient Report
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-[#334155] mt-1.5 max-w-2xl leading-relaxed">
            Upload an ultrasound or CT scan. Our neural network detects calculi, computes
            confidence metrics, and generates an automated clinical report.
          </p>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Diagnosis Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        {!result ? (
          /* Upload & Configuration Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
            
            {/* Left Column: Image Dropzone & Preview (7 Cols) */}
            <div className="lg:col-span-7 med-card p-4 sm:p-6 lg:p-8 bg-white flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-[#03045e]">1. Upload Renal Scan</h2>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-400">JPG, PNG (Max 10MB)</span>
              </div>

              {!previewUrl ? (
                /* Aceternity FileUpload Dropzone */
                <div className="w-full border-2 border-dashed border-[#90e0ef] hover:border-[#0077b6] rounded-2xl bg-white transition-all overflow-hidden shadow-xs group">
                  <FileUpload
                    accept="image/jpeg,image/png,image/jpg"
                    title="Drag & Drop Scan File"
                    description="Upload DICOM slice, CT scan, ultrasound, or X-ray radiograph (up to 10MB)"
                    onChange={(uploadedFiles) => {
                      if (uploadedFiles && uploadedFiles[0]) {
                        handleFileSelect(uploadedFiles[0]);
                      }
                    }}
                  />
                  <div className="flex items-center justify-between px-5 py-3 bg-[#f8fafc] border-t border-slate-200/80 text-[11px] sm:text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-[#03045e]">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      HIPAA-Safe & End-to-End Encrypted
                    </span>
                    <span className="text-slate-400 font-medium">
                      CT &bull; Ultrasound &bull; X-Ray
                    </span>
                  </div>
                </div>
              ) : (
                /* Preview Container */
                <div className="relative w-full rounded-2xl overflow-hidden border border-[#90e0ef] bg-slate-900 flex flex-col items-center justify-center p-2">
                  <div className="relative w-full h-64 sm:h-80 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Uploaded Scan Preview"
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="w-full bg-white/95 backdrop-blur-md rounded-xl p-2.5 sm:p-3 mt-2 flex items-center justify-between border border-slate-200 text-xs">
                    <span className="font-semibold text-[#03045e] truncate max-w-[180px] sm:max-w-[240px]">
                      {file?.name}
                    </span>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={onFileInputChange}
              />
            </div>

            {/* Right Column: Patient Metadata & Action (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
              <div className="med-card p-4 sm:p-6 lg:p-7 bg-white flex flex-col gap-4 sm:gap-5">
                <h2 className="text-base sm:text-lg font-bold text-[#03045e]">2. Patient & Scan Parameters</h2>

                {/* Modality Selector */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-[#03045e] uppercase tracking-wider mb-2">
                    Scan Modality
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {["Ultrasound", "CT Scan", "X-Ray"].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setScanType(mode)}
                        className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-center truncate ${
                          scanType === mode
                            ? "bg-[#0077b6] text-white border-[#0077b6] shadow-sm"
                            : "bg-[#caf0f8]/30 text-[#03045e] border-[#90e0ef] hover:bg-[#caf0f8]"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Name / ID */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-[#03045e] uppercase tracking-wider mb-1.5">
                    Patient Name or ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PT-8492"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#03045e] focus:outline-none focus:border-[#0077b6] focus:ring-2 focus:ring-[#0077b6]/20 transition-all"
                  />
                </div>

                {/* Age & Gender (Responsive 1-col on small mobile, 2-col on sm) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-[#03045e] uppercase tracking-wider mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 42"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#03045e] focus:outline-none focus:border-[#0077b6] focus:ring-2 focus:ring-[#0077b6]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-[#03045e] uppercase tracking-wider mb-1.5">
                      Gender
                    </label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#03045e] focus:outline-none focus:border-[#0077b6] focus:ring-2 focus:ring-[#0077b6]/20 transition-all bg-white"
                    >
                      <option value="Unspecified">Unspecified</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Upload Terms & Diagnostic Privacy Checkbox */}
                <div className="pt-2 pb-1 text-left">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (error && error.includes("Terms")) setError(null);
                      }}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#0077b6] focus:ring-[#0077b6]/20 accent-[#0077b6] shrink-0"
                      required
                    />
                    <span className="leading-snug">
                      I confirm this is a valid medical scan and agree to the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="font-bold text-[#0077b6] hover:underline"
                      >
                        Terms of Use
                      </Link>{" "}
                      &{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="font-bold text-[#0077b6] hover:underline"
                      >
                        Privacy Policy
                      </Link>{" "}
                      conditions for automated image analysis.
                    </span>
                  </label>
                </div>

                {/* Submit Action Button */}
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!file || loading || !agreedToTerms}
                  className={`w-full py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md mt-1 ${
                    !file || loading || !agreedToTerms
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "btn-primary shadow-[#0077b6]/25"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing Scan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Analyze Scan with AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Informational Guidance Box */}
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#caf0f8]/40 border border-[#90e0ef] flex items-start gap-2.5 text-xs text-[#334155] leading-relaxed">
                <Info className="w-4 h-4 text-[#0077b6] shrink-0 mt-0.5" />
                <p>
                  Neural network compares tissue density against 50,000+ labeled kidney scans to compute
                  diagnostic probability and risk index.
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* Live Clinical Report & Calculated Patient Matrix */
          <div className="flex flex-col gap-6 sm:gap-8">
            
            {/* Top Diagnostic Outcome Banner */}
            <div
              className={`p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border shadow-lg flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 ${
                result.isStone
                  ? "bg-rose-50/90 border-rose-200 text-rose-950"
                  : "bg-emerald-50/90 border-emerald-200 text-emerald-950"
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 w-full md:w-auto">
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    result.isStone
                      ? "bg-rose-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {result.isStone ? (
                    <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.4} />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.4} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-75">
                      Diagnostic Result
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black ${
                        result.isStone
                          ? "bg-rose-200 text-rose-800"
                          : "bg-emerald-200 text-emerald-800"
                      }`}
                    >
                      {result.metrics.detectionStatus}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mt-0.5">
                    {result.diagnosis}
                  </h2>
                  <p className="text-xs sm:text-sm opacity-85 mt-1 leading-relaxed">{result.summary}</p>
                </div>
              </div>

              {/* Confidence Dial Meter */}
              <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Model Confidence
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-black md:mt-1 ${
                    result.isStone ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {result.confidence.toFixed(1)}%
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                  Severity: {result.severity}
                </span>
              </div>
            </div>

            {/* Calculated Patient Metrics Matrix (Responsive 2-col on mobile, 4-col on lg) */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#03045e] uppercase tracking-wider mb-2.5">
                Calculated Diagnostic Matrix
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="med-card p-3.5 sm:p-5 bg-white flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-bold uppercase">Condition</span>
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0077b6]" />
                  </div>
                  <p className="text-base sm:text-xl font-black text-[#03045e] truncate">
                    {result.isStone ? "Calculus Present" : "Normal Kidney"}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    Modality: {result.metrics.scanType}
                  </p>
                </div>

                <div className="med-card p-3.5 sm:p-5 bg-white flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-bold uppercase">Confidence</span>
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00b4d8]" />
                  </div>
                  <p className="text-base sm:text-xl font-black text-[#03045e]">
                    {result.metrics.confidenceScore}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    {result.metrics.modelUsed}
                  </p>
                </div>

                <div className="med-card p-3.5 sm:p-5 bg-white flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-bold uppercase">Severity</span>
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0077b6]" />
                  </div>
                  <p className="text-base sm:text-xl font-black text-[#03045e] truncate">
                    {result.metrics.riskIndex}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    Patient: {result.metrics.patientName}
                  </p>
                </div>

                <div className="med-card p-3.5 sm:p-5 bg-white flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] sm:text-xs font-bold uppercase">Latency</span>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <p className="text-base sm:text-xl font-black text-[#03045e]">
                    {result.metrics.inferenceTime}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    Roundtrip Latency
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Findings & Recommendations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
              
              {/* Scan Preview Column (4 Cols) */}
              <div className="lg:col-span-4 med-card p-4 sm:p-5 bg-white flex flex-col gap-3 sm:gap-4">
                <h4 className="text-[11px] sm:text-xs font-bold text-[#03045e] uppercase tracking-wider">
                  Analyzed Scan Visual
                </h4>
                <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img
                    src={result.imageUrl || previewUrl || ""}
                    alt="Analyzed Scan"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 flex flex-col gap-1 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-[#03045e]">
                    Timestamp: {new Date(result.metrics.timestamp).toLocaleTimeString()}
                  </span>
                  <span>Backup: Cloudinary secure storage</span>
                </div>
              </div>

              {/* Clinical Details Column (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
                
                {/* Findings Card */}
                <div className="med-card p-4 sm:p-6 lg:p-7 bg-white flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-[#03045e]">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#0077b6]" />
                    <h4 className="text-sm sm:text-base font-bold">Detailed Anatomical Findings</h4>
                  </div>
                  <ul className="flex flex-col gap-2 mt-1">
                    {result.findings.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#334155] leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0077b6] mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations Card */}
                <div className="med-card p-4 sm:p-6 lg:p-7 bg-white flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-[#03045e]">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    <h4 className="text-sm sm:text-base font-bold">Clinical Recommendations</h4>
                  </div>
                  <ul className="flex flex-col gap-2 mt-1">
                    {result.recommendations.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#334155] leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Precautions & Disclaimers */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] sm:text-xs leading-relaxed">
                    <p className="font-bold">Medical AI Disclaimer</p>
                    <p className="mt-0.5">
                      This diagnostic report is computed using machine learning for clinical assistance.
                      It is not a final legal diagnosis. Please share these findings with a licensed
                      nephrologist or urologist.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Action Toolbar */}
            <div className="pt-4 sm:pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 print:hidden">
              <button
                type="button"
                onClick={resetForm}
                className="btn-ghost text-xs sm:text-sm px-5 py-2.5 sm:py-3 rounded-full flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Analyze Another Scan</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Link
                  href="/dashboard"
                  className="btn-ghost text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-full flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Patient Dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn-primary text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Clinical Report</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
    </ProtectedRoute>
  );
}
