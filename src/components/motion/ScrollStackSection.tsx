"use client";

import React, { useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";

interface ScrollStackSectionProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

/**
 * ScrollStackSection
 *
 * Implements the signature 3D scroll stack animation:
 * - As you scroll, each section rises leaning toward you in 3D and out of focus,
 *   flattening and sharpening as it lands in the center of the window.
 * - As you scroll past, the section leans back a touch, sinks back, and dims.
 * - Zero artificial pinning runway: natural flow with GPU-accelerated 3D transforms.
 */
export function ScrollStackSection({
  children,
  className = "",
  index = 0,
}: ScrollStackSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Spring-smoothed progress for natural inertia
  const smooth = useSpring(scrollYProgress, {
    stiffness: 340,
    damping: 42,
    mass: 0.35,
  });

  // 3D Tilt: leans toward user (-16deg) when entering, flattens to 0deg in view, leans back (+5deg) when exiting
  const rotateX = useTransform(smooth, [0, 0.32, 0.68, 1], [-16, 0, 0, 5]);

  // Scale: enters at 0.94, scales to 1.0 in center, sinks back slightly to 0.97 as next card arrives
  const scale = useTransform(smooth, [0, 0.32, 0.68, 1], [0.94, 1, 1, 0.97]);

  // Sharpness / Filter: subtle blur when arriving, perfectly sharp in reading view
  const filter = useTransform(
    smooth,
    [0, 0.28, 0.72, 1],
    ["blur(4px)", "blur(0px)", "blur(0px)", "blur(2px)"]
  );

  // Dimming: gentle opacity fade on arrival and exit
  const opacity = useTransform(smooth, [0, 0.22, 0.78, 1], [0.5, 1, 1, 0.75]);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full [perspective:1600px] will-change-transform"
      style={{ contain: "paint" }}
    >
      <motion.div
        style={{
          rotateX,
          scale,
          filter,
          opacity,
          transformOrigin: "50% 15%",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default ScrollStackSection;

