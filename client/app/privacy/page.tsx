"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Shield, Lock, Eye, Database, FileCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#334155] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
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
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          <Link href="/" className="group transition-transform hover:scale-105">
            <Image
              src="/mainLogo.png"
              alt="Health Care Medical Company"
              width={140}
              height={60}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#caf0f8] border border-[#90e0ef] text-xs font-semibold text-[#0077b6] mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Patient Privacy & Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#03045e] tracking-tight">
            Privacy Policy & Medical Data Protection
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: September 2026 • Compliant with international medical confidentiality and patient data security standards.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm text-left">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0077b6] text-xs flex items-center justify-center font-bold">1</span>
              Consent & Privacy Tracking in Our Database
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              When creating an account or authenticating via Google OAuth on NephroScan, users must explicitly check the confirmation checkbox accepting our Privacy Policy. This verification is permanently recorded in our database with the user&apos;s unique record (<code>agreedToTerms: true</code>) along with an immutable timestamp (<code>agreedToTermsAt</code>). Users who do not consent to this tracking cannot create accounts or upload diagnostic data.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0077b6] text-xs flex items-center justify-center font-bold">2</span>
              Information We Collect
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              We collect only the minimum required information necessary to provide accurate automated AI detection:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
              <li>
                <strong>Account Credentials:</strong> Full name, registered email address, hashed passwords (bcrypt with 15 salt rounds), and optional profile avatars.
              </li>
              <li>
                <strong>Diagnostic Scan Data:</strong> Ultrasound and CT scan images voluntarily provided for kidney stone detection.
              </li>
              <li>
                <strong>Clinical Report Metadata:</strong> Patient reference names or anonymous IDs, age, gender, and scan orientation tags used strictly for generating clinical diagnostic reports.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0077b6] text-xs flex items-center justify-center font-bold">3</span>
              Immediate Server Hard Drive Deletion & Ephemeral Lifecycle
            </h2>
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-blue-950 text-xs sm:text-sm leading-relaxed">
              <strong>Zero Hard Drive Retention Guarantee:</strong> To protect sensitive medical records, scan images uploaded to NephroScan are immediately deleted from the server hard drive right after AI inference. The local file is removed from disk (<code>fs.unlink</code>) and secured only via encrypted, authenticated Cloudinary PACS backups.
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              We never use your private patient imaging scans to train commercial third-party advertising models. Your medical data belongs exclusively to you and your authorized clinical staff.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0077b6] text-xs flex items-center justify-center font-bold">4</span>
              Security Architecture & Encryption Standards
            </h2>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
              <li>
                <strong>Transit Security:</strong> All API requests, token exchanges, and file transmissions are encrypted using Transport Layer Security (TLS 1.3 / HTTPS).
              </li>
              <li>
                <strong>Session Protection:</strong> Tokens are stored in secure HTTP-only cookies protected against cross-site scripting (XSS) and cross-site request forgery (CSRF).
              </li>
              <li>
                <strong>Access Control:</strong> Diagnostic reports can only be retrieved by the authenticated user who initiated the analysis.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0077b6] text-xs flex items-center justify-center font-bold">5</span>
              Your Data Rights & Erasure Requests
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              You retain full rights to request complete data deletion, report history removal, or account termination at any time. To exercise these rights, submit a written request to our data protection officer at:
            </p>
            <p className="text-sm font-semibold text-[#0077b6]">
              Email: <a href="mailto:privacy@nephroscan.ai" className="hover:underline">privacy@nephroscan.ai</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
