"use client";

/**
 * CmsSeedButtons — admin controls that run the insert-if-absent seeds from
 * the protected original content store through the server actions. Results
 * render honestly, including the "tables not applied yet" state.
 */

import { useState, useTransition } from "react";

import { seedBillsAction, seedPagesAction } from "@/lib/admin/actions";

export function CmsSeedButtons({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(kind: "bills" | "pages") {
    startTransition(async () => {
      const res = kind === "bills" ? await seedBillsAction() : await seedPagesAction();
      if (!res.ok) {
        setMessage(
          res.code === "table_missing"
            ? "CMS tables not applied yet — run migrations 0002–0004 first."
            : `Failed: ${res.code}${res.message ? ` — ${res.message}` : ""}`,
        );
        return;
      }
      const data = res.data as { seeded?: number; skipped?: number; billsSeeded?: number };
      if ("billsSeeded" in data) {
        setMessage(`Seeded: ${data.billsSeeded} new bills (${data.skipped} already present).`);
      } else {
        setMessage(`Seeded: ${data.seeded} pages (${data.skipped} already present).`);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => run("bills")}
        disabled={disabled || pending}
        className="inline-flex h-9 items-center rounded-full bg-navy px-4 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
      >
        Seed bills from original store
      </button>
      <button
        type="button"
        onClick={() => run("pages")}
        disabled={disabled || pending}
        className="inline-flex h-9 items-center rounded-full border hairline bg-paper px-4 text-xs font-medium text-navy transition hover:border-navy/40 disabled:opacity-50"
      >
        Seed pages from original library
      </button>
      {pending ? <span className="text-xs text-navy/60">Working…</span> : null}
      {message ? <span className="text-xs text-navy/80">{message}</span> : null}
    </div>
  );
}
