"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";

export const Meteors = ({
  number = 20,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const meteorCount = number;
  const meteors = new Array(meteorCount).fill(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {meteors.map((_, idx) => {
        // Calculate position to evenly distribute meteors across container width
        const position = idx * (800 / meteorCount) - 400;
        // Deterministic delay and duration to guarantee zero hydration mismatch
        const delay = (((idx * 7 + 3) % 20) / 4).toFixed(2) + "s";
        const duration = (5 + ((idx * 11 + 2) % 6)).toFixed(2) + "s";

        return (
          <span
            key={"meteor" + idx}
            className={cn(
              "animate-meteor-effect absolute h-0.5 w-0.5 rotate-[45deg] rounded-[9999px] bg-[#0077b6] shadow-[0_0_0_1px_rgba(0,119,182,0.25)]",
              "before:absolute before:top-1/2 before:h-[1.5px] before:w-[50px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-[#0077b6]/70 before:to-transparent before:content-['']",
              className,
            )}
            style={{
              top: "-40px",
              left: position + "px",
              animationDelay: delay,
              animationDuration: duration,
            }}
          />
        );
      })}
    </motion.div>
  );
};
