"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  LogOut,
  PlusCircle,
  ShieldCheck,
  Eye,
} from "lucide-react";

interface DashboardStats {
  totalTests: number;
  completed: number;
  pending: number;
}

interface RecentReport {
  _id: string;
  status: string;
  confidence: number;
  createdAt: string;
  fileUrl: string;
  isStone?: boolean;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  scanType?: string;
  analysis?: {
    diagnosis?: string;
    severity?: string;
    summary?: string;
    findings?: string[];
    recommendations?: string[];
  };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5876";

export default function DashboardPage() {
  const router = useRouter();
  const { user, authFetch, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    completed: 0,
    pending: 0,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${BACKEND_URL}/api/v1/dashboard/getdata`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data.stats || { totalTests: 0, completed: 0, pending: 0 });
            setRecentReports(data.recentReports || []);
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Could not load past reports from clinical database.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [authFetch]);

  const handleDownloadPdf = async (reportId: string) => {
    try {
      const res = await authFetch(
        `${BACKEND_URL}/api/v1/dashboard/download-report/${reportId}`,
        { method: "POST" }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Kidney_Report_${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        alert("Could not generate report PDF. Please try again.");
      }
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to download clinical report PDF.");
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/diagnose");
    }
  };

  return (
    <ProtectedRoute
      title="Kidney Stone Clinical Dashboard"
      description="Access to your patient diagnostic dashboard and test history requires an active, verified login session."
    >
      <div className="min-h-screen w-full bg-[#f8fafc] text-[#334155] overflow-x-hidden">
        <div className="boxed-container mx-auto max-w-[1240px] px-3 sm:px-6 py-3 sm:py-8">
          {/* Header */}
          <header className="w-full flex items-center justify-between pb-3 sm:pb-6 border-b border-[#90e0ef]/50 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0077b6] text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:border-[#90e0ef] group shrink-0"
                title="Go back"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-0.5 text-slate-500 group-hover:text-[#0077b6]" />
                <span className="hidden xs:inline">Back</span>
              </button>

              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <Image
                  src="/mainLogo.png"
                  alt="Health Care Medical Company"
                  width={140}
                  height={60}
                  className="h-8 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
                  priority
                />
              </Link>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <Link
                href="/diagnose"
                className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#0077b6] hover:bg-[#03045e] text-white shadow-xs transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New AI Scan</span>
                <span className="sm:hidden">New Scan</span>
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg hover:bg-rose-50"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </header>

          {/* Welcome Banner */}
          <div className="py-4 sm:py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#caf0f8]/30 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#90e0ef]/70 shadow-lg shadow-slate-200/60">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 med-pill mb-2 text-[11px] sm:text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0077b6]" />
                  <span>Clinical Patient Portal</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-extrabold text-[#03045e] tracking-tight truncate">
                  Welcome back, {user?.username || "Patient"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 break-all sm:break-normal">
                  Connected as: <span className="font-semibold text-[#0077b6]">{user?.email}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <Link
                  href="/diagnose"
                  className="btn-primary py-2.5 sm:py-3 px-4 sm:px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-[#0077b6]/20 w-full md:w-auto text-center text-xs sm:text-base"
                >
                  <Brain className="w-4 h-4 shrink-0" />
                  <span>Launch AI Diagnosis Scanner</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
              </div>
            </div>
          </div>

          {/* Metrics Stats Grid - Responsive 2 cols on mobile, 3 cols on tablet/desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Total Scans</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#caf0f8]/60 text-[#0077b6] flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black text-[#03045e] mt-1.5 sm:mt-2">
                {loading ? "..." : stats.totalTests}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 truncate">Renal image tests</div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Completed</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black text-emerald-600 mt-1.5 sm:mt-2">
                {loading ? "..." : stats.completed}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 truncate">Verified diagnostics</div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Analysis Status</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black text-[#0077b6] mt-1.5 sm:mt-2">
                Active
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 truncate">AI MobileNetV2 CNN operational</div>
            </div>
          </div>

          {/* Recent Reports Section */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-3.5 sm:p-7 shadow-xs">
            <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
              <div>
                <h2 className="text-base sm:text-xl font-bold text-[#03045e]">
                  Recent Scan Reports
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Your past ultrasound and CT scan diagnostic results
                </p>
              </div>

              <Link
                href="/diagnose"
                className="shrink-0 text-xs sm:text-sm font-semibold text-[#0077b6] hover:text-[#03045e] transition-colors bg-[#caf0f8]/50 hover:bg-[#caf0f8] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg whitespace-nowrap"
              >
                + New Analysis
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading clinical scan history...
              </div>
            ) : recentReports.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#caf0f8] text-[#0077b6] mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#03045e]">No Scan Reports Found Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You haven&apos;t run any kidney stone diagnostic scans on this account yet.
                  Upload your first ultrasound or CT scan to get instant findings.
                </p>
                <div className="pt-2">
                  <Link
                    href="/diagnose"
                    className="btn-primary text-xs px-5 py-2.5 rounded-full inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Run Your First Scan</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReports.map((report) => {
                  const isStoneDetected =
                    report.isStone ||
                    report.analysis?.diagnosis?.toLowerCase().includes("stone detected");

                  return (
                    <div
                      key={report._id}
                      className="py-3.5 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 px-2 sm:px-4 rounded-xl sm:rounded-2xl transition-all"
                    >
                      {/* Left: Thumbnail & Clinical Findings Summary */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        {report.fileUrl && report.fileUrl.startsWith("http") ? (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 relative shadow-2xs">
                            <img
                              src={report.fileUrl}
                              alt="Renal scan thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#caf0f8]/80 text-[#0077b6] flex items-center justify-center shrink-0">
                            <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-sm sm:text-base text-[#03045e]">
                              {report.analysis?.diagnosis || "Kidney Scan Analysis"}
                            </span>

                            <span
                              className={`text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isStoneDetected
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {isStoneDetected ? "Stone Detected" : "No Stone"}
                            </span>

                            {report.scanType && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hidden sm:inline-block">
                                {report.scanType}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {report.analysis?.summary || `Confidence: ${report.confidence}%`}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-1.5 font-medium">
                            <span className="text-slate-500">
                              {new Date(report.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            {report.patientName && report.patientName !== "Anonymous Patient" && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 font-semibold truncate max-w-[110px] sm:max-w-[130px]">
                                  {report.patientName}
                                </span>
                              </>
                            )}

                            <span>•</span>
                            <span className="text-[#0077b6] font-bold">
                              Confidence: {report.confidence ? `${report.confidence.toFixed(1)}%` : "N/A"}
                            </span>

                            {report.analysis?.severity && report.analysis.severity !== "None" && (
                              <>
                                <span>•</span>
                                <span className="text-amber-700 font-semibold">
                                  {report.analysis.severity} Severity
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions (View Report & PDF Download) - Exactly same size & height */}
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 shrink-0 w-full md:w-auto pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <Link
                          href={`/diagnose?reportId=${report._id}`}
                          className="h-10 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap bg-[#0077b6] hover:bg-[#03045e] text-white border border-[#0077b6] shadow-xs transition-all w-full sm:w-32"
                        >
                          <Eye className="w-4 h-4 shrink-0" />
                          <span>View Report</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(report._id)}
                          className="h-10 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap border border-slate-300 hover:border-[#0077b6] bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0077b6] shadow-2xs transition-all w-full sm:w-32"
                          title="Download PDF clinical summary"
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
