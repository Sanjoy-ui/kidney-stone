"use client";

import { Mail, Clock, ShieldCheck } from "lucide-react";

export default function CTASection() {
  return (
    <section id="contact" className="w-full py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 md:p-14 text-center border border-[#90e0ef]/80 bg-white shadow-xl shadow-[#0077b6]/5 w-full">
        {/* Subtle Decorative Ambient Background Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#caf0f8]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#90e0ef]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-5 max-w-2xl mx-auto">
          {/* Pill Badge */}
          <span className="med-pill">
            <Mail className="w-3.5 h-3.5 text-[#0077b6]" />
            <span>Get in Touch</span>
          </span>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#03045e] tracking-tight">
            Contact the <span className="text-[#0077b6]">Team</span>
          </h2>

          {/* Description */}
          <p className="text-[#334155] text-sm sm:text-base font-normal leading-relaxed">
            Have questions about AI renal imaging, hospital integration, or patient report validation? Our medical and clinical engineering team is ready to assist.
          </p>

          {/* Contact Action */}
          <div className="pt-2">
            <a
              href="mailto:contact@nephroscan.ai"
              className="btn-primary text-sm sm:text-base px-8 py-3.5 rounded-full shadow-lg shadow-[#0077b6]/25 hover:scale-[1.02] transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Contact the Team</span>
            </a>
          </div>

          {/* Micro Support Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs text-slate-500 border-t border-slate-100 w-full mt-2">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#0077b6]" />
              contact@nephroscan.ai
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0077b6]" />
              Typical reply within 2 hours
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Direct Clinical Advisory
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
