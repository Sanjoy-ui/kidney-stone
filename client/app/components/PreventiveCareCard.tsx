"use client";

import { useState, useMemo } from "react";
import {
  Droplets,
  Activity,
  HeartPulse,
  Apple,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  Info,
  Scale,
} from "lucide-react";
import {
  calculateClinicalRiskAndHydration,
  ClinicalRiskProfile,
} from "../utils/clinicalRiskEngine";

interface PreventiveCareCardProps {
  isStone: boolean;
  confidence: number;
  initialAge?: string | number;
  initialGender?: string;
  initialWeight?: number;
  sliceCount?: number;
  positiveSliceCount?: number;
  serverRiskProfile?: ClinicalRiskProfile;
}

export default function PreventiveCareCard({
  isStone,
  confidence,
  initialAge = 40,
  initialGender = "Male",
  initialWeight = 70,
  sliceCount = 1,
  positiveSliceCount = 1,
  serverRiskProfile,
}: PreventiveCareCardProps) {
  const [patientWeight, setPatientWeight] = useState<number>(initialWeight);

  // Dynamically recalculate when patient adjusts weight slider
  const riskProfile = useMemo(() => {
    return calculateClinicalRiskAndHydration({
      isStone,
      confidence,
      age: initialAge,
      gender: initialGender,
      weightKg: patientWeight,
      sliceCount,
      positiveSliceCount,
    });
  }, [isStone, confidence, initialAge, initialGender, patientWeight, sliceCount, positiveSliceCount]);

  const riskReduction = Math.max(
    0,
    riskProfile.recurrenceRiskPercent - riskProfile.adherentRiskPercent
  );

  return (
    <div className="med-card p-5 sm:p-7 bg-white border border-[#90e0ef]/70 flex flex-col gap-6 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#0077b6]" />
            <h3 className="text-base sm:text-lg font-bold text-[#03045e]">
              Preventive Care & 24-Hour Hydration Planner
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evidence-based disease management and recurrence prevention protocol (AUA / EAU Guidelines).
          </p>
        </div>

        {/* Patient Weight Interactive Adjustment */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200 self-start sm:self-auto">
          <Scale className="w-4 h-4 text-slate-500" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Body Weight</span>
            <span className="text-xs font-black text-[#03045e]">{patientWeight} kg</span>
          </div>
          <input
            type="range"
            min="45"
            max="135"
            step="1"
            value={patientWeight}
            onChange={(e) => setPatientWeight(Number(e.target.value))}
            className="w-24 accent-[#0077b6] cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            title="Adjust body weight to personalize hydration volume"
          />
        </div>
      </div>

      {/* Primary Metrics Grid: Hydration & Recurrence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: 24-Hour Target Hydration */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#caf0f8]/30 via-white to-slate-50 border border-[#90e0ef]/60 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0077b6]">
              <Droplets className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Target 24h Fluid Intake
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#caf0f8] text-[#0077b6]">
              ~{riskProfile.targetGlasses} Cups (250mL)
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#03045e]">
              {riskProfile.targetHydrationLiters.toFixed(2)}
            </span>
            <span className="text-sm font-bold text-slate-500">Liters / day</span>
          </div>

          {/* Fluid Distribution Guide */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>Diurnal Distribution</span>
              <span className="text-[#0077b6]">Min Urine Output: &ge; 2.5L</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full bg-cyan-400 w-[30%]" title="Morning: 30%" />
              <div className="h-full bg-[#0077b6] w-[40%]" title="Afternoon: 40%" />
              <div className="h-full bg-indigo-500 w-[20%]" title="Evening: 20%" />
              <div className="h-full bg-purple-600 w-[10%]" title="Bedtime: 10%" />
            </div>
            <span className="text-[10px] text-slate-400">
              Maintain consistent dilution; drink 1 glass before sleep to suppress night crystallization.
            </span>
          </div>
        </div>

        {/* Card 2: 5-Year Recurrence Risk Projection */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/20 via-white to-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                5-Year Recurrence Risk
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isStone
                  ? "bg-rose-100 text-rose-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {riskProfile.riskTier}
            </span>
          </div>

          {/* Comparative Progress Bars */}
          <div className="flex flex-col gap-2.5">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Baseline Untreated Risk</span>
                <span className="text-rose-600">{riskProfile.recurrenceRiskPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, riskProfile.recurrenceRiskPercent)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1 text-emerald-700">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>With Protocol Compliance</span>
                </span>
                <span className="text-emerald-600">{riskProfile.adherentRiskPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, riskProfile.adherentRiskPercent)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>High fluid adherence achieves up to {riskReduction}% absolute risk reduction.</span>
          </div>
        </div>

      </div>

      {/* Dietary & Metabolic Guidance Cards (4-Col Grid) */}
      <div className="flex flex-col gap-2.5">
        <h4 className="text-xs font-bold text-[#03045e] uppercase tracking-wider flex items-center gap-1.5">
          <Apple className="w-3.5 h-3.5 text-[#0077b6]" />
          <span>Evidence-Based Metabolic Dietary Interventions</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {riskProfile.dietaryGuidelines.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-1.5"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0077b6]">
                  {item.category}
                </span>
                <p className="text-xs font-black text-[#03045e] mt-0.5 truncate" title={item.target}>
                  {item.target}
                </p>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {item.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
