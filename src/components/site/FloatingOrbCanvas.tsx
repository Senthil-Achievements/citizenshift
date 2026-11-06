"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface FloatingOrbCanvasProps {
  className?: string;
  color?: string;
}

export default function FloatingOrbCanvas({
  className = "",
  color = "#f43f5e",
}: FloatingOrbCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 320;
    let height = container.clientHeight || 320;
    let isVisible = true;
    let animationFrameId: number;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Sculptural Twisted Torus Knot (Matching Reference Image)
    const geometry = new THREE.TorusKnotGeometry(1.05, 0.38, 96, 24, 2, 3);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.88,
      roughness: 0.16,
      wireframe: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Subtle drop shadow plane under sculpture
    const shadowGeo = new THREE.CircleGeometry(1.3, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.22,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.6;
    scene.add(shadowMesh);

    // 3. Lighting (Rich multi-point specular highlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 3.5, 12);
    rimLight.position.set(-4, -2, 2);
    scene.add(rimLight);

    const pinkFill = new THREE.PointLight(0xf43f5e, 3.0, 10);
    pinkFill.position.set(3, -3, 3);
    scene.add(pinkFill);

    // 4. Mouse Tracking & Interactive Tilt
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = nx * 0.9;
      mouse.targetY = ny * 0.9;
    };
    container.addEventListener("pointermove", handlePointerMove, { passive: true });

    // Click spin acceleration
    let spinBoost = 0;
    const handleClick = () => {
      spinBoost += 0.28;
    };
    container.addEventListener("click", handleClick);

    // 5. Render Loop with Viewport Caching
    let clock = new THREE.Clock();
    const render = () => {
      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation (lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      spinBoost *= 0.92;

      // Sculpture floating & rotation physics
      mesh.rotation.y += (0.45 + spinBoost * 4) * delta;
      mesh.rotation.x = Math.sin(elapsedTime * 0.8) * 0.25 + mouse.y * 0.6;
      mesh.rotation.z = mouse.x * 0.45;
      mesh.position.y = Math.sin(elapsedTime * 1.8) * 0.12;

      // Dynamic shadow tracking
      shadowMesh.scale.setScalar(1 - mesh.position.y * 0.3);
      shadowMat.opacity = 0.22 - mesh.position.y * 0.08;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    // 6. Viewport Intersection Observer (0% GPU when out of view)
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        if (visible !== isVisible) {
          isVisible = visible;
          if (isVisible) {
            clock.start();
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(render);
          } else {
            clock.stop();
            cancelAnimationFrame(animationFrameId);
          }
        }
      },
      { threshold: 0.05, rootMargin: "100px 0px" }
    );
    observer.observe(container);

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      width = container.clientWidth || 320;
      height = container.clientHeight || 320;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    animationFrameId = requestAnimationFrame(render);

    // 8. Cleanup
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("click", handleClick);

      geometry.dispose();
      material.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [color]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center cursor-pointer select-none ${className}`}
      title="Click or drag to interact with 3D sculpture"
    />
  );
}

