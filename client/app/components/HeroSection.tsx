"use client";

import { ArrowRight, CheckCircle2, Stethoscope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import doctorImage from "@/public/Doctors-cuate.svg";
import { useAuth } from "../context/AuthContext";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="w-full pt-6 pb-10 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16 overflow-hidden sm:overflow-visible">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center">
        
        {/* Left Column: Narrative, CTA & Partner Logos */}
        <div className="flex flex-col gap-5 sm:gap-7 text-left w-full z-10">
          
          {/* Pill Tag */}
          <div className="inline-flex self-start">
            
          </div>

          {/* Headline - fluid typography */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-extrabold tracking-tight text-[#03045e] leading-[1.18] sm:leading-[1.12]">
            Get a complete diagnosis at the{" "}
            <span className="text-[#0077b6]">NephroScan</span> Medical Center
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-base lg:text-lg text-[#334155] leading-relaxed font-normal max-w-xl">
            NephroScan is a modern medical AI diagnostic platform of a new format that provides
            high-quality kidney stone detection, segmentation, and verified clinical reports
            in the shortest possible time.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1 w-full sm:w-auto">
            <Link
              href={isAuthenticated ? "/diagnose" : "/login?redirect=/diagnose"}
              className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3.5 rounded-full shadow-lg shadow-[#0077b6]/30 justify-center text-center"
            >
              <span>Try Kidney Stone Diagnosis</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>

          {/* Medical Partner Logos - Responsive wrapping */}
          <div className="pt-5 sm:pt-8 border-t border-slate-200/80 flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-10 opacity-75 hover:opacity-100 transition-opacity">
            {/* Synlab */}
            <div className="flex items-center gap-1.5 font-bold tracking-wider text-[#03045e] text-xs sm:text-base">
              <span className="tracking-widest font-black">SYNLAB</span>
              <span className="text-[#0077b6] text-base sm:text-lg font-mono">\</span>
            </div>

            {/* Kaiser Permanente */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#03045e] tracking-tight uppercase">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#0077b6]/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0077b6]" />
              </div>
              <span>Kaiser Permanente</span>
            </div>

            {/* Medecu */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#03045e] tracking-tight">
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-[#00b4d8]" />
              <span className="font-extrabold text-xs sm:text-base italic">medecu</span>
            </div>
          </div>
        </div>

        {/* Right Column: Doctor Composition (Fluid scaling for all screens) */}
        <div className="relative flex items-center justify-center w-full min-h-[340px] sm:min-h-[440px] lg:min-h-[480px] py-4">
          {/* Layer 1: Circular Framing with Concentric Rings */}
          <div className="w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px] lg:w-[450px] lg:h-[450px] rounded-full bg-gradient-to-tr from-[#caf0f8] via-[#caf0f8]/70 to-white shadow-xl shadow-[#0077b6]/10 border border-[#90e0ef] flex items-center justify-center relative">
            {/* Concentric subtle decorative dashed ring */}
            <div className="absolute -inset-3 sm:-inset-5 rounded-full border border-[#90e0ef]/50 border-dashed pointer-events-none" />
            <div className="hidden sm:block absolute -right-4 top-8 w-20 sm:w-24 h-20 sm:h-24 rounded-full border-2 border-[#90e0ef]/40 pointer-events-none" />

            {/* Layer 2: Floating Decorative Capsule Pill (Top Left) */}
            <div className="absolute -top-3 left-1 sm:left-4 z-20 w-9 h-13 sm:w-14 sm:h-20 rounded-full bg-gradient-to-b from-[#0077b6] to-[#00b4d8] shadow-lg shadow-[#0077b6]/30 border-2 border-white flex flex-col items-center justify-center transform -rotate-12">
              <div className="w-full h-1/2 rounded-t-full bg-[#0077b6] border-b border-white/40" />
              <div className="w-full h-1/2 rounded-b-full bg-[#90e0ef]" />
            </div>

            {/* Layer 3: Floating Small Capsule Pill (Right) */}
            <div className="absolute -right-2 sm:right-2 top-1/3 z-20 w-8 h-12 sm:w-10 sm:h-14 rounded-full bg-gradient-to-b from-[#00b4d8] to-[#caf0f8] shadow-md shadow-[#0077b6]/20 border-2 border-white flex flex-col items-center justify-center transform rotate-45">
              <div className="w-full h-1/2 rounded-t-full bg-[#0077b6] border-b border-white/40" />
              <div className="w-full h-1/2 rounded-b-full bg-[#caf0f8]" />
            </div>

            {/* Layer 4: Doctor Centerpiece Image */}
            <div className="relative z-10 w-[240px] sm:w-[340px] md:w-[400px] lg:w-[440px] max-h-[380px] sm:max-h-[460px] flex items-end justify-center">
              <Image
                src={doctorImage}
                alt="Doctor Presenting Medical Data"
                priority
                className="object-contain max-h-[350px] sm:max-h-[450px] w-auto drop-shadow-2xl"
              />
            </div>

            {/* Layer 5: Floating Specialist Social Proof Card (Bottom Left) */}
            <div className="absolute -bottom-2 -left-2 sm:bottom-2 sm:left-0 z-20 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-xl border border-[#90e0ef]/80 flex items-center gap-2 sm:gap-3 scale-85 sm:scale-100 origin-bottom-left">
              <div className="flex -space-x-1.5 sm:-space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#0077b6] to-[#00b4d8] border-2 border-white flex items-center justify-center text-white text-[9px] sm:text-[10px] font-extrabold">
                  DR
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#03045e] to-[#0077b6] border-2 border-white flex items-center justify-center text-white text-[9px] sm:text-[10px] font-extrabold">
                  MD
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] border-2 border-white flex items-center justify-center text-[#03045e] text-[9px] sm:text-[10px] font-extrabold">
                  AI
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-[#03045e] leading-tight">20+ Specialists</p>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#0077b6]">98.6% Accuracy</p>
              </div>
            </div>

            {/* Layer 6: Floating Diagnostic Report Card (Bottom Right) */}
            <div className="absolute -bottom-2 -right-2 sm:bottom-0 sm:right-0 z-20 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-xl border border-[#90e0ef]/80 flex flex-col gap-1.5 sm:gap-2 w-32 sm:w-40 scale-85 sm:scale-100 origin-bottom-right">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#caf0f8] flex items-center justify-center text-[#0077b6]">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0077b6]" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#03045e]">Report Ready</span>
              </div>
              
              <div className="flex flex-col gap-1 sm:gap-1.5 pt-0.5 sm:pt-1">
                <div className="h-1.5 w-full bg-[#caf0f8] rounded-full" />
                <div className="h-1.5 w-3/4 bg-[#90e0ef] rounded-full" />
                <div className="h-1.5 w-1/2 bg-[#00b4d8]/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
