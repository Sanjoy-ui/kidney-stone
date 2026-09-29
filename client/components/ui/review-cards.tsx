"use client";

import React from "react";
import { Meteors } from "./meteors";
import { Star } from "lucide-react";

export interface ReviewItem {
  name: string;
  role: string;
  quote: string;
  badge?: string;
  rating?: number;
}

export const defaultReviews: ReviewItem[] = [
  {
    name: "Dr. Priya Sharma",
    role: "Senior Nephrologist, Apollo Hospitals",
    quote:
      "NephroScan identified a 4mm renal calculus that our initial ultrasound screening missed. The confidence scoring and localized heatmaps provide the exact reliability needed in daily clinical practice.",
    rating: 5,
  },
  {
    name: "Dr. Arjun Mehta",
    role: "Lead Radiologist, AIIMS Delhi",
    quote:
      "Automated diagnostic report generation reduced our turnaround time from 24 hours to under 2 seconds. It has integrated seamlessly into our diagnostic imaging pipeline.",
    rating: 5,
  },
  {
    name: "Ravi Kumar",
    role: "Patient, Bengaluru",
    quote:
      "I uploaded my renal ultrasound scan from home and received findings in seconds. The downloadable medical report was validated and confirmed by my consulting physician.",
    rating: 5,
  },
];

export function ReviewCard({
  review,
  meteorCount = 20,
}: {
  review: ReviewItem;
  meteorCount?: number;
}) {
  return (
    <div className="relative w-full h-full">
      {/* Ambient Gradient Blur Glow (Soft Medical Ice-Blue) */}
      <div className="absolute inset-0 h-full w-full scale-[0.85] transform rounded-full bg-gradient-to-r from-blue-200/50 via-cyan-100/40 to-teal-100/30 blur-2xl opacity-70 pointer-events-none" />
      
      {/* Meteor Card Container (Clean Light Medical Card) */}
      <div className="relative flex h-full flex-col items-start justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 lg:p-8 shadow-xl shadow-slate-200/50 hover:border-[#0077b6]/50 hover:shadow-2xl hover:shadow-[#0077b6]/10 transition-all duration-300">
        <div className="w-full">
          {/* Top Header Row: Diagonal Arrow Circle & Star Rating */}
          <div className="flex items-center justify-between w-full mb-4 sm:mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#90e0ef] bg-[#caf0f8]/80 text-[#0077b6] shadow-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                className="h-3.5 w-3.5 text-[#0077b6]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25"
                />
              </svg>
            </div>

            {/* 5 Stars */}
            <div className="flex items-center gap-1">
              {Array.from({ length: review.rating || 5 }).map((_, j) => (
                <Star
                  key={j}
                  className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>

          {/* Reviewer Name */}
          <h3 className="relative z-50 text-xl font-bold text-[#03045e] tracking-tight mb-1">
            {review.name}
          </h3>

          {/* Role / Institution */}
          <p className="relative z-50 text-xs font-semibold text-[#0077b6] mb-4 tracking-wide uppercase">
            {review.role}
          </p>

          {/* Review Text / Quote */}
          <p className="relative z-50 text-sm font-normal text-slate-600 leading-relaxed italic">
            &ldquo;{review.quote}&rdquo;
          </p>
        </div>

        {/* Meteor animation effect */}
        <Meteors number={meteorCount} />
      </div>
    </div>
  );
}

export function ReviewCards({
  reviews = defaultReviews,
}: {
  reviews?: ReviewItem[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch w-full max-w-6xl mx-auto">
      {reviews.map((review, idx) => (
        <ReviewCard key={review.name + idx} review={review} meteorCount={20} />
      ))}
    </div>
  );
}

// Backwards-compatible export of demo
export function MeteorsDemo() {
  return <ReviewCards />;
}

export default ReviewCards;
