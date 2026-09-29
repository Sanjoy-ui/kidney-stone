"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function PricingSection() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      id: "hobby",
      name: "Hobby",
      description: "For solo clinicians and small clinics getting started with AI screening.",
      price: billingCycle === "monthly" ? "199" : "159",
      period: "/ Month",
      billingNote: billingCycle === "yearly" ? "Billed annually (₹1,908/yr)" : "Billed monthly",
      buttonText: "Start a free trial",
      buttonHref: user ? "/diagnose?plan=hobby" : "/register?plan=hobby",
      isPopular: false,
      includesTitle: "HOBBY PLAN INCLUDES",
      features: [
        { text: "AI kidney scans per month", bold: "50" },
        { text: "Rapid stone detection & binary diagnosis", bold: "" },
        { text: "Clinical confidence scoring & metrics", bold: "" },
        { text: "Medical PDF report export", bold: "Downloadable" },
        { text: "Cloud storage for 60-day scan history", bold: "" },
        { text: "seat (Clinician / Radiologist)", bold: "1 member" },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      description: "For diagnostic centers & nephrology teams needing high-volume precision.",
      price: billingCycle === "monthly" ? "499" : "399",
      period: "/ Month",
      billingNote: billingCycle === "yearly" ? "Billed annually (₹4,788/yr)" : "Billed monthly",
      buttonText: "Get started",
      buttonHref: user ? "/diagnose?plan=pro" : "/register?plan=pro",
      isPopular: true,
      includesTitle: "PRO PLAN INCLUDES",
      features: [
        { text: "AI diagnostic scans (Zero quota limits)", bold: "Unlimited" },
        { text: "MobileNetV2 deep learning (<2s inference)", bold: "" },
        { text: "Stone localization & heatmap analysis", bold: "High-accuracy" },
        { text: "Instant Cloudinary backup with auto-wipe", bold: "" },
        { text: "Priority clinical support", bold: "24/7" },
        { text: "seats with multi-device sync", bold: "10 clinician" },
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For multi-specialty hospitals, healthcare networks & diagnostic labs.",
      price: billingCycle === "monthly" ? "1,499" : "1,199",
      period: "/ Month",
      billingNote: billingCycle === "yearly" ? "Billed annually (₹14,388/yr)" : "Billed monthly per site",
      buttonText: "Get started",
      buttonHref: user ? "/diagnose?plan=enterprise" : "/register?plan=enterprise",
      isPopular: false,
      includesTitle: "ENTERPRISE PLAN INCLUDES",
      features: [
        { text: "in Pro included", bold: "Everything" },
        { text: "Custom hospital PACS & DICOM integration", bold: "" },
        { text: "Dedicated clinical account manager", bold: "" },
        { text: "HIPAA & ISO 13485 compliance SLA", bold: "" },
        { text: "Emergency clinical hotline support", bold: "Dedicated" },
        { text: "seats for full hospital department", bold: "Unlimited clinician" },
      ],
    },
  ];

  return (
    <section id="pricing" className="w-full py-16 sm:py-24 relative">
      {/* Header Content */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#03045e] tracking-tight leading-tight">
          Our Plans
        </h2>
        
        <p className="mt-2.5 sm:mt-3.5 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed px-2">
          Choose the right scale for your individual practice, imaging center, or hospital network. All tiers include certified security and lightning-fast inference.
        </p>

        {/* Billing Cycle Switcher */}
        <div className="mt-6 sm:mt-8 inline-flex items-center p-1 rounded-full bg-slate-200/80 border border-slate-300 shadow-inner max-w-full">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-white text-[#03045e] shadow-sm"
                : "text-slate-600 hover:text-[#03045e]"
            }`}
          >
            Monthly billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
              billingCycle === "yearly"
                ? "bg-white text-[#03045e] shadow-sm"
                : "text-slate-600 hover:text-[#03045e]"
            }`}
          >
            <span>Yearly billing</span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isPopular = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 ease-out transform cursor-pointer group bg-white ${
                isPopular
                  ? "border-2 border-[#0077b6] shadow-2xl shadow-[#0077b6]/20 ring-4 ring-[#0077b6]/10 lg:scale-[1.03] hover:scale-105 hover:-translate-y-3 hover:shadow-2xl hover:shadow-[#0077b6]/30 hover:border-[#023e8a]"
                  : "border border-slate-200/90 shadow-xl shadow-slate-200/50 hover:scale-105 hover:-translate-y-2.5 hover:shadow-2xl hover:shadow-[#0077b6]/15 hover:border-[#0077b6]/50"
              }`}
            >
              <div>
                {/* Top Inner Sub-Card Header */}
                <div
                  className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left transition-colors ${
                    isPopular
                      ? "bg-gradient-to-br from-[#0077b6]/10 to-[#caf0f8]/40 border border-[#0077b6]/25"
                      : "bg-[#f8fafc] border border-slate-200/80 group-hover:bg-[#f0f9ff]/60 group-hover:border-[#bae6fd]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#03045e]">
                      {plan.name}
                    </h3>
                    {isPopular && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#0077b6] text-white shadow-xs">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                    {plan.description}
                  </p>
                </div>

                {/* Price Row */}
                <div className="text-left mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#03045e]">
                      ₹{plan.price}
                    </span>
                    <span className="text-sm sm:text-base font-medium text-slate-500">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1 font-medium text-slate-400">
                    {plan.billingNote}
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.buttonHref}
                  className={`w-full py-3.5 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer mb-8 shadow-sm ${
                    isPopular
                      ? "bg-gradient-to-r from-[#0077b6] to-[#0096c7] hover:from-[#023e8a] hover:to-[#0077b6] text-white shadow-lg shadow-[#0077b6]/30 hover:scale-[1.01]"
                      : "bg-slate-100 hover:bg-[#caf0f8]/60 border border-slate-300 text-[#03045e] hover:text-[#0077b6] hover:border-[#0077b6]/60 transition-colors"
                  }`}
                >
                  {plan.buttonText}
                </Link>

                {/* Dotted Divider */}
                <div className="w-full border-b border-dotted mb-7 border-slate-200" />

                {/* Includes Title */}
                <h4
                  className={`text-[11px] font-bold tracking-wider uppercase mb-5 text-left ${
                    isPopular ? "text-[#0077b6]" : "text-slate-500"
                  }`}
                >
                  {plan.includesTitle}
                </h4>

                {/* Features List */}
                <ul className="flex flex-col gap-3.5 text-left text-xs sm:text-sm">
                  {plan.features.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${
                          isPopular
                            ? "bg-[#0077b6] text-white shadow-xs"
                            : "bg-[#caf0f8] text-[#0077b6] border border-[#90e0ef]/60"
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className={isPopular ? "text-slate-700" : "text-slate-600"}>
                        {item.bold ? (
                          <>
                            <strong className="font-bold text-[#03045e]">
                              {item.bold}{" "}
                            </strong>
                            {item.text}
                          </>
                        ) : (
                          item.text
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
