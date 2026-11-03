"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createBillAction } from "@/lib/admin/actions";

const INPUT =
  "w-full rounded-md border hairline bg-paper px-3 py-2 text-sm text-navy placeholder:text-navy/40";

/** Minimal create form — full editing happens on the bill's own page. */
export function BillCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const title = String(fd.get("title") ?? "").trim();
        if (!title) {
          setError("Title is required.");
          return;
        }
        startTransition(async () => {
          const res = await createBillAction({
            title,
            number: String(fd.get("number") ?? "").trim() || undefined,
            level: String(fd.get("level") ?? "") || undefined,
            summary: String(fd.get("summary") ?? "").trim() || undefined,
          });
          if (!res.ok) {
            setError(`Create failed: ${res.code}${res.message ? ` — ${res.message}` : ""}`);
            return;
          }
          router.push(`/admin/legislation/${res.data.row.id}`);
        });
      }}
      className="grid max-w-xl gap-4 border hairline bg-paper p-5"
    >
      {error ? <p className="border border-berry/30 bg-berry/5 px-4 py-2 text-sm">{error}</p> : null}
      <label className="grid gap-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Official title *</span>
        <input name="title" required className={INPUT} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Number</span>
        <input name="number" placeholder="e.g. HB10923" className={INPUT} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Level</span>
        <select name="level" className={INPUT} defaultValue="">
          <option value="">—</option>
          <option value="Federal">Federal</option>
          <option value="State">State</option>
          <option value="Municipal">Municipal</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Summary</span>
        <textarea name="summary" rows={4} className={INPUT} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 w-fit items-center rounded-full bg-navy px-5 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
      >
        Create record
      </button>
    </form>
  );
}
