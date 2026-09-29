"use client";

import { Users, Target, Timer, Building2 } from "lucide-react";

const stats = [
  { icon: Users, value: "10,000+", label: "Patients Analyzed" },
  { icon: Target, value: "98.6%", label: "Detection Accuracy" },
  { icon: Timer, value: "< 2s", label: "Avg. Analysis Time" },
  { icon: Building2, value: "50+", label: "Partner Hospitals" },
];

export default function StatsBar() {
  return (
    <div className="w-full mt-4 sm:mt-10 mb-8 sm:mb-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-2 sm:gap-3 text-center p-4 sm:p-6 lg:p-7 med-card group h-full bg-white"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#caf0f8] border border-[#90e0ef] flex items-center justify-center group-hover:bg-[#0077b6] transition-all duration-300">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0077b6] group-hover:text-white transition-colors" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#03045e] tracking-tight">{value}</p>
              <p className="text-[11px] sm:text-xs md:text-sm font-semibold text-[#334155] mt-0.5 sm:mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
