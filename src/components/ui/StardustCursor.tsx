"use client";

import React, { useEffect, useRef } from "react";

export interface StardustCursorProps {
  /** Palette of fine dust particles */
  colors?: string[];
  /** Base particle count per move */
  density?: number;
  /** Size multiplier for particles */
  size?: number;
  /** Mushroom puff particle count on click */
  puffCount?: number;
  /** Blend mode for canvas */
  compositeOperation?: GlobalCompositeOperation;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  decay: number;
  isPuff?: boolean;
  curl?: number;
}

const DEFAULT_COLORS = [
  "#e3f3fc", // CitizenShift Icy blue
  "#93c5fd", // Soft sky
  "#67e8f9", // Cyan stardust
  "#f43f5e", // Berry accent
  "#ffffff", // Brilliant white mote
];

export default function StardustCursor({
  colors = DEFAULT_COLORS,
  density = 2.5,
  size = 1.6,
  puffCount = 65,
  compositeOperation = "lighter",
}: StardustCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Respect user's motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = (canvas.width = window.innerWidth * dpr);
    let height = (canvas.height = window.innerHeight * dpr);
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      vx: 0,
      vy: 0,
      speed: 0,
      active: false,
    };

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Spawn a single stardust mote
    const spawnDust = (x: number, y: number, vx: number, vy: number, isPuff = false) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const baseSize = (Math.random() * 1.8 + 0.6) * size;
      const decay = isPuff
        ? 0.012 + Math.random() * 0.018 // puff lingers longer
        : 0.016 + Math.random() * 0.024; // fine trail decays quickly

      particles.push({
        x,
        y,
        vx,
        vy,
        size: baseSize,
        color,
        alpha: 0.85 + Math.random() * 0.15,
        life: 1,
        decay,
        isPuff,
        curl: (Math.random() - 0.5) * 0.06,
      });
    };

    // 1. Fluid Wake behind pointer move
    const handlePointerMove = (e: PointerEvent) => {
      // Disregard coarse touch devices to prevent mobile battery drain
      if (e.pointerType === "touch") return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      if (!mouse.active) {
        mouse.x = mouse.prevX = currentX;
        mouse.y = mouse.prevY = currentY;
        mouse.active = true;
        return;
      }

      const dx = currentX - mouse.prevX;
      const dy = currentY - mouse.prevY;
      const dist = Math.hypot(dx, dy);

      mouse.vx = dx;
      mouse.vy = dy;
      mouse.speed = dist;
      mouse.x = currentX;
      mouse.y = currentY;

      // Spawn dust along interpolated path for continuous fluid wake
      const steps = Math.min(Math.max(Math.floor(dist / 4), 1), 12);
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const px = mouse.prevX + dx * t;
        const py = mouse.prevY + dy * t;

        // Fluid wake perpendicular push (outward spray like boat wake)
        const perpX = dist > 0 ? (-dy / dist) * (Math.random() - 0.5) * 1.8 : 0;
        const perpY = dist > 0 ? (dx / dist) * (Math.random() - 0.5) * 1.8 : 0;
        const forwardDrag = 0.08;

        const count = Math.ceil(density * Math.random());
        for (let k = 0; k < count; k++) {
          spawnDust(
            px + (Math.random() - 0.5) * 4,
            py + (Math.random() - 0.5) * 4,
            dx * forwardDrag + perpX + (Math.random() - 0.5) * 0.6,
            dy * forwardDrag + perpY + (Math.random() - 0.5) * 0.6
          );
        }
      }

      mouse.prevX = currentX;
      mouse.prevY = currentY;
    };

    // 2. The Signature "Mushroom Puff on Click"
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;

      const clickX = e.clientX;
      const clickY = e.clientY;

      // A: Central rising stem of fine dust motes
      const stemCount = Math.floor(puffCount * 0.35);
      for (let i = 0; i < stemCount; i++) {
        const spread = (Math.random() - 0.5) * 1.2;
        const riseSpeed = -(Math.random() * 3.5 + 2.0); // Shoots upward
        spawnDust(
          clickX + (Math.random() - 0.5) * 8,
          clickY + (Math.random() - 0.5) * 6,
          spread,
          riseSpeed,
          true
        );
      }

      // B: Billowing toroidal mushroom cap
      const capCount = Math.floor(puffCount * 0.65);
      for (let i = 0; i < capCount; i++) {
        const angle = (i / capCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const horizontalSpeed = Math.cos(angle) * (Math.random() * 3.2 + 1.2);
        // Upward arc that curls outward and over like a mushroom cap
        const verticalSpeed = -Math.abs(Math.sin(angle)) * (Math.random() * 2.8 + 1.5) - 0.8;

        spawnDust(
          clickX + Math.cos(angle) * 4,
          clickY + (Math.random() - 0.5) * 4,
          horizontalSpeed,
          verticalSpeed,
          true
        );
      }
    };

    const handlePointerLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    // 3. Animation loop: update physics & render particles
    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = compositeOperation;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Fluid wake physics: damping + curl eddies
        p.vx *= 0.94;
        p.vy *= 0.94;

        if (p.isPuff) {
          // Mushroom puff vortex expansion: stem slows, cap curls downward
          p.vy += 0.04; // Gentle gravity settling
          p.vx += p.curl ? p.curl * 1.2 : 0;
        } else {
          // Fluid wake subtle curl drift
          const tempVx = p.vx;
          p.vx = p.vx * Math.cos(p.curl || 0) - p.vy * Math.sin(p.curl || 0);
          p.vy = tempVx * Math.sin(p.curl || 0) + p.vy * Math.cos(p.curl || 0);
        }

        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw stardust particle with luminous halo
        const currentAlpha = p.alpha * p.life;
        const radius = p.size * (0.6 + p.life * 0.4);

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Extra sparkle core on larger motes
        if (radius > 1.4) {
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = currentAlpha * 0.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [colors, density, size, puffCount, compositeOperation]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999] h-full w-full select-none"
      aria-hidden="true"
    />
  );
}
