"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export interface ScrollStackContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollStackContainer({
  children,
  className = "",
}: ScrollStackContainerProps) {
  return (
    <div className={`relative w-full ${className}`}>
      {children}
    </div>
  );
}

export interface ScrollStackItemProps {
  id?: string;
  index: number;
  total?: number;
  children: React.ReactNode;
  className?: string;
  scaleOnCover?: boolean;
  topOffset?: number; // px from top of viewport when stuck
  roundedTop?: boolean;
  borderTop?: boolean;
  shadow?: boolean;
}

export function ScrollStackItem({
  id,
  index,
  total = 6,
  children,
  className = "",
  scaleOnCover = true,
  topOffset = 0,
  roundedTop = true,
  borderTop = true,
  shadow = true,
}: ScrollStackItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor scroll progress relative to this section's vertical position
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Scale down slightly and subtly dim as the next stacked card covers this one
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, scaleOnCover && index < (total - 1) ? 0.95 : 1]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.95],
    [1, scaleOnCover && index < (total - 1) ? 0.78 : 1]
  );

  const brightness = useTransform(
    scrollYProgress,
    [0, 1],
    ["brightness(100%)", scaleOnCover && index < (total - 1) ? "brightness(80%)" : "brightness(100%)"]
  );

  // Dynamic z-index so later items stack cleanly over earlier items
  const zIndex = 10 + index * 10;

  return (
    <div
      id={id}
      ref={containerRef}
      className="relative w-full scroll-mt-0"
      style={{
        zIndex,
      }}
    >
      <motion.div
        style={{
          scale,
          opacity,
          filter: brightness,
          transformOrigin: "top center",
          willChange: "transform, opacity, filter",
          top: `${topOffset}px`,
        }}
        className={`sticky w-full transform-gpu transition-shadow duration-300 ${
          roundedTop && index > 0
            ? "rounded-t-[28px] sm:rounded-t-[38px] md:rounded-t-[48px]"
            : ""
        } ${
          borderTop && index > 0
            ? "border-t border-white/15"
            : ""
        } ${
          shadow && index > 0
            ? "shadow-[0_-25px_60px_rgba(0,0,0,0.85)]"
            : ""
        } overflow-hidden ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default ScrollStackContainer;

