/**
 * Clinical Risk & Hydration Calculation Engine (Client-Side)
 * Formulated from American Urological Association (AUA) and
 * European Association of Urology (EAU) Nephrolithiasis Management Guidelines.
 */

export interface DietaryGuideline {
  category: string;
  target: string;
  recommendation: string;
}

export interface ClinicalRiskProfile {
  targetHydrationLiters: number;
  targetGlasses: number;
  recurrenceRiskPercent: number;
  adherentRiskPercent: number;
  riskTier: string;
  dietaryGuidelines: DietaryGuideline[];
}

export interface CalculateRiskOptions {
  isStone?: boolean;
  confidence?: number;
  age?: number | string;
  gender?: string;
  weightKg?: number | string;
  sliceCount?: number;
  positiveSliceCount?: number;
}

export function calculateClinicalRiskAndHydration({
  isStone = false,
  confidence = 90,
  age = 40,
  gender = "Male",
  weightKg = 70,
  sliceCount = 1,
  positiveSliceCount = 1,
}: CalculateRiskOptions = {}): ClinicalRiskProfile {
  const numAge = typeof age === "number" ? age : parseInt(String(age)) || 40;
  const numWeight = typeof weightKg === "number" ? weightKg : parseFloat(String(weightKg)) || 70;
  const isMale = String(gender).toLowerCase() === "male";

  // 1. Target 24-Hour Hydration Calculation
  let targetHydrationLiters: number;
  if (isStone) {
    const weightBasedLiters = (numWeight * 42) / 1000;
    targetHydrationLiters = Math.max(3.0, Math.min(3.8, Number(weightBasedLiters.toFixed(2))));
    if (numAge > 65) {
      targetHydrationLiters = Math.max(2.5, Number((targetHydrationLiters * 0.9).toFixed(2)));
    }
  } else {
    const weightBasedLiters = (numWeight * 33) / 1000;
    targetHydrationLiters = Math.max(2.2, Math.min(3.0, Number(weightBasedLiters.toFixed(2))));
  }

  const targetGlasses = Math.round((targetHydrationLiters * 1000) / 250);

  // 2. 5-Year Recurrence Risk Score (%)
  let baselineRecurrence: number;
  let riskTier: string;

  if (isStone) {
    let riskScore = 44;

    if (numAge < 35) riskScore += 8;
    if (isMale) riskScore += 5;
    if (confidence > 92) riskScore += 4;
    if (sliceCount > 1 && positiveSliceCount > 1) riskScore += 7;

    riskScore = Math.min(78, Math.max(35, riskScore));

    if (riskScore >= 60) riskTier = "High Recurrence Risk";
    else if (riskScore >= 45) riskTier = "Moderate Recurrence Risk";
    else riskTier = "Elevated Risk";

    baselineRecurrence = riskScore;
  } else {
    baselineRecurrence = Math.min(12, Math.max(4, isMale ? 8 : 5));
    riskTier = "Low / Baseline Population Risk";
  }

  const adherentRiskScore = Math.max(8, Number((baselineRecurrence * 0.52).toFixed(1)));

  // 3. Metabolic Dietary Guidelines
  const dietaryGuidelines: DietaryGuideline[] = [
    {
      category: "Fluid Dynamics",
      target: `${targetHydrationLiters} L/day (~${targetGlasses} glasses)`,
      recommendation:
        "Distribute fluid consumption evenly across waking hours with 1 glass before sleep to suppress nocturnal crystallization.",
    },
    {
      category: "Citrate Enhancement",
      target: ">= 45 mEq/day urinary citrate",
      recommendation:
        "Add fresh citrus (lemon or lime juice) to drinking water. Natural citrate chelates free calcium to inhibit crystal aggregation.",
    },
    {
      category: "Sodium & Calcium Balance",
      target: "< 2,000 mg/day Sodium, Normal Calcium (1,000-1,200 mg/day)",
      recommendation:
        "Limit dietary sodium to diminish proximal tubule calcium clearance. Maintain normal dietary calcium so calcium binds intestinal oxalate.",
    },
    {
      category: "Oxalate Moderation",
      target: "< 100 mg/day High-Oxalate Foods",
      recommendation:
        "Moderate spinach, almonds, rhubarb, beets, and dark chocolate, particularly when not paired with dietary calcium.",
    },
  ];

  return {
    targetHydrationLiters,
    targetGlasses,
    recurrenceRiskPercent: baselineRecurrence,
    adherentRiskPercent: adherentRiskScore,
    riskTier,
    dietaryGuidelines,
  };
}
