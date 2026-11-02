"use client";

/**
 * Modal — accessible dialog built on framer-motion AnimatePresence.
 * Focus trapping, Escape handling, scroll lock (Lenis-aware).
 * NOTE: AnimatePresence's direct child must be a motion element, so the
 * dialog wrapper itself is a motion.div.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  /** Panel chrome tone */
  tone?: "paper" | "navy";
}

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.__lenis?.stop();
    return () => {
      document.body.style.overflow = prev;
      window.__lenis?.start();
    };
  }, [locked]);
}

export default function Modal({ open, onClose, label, children, tone = "paper" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    // initial focus
    panelRef.current?.querySelector<HTMLElement>("input, button")?.focus?.();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="dialog"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1, transition: { duration: 0.3, delay: 0.25 } }}
        >
          <motion.div
            className="absolute inset-0 bg-navy-900/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 42, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.9 }}
            className={`relative max-h-[88dvh] w-full overflow-y-auto border shadow-2xl sm:max-w-lg ${
              tone === "navy"
                ? "border-icy/20 bg-navy-800 text-paper"
                : "hairline border bg-paper text-navy"
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`absolute right-0 top-0 grid size-11 place-items-center border-b border-l transition-colors ${
                tone === "navy"
                  ? "hairline-light hover:bg-icy/10"
                  : "hairline hover:bg-icy-100"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
