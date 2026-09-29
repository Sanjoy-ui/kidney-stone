import { Suspense } from "react";
import AuthCard from "../components/AuthCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in — NephroScan AI",
  description: "Log in to your NephroScan AI account to access kidney stone diagnostic reports.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <AuthCard initialMode="login" />
    </Suspense>
  );
}
