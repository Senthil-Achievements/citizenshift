"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPageAction } from "@/lib/admin/actions";

const INPUT =
  "w-full rounded-md border hairline bg-paper px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none";

export function PageCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper transition hover:bg-navy-600"
      >
        + New Page
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const title = String(fd.get("title") ?? "").trim();
        const slug = String(fd.get("slug") ?? "").trim();
        const publish_state = (String(fd.get("publish_state") ?? "draft")) as "draft" | "published" | "archived";

        if (!title || !slug) {
          setError("Title and slug are required.");
          return;
        }

        startTransition(async () => {
          setError(null);
          const res = await createPageAction({
            title,
            slug,
            publish_state,
            sections: [
              {
                id: "main-content",
                kind: "content",
                title,
                body: "Enter page body content here.",
              },
            ],
          });
          if (!res.ok) {
            setError(`Creation failed: ${res.code}${res.message ? ` — ${res.message}` : ""}`);
          } else {
            router.push(`/admin/pages/${res.data.row.id}`);
          }
        });
      }}
      className="grid gap-4 rounded border hairline bg-paper p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-navy">Create New Page</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-navy/60 hover:text-navy"
        >
          Cancel
        </button>
      </div>

      {error ? (
        <p className="border border-berry/30 bg-berry/5 p-2 text-xs text-berry">{error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Page Title</span>
          <input name="title" required placeholder="e.g. Terms of Service" className={INPUT} />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">URL Slug</span>
          <input name="slug" required placeholder="e.g. terms-of-service" className={INPUT} />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-navy/70">
          <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Initial State</span>
          <select name="publish_state" defaultValue="draft" className="rounded border hairline bg-paper px-2 py-1 text-xs text-navy">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="ml-auto rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create & Open Editor"}
        </button>
      </div>
    </form>
  );
}

