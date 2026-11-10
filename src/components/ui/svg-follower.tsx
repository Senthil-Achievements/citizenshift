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

export function SVGFollower({
  width = 1400,
  height = 1200,
  colors = ["#f43f5e", "#38bdf8", "#fbbf24", "#34d399", "#818cf8"],
  removeDelay = 400,
  autoPlay = false,
  className = "",
  isGlobal = true,
}: SVGFollowerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const followersRef = useRef<Follower[]>([]);
  const animationRef = useRef<number>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Position[]>([]);
  const [dimensions, setDimensions] = useState({ width, height });

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
      this.line.style.strokeWidth = "2";
      this.line.style.opacity = "0.85";
      this.stage.appendChild(this.line);
    }

    private getDrift(): number {
      return (Math.random() - 0.5) * 3;
    }

    public add(position: Position) {
      const direction = { x: 0, y: 0 };
      if (this.points[0]) {
        direction.x = (position.x - this.points[0].position.x) * 0.25;
        direction.y = (position.y - this.points[0].position.y) * 0.25;
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

      const shapeChance = Math.random();
      // Rich particle generation across smooth circles and confetti squares
      if (shapeChance < 0.52) {
        this.makeCircle(point);
      } else if (shapeChance < 0.82) {
        this.makeSquare(point);
      }

      this.points.unshift(point);
    }

    private createLine(points: Point[]): string {
      const path: string[] = [points.length ? "M" : ""];

      if (points.length > 0) {
        let forward = true;
        let i = 0;

        while (i >= 0) {
          const point = points[i];
          const offsetX = point.direction.x * ((i - points.length) / points.length) * 0.6;
          const offsetY = point.direction.y * ((i - points.length) / points.length) * 0.6;
          const x = point.position.x + (forward ? offsetY : -offsetY);
          const y = point.position.y + (forward ? offsetX : -offsetX);
          point.age += 0.2;

          path.push(String(x + point.drift.x * point.age));
          path.push(String(y + point.drift.y * point.age));

          i += forward ? 1 : -1;
          if (i === points.length) {
            i--;
            forward = false;
          }
        }
      }

      return path.join(" ");
    }

    public trim() {
      if (this.points.length > 0) {
        const last = this.points[this.points.length - 1];
        const now = Date.now();
        if (last.time < now - removeDelay) {
          this.points.pop();
        }
      }
      this.line.setAttribute("d", this.createLine(this.points));
    }

    private makeCircle(point: Point) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      // Rich, dynamic circle radius with safety bounds
      const speed = Math.abs(point.direction.x) + Math.abs(point.direction.y);
      const radius = Math.min(26, Math.max(3.5, speed * 1.3));
      circle.setAttribute("r", String(radius));
      circle.style.fill = this.color;
      circle.setAttribute("cx", "0");
      circle.setAttribute("cy", "0");
      this.moveShape(circle, point);
    }

    private makeSquare(point: Point) {
      const speed = Math.abs(point.direction.x) + Math.abs(point.direction.y);
      const size = Math.min(30, Math.max(5, speed * 1.6));
      const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      square.setAttribute("width", String(size));
      square.setAttribute("height", String(size));
      square.style.fill = this.color;
      this.moveShape(square, point);
    }

    private moveShape(shape: SVGElement, point: Point) {
      this.stage.appendChild(shape);
      // Orbital tracking trajectory: particles curve in an orbit around the cursor point
      const angle = Math.random() * Math.PI * 2;
      const orbitDist = 16 + Math.random() * 32;
      const orbitX = point.position.x + Math.cos(angle) * orbitDist + point.direction.x * 12;
      const orbitY = point.position.y + Math.sin(angle) * orbitDist + point.direction.y * 12;

      shape.style.transform = `translate(${point.position.x}px, ${point.position.y}px)`;
      shape.style.transition = "transform 0.52s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out";
      shape.style.opacity = "1";

      // Failsafe auto-cleanup ensuring elements are always removed
      const cleanup = () => {
        if (this.stage.contains(shape)) {
          this.stage.removeChild(shape);
        }
      };

      requestAnimationFrame(() => {
        shape.style.transform = `translate(${orbitX}px, ${orbitY}px) scale(0) rotate(${Math.random() * 360}deg)`;
        shape.style.opacity = "0";
      });

      setTimeout(cleanup, 530);
    }

    public destroy() {
      if (this.stage.contains(this.line)) {
        this.stage.removeChild(this.line);
      }
    }
  }

  // Handle local container move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const position: Position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      followersRef.current.forEach((follower) => follower.add(position));

      if (isRecording) {
        recordingRef.current.push({
          x: (position.x / dimensions.width) * 100,
          y: (position.y / dimensions.height) * 100,
        });
      }
    },
    [dimensions.width, dimensions.height, isRecording]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const touch = e.touches[0];
      const position: Position = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };

      followersRef.current.forEach((follower) => follower.add(position));

      if (isRecording) {
        recordingRef.current.push({
          x: (position.x / dimensions.width) * 100,
          y: (position.y / dimensions.height) * 100,
        });
      }
    },
    [dimensions.width, dimensions.height, isRecording]
  );

  const startRecording = () => {
    recordingRef.current = [];
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const animate = useCallback(() => {
    followersRef.current.forEach((follower) => follower.trim());
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Update dimensions if isGlobal is active
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

  // Global window pointer follower listener (Full animation everywhere)
  useEffect(() => {
    if (!isGlobal) return;

    const handleWindowMove = (e: PointerEvent) => {
      const position: Position = {
        x: e.clientX,
        y: e.clientY,
      };
      followersRef.current.forEach((follower) => follower.add(position));
    };

    window.addEventListener("pointermove", handleWindowMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleWindowMove);
  }, [isGlobal]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Initialize followers for all colors
    const currentFollowers = colors.map((color) => new Follower(svgRef.current!, color));
    followersRef.current = currentFollowers;

    // Start animation loop
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      currentFollowers.forEach((f) => f.destroy());
    };
  }, [colors, animate]);

  if (isGlobal) {
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

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      />
    </div>
  );
}

export default SVGFollower;
