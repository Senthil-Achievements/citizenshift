"use client";

/**
 * BillEditor — the Legislation module's edit form.
 *
 * Renders every editable field of a bill row, the publish controls, the
 * source-document links, and the revision history with per-revision rollback.
 * All writes go through the admin server actions (re-verified server-side on
 * every call); nothing here talks to Supabase directly.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  updateBillAction,
  setBillPublishStateAction,
  deleteBillAction,
  listBillRevisionsAction,
  rollbackBillAction,
} from "@/lib/admin/actions";
import type { BillRevisionRow, BillRow, BillUpdate } from "@/lib/cms/types";

const INPUT =
  "w-full rounded-md border hairline bg-paper px-3 py-2 text-sm text-navy placeholder:text-navy/40";

export function BillEditor({ bill, isAdmin }: { bill: BillRow; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [revisions, setRevisions] = useState<BillRevisionRow[] | null>(null);

  function submit(patch: Record<string, string>, note: string) {
    startTransition(async () => {
      const payload: BillUpdate = {};
      if (patch.title !== undefined) payload.title = patch.title;
      if (patch.number !== undefined) payload.number = patch.number || null;
      if (patch.summary !== undefined) payload.summary = patch.summary || null;
      if (patch.full_summary !== undefined) payload.full_summary = patch.full_summary || null;
      if (patch.level !== undefined) payload.level = patch.level || null;
      if (patch.jurisdiction !== undefined) payload.jurisdiction = patch.jurisdiction || null;
      if (patch.policy_area !== undefined) payload.policy_area = patch.policy_area || null;
      if (patch.emoji !== undefined) payload.emoji = patch.emoji || null;
      if (patch.status !== undefined) payload.status = patch.status || null;
      if (patch.introduced_date !== undefined) payload.introduced_date = patch.introduced_date || null;
      if (patch.source_url !== undefined) payload.source_url = patch.source_url || null;

      const res = await updateBillAction(bill.id, payload, note);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Save failed: ${res.code}${res.message ? ` — ${res.message}` : ""}` });
        return;
      }
      setFeedback({ tone: "ok", text: "Saved. A revision snapshot was recorded in the audit log." });
      router.refresh();
    });
  }

  function submitPublish(state: BillRow["publish_state"]) {
    startTransition(async () => {
      const res = await setBillPublishStateAction(bill.id, state);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Failed: ${res.code}` });
        return;
      }
      setFeedback({ tone: "ok", text: `Publish state set to ${state}.` });
      router.refresh();
    });
  }

  function submitDelete() {
    if (!window.confirm("Delete this bill record? The original store snapshot is retained and the bill can be re-seeded.")) return;
    startTransition(async () => {
      const res = await deleteBillAction(bill.id);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Delete failed: ${res.code}` });
        return;
      }
      router.push("/admin/legislation");
    });
  }

  function loadRevisions() {
    startTransition(async () => {
      const res = await listBillRevisionsAction(bill.id);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Could not load revisions: ${res.code}` });
        return;
      }
      setRevisions(res.data.rows);
    });
  }

  function doRollback(revisionNo: number) {
    if (!window.confirm(`Restore revision ${revisionNo}? The current state is snapshotted first.`)) return;
    startTransition(async () => {
      const res = await rollbackBillAction(bill.id, revisionNo);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Rollback failed: ${res.code}` });
        return;
      }
      setFeedback({ tone: "ok", text: `Rolled back to revision ${revisionNo}.` });
      router.refresh();
      setRevisions(null);
    });
  }

  return (
    <div className="grid gap-6">
      {feedback ? (
        <p
          className={`border px-4 py-2 text-sm ${
            feedback.tone === "ok" ? "border-navy/20 bg-icy-100 text-navy" : "border-berry/30 bg-berry/5 text-navy"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const patch: Record<string, string> = {};
          for (const key of ["title", "number", "level", "jurisdiction", "policy_area", "emoji", "status", "introduced_date", "source_url", "summary", "full_summary"]) {
            const v = fd.get(key);
            if (typeof v === "string" && v !== String((bill as unknown as Record<string, unknown>)[key] ?? "")) {
              patch[key] = v;
            }
          }
          if (Object.keys(patch).length === 0) {
            setFeedback({ tone: "ok", text: "No changes to save." });
            return;
          }
          submit(patch, "Edited via Legislation module");
        }}
        className="grid gap-4 border hairline bg-paper p-5"
      >
        <label className="grid gap-1 text-sm">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Official title *</span>
          <input name="title" required defaultValue={bill.title} className={INPUT} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Number</span>
            <input name="number" defaultValue={bill.number ?? ""} className={INPUT} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Introduced date</span>
            <input name="introduced_date" defaultValue={bill.introduced_date ?? ""} className={INPUT} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Level</span>
            <select name="level" defaultValue={bill.level ?? ""} className={INPUT}>
              <option value="">—</option>
              <option value="Federal">Federal</option>
              <option value="State">State</option>
              <option value="Municipal">Municipal</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Jurisdiction</span>
            <input name="jurisdiction" defaultValue={bill.jurisdiction ?? ""} className={INPUT} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Policy area</span>
            <input name="policy_area" defaultValue={bill.policy_area ?? ""} className={INPUT} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Emoji</span>
            <input name="emoji" defaultValue={bill.emoji ?? ""} className={INPUT} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Status</span>
            <input name="status" defaultValue={bill.status ?? ""} className={INPUT} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Source URL (external, must stay unchanged)</span>
            <input name="source_url" defaultValue={bill.source_url ?? ""} className={INPUT} />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Summary</span>
          <textarea name="summary" rows={5} defaultValue={bill.summary ?? ""} className={INPUT} />
        </label>
        {bill.full_summary ? (
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Full summary</span>
            <textarea name="full_summary" rows={5} defaultValue={bill.full_summary ?? ""} className={INPUT} />
          </label>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center rounded-full bg-navy px-5 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
          >
            Save changes
          </button>
          <p className="text-xs text-navy/50">
            Every save records an audit entry and a revision snapshot.
          </p>
        </div>
      </form>

      <div className="border hairline bg-paper p-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Publish state</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-navy/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-navy">
            {bill.publish_state}
          </span>
          {(["published", "draft", "archived"] as const)
            .filter((s) => s !== bill.publish_state)
            .map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                onClick={() => submitPublish(s)}
                className="inline-flex h-9 items-center rounded-full border hairline bg-paper px-4 text-xs font-medium text-navy transition hover:border-navy/40 disabled:opacity-50"
              >
                Set {s}
              </button>
            ))}
          {isAdmin ? (
            <button
              type="button"
              disabled={pending}
              onClick={submitDelete}
              className="inline-flex h-9 items-center rounded-full border border-berry/40 bg-paper px-4 text-xs font-semibold text-berry transition hover:bg-berry/5 disabled:opacity-50"
            >
              Delete record
            </button>
          ) : null}
        </div>
      </div>

      <div className="border hairline bg-paper p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Revision history</h2>
          <button
            type="button"
            onClick={loadRevisions}
            disabled={pending}
            className="inline-flex h-8 items-center rounded-full border hairline bg-paper px-3 text-xs font-medium text-navy transition hover:border-navy/40 disabled:opacity-50"
          >
            {revisions ? "Refresh" : "Load revisions"}
          </button>
        </div>
        {revisions === null ? null : revisions.length === 0 ? (
          <p className="mt-3 text-sm text-navy/60">No revisions yet — history starts after the first edit.</p>
        ) : (
          <ul className="mt-3 divide-y hairline">
            {revisions.map((rev) => (
              <li key={rev.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <span className="font-mono text-xs text-navy/70">
                    rev {rev.revision_no} · {new Date(rev.created_at).toLocaleString("en-US")}
                  </span>
                  {rev.actor_label ? <span className="ml-2 text-xs text-navy/50">{rev.actor_label}</span> : null}
                  <p className="truncate text-xs text-navy/50">
                    {String((rev.data as Record<string, unknown>)?.title ?? "")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => doRollback(rev.revision_no)}
                  className="shrink-0 rounded-full border hairline px-3 py-1 text-xs font-medium text-navy transition hover:border-navy/40 disabled:opacity-50"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
