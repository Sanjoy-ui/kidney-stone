"use client";

import { useState, useRef, MouseEvent } from "react";
import {
  Sun,
  Contrast,
  SlidersHorizontal,
  ZoomIn,
  Ruler,
  RotateCcw,
  Sparkles,
  Eye,
  Layers,
  Crosshair,
} from "lucide-react";

interface Point {
  x: number;
  y: number;
}

export interface RadiologyViewerProps {
  imageUrl: string;
  heatmapUrl?: string | null;
  alt?: string;
  visualMode?: "gradcam" | "original" | "split";
  onVisualModeChange?: (mode: "gradcam" | "original" | "split") => void;
  gradcamLayer?: string | null;
}

export default function RadiologyViewer({
  imageUrl,
  heatmapUrl,
  alt = "Renal Ultrasound Scan",
  visualMode = "gradcam",
  onVisualModeChange,
  gradcamLayer,
}: RadiologyViewerProps) {
  // Enhancement Filter States
  const [contrast, setContrast] = useState<number>(100);
  const [brightness, setBrightness] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);

  // Inspection Tool States
  const [activeTool, setActiveTool] = useState<"none" | "loupe" | "caliper">("none");

  // Loupe Cursor State
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [lensPercent, setLensPercent] = useState<Point>({ x: 50, y: 50 });
  const [isHoveringImage, setIsHoveringImage] = useState<boolean>(false);

  // Digital Caliper State
  const [caliperStart, setCaliperStart] = useState<Point | null>(null);
  const [caliperEnd, setCaliperEnd] = useState<Point | null>(null);
  const [caliperDraft, setCaliperDraft] = useState<Point | null>(null);
  const [isDrawingCaliper, setIsDrawingCaliper] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active displayed image source depending on visual mode
  const currentImageSrc =
    visualMode === "gradcam" && heatmapUrl ? heatmapUrl : imageUrl;

  // Reset all filters and tools
  const handleReset = () => {
    setContrast(100);
    setBrightness(100);
    setInvert(false);
    setActiveTool("none");
    setCaliperStart(null);
    setCaliperEnd(null);
    setCaliperDraft(null);
    setIsDrawingCaliper(false);
  };

  // Preset Filters
  const applyPreset = (preset: "default" | "highContrast" | "boneWindow") => {
    if (preset === "default") {
      setContrast(100);
      setBrightness(100);
      setInvert(false);
    } else if (preset === "highContrast") {
      setContrast(170);
      setBrightness(110);
      setInvert(false);
    } else if (preset === "boneWindow") {
      setContrast(150);
      setBrightness(105);
      setInvert(true);
    }
  };

  // Compute CSS filter string
  const cssFilter = `contrast(${contrast}%) brightness(${brightness}%)${
    invert ? " invert(1) hue-rotate(180deg)" : ""
  }`;

  // Handle pointer movements for loupe and caliper
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setMousePos({ x, y });
    setLensPercent({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });

    if (activeTool === "caliper" && isDrawingCaliper) {
      setCaliperDraft({ x, y });
    }
  };

  const handleMouseEnter = () => {
    setIsHoveringImage(true);
  };

  const handleMouseLeave = () => {
    setIsHoveringImage(false);
    if (isDrawingCaliper) {
      setIsDrawingCaliper(false);
    }
  };

  // Caliper point selection
  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "caliper" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    if (!isDrawingCaliper && (!caliperStart || caliperEnd)) {
      // Start a new measurement
      setCaliperStart({ x, y });
      setCaliperEnd(null);
      setCaliperDraft({ x, y });
      setIsDrawingCaliper(true);
    } else if (isDrawingCaliper && caliperStart) {
      // Complete the measurement
      setCaliperEnd({ x, y });
      setCaliperDraft(null);
      setIsDrawingCaliper(false);
    }
  };

  // Calculate caliper measurement
  const activeEnd = caliperEnd || caliperDraft;
  let distancePx = 0;
  let distanceMm = 0;
  if (caliperStart && activeEnd) {
    const dx = activeEnd.x - caliperStart.x;
    const dy = activeEnd.y - caliperStart.y;
    distancePx = Math.hypot(dx, dy);
    // Standard clinical calibration: 512px ultrasound frame corresponds to ~130mm field of view (~0.254 mm/px)
    // Scale proportionally to rendered container width
    const containerWidth = containerRef.current?.clientWidth || 512;
    const scaleFactor = 130 / containerWidth;
    distanceMm = distancePx * scaleFactor;
  }

  // Clinical categorization of stone size
  const getStoneCategory = (mm: number) => {
    if (mm <= 0) return "";
    if (mm < 5) return "Small (< 5 mm, high spontaneous passage rate)";
    if (mm <= 10) return "Moderate (5 - 10 mm, medical expulsive therapy indicated)";
    return "Large (> 10 mm, potential surgical / shockwave lithotripsy candidate)";
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* PACS Inspection Suite Toolbar */}
      <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col gap-2 shadow-md">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0077b6]" />
            <span className="uppercase tracking-wider text-[11px]">PACS Radiology Tools</span>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyPreset("default")}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                contrast === 100 && brightness === 100 && !invert
                  ? "bg-[#0077b6] text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Standard Radiograph View"
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => applyPreset("highContrast")}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                contrast === 170 && !invert
                  ? "bg-[#0077b6] text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Enhance shadow contrast"
            >
              High Contrast
            </button>
            <button
              type="button"
              onClick={() => applyPreset("boneWindow")}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                invert
                  ? "bg-[#0077b6] text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Negative Inverted Window for dense calcifications"
            >
              Bone Window
            </button>
          </div>
        </div>

        {/* Action Controls & Tool Switches */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 flex-wrap">
          <div className="flex items-center gap-1.5">
            {/* Loupe Toggle */}
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === "loupe" ? "none" : "loupe")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTool === "loupe"
                  ? "bg-[#0077b6] text-white shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title="Toggle 2.5x Magnifier Loupe"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>2.5x Loupe</span>
            </button>

            {/* Caliper Toggle */}
            <button
              type="button"
              onClick={() => {
                if (activeTool === "caliper") {
                  setActiveTool("none");
                } else {
                  setActiveTool("caliper");
                  setCaliperStart(null);
                  setCaliperEnd(null);
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTool === "caliper"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title="Click two points to measure stone diameter"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Digital Caliper</span>
            </button>

            {/* Invert Colors Toggle */}
            <button
              type="button"
              onClick={() => setInvert(!invert)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                invert
                  ? "bg-amber-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title="Toggle negative radiograph inversion"
            >
              <Contrast className="w-3.5 h-3.5" />
              <span>Invert</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Filter Sliders Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                showFiltersDrawer
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Levels</span>
            </button>

            {/* Reset All Button */}
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              title="Reset all filters and inspection tools"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Sliders Drawer */}
        {showFiltersDrawer && (
          <div className="pt-2.5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-2.5 rounded-xl">
            {/* Contrast Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Contrast className="w-3 h-3 text-[#0077b6]" />
                  <span>Contrast</span>
                </span>
                <span className="font-mono text-white">{contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="250"
                step="5"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-[#0077b6] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Brightness Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Brightness</span>
                </span>
                <span className="font-mono text-white">{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* View Switcher Tabs (if Heatmap Available) */}
      {heatmapUrl && onVisualModeChange && (
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onVisualModeChange("gradcam")}
            className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              visualMode === "gradcam"
                ? "bg-white text-[#0077b6] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Heatmap</span>
          </button>
          <button
            type="button"
            onClick={() => onVisualModeChange("original")}
            className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              visualMode === "original"
                ? "bg-white text-[#0077b6] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Original</span>
          </button>
          <button
            type="button"
            onClick={() => onVisualModeChange("split")}
            className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
              visualMode === "split"
                ? "bg-white text-[#0077b6] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Split</span>
          </button>
        </div>
      )}

      {/* Main Image Display Area with Interactive Tools */}
      {visualMode === "split" && heatmapUrl ? (
        <div className="grid grid-cols-2 gap-2">
          {/* Raw Ultrasound Side */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-1 border border-slate-200">
            <div className="w-full h-44 sm:h-56 flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Raw Ultrasound"
                style={{ filter: cssFilter }}
                className="max-h-full max-w-full object-contain transition-all"
              />
            </div>
            <span className="text-[10px] font-bold text-slate-300 py-1">
              Raw Ultrasound
            </span>
          </div>

          {/* AI Attention Map Side */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-1 border border-[#90e0ef]">
            <div className="w-full h-44 sm:h-56 flex items-center justify-center">
              <img
                src={heatmapUrl}
                alt="Grad-CAM Attention Map"
                style={{ filter: cssFilter }}
                className="max-h-full max-w-full object-contain transition-all"
              />
            </div>
            <span className="text-[10px] font-bold text-[#90e0ef] py-1">
              AI Attention Map
            </span>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleContainerClick}
          className={`relative w-full h-56 sm:h-72 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 select-none ${
            activeTool === "loupe" || activeTool === "caliper"
              ? "cursor-crosshair"
              : "cursor-default"
          }`}
        >
          {/* Main Filtered Image */}
          <img
            src={currentImageSrc}
            alt={alt}
            style={{ filter: cssFilter }}
            className="max-h-full max-w-full object-contain transition-[filter] duration-75"
          />

          {/* Top Left Badge */}
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
            <span>
              {visualMode === "gradcam" && heatmapUrl
                ? "Grad-CAM Attention Map"
                : "Original Scan"}
            </span>
            {invert && (
              <span className="text-[9px] px-1 rounded bg-amber-500/80 text-black font-black">
                Inverted
              </span>
            )}
          </div>

          {/* Caliper Instruction / Status Overlay */}
          {activeTool === "caliper" && (
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-[10px] font-bold text-emerald-200 backdrop-blur-xs flex items-center gap-1.5">
              <Crosshair className="w-3 h-3 text-emerald-400" />
              <span>
                {isDrawingCaliper
                  ? "Click to set point B"
                  : caliperEnd
                  ? "Caliper locked (click to reset)"
                  : "Click to set point A"}
              </span>
            </div>
          )}

          {/* SVG Caliper Overlay */}
          {activeTool === "caliper" && caliperStart && activeEnd && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              {/* Distance Line */}
              <line
                x1={caliperStart.x}
                y1={caliperStart.y}
                x2={activeEnd.x}
                y2={activeEnd.y}
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray={isDrawingCaliper ? "4 3" : "none"}
              />

              {/* End Point Markers */}
              <circle
                cx={caliperStart.x}
                cy={caliperStart.y}
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <circle
                cx={activeEnd.x}
                cy={activeEnd.y}
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Midpoint Measurement Tag */}
              <g
                transform={`translate(${
                  (caliperStart.x + activeEnd.x) / 2
                }, ${(caliperStart.y + activeEnd.y) / 2 - 12})`}
              >
                <rect
                  x="-38"
                  y="-10"
                  width="76"
                  height="20"
                  rx="4"
                  fill="#022c22"
                  stroke="#10b981"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {distanceMm.toFixed(1)} mm
                </text>
              </g>
            </svg>
          )}

          {/* Circular 2.5x Magnifier Loupe */}
          {activeTool === "loupe" && isHoveringImage && (
            <div
              className="absolute pointer-events-none z-30 rounded-full border-2 border-white/90 shadow-2xl overflow-hidden"
              style={{
                width: 140,
                height: 140,
                left: mousePos.x,
                top: mousePos.y,
                transform: "translate(-50%, -50%)",
                boxShadow:
                  "0 0 0 2px rgba(0, 119, 182, 0.8), 0 10px 25px -5px rgba(0, 0, 0, 0.6)",
              }}
            >
              {/* Zoomed Background Layer */}
              <div
                className="w-full h-full rounded-full"
                style={{
                  backgroundImage: `url(${currentImageSrc})`,
                  backgroundPosition: `${lensPercent.x}% ${lensPercent.y}%`,
                  backgroundSize: "280%",
                  backgroundRepeat: "no-repeat",
                  filter: cssFilter,
                }}
              />

              {/* Reticle Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-[1px] bg-red-500/80" />
                <div className="h-4 w-[1px] bg-red-500/80 absolute" />
              </div>

              {/* Lens Scale Tag */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-bold text-white tracking-wider uppercase">
                2.5x Loupe
              </div>
            </div>
          )}
        </div>
      )}

      {/* Caliper Measurement Readout Card */}
      {activeTool === "caliper" && caliperEnd && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col gap-1 text-xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-900 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-emerald-600" />
              <span>Caliper Measurement</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-emerald-700">
                {distanceMm.toFixed(1)} mm
              </span>
              <span className="text-[10px] text-emerald-600 font-mono">
                ({distancePx.toFixed(0)} px)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-800 leading-snug">
            {getStoneCategory(distanceMm)}
          </p>
        </div>
      )}

      {/* Heatmap Colormap Spectrum (when active) */}
      {heatmapUrl && visualMode !== "original" && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5 text-[11px] text-slate-600">
          <div className="flex items-center justify-between font-bold text-[#03045e]">
            <span>Neural Activation Intensity</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {gradcamLayer || "MobileNetV2 out_relu"}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-yellow-400 to-red-600" />
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Low (Background)</span>
            <span>Moderate</span>
            <span className="text-rose-600 font-bold">High Attention (Calculus)</span>
          </div>
        </div>
      )}
    </div>
  );
}
