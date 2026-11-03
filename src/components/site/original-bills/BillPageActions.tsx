"use client";

/**
 * Client controls for the verbatim original-bill reproduction page.
 *
 *  - Share uses the Web Share API with a clipboard fallback (real behaviour,
 *    mirrors the original page's share control).
 *  - "Contact Your Rep" opens the same official lookup channels used across
 *    the bill experience; CitizenShift never composes the message.
 *  - The "Generate plain-language summary" control is deliberately DISABLED:
 *    /bills/[id] reproduces official legislative content verbatim
 *    (docs/content-fidelity-policy.md) and must not generate AI text over it.
 *
 * These components contribute no extra text nodes beyond the original page's
 * structure: buttons render the same "Share" / "Contact Your Rep" /
 * "Generate plain-language summary" labels, dialogs render nothing until
 * opened, and the disabled summary control carries no visible alternative text.
 */

import { useState } from "react";

import ContactRepDialog from "@/components/site/legislation/ContactRepDialog";
import { shareOrCopy } from "@/components/site/legislation/ShareDialog";
import type { Bill, LegislationLevel } from "@/lib/legislation";

function billShim(
  id: string,
  title: string,
  billNumber: string,
  level: string,
): Bill {
  return {
    id,
    bill_number: billNumber,
    title,
    summary: "",
    level: level as LegislationLevel,
    jurisdiction: "",
    status: "",
    policy_area: "",
    introduced_date: "",
    source: "citizenshift-original",
  };
}

const FOOTER_BTN =
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full border hairline bg-paper px-4 py-2 text-xs font-medium text-navy transition-colors hover:bg-icy-100 sm:text-sm";

/**
 * The action bar of the original page: [Share] [Contact Your Rep].
 * Rendered inside the bordered card footer, mirroring the original structure.
 */
export function OriginalBillActionBar({
  id,
  title,
  billNumber,
  level,
}: {
  id: string;
  title: string;
  billNumber: string;
  level: string;
}) {
  const [contactOpen, setContactOpen] = useState(false);
  const shim = billShim(id, title, billNumber, level);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={FOOTER_BTN}
        onClick={() => void shareOrCopy(shim)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 shrink-0"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span className="hidden sm:inline text-xs sm:text-sm">Share</span>
      </button>
      <button
        type="button"
        className={FOOTER_BTN}
        onClick={() => setContactOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 shrink-0"
          aria-hidden="true"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <span className="hidden sm:inline text-xs sm:text-sm">
          Contact Your Rep
        </span>
      </button>
      <ContactRepDialog
        bill={shim}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  );
}

const GEN_BTN =
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full border hairline bg-paper px-5 text-sm font-medium text-navy transition-colors hover:bg-icy-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-paper";
const PRIMARY_BTN =
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-navy px-5 text-sm font-semibold text-paper transition-colors hover:bg-navy-600";

/**
 * The summary card's two controls, rendered as adjacent siblings so their
 * innerText concatenates exactly like the original page's ("...summaryContact
 * Your Rep"). The first control is disabled with an honest note: no AI summary
 * is generated over official legislative content on this page.
 */
export function OriginalBillSummaryActions({
  id,
  title,
  billNumber,
  level,
}: {
  id: string;
  title: string;
  billNumber: string;
  level: string;
}) {
  const [contactOpen, setContactOpen] = useState(false);
  const shim = billShim(id, title, billNumber, level);

  return (
    <>
      <button
        type="button"
        className={GEN_BTN}
        disabled
        title="AI summaries are intentionally not generated for this reproduction — read the official original text instead"
      >
        Generate plain-language summary
      </button>
      <button
        type="button"
        className={PRIMARY_BTN}
        onClick={() => setContactOpen(true)}
      >
        Contact Your Rep
      </button>
      <ContactRepDialog
        bill={shim}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
}
