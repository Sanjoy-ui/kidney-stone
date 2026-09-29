"use client";

import React, { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Lock, ArrowRight, Loader2, Home } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function ProtectedRoute({
  children,
  title = "Protected Clinical Diagnostic Dashboard",
  description = "Access to the Kidney Stone AI Detection & Patient Scan Dashboard requires an authenticated session with verified credentials.",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectTarget = `/login?redirect=${encodeURIComponent(pathname || "/diagnose")}`;
      // Small timeout to allow UI notice before route transition
      const timer = setTimeout(() => {
        router.push(redirectTarget);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#caf0f8]/80 text-[#0077b6] shadow-md shadow-[#90e0ef]/30 animate-pulse">
            <Lock className="w-8 h-8 text-[#0077b6]" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0077b6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#0077b6]"></span>
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#03045e]">
              Verifying Clinical Session...
            </h3>
            <p className="text-xs text-slate-500">
              Validating access token and clinical credentials.
            </p>
          </div>
          <Loader2 className="w-5 h-5 text-[#0077b6] animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(pathname || "/diagnose")}`;

    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#90e0ef]/70 shadow-2xl shadow-slate-200/80 p-6 sm:p-8 text-center space-y-6">
          <div className="flex justify-center">
            <Link href="/">
              <Image
                src="/mainLogo.png"
                alt="Health Care Medical Company"
                width={160}
                height={70}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <Lock className="w-3 h-3" />
              <span>Authentication Required</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#03045e] tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href={redirectUrl}
              className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-[#0077b6]/20"
            >
              <span>Log In with Verified Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={`/register?redirect=${encodeURIComponent(pathname || "/diagnose")}`}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-[#03045e] hover:bg-slate-50 transition-colors text-sm font-semibold flex items-center justify-center"
            >
              Create New Patient / Clinician Account
            </Link>

            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-[#0077b6] transition-colors flex items-center justify-center gap-1 pt-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Public Homepage</span>
            </Link>
          </div>

          <p className="text-[11px] text-slate-400">
            Redirecting to login automatically in a moment...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
