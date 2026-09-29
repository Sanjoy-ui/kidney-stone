"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useAuth } from "../context/AuthContext";

interface AuthCardProps {
  initialMode?: "login" | "signup";
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5876";

const byPrefixAndName = {
  fas: {
    "angle-left": { iconName: "angle-left", prefix: "fas" },
  },
};

function FontAwesomeIcon({
  icon,
  className = "",
}: {
  icon?: { iconName: string; prefix?: string } | string;
  className?: string;
}) {
  const iconName = typeof icon === "string" ? icon : icon?.iconName || "angle-left";
  return <i className={`fa-solid fa-${iconName} ${className}`} aria-hidden="true" />;
}

async function parseResponseJson(res: Response) {
  try {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        message: text || `Server error (${res.status})`,
      };
    }
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : "Failed to read server response";
    return {
      success: false,
      message: err,
    };
  }
}

export default function AuthCard({ initialMode = "login" }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/diagnose";
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please provide your full name.");
      return;
    }

    if (mode === "signup" && !agreedToTerms) {
      setError("You must check and agree to the Terms of Use and Privacy Policy to create an account.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await parseResponseJson(response);

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Invalid email or password.");
        }

        if (data.data) {
          const { userId, email: userEmail, username, photo_url, accessToken, refreshToken } = data.data;
          login(
            { userId, email: userEmail, username, photo_url },
            accessToken,
            refreshToken
          );
        }

        setSuccessMsg("Logged in successfully! Redirecting...");
        setTimeout(() => {
          router.push(redirectParam);
        }, 800);
      } else {
        // Sign up
        const response = await fetch(`${BACKEND_URL}/api/v1/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: name.trim(),
            email: email.trim(),
            password: password,
            agreedToTerms: agreedToTerms,
          }),
        });

        const data = await parseResponseJson(response);

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Registration failed. Please check details.");
        }

        setSuccessMsg(
          data.data?.message ||
            "Registration successful! Please check your email for the verification OTP."
        );
        setTimeout(() => {
          setMode("login");
          setSuccessMsg(null);
        }, 3000);
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      const msg = err instanceof Error ? err.message : "Authentication request failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg(null);

    if (mode === "signup" && !agreedToTerms) {
      setError("Please check and accept the Terms of Use and Privacy Policy before creating your account with Google.");
      return;
    }

    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await fetch(`${BACKEND_URL}/api/v1/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idToken,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          agreedToTerms: agreedToTerms,
        }),
      });

      const data = await parseResponseJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Google authentication failed.");
      }

      const resData = data.data || data;
      if (resData) {
        login(
          {
            userId: resData.userId,
            email: resData.email,
            username: resData.username,
            photo_url: resData.photo_url,
          },
          resData.accessToken || resData.token,
          resData.refreshToken
        );
      }

      setSuccessMsg("Google sign in successful! Redirecting...");
      setTimeout(() => {
        router.push(redirectParam);
      }, 800);
    } catch (err: unknown) {
      console.error("Google sign-in error:", err);
      let msg = "Google sign-in was cancelled or failed.";
      if (err instanceof Error) {
        if (err.message.includes("auth/popup-closed-by-user")) {
          msg = "Sign-in popup closed before completion.";
        } else if (err.message.includes("auth/unauthorized-domain")) {
          msg = "Domain not authorized in Firebase Console. Please add localhost to Authorized Domains.";
        } else {
          msg = err.message;
        }
      }
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col items-center justify-center px-4 py-10 sm:py-16">
      
      {/* Back Button */}
      <div className="w-full max-w-[420px] flex items-center justify-start mb-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#03045e] transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-200/60 cursor-pointer group"
          aria-label="Back to previous page"
        >
          <FontAwesomeIcon
            icon={byPrefixAndName.fas["angle-left"]}
            className="text-base transition-transform group-hover:-translate-x-1"
          />
          <span>Back</span>
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
        
        {/* Brand Logo */}
        <Link href="/" className="mb-3 group transition-transform hover:scale-105">
          <Image
            src="/mainLogo.png"
            alt="Health Care Medical Company"
            width={180}
            height={80}
            className="h-12 sm:h-14 w-auto object-contain"
            priority
          />
        </Link>

        {/* Title */}
        <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-[#0f172a] tracking-tight mt-2">
          {mode === "login" ? "Log in to your account" : "Create an account"}
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-slate-500 font-normal mt-1.5 max-w-xs">
          {mode === "login"
            ? "Welcome back! Please enter your details."
            : "Start your journey with NephroScan AI diagnostics."}
        </p>

        {/* Feedback Alert Messages */}
        {error && (
          <div className="w-full mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="w-full mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-5 text-left">
          
          {/* Name Field (Sign Up Only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 transition-all bg-white"
                required
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 transition-all bg-white"
              required
            />
          </div>

          {/* Password Field with Eye Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:border-[#6366f1] focus:ring-4 focus:ring-[#6366f1]/10 transition-all bg-white font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Privacy Policy & Terms Checkbox for Sign Up */}
          {mode === "signup" && (
            <div className="pt-1 text-left">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs sm:text-sm text-slate-600">
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
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-bold text-[#0077b6] hover:underline"
                  >
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-bold text-[#0077b6] hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  , including conditions for medical scan analysis.
                </span>
              </label>
            </div>
          )}

          {/* Options Row (Remember me & Forgot Password) for Login */}
          {mode === "login" && (
            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-normal">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0077b6] focus:ring-[#0077b6]/20 accent-[#0077b6]"
                />
                <span>Remember for 30 days</span>
              </label>

              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please contact support or check your registered email for password recovery.");
                }}
                className="font-semibold text-[#0077b6] hover:text-[#03045e] transition-colors"
              >
                Forgot password
              </a>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-sm sm:text-base shadow-md shadow-[#6366f1]/25 transition-all mt-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Sign up"
            )}
          </button>

          {/* Social Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? "Connecting to Google..." : "Sign in with Google"}</span>
          </button>
        </form>

        {/* Footer Switcher */}
        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-6">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-[#6366f1] hover:text-[#4f46e5] transition-colors cursor-pointer"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-[#6366f1] hover:text-[#4f46e5] transition-colors cursor-pointer"
              >
                Log in
              </Link>
            </>
          )}
        </p>

      </div>
    </div>
  );
}
