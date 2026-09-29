"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldAlert, FileText, CheckCircle2, Lock, AlertTriangle, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#03045e] tracking-tight">
            Terms of Use & Diagnostic Conditions
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: September 2026 • Effective for all account holders, medical uploads, and diagnostic scans.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm text-left">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0077b6] text-xs flex items-center justify-center font-bold">1</span>
              Acceptance of Terms & User Consent
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              By registering an account, authenticating via Google OAuth, or uploading any medical image for kidney stone analysis, you explicitly agree to be bound by these Terms of Use and our Privacy Policy. Acceptance is recorded in our secure database upon registration with cryptographic timestamps. If you do not agree to these terms, you are strictly prohibited from creating an account or using the automated scan services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0077b6] text-xs flex items-center justify-center font-bold">2</span>
              Medical Scan Upload Conditions & Image Security
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              NephroScan AI is engineered exclusively for genuine renal diagnostic imagery, including ultrasound scans, computed tomography (CT) scans, and intravenous urography (IVU) radiographs.
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
              <li>
                <strong>Authorized Imagery:</strong> You represent and warrant that all uploaded images are legitimate medical imaging files and that you have valid clinical authorization or patient consent to perform the analysis.
              </li>
              <li>
                <strong>Zero Malicious Code Tolerance:</strong> Uploading executable files, scripts, obfuscated payloads, non-medical content, or files exceeding security parameters is strictly prohibited.
              </li>
              <li>
                <strong>Automated Binary Inspection:</strong> Every file undergoes mandatory binary magic-byte inspection and MIME-type validation. Tampered or counterfeit files will be immediately rejected and logged.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5 text-amber-700">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              Clinical Decision Support Disclaimer (Not Final Medical Advice)
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs sm:text-sm leading-relaxed">
              <strong>CRITICAL NOTICE:</strong> NephroScan AI is an artificial intelligence decision-support platform designed to assist healthcare clinicians and patients. It does <strong>NOT</strong> provide a definitive medical diagnosis, nor does it replace the clinical judgment of a licensed urologist, nephrologist, or radiologist. Patients must consult certified medical professionals for clinical evaluation, pharmacological intervention, or surgical management.
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0077b6] text-xs flex items-center justify-center font-bold">4</span>
              Image Lifecycle & Automated Server Hard Drive Wiping
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              We respect user privacy and patient confidentiality. When you upload an image for analysis:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
              <li>
                <strong>Ephemeral Server Processing:</strong> The scan image is processed temporarily in volatile memory/ephemeral storage solely for neural network inference.
              </li>
              <li>
                <strong>Immediate Disk Erasure:</strong> Immediately upon inference and secure cloud backup to Cloudinary PACS storage, the local image file is wiped permanently from server hard drives using unrecoverable deletion algorithms.
              </li>
              <li>
                <strong>Zero Server Retainment:</strong> No raw uploaded images remain permanently on host application servers.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f172a] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0077b6] text-xs flex items-center justify-center font-bold">5</span>
              User Accounts & Mandatory Verification
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Users must provide authentic credentials during signup. Email verification via one-time passwords (OTP) or Google OAuth authentication is mandatory before account features are activated. Acceptance of the Privacy Policy is verified and maintained in our database. Failure to maintain acceptable use may lead to permanent termination of access.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-[#0f172a]">Contact & Clinical Inquiries</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              If you have questions regarding these Terms of Use or wish to discuss institutional PACS integration, contact our legal and medical compliance team at:
            </p>
            <p className="text-sm font-semibold text-[#0077b6]">
              Email: <a href="mailto:contact@nephroscan.ai" className="hover:underline">contact@nephroscan.ai</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
