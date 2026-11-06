"use client";

import type React from "react";
import { useRef, useEffect, useCallback, useState } from "react";

interface Position {
  x: number;
  y: number;
}

interface Point {
  position: Position;
  time: number;
  drift: Position;
  age: number;
  direction: Position;
}

export interface SVGFollowerProps {
  width?: number;
  height?: number;
  colors?: string[];
  removeDelay?: number;
  autoPlay?: boolean;
  className?: string;
  isGlobal?: boolean;
}

const MAX_PARTICLES_ON_SCREEN = 12;

export function SVGFollower({
  width = 1400,
  height = 1200,
  colors = ["#f43f5e", "#38bdf8", "#fbbf24", "#34d399", "#818cf8"],
  removeDelay = 280,
  className = "",
  isGlobal = true,
}: SVGFollowerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const followersRef = useRef<Follower[]>([]);
  const animationRef = useRef<number>(undefined);
  const [dimensions, setDimensions] = useState({ width, height });
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeParticlesRef = useRef(0);
  const pendingPositionRef = useRef<Position | null>(null);

  class Follower {
    private points: Point[] = [];
    public line: SVGPathElement;
    private color: string;
    private stage: SVGSVGElement;

    constructor(stage: SVGSVGElement, color: string) {
      this.stage = stage;
      this.color = color;
      this.line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.line.style.fill = color;
      this.line.style.stroke = color;
      this.line.style.strokeWidth = "1.5";
      this.line.style.opacity = "0.75";
      this.stage.appendChild(this.line);
    }

    private getDrift(): number {
      return (Math.random() - 0.5) * 2;
    }

    public add(position: Position) {
      if (isScrollingRef.current) return;

      const direction = { x: 0, y: 0 };
      if (this.points[0]) {
        direction.x = (position.x - this.points[0].position.x) * 0.2;
        direction.y = (position.y - this.points[0].position.y) * 0.2;
      }

      const point: Point = {
        position: position,
        time: Date.now(),
        drift: {
          x: this.getDrift() + direction.x / 2,
          y: this.getDrift() + direction.y / 2,
        },
        age: 0,
        direction: direction,
      };

      // Strict particle cap prevents DOM churn on low-end laptops
      if (activeParticlesRef.current < MAX_PARTICLES_ON_SCREEN) {
        const shapeChance = Math.random();
        if (shapeChance < 0.25) {
          this.makeCircle(point);
        } else if (shapeChance < 0.45) {
          this.makeSquare(point);
        }
      }

      this.points.unshift(point);
      if (this.points.length > 5) {
        this.points.length = 5;
      }
    }

    private createLine(points: Point[]): string {
      if (points.length === 0) return "";
      const path: string[] = ["M"];
      let forward = true;
      let i = 0;

      while (i >= 0) {
        const point = points[i];
        const offsetX = point.direction.x * ((i - points.length) / points.length) * 0.4;
        const offsetY = point.direction.y * ((i - points.length) / points.length) * 0.4;
        const x = point.position.x + (forward ? offsetY : -offsetY);
        const y = point.position.y + (forward ? offsetX : -offsetX);
        point.age += 0.2;

        path.push(String(Math.round(x + point.drift.x * point.age)));
        path.push(String(Math.round(y + point.drift.y * point.age)));

        i += forward ? 1 : -1;
        if (i === points.length) {
          i--;
          forward = false;
        }
      }
      return path.join(" ");
    }

    public trim() {
      if (this.points.length > 0) {
        const now = Date.now();
        while (this.points.length > 0 && this.points[this.points.length - 1].time < now - removeDelay) {
          this.points.pop();
        }
      }
      this.line.setAttribute("d", this.createLine(this.points));
    }

    private makeCircle(point: Point) {
      // Strictly capped radius (never exceeds 5px, preventing screen-filling giant shapes)
      const radius = Math.min(5, Math.max(2, (Math.abs(point.direction.x) + Math.abs(point.direction.y)) * 0.3));
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", String(radius));
      circle.style.fill = this.color;
      circle.setAttribute("cx", "0");
      circle.setAttribute("cy", "0");
      this.moveShape(circle, point);
    }

    private makeSquare(point: Point) {
      // Strictly capped size (never exceeds 6px)
      const size = Math.min(6, Math.max(2.5, (Math.abs(point.direction.x) + Math.abs(point.direction.y)) * 0.35));
      const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      square.setAttribute("width", String(size));
      square.setAttribute("height", String(size));
      square.style.fill = this.color;
      this.moveShape(square, point);
    }

    private moveShape(shape: SVGElement, point: Point) {
      this.stage.appendChild(shape);
      activeParticlesRef.current++;

      const driftX = point.position.x + point.direction.x * 6 + point.drift.x * 6;
      const driftY = point.position.y + point.direction.y * 6 + point.drift.y * 6;

      shape.style.transform = `translate(${point.position.x}px, ${point.position.y}px)`;
      shape.style.transition = "transform 0.4s ease-out, opacity 0.4s ease-out";
      shape.style.opacity = "0.9";

      requestAnimationFrame(() => {
        shape.style.transform = `translate(${driftX}px, ${driftY}px) scale(0)`;
        shape.style.opacity = "0";
      });

      const cleanup = () => {
        if (this.stage.contains(shape)) {
          this.stage.removeChild(shape);
          activeParticlesRef.current = Math.max(0, activeParticlesRef.current - 1);
        }
      };

      setTimeout(cleanup, 420);
    }

    public destroy() {
      if (this.stage.contains(this.line)) {
        this.stage.removeChild(this.line);
      }
    }
  }

  // Animation ticker: throttled to RAF
  const animate = useCallback(() => {
    // Process pending pointer position once per frame
    if (pendingPositionRef.current && !isScrollingRef.current) {
      const pos = pendingPositionRef.current;
      pendingPositionRef.current = null;
      followersRef.current.forEach((follower) => follower.add(pos));
    }

    followersRef.current.forEach((follower) => follower.trim());
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Update dimensions
  useEffect(() => {
    if (!isGlobal) return;
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [isGlobal]);

  // Scroll detection: completely silence cursor trail during scroll for 60+ FPS
  useEffect(() => {
    const handleScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Global pointer follower listener (desktop mouse only; ignore touch)
  useEffect(() => {
    if (!isGlobal) return;
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return; // Touch device, skip cursor follower
    }

    const handleWindowMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || isScrollingRef.current) return;
      pendingPositionRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    window.addEventListener("pointermove", handleWindowMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleWindowMove);
  }, [isGlobal]);

  // Lifecycle: initialize followers
  useEffect(() => {
    const stage = svgRef.current;
    if (!stage) return;

    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    followersRef.current = colors.map((color) => new Follower(stage, color));
    animationRef.current = requestAnimationFrame(animate);

    const currentFollowers = followersRef.current;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      currentFollowers.forEach((f) => f.destroy());
    };
  }, [colors, animate]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
    </div>
  );
}

export default SVGFollower;
