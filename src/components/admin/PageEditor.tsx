"use client";

/**
 * PageEditor — Page Management module controls: edit page facts, edit the
 * ordered section list (JSON, structurally validated server-side), publish
 * state, revisions with rollback. Original site copy is shown as "kind"
 * typed sections so editors change data, never code.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  updatePageAction,
  setPagePublishStateAction,
  deletePageAction,
  listPageRevisionsAction,
  rollbackPageAction,
  seedPagesAction,
} from "@/lib/admin/actions";
import type { PageRevisionRow, SitePageRow } from "@/lib/cms/types";

const INPUT =
  "w-full rounded-md border hairline bg-paper px-3 py-2 text-sm text-navy";

export function PageEditor({ page, isAdmin }: { page: SitePageRow; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [revisions, setRevisions] = useState<PageRevisionRow[] | null>(null);

  const sectionsJson = JSON.stringify(page.sections ?? [], null, 2);

  return (
    <div className="grid gap-6">
      {feedback ? (
        <p className={`border px-4 py-2 text-sm ${feedback.tone === "ok" ? "border-navy/20 bg-icy-100" : "border-berry/30 bg-berry/5"}`}>
          {feedback.text}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const raw = String(fd.get("sections") ?? "");
          let sections: unknown = undefined;
          if (raw !== sectionsJson) {
            try {
              sections = JSON.parse(raw);
            } catch {
              setFeedback({ tone: "err", text: "Sections must be valid JSON." });
              return;
            }
          }
          startTransition(async () => {
            const res = await updatePageAction(page.id, {
              title: String(fd.get("title") ?? "") || page.title,
              slug: String(fd.get("slug") ?? "") || page.slug,
              sections,
              note: "Edited via Page Management",
            });
            if (!res.ok) setFeedback({ tone: "err", text: `Save failed: ${res.code}${res.message ? ` — ${res.message}` : ""}` });
            else {
              setFeedback({ tone: "ok", text: "Saved. A revision snapshot was recorded." });
              router.refresh();
            }
          });
        }}
        className="grid gap-4 border hairline bg-paper p-5"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_280px]">
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Title</span>
            <input name="title" defaultValue={page.title} className={INPUT} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Slug</span>
            <input name="slug" defaultValue={page.slug} className={INPUT} />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">
            Sections (ordered JSON array — each item needs a "kind")
          </span>
          <textarea name="sections" rows={16} defaultValue={sectionsJson} className={`${INPUT} font-mono text-xs`} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-navy px-5 py-2 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
        >
          Save changes
        </button>
      </form>

      <div className="border hairline bg-paper p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-navy/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-navy">
            {page.publish_state}
          </span>
          {(["published", "draft", "archived"] as const)
            .filter((s) => s !== page.publish_state)
            .map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await setPagePublishStateAction(page.id, s);
                    if (!res.ok) setFeedback({ tone: "err", text: `Failed: ${res.code}` });
                    else {
                      setFeedback({ tone: "ok", text: `State set to ${s}.` });
                      router.refresh();
                    }
                  })
                }
                className="rounded-full border hairline px-4 py-2 text-xs font-medium text-navy disabled:opacity-50"
              >
                Set {s}
              </button>
            ))}
          {isAdmin ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Delete page “${page.title}”?`)) return;
                startTransition(async () => {
                  const res = await deletePageAction(page.id);
                  if (!res.ok) setFeedback({ tone: "err", text: `Delete failed: ${res.code}` });
                  else router.push("/admin/pages");
                });
              }}
              className="rounded-full border border-berry/40 px-4 py-2 text-xs font-semibold text-berry transition hover:bg-berry/5 disabled:opacity-50"
            >
              Delete page
            </button>
          ) : null}
        </div>
      </div>

      <div className="border hairline bg-paper p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">Revision history</h2>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await listPageRevisionsAction(page.id);
                if (!res.ok) setFeedback({ tone: "err", text: `Could not load revisions: ${res.code}` });
                else setRevisions(res.data.rows);
              })
            }
            className="rounded-full border hairline px-3 py-1.5 text-xs font-medium text-navy disabled:opacity-50"
          >
            Load revisions
          </button>
        </div>
        {revisions === null ? null : revisions.length === 0 ? (
          <p className="mt-3 text-sm text-navy/60">No revisions yet.</p>
        ) : (
          <ul className="mt-3 divide-y hairline">
            {revisions.map((rev) => (
              <li key={rev.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="font-mono text-xs text-navy/70">
                  rev {rev.revision_no} · {new Date(rev.created_at).toLocaleString("en-US")}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await rollbackPageAction(page.id, rev.revision_no);
                      if (!res.ok) setFeedback({ tone: "err", text: `Rollback failed: ${res.code}` });
                      else {
                        setFeedback({ tone: "ok", text: `Restored revision ${rev.revision_no}.` });
                        router.refresh();
                        setRevisions(null);
                      }
                    })
                  }
                  className="rounded-full border hairline px-3 py-1 text-xs font-medium text-navy disabled:opacity-50"
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

export function SeedPagesButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await seedPagesAction();
            if (!res.ok) {
              setMsg(res.code === "table_missing" ? "Tables not applied yet." : `Failed: ${res.code}`);
              return;
            }
            setMsg(`Seeded ${res.data.seeded} new pages (${res.data.skipped} already present).`);
          })
        }
        className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
      >
        Seed pages from original library
      </button>
      {msg ? <span className="text-xs text-navy/70">{msg}</span> : null}
    </div>
  );
}
