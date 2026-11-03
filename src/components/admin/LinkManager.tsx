"use client";

/**
 * LinkManager — Link Management module controls for site_links (site-wide)
 * and, optionally, bill_links for one bill (?bill=<id>). External hrefs are
 * guarded https-only in the actions; internal links must be site paths.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  upsertSiteLinkAction,
  deleteSiteLinkAction,
  upsertBillLinkAction,
  deleteBillLinkAction,
} from "@/lib/admin/actions";
import type { BillLinkRow, SiteLinkRow } from "@/lib/cms/types";

const INPUT = "min-w-0 flex-1 rounded-md border hairline bg-paper px-2 py-1 text-sm text-navy";

export function SiteLinksManager({ rows, isAdmin }: { rows: SiteLinkRow[]; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="border hairline bg-paper p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
        Site-wide links
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          startTransition(async () => {
            const res = await upsertSiteLinkAction(null, {
              label: String(fd.get("label") ?? ""),
              href: String(fd.get("href") ?? ""),
              kind: (String(fd.get("kind") ?? "external") as SiteLinkRow["kind"]),
              location: String(fd.get("location") ?? "") || null,
              description: String(fd.get("description") ?? "") || null,
            });
            if (!res.ok) window.alert(`${res.code}${res.message ? `: ${res.message}` : ""}`);
            else form.reset();
          });
        }}
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_110px_140px_1fr_auto]"
      >
        <input name="label" required placeholder="Label" className={INPUT} />
        <input name="href" required placeholder="https://… or /path" className={INPUT} />
        <select name="kind" className={INPUT} defaultValue="external" aria-label="Kind">
          <option value="external">external</option>
          <option value="internal">internal</option>
        </select>
        <input name="location" placeholder="location" className={INPUT} />
        <input name="description" placeholder="description" className={INPUT} />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <form
            key={row.id}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await upsertSiteLinkAction(row.id, {
                  label: String(fd.get("label") ?? ""),
                  href: String(fd.get("href") ?? ""),
                  kind: String(fd.get("kind") ?? row.kind) as SiteLinkRow["kind"],
                  location: String(fd.get("location") ?? "") || null,
                  sort_order: Number(fd.get("sort_order") ?? row.sort_order),
                  is_active: fd.get("is_active") === "on",
                });
                if (!res.ok) window.alert(`${res.code}${res.message ? `: ${res.message}` : ""}`);
                else router.refresh();
              });
            }}
            className="flex flex-wrap items-center gap-2 border-b hairline pb-2 last:border-0"
          >
            <input name="label" defaultValue={row.label} required className={INPUT} />
            <input name="href" defaultValue={row.href} required className={INPUT} />
            <select name="kind" defaultValue={row.kind} className="w-24 rounded-md border hairline bg-paper px-2 py-1 text-sm text-navy" aria-label="Kind">
              <option value="external">external</option>
              <option value="internal">internal</option>
            </select>
            <input name="location" defaultValue={row.location ?? ""} placeholder="location" className="w-28 rounded-md border hairline bg-paper px-2 py-1 text-sm text-navy" />
            <input name="sort_order" type="number" defaultValue={row.sort_order} className="w-16 rounded-md border hairline bg-paper px-2 py-1 text-sm text-navy" />
            <label className="flex items-center gap-1 text-xs text-navy/70">
              <input name="is_active" type="checkbox" defaultChecked={row.is_active} /> active
            </label>
            <button type="submit" disabled={pending} className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50">
              Save
            </button>
            {isAdmin ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Delete link “${row.label}”?`)) return;
                  startTransition(async () => {
                    const res = await deleteSiteLinkAction(row.id);
                    if (!res.ok) window.alert(res.code);
                    else router.refresh();
                  });
                }}
                className="rounded-full border border-berry/40 px-3 py-1.5 text-xs font-semibold text-berry transition hover:bg-berry/5 disabled:opacity-50"
              >
                Delete
              </button>
            ) : null}
          </form>
        ))}
        {rows.length === 0 ? (
          <p className="text-sm text-navy/60">
            No site links registered yet. External URLs from the original pages should be entered exactly as captured.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function BillLinksManager({ billId, rows, isAdmin }: { billId: string; rows: BillLinkRow[]; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="border hairline bg-paper p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
        Bill links (bill {billId})
      </h2>
      <div className="mt-3 grid gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center gap-2 border-b hairline pb-2 last:border-0">
            <span className="min-w-0 flex-1 truncate text-sm text-navy">{row.label}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-navy/50">{row.href}</span>
            <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${row.is_active ? "bg-icy-100 text-navy" : "bg-navy/5 text-navy/50"}`}>
              {row.kind}
            </span>
            {isAdmin ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Delete link “${row.label}” from this bill?`)) return;
                  startTransition(async () => {
                    const res = await deleteBillLinkAction(row.id);
                    if (!res.ok) window.alert(res.code);
                    else router.refresh();
                  });
                }}
                className="rounded-full border border-berry/40 px-3 py-1.5 text-xs font-semibold text-berry transition hover:bg-berry/5 disabled:opacity-50"
              >
                Delete
              </button>
            ) : null}
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-navy/60">No links attached.</p> : null}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          startTransition(async () => {
            const res = await upsertBillLinkAction(null, {
              bill_id: billId,
              label: String(fd.get("label") ?? ""),
              href: String(fd.get("href") ?? ""),
              kind: String(fd.get("kind") ?? "document") as BillLinkRow["kind"],
            });
            if (!res.ok) window.alert(`${res.code}${res.message ? `: ${res.message}` : ""}`);
            else form.reset();
          });
        }}
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_120px_auto]"
      >
        <input name="label" required placeholder="Link text as displayed" className={INPUT} />
        <input name="href" required placeholder="https://… (external) or /path (internal)" className={INPUT} />
        <select name="kind" className={INPUT} defaultValue="document" aria-label="Kind">
          <option value="document">document</option>
          <option value="external">external</option>
          <option value="internal">internal</option>
        </select>
        <button type="submit" disabled={pending} className="shrink-0 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50">
          Attach
        </button>
      </form>
    </div>
  );
}
