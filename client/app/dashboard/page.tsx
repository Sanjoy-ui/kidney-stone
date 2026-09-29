"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  LogOut,
  PlusCircle,
  ShieldCheck,
  User,
  AlertCircle
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
  analysis?: {
    diagnosis?: string;
    severity?: string;
    summary?: string;
  };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5876";

export default function DashboardPage() {
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

  return (
    <ProtectedRoute
      title="Kidney Stone Clinical Dashboard"
      description="Access to your patient diagnostic dashboard and test history requires an active, verified login session."
    >
      <div className="min-h-screen w-full bg-[#f8fafc] text-[#334155] overflow-x-hidden">
        <div className="boxed-container mx-auto max-w-[1240px] px-3 sm:px-6 py-4 sm:py-8">
          {/* Header */}
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

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/diagnose"
                className="btn-primary text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New AI Scan</span>
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors px-2.5 py-2 rounded-lg hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </header>

          {/* Welcome Banner */}
          <div className="py-6 sm:py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#caf0f8]/30 p-6 sm:p-8 rounded-3xl border border-[#90e0ef]/70 shadow-lg shadow-slate-200/60">
              <div>
                <div className="inline-flex items-center gap-1.5 med-pill mb-2 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0077b6]" />
                  <span>Clinical Patient Portal</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#03045e] tracking-tight">
                  Welcome back, {user?.username || "Patient"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Connected as: <span className="font-semibold text-[#0077b6]">{user?.email}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/diagnose"
                  className="btn-primary py-3 px-6 rounded-2xl font-bold flex items-center gap-2 shadow-md shadow-[#0077b6]/20"
                >
                  <Brain className="w-4 h-4" />
                  <span>Launch AI Diagnosis Scanner</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Metrics Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Scans Run</span>
                <div className="w-8 h-8 rounded-lg bg-[#caf0f8]/60 text-[#0077b6] flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#03045e] mt-2">
                {loading ? "..." : stats.totalTests}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Renal image inference tests</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Completed Reports</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
                {loading ? "..." : stats.completed}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Verified diagnostic outputs</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Analysis Status</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#0077b6] mt-2">
                Active
              </div>
              <div className="text-[11px] text-slate-400 mt-1">AI MobileNetV2 CNN operational</div>
            </div>
          </div>

          {/* Recent Reports Section */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#03045e]">
                  Recent Scan Reports
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your past ultrasound and CT scan diagnostic results
                </p>
              </div>

              <Link
                href="/diagnose"
                className="text-xs sm:text-sm font-semibold text-[#0077b6] hover:text-[#03045e] transition-colors"
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
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {recentReports.map((report) => (
                  <div
                    key={report._id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#caf0f8]/80 text-[#0077b6] flex items-center justify-center shrink-0 mt-0.5">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#03045e]">
                            {report.analysis?.diagnosis || "Diagnostic Scan"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              report.analysis?.diagnosis?.toLowerCase().includes("stone detected")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {report.analysis?.severity || "Analyzed"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {report.analysis?.summary || `Confidence: ${report.confidence}%`}
                        </p>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {new Date(report.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(report._id)}
                        className="btn-ghost text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
