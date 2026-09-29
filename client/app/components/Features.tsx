"use client";

import { Brain, FileText, Lock, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Renal Detection",
    description:
      "Deep CNN model trained on 50,000+ labeled kidney ultrasound and CT scan images. Detects stones as small as 2mm with high precision.",
  },
  {
    icon: FileText,
    title: "Instant PDF Clinical Reports",
    description:
      "Auto-generated diagnostic reports complete with findings, probability confidence scores, size estimations, and verified clinical recommendations.",
  },
  {
    icon: Lock,
    title: "Secure & HIPAA-Ready",
    description:
      "End-to-end encrypted image transfer. Compliant infrastructure with zero data retention policy for maximum patient confidentiality.",
  },
  {
    icon: BarChart3,
    title: "Heatmap & Confidence Scoring",
    description:
      "Every diagnosis comes with an exact probability score and visual segmentation heatmap, highlighting the precise region of interest.",
  },
];

export default function Features() {
  return (
    <section id="features" className="w-full py-10 sm:py-16 lg:py-20">
      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-16">
        <span className="med-pill mb-3.5 inline-flex">Medical Services</span>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#03045e] mt-2 tracking-tight leading-tight">
          Comprehensive <span className="text-[#0077b6]">Diagnostic Features</span>
        </h2>
        <p className="text-[#334155] mt-2.5 sm:mt-3 max-w-xl mx-auto text-sm sm:text-base lg:text-lg font-normal leading-relaxed">
          Built for clinicians and patients alike — high precision diagnostics wrapped in an intuitive interface.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="med-card p-5 sm:p-7 lg:p-9 group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between bg-white"
          >
            <div className="flex items-start gap-3.5 sm:gap-5">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#caf0f8] border border-[#90e0ef] flex items-center justify-center shrink-0 group-hover:bg-[#0077b6] transition-all duration-300">
                <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-[#0077b6] group-hover:text-white transition-colors" strokeWidth={2} />
              </div>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#03045e]">{title}</h3>
                <p className="text-[#334155] text-xs sm:text-sm lg:text-base leading-relaxed">{description}</p>
              </div>
            </div>

            {/* Bottom Accent Bar */}
            <div className="mt-6 h-0.5 w-0 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] group-hover:w-full transition-all duration-500 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
