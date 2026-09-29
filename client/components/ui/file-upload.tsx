"use client";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload, IconCheck } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 14,
    y: -14,
    opacity: 1,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 0.9,
  },
};

export const FileUpload = ({
  onChange,
  className,
  accept,
  title = "Upload scan image",
  description = "Drag & drop your ultrasound or CT scan here, or click to browse",
}: {
  onChange?: (files: File[]) => void;
  className?: string;
  accept?: string;
  title?: string;
  description?: string;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className={cn("w-full", className)} {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className={cn(
          "group/file relative block w-full cursor-pointer overflow-hidden rounded-2xl p-6 sm:p-8 transition-colors",
          isDragActive ? "bg-[#caf0f8]/30" : "bg-gradient-to-b from-[#f0f9ff]/50 via-white to-[#f8fafc]/40"
        )}
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept={accept}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />

        {/* Clean, Light Medical Grid Pattern (No Dark Smudges) */}
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,white_75%,transparent_100%)]">
          <GridPattern />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <p className="font-sans text-base sm:text-lg font-bold text-[#03045e] tracking-tight">
            {title}
          </p>
          <p className="mt-1.5 font-sans text-xs sm:text-sm font-normal text-slate-500 max-w-sm leading-relaxed">
            {description}
          </p>

          <div className="relative mx-auto mt-6 w-full max-w-md">
            {files.length > 0 ? (
              files.map((file, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className="relative z-40 mx-auto flex w-full flex-col items-start justify-start overflow-hidden rounded-2xl bg-white p-4 sm:p-5 border border-[#90e0ef] shadow-md shadow-[#0077b6]/10"
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                        <IconCheck className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className="truncate text-sm font-bold text-[#03045e]"
                      >
                        {file.name}
                      </motion.p>
                    </div>

                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold bg-[#caf0f8] text-[#0077b6]"
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.span>
                  </div>

                  <div className="mt-3 flex w-full items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-600 uppercase text-[10px]">
                      {file.type || "IMAGE"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tap or drop another to replace
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="relative flex items-center justify-center py-2">
                {/* Main Interactive Spring Card */}
                <motion.div
                  layoutId="file-upload"
                  variants={mainVariant}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className={cn(
                    "relative z-40 mx-auto flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-2xl bg-white border-2 transition-all",
                    isDragActive
                      ? "border-[#0077b6] shadow-xl shadow-[#0077b6]/25 bg-[#caf0f8]/20"
                      : "border-[#90e0ef] shadow-lg shadow-[#0077b6]/10 group-hover/file:border-[#0077b6] group-hover/file:shadow-xl group-hover/file:shadow-[#0077b6]/20"
                  )}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#caf0f8] text-[#0077b6] flex items-center justify-center group-hover/file:bg-[#0077b6] group-hover/file:text-white transition-all duration-300 shadow-xs">
                    <IconUpload className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="mt-2 text-xs font-bold text-[#03045e] group-hover/file:text-[#0077b6] transition-colors">
                    {isDragActive ? "Drop Scan" : "Browse File"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isDragActive ? "Release now" : "or drag & drop"}
                  </span>
                </motion.div>

                {/* Secondary Offset Background Card */}
                <motion.div
                  variants={secondaryVariant}
                  transition={{ duration: 0.2 }}
                  className="absolute z-30 mx-auto flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-2xl border-2 border-dashed border-[#0077b6]/40 bg-[#caf0f8]/40 pointer-events-none"
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  return (
    <div
      className="absolute inset-0 h-full w-full pointer-events-none opacity-50"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #0077b6 1px, transparent 0)`,
        backgroundSize: "22px 22px",
      }}
    />
  );
}
