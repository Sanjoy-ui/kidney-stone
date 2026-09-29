"use client";

import { Upload, Brain, FileText, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Scan",
    description:
      "Upload CT scan, MRI, or ultrasound images in JPG, PNG, or DICOM format. Secure HIPAA-compliant transfer with zero data retention.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Analyzes the Image",
    description:
      "Our deep CNN model — trained on 50,000+ labeled kidney scans — segments the renal anatomy and detects stone location and size.",
  },
  {
    number: "03",
    icon: FileText,
    title: "Get Your Clinical Report",
    description:
      "Receive an instant, downloadable diagnostic report containing stone detection status, confidence scores, and clinical recommendations.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full py-10 sm:py-16 lg:py-20 text-center">
      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-16">
        <span className="med-pill mb-3.5 inline-flex">Diagnostic Workflow</span>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#03045e] mt-2 tracking-tight leading-tight">
          Simple. Fast. <span className="text-[#0077b6]">Clinically Accurate.</span>
        </h2>
        <p className="text-[#334155] mt-2.5 sm:mt-3 max-w-xl mx-auto text-sm sm:text-base lg:text-lg font-normal leading-relaxed">
          From scan upload to comprehensive diagnosis in three seamless steps.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 relative text-left">
        {/* Connector Line (Desktop) */}
        <div className="hidden md:block absolute top-14 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-0.5 bg-gradient-to-r from-[#0077b6]/30 via-[#00b4d8]/40 to-[#0077b6]/30" />

        {steps.map(({ number, icon: Icon, title, description }, i) => (
          <div
            key={number}
            className="med-card p-5 sm:p-7 lg:p-8 flex flex-col justify-between gap-4 sm:gap-5 hover:-translate-y-1.5 transition-all duration-300 group relative z-10 h-full bg-white"
          >
            <div>
              {/* Step Header */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0077b6] to-[#00b4d8] flex items-center justify-center shrink-0 shadow-md shadow-[#0077b6]/20 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
                </div>
                <span className="text-3xl sm:text-4xl font-black text-[#0077b6]/25 tracking-tight">
                  {number}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[#03045e] mt-3 sm:mt-4">{title}</h3>
              <p className="text-[#334155] leading-relaxed text-xs sm:text-sm mt-1.5 sm:mt-2">{description}</p>
            </div>

            {i < steps.length - 1 && (
              <ArrowRight className="w-5 h-5 text-[#0077b6] md:hidden self-center mt-2" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
