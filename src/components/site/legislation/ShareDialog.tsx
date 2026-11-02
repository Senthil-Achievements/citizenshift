"use client";

/**
 * ShareDialog — Web Share API with clipboard fallback.
 * Shares the bill title with the CitizenShift record reference.
 */

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Bill } from "@/lib/legislation";
import { billDateLabel, billDisplayNumber, billTitle } from "@/lib/legislation";

export function shareText(bill: Bill): string {
  return `${billTitle(bill)} (${billDisplayNumber(bill)}, ${bill.level}) — track it on CitizenShift: https://citizenshift.us`;
}

export async function shareOrCopy(bill: Bill): Promise<"shared" | "copied" | "fallback"> {
  const text = shareText(bill);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: billTitle(bill), text });
      return "shared";
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return "shared"; // user dismissed — no toast
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      /* fallthrough */
    }
  }
  return "fallback";
}

export default function ShareDialog({
  bill,
  open,
  onClose,
}: {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
}) {
  const copiedNow = async () => {
    if (!bill) return;
    if (navigator?.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText(bill));
      } catch {
        /* noop */
      }
    }
  };

  return (
    <Modal open={open && !!bill} onClose={onClose} label="Share this bill">
      {bill && (
        <div className="p-6 sm:p-8">
          <p className="eyebrow text-berry">Share</p>
          <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-navy">
            {billTitle(bill)}
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/50">
            {billDisplayNumber(bill)} · {bill.level} · {billDateLabel(bill)}
          </p>

          <div className="mt-5 border hairline bg-icy-50 p-4 text-sm leading-relaxed text-navy/85">
            {shareText(bill)}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={async () => {
                await shareOrCopy(bill);
                onClose();
              }}
              className="flex-1 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-icy transition-colors hover:bg-navy-600"
            >
              Share now
            </button>
            <button
              type="button"
              onClick={copiedNow}
              className="flex-1 rounded-full border hairline px-5 py-3 text-sm font-semibold text-navy transition-colors hover:bg-icy-100"
            >
              Copy text
            </button>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-navy/40">
            Uses your device share sheet when available, clipboard otherwise.
          </p>
        </div>
      )}
    </Modal>
  );
}
