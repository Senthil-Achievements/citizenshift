"use client";

/**
 * CategoryManager — inline editing for the four category taxonomies and
 * create/delete for free-form tags. Label changes are audited because they
 * render on the public site.
 */

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import {
  updateJurisdictionAction,
  updatePolicyAreaAction,
  updateStatusAction,
  createTagAction,
  deleteTagAction,
} from "@/lib/admin/actions";
import type { JurisdictionRow, PolicyAreaRow } from "@/lib/cms/types";
import type { StatusRow, TagRow } from "@/lib/cms/categories";

const LABEL_INPUT =
  "min-w-0 flex-1 rounded-md border hairline bg-paper px-2 py-1 text-sm text-navy";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border hairline bg-paper p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy/50">{title}</h2>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

function SliderRow({
  name,
  active,
  toggle,
  children,
}: {
  name: string;
  active: boolean;
  toggle: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b hairline pb-2 last:border-0 last:pb-0">
      <span className="w-10 shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-navy/40">
        {name}
      </span>
      {children}
      {toggle}
    </div>
  );
}

export function CategoryManager({
  jurisdictions,
  policyAreas,
  statuses,
  tags,
  isAdmin,
}: {
  jurisdictions: JurisdictionRow[];
  policyAreas: PolicyAreaRow[];
  statuses: StatusRow[];
  tags: TagRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {feedback ? (
        <p className="border border-navy/20 bg-icy-100 px-4 py-2 text-sm lg:col-span-2">{feedback}</p>
      ) : null}

      <Section title="Jurisdiction levels">
        {jurisdictions.map((j) => (
          <SliderRow
            key={j.id}
            name={j.id}
            active={j.is_active}
            toggle={
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await updateJurisdictionAction(j.id, { is_active: !j.is_active });
                    if (!res.ok) setFeedback(`Failed: ${res.code}`);
                    else router.refresh();
                  })
                }
                className="rounded-full border hairline px-3 py-1 text-xs font-medium text-navy disabled:opacity-50"
              >
                {j.is_active ? "Active" : "Inactive"}
              </button>
            }
          >
            <input
              key={j.label}
              defaultValue={j.label}
              className={LABEL_INPUT}
              aria-label={`${j.id} label`}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== j.label) {
                  startTransition(async () => {
                    const res = await updateJurisdictionAction(j.id, { label: v });
                    if (!res.ok) setFeedback(`Failed: ${res.code}`);
                    else router.refresh();
                  });
                }
              }}
            />
          </SliderRow>
        ))}
      </Section>

      <Section title="Policy areas">
        {policyAreas.map((p) => (
          <SliderRow
            key={p.id}
            name={p.id}
            active={p.is_active}
            toggle={
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await updatePolicyAreaAction(p.id, { is_active: !p.is_active });
                    if (!res.ok) setFeedback(`Failed: ${res.code}`);
                    else router.refresh();
                  })
                }
                className="rounded-full border hairline px-3 py-1 text-xs font-medium text-navy disabled:opacity-50"
              >
                {p.is_active ? "Active" : "Inactive"}
              </button>
            }
          >
            <input
              key={p.label}
              defaultValue={p.label}
              className={LABEL_INPUT}
              aria-label={`${p.id} label`}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== p.label) {
                  startTransition(async () => {
                    const res = await updatePolicyAreaAction(p.id, { label: v });
                    if (!res.ok) setFeedback(`Failed: ${res.code}`);
                    else router.refresh();
                  });
                }
              }}
            />
          </SliderRow>
        ))}
      </Section>

      <Section title="Statuses">
        {statuses.map((s) => (
          <SliderRow
            key={s.id}
            name={s.id}
            active={s.is_active}
            toggle={
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await updateStatusAction(s.id, { is_active: !s.is_active });
                    if (!res.ok) setFeedback(`Failed: ${res.code}`);
                    else router.refresh();
                  })
                }
                className="rounded-full border hairline px-3 py-1 text-xs font-medium text-navy disabled:opacity-50"
              >
                {s.is_active ? "Active" : "Inactive"}
              </button>
            }
          >
            <input
              key={s.label}
              defaultValue={s.label}
              className={LABEL_INPUT}
              aria-label={`${s.id} label`}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== s.label) {
                  startTransition(async () => {
                    const res = await updateStatusAction(s.id, { label: v });
                    if (!res.ok) setFeedback(`Failed: ${res.code}`);
                    else router.refresh();
                  });
                }
              }}
            />
          </SliderRow>
        ))}
      </Section>

      <Section title="Tags">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            startTransition(async () => {
              const res = await createTagAction({ label: String(fd.get("label") ?? "") });
              if (!res.ok) setFeedback(`Tag failed: ${res.code}${res.message ? ` — ${res.message}` : ""}`);
              else form.reset();
            });
          }}
          className="flex gap-2"
        >
          <input name="label" required placeholder="New tag label" className={LABEL_INPUT} />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-navy-600 disabled:opacity-50"
          >
            Add
          </button>
        </form>
        {tags.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-2 border-b hairline pb-2 last:border-0">
            <span className="text-sm text-navy">
              {t.label} <span className="font-mono text-[10px] text-navy/40">/{t.slug}</span>
            </span>
            {isAdmin ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`Delete tag “${t.label}”?`)) return;
                  startTransition(async () => {
                    const res = await deleteTagAction(t.id);
                    if (!res.ok) setFeedback(`Delete failed: ${res.code}`);
                    else router.refresh();
                  });
                }}
                className="rounded-full border border-berry/40 px-3 py-1 text-xs font-semibold text-berry transition hover:bg-berry/5 disabled:opacity-50"
              >
                Delete
              </button>
            ) : null}
          </div>
        ))}
        {tags.length === 0 ? <p className="text-sm text-navy/60">No tags yet.</p> : null}
      </Section>
    </div>
  );
}
