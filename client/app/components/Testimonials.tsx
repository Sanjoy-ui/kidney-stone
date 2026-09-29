"use client";

import { ReviewCards } from "@/components/ui/review-cards";

export default function Testimonials() {
  return (
    <section id="reviews" className="w-full py-10 sm:py-16 lg:py-24 relative">
      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-16">
        <span className="med-pill mb-3.5 inline-flex">Patient & Clinician Reviews</span>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#03045e] mt-2 tracking-tight leading-tight">
          Trusted by Medical <span className="text-[#0077b6]">Professionals</span>
        </h2>
        <p className="text-[#334155] mt-2.5 sm:mt-3 max-w-xl mx-auto text-xs sm:text-base lg:text-lg font-normal leading-relaxed px-2">
          Nephrologists, radiologists, and patients validate our high-precision AI kidney stone diagnostic system.
        </p>
      </div>

      {/* Meteors Review Cards */}
      <ReviewCards />
    </section>
  );
}
