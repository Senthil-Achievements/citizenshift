"use client";

/**
 * SponsorManager — Sponsor Management module controls: create, edit-in-place
 * and (admin-only) delete. Scoping for new bills' attachments lives in the
 * Links module; this module manages the sponsor directory itself.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  upsertSponsorAction,
  deleteSponsorAction,
} from "@/lib/admin/actions";
import type { SponsorRow } from "@/lib/cms/types";

const INPUT =
  "w-full rounded-md border hairline bg-paper px-3 py-1.5 text-sm text-navy";

function SponsorRowForm({
  row,
  isAdmin,
  pending,
  onDone,
}: {
  row: SponsorRow;
  isAdmin: boolean;
  pending: boolean;
  onDone: (msg: { tone: "ok" | "err"; text: string }) => void;
}) {
  return (
    <tr className="border-b hairline last:border-0">
      <td className="px-3 py-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onDone({ tone: "ok", text: "Saving…" });
            void (async () => {
              const res = await upsertSponsorAction(row.id, {
                name: String(fd.get("name") ?? ""),
                initials: String(fd.get("initials") ?? "") || null,
                meta: String(fd.get("meta") ?? "") || null,
                party: String(fd.get("party") ?? "") || null,
                title: String(fd.get("title") ?? "") || null,
                source_url: String(fd.get("source_url") ?? "") || null,
              });
              if (!res.ok) onDone({ tone: "err", text: `Save failed: ${res.code}` });
              else window.location.reload();
            })();
          }}
          className="grid gap-2 sm:grid-cols-[1fr_70px_1fr_70px_1fr_1.4fr_auto] sm:items-center"
        >
          <input name="name" defaultValue={row.name} required className={INPUT} aria-label="Name" />
          <input name="initials" defaultValue={row.initials ?? ""} className={INPUT} aria-label="Initials" placeholder="DS" />
          <input name="meta" defaultValue={row.meta ?? ""} className={INPUT} aria-label="Representation" placeholder="D · HD-FL-9" />
          <input name="party" defaultValue={row.party ?? ""} className={INPUT} aria-label="Party" placeholder="D" />
          <input name="title" defaultValue={row.title ?? ""} className={INPUT} aria-label="Title" placeholder="Representative" />
          <input name="source_url" defaultValue={row.source_url ?? ""} className={INPUT} aria-label="Source URL" placeholder="https://…" />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
            >
              Save
            </button>
            {isAdmin ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Delete sponsor “${row.name}”? It detaches from all bills (audit keeps the record).`)) return;
                  void (async () => {
                    const res = await deleteSponsorAction(row.id);
                    if (!res.ok) onDone({ tone: "err", text: `Delete failed: ${res.code}` });
                    else window.location.reload();
                  })();
                }}
                className="rounded-full border border-berry/40 px-3 py-1.5 text-xs font-semibold text-berry transition hover:bg-berry/5 disabled:opacity-50"
              >
                Delete
              </button>
            ) : null}
          </div>
        </form>
      </td>
    </tr>
  );
}

export function SponsorManager({
  rows,
  isAdmin,
  tableMissing,
}: {
  rows: SponsorRow[];
  isAdmin: boolean;
  tableMissing: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  return (
    <div className="grid gap-4">
      {feedback ? (
        <p className={`border px-4 py-2 text-sm ${feedback.tone === "ok" ? "border-navy/20 bg-icy-100" : "border-berry/30 bg-berry/5"}`}>
          {feedback.text}
        </p>
      ) : null}
      {tableMissing ? (
        <p className="border border-berry/30 bg-berry/5 px-4 py-3 text-sm text-navy/80">{tableMissing}</p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const name = String(fd.get("new_name") ?? "").trim();
          if (!name) return;
          startTransition(async () => {
            const res = await upsertSponsorAction(null, {
              name,
              initials: String(fd.get("new_initials") ?? "") || null,
              meta: String(fd.get("new_meta") ?? "") || null,
              party: String(fd.get("new_party") ?? "") || null,
              title: String(fd.get("new_title") ?? "") || null,
              source_url: String(fd.get("new_source_url") ?? "") || null,
            });
            if (!res.ok) setFeedback({ tone: "err", text: `Create failed: ${res.code}${res.message ? ` — ${res.message}` : ""}` });
            else form.reset();
          });
        }}
        className="grid gap-2 border hairline bg-paper p-4 sm:grid-cols-[1fr_70px_1fr_70px_1fr_1.4fr_auto] sm:items-center"
      >
        <input name="new_name" required placeholder="New sponsor name" className={INPUT} />
        <input name="new_initials" placeholder="DS" className={INPUT} aria-label="Initials" />
        <input name="new_meta" placeholder="D · HD-FL-9" className={INPUT} aria-label="Representation" />
        <input name="new_party" placeholder="Party" className={INPUT} aria-label="Party" />
        <input name="new_title" placeholder="Title" className={INPUT} aria-label="Title" />
        <input name="new_source_url" placeholder="https://…" className={INPUT} aria-label="Source URL" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
        >
          Add sponsor
        </button>
      </form>

      <div className="overflow-x-auto border hairline bg-paper">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
              <th className="px-3 py-3">Name / initials / representation / party / title / source URL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <SponsorRowForm key={row.id} row={row} isAdmin={isAdmin} pending={pending} onDone={setFeedback} />
            ))}
            {rows.length === 0 && !tableMissing ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-navy/60">
                  No sponsors yet — seeding bills also seeds their sponsors.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
