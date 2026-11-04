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
  colors = ["#ff6b6b", "#fff200", "#45b7d1", "#96ceb4", "#ffeaa7"],
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
      this.line.style.strokeWidth = "1";
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
      const chance = 0.1;
      if (shapeChance < chance) this.makeCircle(point);
      else if (shapeChance < chance * 2) this.makeSquare(point);
      else if (shapeChance < chance * 3) this.makeTriangle(point);

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
      const radius = (Math.abs(point.direction.x) + Math.abs(point.direction.y)) * 1;
      circle.setAttribute("r", String(radius));
      circle.style.fill = this.color;
      circle.setAttribute("cx", "0");
      circle.setAttribute("cy", "0");
      this.moveShape(circle, point);
    }

    private makeSquare(point: Point) {
      const size = (Math.abs(point.direction.x) + Math.abs(point.direction.y)) * 1.5;
      const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      square.setAttribute("width", String(size));
      square.setAttribute("height", String(size));
      square.style.fill = this.color;
      this.moveShape(square, point);
    }

    private makeTriangle(point: Point) {
      const size = (Math.abs(point.direction.x) + Math.abs(point.direction.y)) * 1.5;
      const triangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      triangle.setAttribute("points", `0,0 ${size},${size / 2} 0,${size}`);
      triangle.style.fill = this.color;
      this.moveShape(triangle, point);
    }

    private moveShape(shape: SVGElement, point: Point) {
      this.stage.appendChild(shape);
      const driftX = point.position.x + point.direction.x * (Math.random() * 20) + point.drift.x * (Math.random() * 10);
      const driftY = point.position.y + point.direction.y * (Math.random() * 20) + point.drift.y * (Math.random() * 10);

      // Simple animation without GSAP
      shape.style.transform = `translate(${point.position.x}px, ${point.position.y}px)`;
      shape.style.transition = "all 0.5s ease-out";

      setTimeout(() => {
        shape.style.transform = `translate(${driftX}px, ${driftY}px) scale(0) rotate(${Math.random() * 360}deg)`;
        setTimeout(() => {
          if (this.stage.contains(shape)) {
            this.stage.removeChild(shape);
          }
        }, 500);
      }, 10);
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

  // Global window pointer follower listener
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

    // Initialize followers
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
          className="absolute inset-0 h-full w-full"
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
