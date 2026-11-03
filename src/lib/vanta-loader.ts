/**
 * vanta-loader.ts — Resilient client-side loader for Three.js & Vanta.js BIRDS:
 *   1. Attempts local high-performance pinned vendor scripts first.
 *   2. Automatically falls back to high-reliability CDNs (Cloudflare / jsDelivr)
 *      if local scripts are blocked by laptop adblockers or corporate filters.
 *   3. Idempotent execution with immediate resolution if already in memory.
 */

let loadPromise: Promise<boolean> | null = null;

function loadScript(
  localSrc: string,
  cdnFallbackSrc: string,
  isReadyCheck: () => boolean,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isReadyCheck()) {
      resolve();
      return;
    }

    const tryLoad = (src: string, isFallback: boolean) => {
      // Check existing script tag
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true" || isReadyCheck()) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => {
          existing.dataset.loaded = "true";
          resolve();
        });
        existing.addEventListener("error", () => {
          if (!isFallback) tryLoad(cdnFallbackSrc, true);
          else reject(new Error(`Failed to load ${src}`));
        });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = () => {
        script.remove();
        if (!isFallback) {
          tryLoad(cdnFallbackSrc, true);
        } else {
          reject(new Error(`Failed to load ${src}`));
        }
      };
      document.head.appendChild(script);
    };

    tryLoad(localSrc, false);
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
        // 1. Three.js r121
        await loadScript(
          "/vendor/three.r121.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js",
          () => typeof window.THREE !== "undefined",
        );

        // 2. Vanta Birds
        await loadScript(
          "/vendor/vanta.birds.min.js",
          "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js",
          () => typeof window.VANTA?.BIRDS === "function",
        );

        return Boolean(window.VANTA && window.VANTA.BIRDS);
      } catch (err) {
        console.warn("Could not load Vanta Birds vendor scripts:", err);
        return false;
      }
    })();
  }

  return loadPromise;
}
