"use client";

/**
 * RevealObserver — watches [data-reveal] elements (including ones mounted
 * later, e.g. feed cards) and flips them in. Lightweight IntersectionObserver,
 * reduced-motion safe (CSS base styles neutralise themselves for reduced motion).
 */

import { useEffect } from "react";

export default function RevealObserver() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supportsIO = "IntersectionObserver" in window;

    if (reduced || !supportsIO) {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => el.classList.add("is-in"));
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );

    const observeRoot = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    };
    observeRoot(document);

    // watch for later-mounted reveal targets (feed cards, dialogs)
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches?.("[data-reveal]:not(.is-in)")) io.observe(node);
            observeRoot(node);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
