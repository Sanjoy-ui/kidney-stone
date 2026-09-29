import { Suspense } from "react";
import AuthCard from "../components/AuthCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up — NephroScan AI",
  description: "Create an account on NephroScan AI to access advanced renal diagnostic scans and reports.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <AuthCard initialMode="signup" />
    </Suspense>
  );
}
