/**
 * vanta-loader.ts — Client-side loader for pinned local vendor scripts:
 *   - /vendor/three.r121.min.js (Three.js r121, MIT)
 *   - /vendor/vanta.birds.min.js (Vanta.js Birds 0.5.24, MIT)
 *
 * Guaranteed order, idempotent execution, and zero external CDN dependency.
 */

let loadPromise: Promise<boolean> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If script already exists in document, avoid re-adding
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if ((existing as any).dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false; // Preserve execution order
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

export function loadVantaBirdsScripts(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  // If already loaded on window
  if (window.VANTA && window.VANTA.BIRDS && window.THREE) {
    return Promise.resolve(true);
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        // 1. Three.js must be loaded first
        await loadScript("/vendor/three.r121.min.js");
        // 2. Vanta.birds loaded second
        await loadScript("/vendor/vanta.birds.min.js");
        return Boolean(window.VANTA && window.VANTA.BIRDS);
      } catch (err) {
        console.warn("Could not load Vanta Birds vendor scripts:", err);
        return false;
      }
    })();
  }

  return loadPromise;
}

