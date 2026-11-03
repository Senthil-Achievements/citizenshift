"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setTestimonialStatusAction,
  setTestimonialFeatureAction,
  updateTestimonialAction,
  deleteTestimonialAction,
} from "@/lib/admin/actions";
import type { TestimonialRow } from "@/lib/cms/types";

const INPUT =
  "w-full rounded border hairline bg-paper px-3 py-1.5 text-xs text-navy focus:border-navy focus:outline-none";

export function TestimonialManager({
  testimonials,
  isAdmin,
}: {
  testimonials: TestimonialRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Status filter tab
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Edit modal
  const [editingItem, setEditingItem] = useState<TestimonialRow | null>(null);

  // Video preview modal
  const [previewVideo, setPreviewVideo] = useState<{ url: string; provider: string | null; name: string } | null>(null);

  // Moderation notes prompt
  const [rejectPromptId, setRejectPromptId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Share form copy
  const [copied, setCopied] = useState(false);

  const handleCopyFormLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://citizenshift.us";
    navigator.clipboard.writeText(`${origin}/testimonials/submit`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApprove = (id: string, name: string) => {
    startTransition(async () => {
      const res = await setTestimonialStatusAction(id, "approved", "Approved by administrator");
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Approval failed: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: `Approved and published testimonial from ${name}.` });
        router.refresh();
      }
    });
  };

  const handleReject = (id: string, name: string) => {
    startTransition(async () => {
      const res = await setTestimonialStatusAction(id, "rejected", rejectNote || "Declined");
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Rejection failed: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: `Rejected testimonial from ${name}.` });
        setRejectPromptId(null);
        setRejectNote("");
        router.refresh();
      }
    });
  };

  const handleToggleFeature = (id: string, current: boolean, name: string) => {
    startTransition(async () => {
      const res = await setTestimonialFeatureAction(id, !current);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Failed to update featured state: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: `${!current ? "Featured" : "Unfeatured"} ${name}.` });
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Permanently delete testimonial from ${name}?`)) return;
    startTransition(async () => {
      const res = await deleteTestimonialAction(id);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Delete failed: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: `Deleted testimonial.` });
        router.refresh();
      }
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const fd = new FormData(e.currentTarget as HTMLFormElement);

    startTransition(async () => {
      const res = await updateTestimonialAction(editingItem.id, {
        full_name: String(fd.get("full_name") ?? ""),
        organization: String(fd.get("organization") ?? "") || null,
        role: String(fd.get("role") ?? "") || null,
        quote_highlight: String(fd.get("quote_highlight") ?? "") || null,
        testimonial_text: String(fd.get("testimonial_text") ?? ""),
        sort_order: Number(fd.get("sort_order") ?? 0),
        moderation_notes: String(fd.get("moderation_notes") ?? "") || null,
      });

      if (!res.ok) {
        setFeedback({ tone: "err", text: `Update failed: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: "Testimonial metadata updated." });
        setEditingItem(null);
        router.refresh();
      }
    });
  };

  const filtered = testimonials.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  const pendingCount = testimonials.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border hairline bg-paper p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              statusFilter === "all" ? "bg-navy text-paper" : "text-navy/70 hover:bg-icy-100"
            }`}
          >
            All Submissions ({testimonials.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`relative rounded-md px-3 py-1.5 text-xs font-medium ${
              statusFilter === "pending" ? "bg-navy text-paper" : "text-navy/70 hover:bg-icy-100"
            }`}
          >
            Pending Review
            {pendingCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-berry px-1.5 py-0.2 text-[10px] font-bold text-paper">
                {pendingCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              statusFilter === "approved" ? "bg-navy text-paper" : "text-navy/70 hover:bg-icy-100"
            }`}
          >
            Approved ({testimonials.filter((t) => t.status === "approved").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              statusFilter === "rejected" ? "bg-navy text-paper" : "text-navy/70 hover:bg-icy-100"
            }`}
          >
            Rejected ({testimonials.filter((t) => t.status === "rejected").length})
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopyFormLink}
          className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper shadow-xs transition hover:bg-navy-600"
        >
          {copied ? "Link Copied!" : "📋 Copy & Share Submission Form URL"}
        </button>
      </div>

      {feedback ? (
        <p
          className={`border p-3 text-xs ${
            feedback.tone === "ok" ? "border-navy/20 bg-icy-100 text-navy" : "border-berry/30 bg-berry/5 text-berry"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      {/* Video Preview Modal */}
      {previewVideo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-lg border hairline bg-paper p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold text-navy">
                Video Preview: {previewVideo.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="text-navy/60 hover:text-navy"
              >
                ✕
              </button>
            </div>
            {previewVideo.provider === "youtube" || previewVideo.url.includes("youtube.com") || previewVideo.url.includes("youtu.be") ? (
              <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${previewVideo.url.split("watch?v=")[1]?.split("&")[0] || ""}`}
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
                <video src={previewVideo.url} controls className="h-full w-full" />
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="rounded bg-navy px-4 py-1.5 text-xs font-semibold text-paper"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Metadata Modal */}
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border hairline bg-paper p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b hairline pb-3">
              <h3 className="font-display text-lg font-semibold text-navy">
                Edit Testimonial Metadata
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-navy/60 hover:text-navy"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Full Name</span>
                <input name="full_name" defaultValue={editingItem.full_name} required className={INPUT} />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Email (Private)</span>
                <input defaultValue={editingItem.email} disabled className={`${INPUT} opacity-60 bg-icy-50`} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Organization</span>
                <input name="organization" defaultValue={editingItem.organization ?? ""} className={INPUT} />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Role</span>
                <input name="role" defaultValue={editingItem.role ?? ""} className={INPUT} />
              </label>
            </div>

            <label className="grid gap-1 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Key Highlight Quote</span>
              <input name="quote_highlight" defaultValue={editingItem.quote_highlight ?? ""} className={INPUT} />
            </label>

            <label className="grid gap-1 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Full Testimonial Text</span>
              <textarea name="testimonial_text" rows={5} defaultValue={editingItem.testimonial_text} required className={INPUT} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Sort Order (lower is first)</span>
                <input name="sort_order" type="number" defaultValue={editingItem.sort_order} className={INPUT} />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Internal Moderation Notes</span>
                <input name="moderation_notes" defaultValue={editingItem.moderation_notes ?? ""} className={INPUT} />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t hairline">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded border hairline px-4 py-2 text-xs font-medium text-navy/70 hover:bg-icy-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded bg-navy px-5 py-2 text-xs font-semibold text-paper hover:bg-navy-600 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Main Review Queue Table */}
      <div className="overflow-x-auto border hairline bg-paper">
        <table className="w-full text-left text-sm text-navy">
          <thead className="border-b hairline bg-icy-50 font-mono text-[10px] uppercase tracking-wider text-navy/60">
            <tr>
              <th className="px-4 py-3">Submitter & Organization</th>
              <th className="px-4 py-3">Feedback & Highlight</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y hairline">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-xs text-navy/50">
                  No testimonials found matching this filter.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const hasVideo = Boolean(t.video_url);
                const statusBadge =
                  t.status === "approved"
                    ? "bg-navy/10 text-navy font-semibold"
                    : t.status === "pending"
                      ? "bg-berry/15 text-berry font-bold"
                      : "bg-navy/5 text-navy/40";

                return (
                  <tr key={t.id} className="transition hover:bg-icy-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border hairline" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-icy-100 text-xs font-semibold text-navy">
                            {t.full_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-navy text-xs">{t.full_name}</div>
                          <div className="text-[11px] text-navy/60">
                            {t.role ? t.role : ""}
                            {t.role && t.organization ? " · " : ""}
                            {t.organization ? t.organization : ""}
                          </div>
                          <div className="font-mono text-[10px] text-navy/40">{t.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      {t.quote_highlight ? (
                        <p className="font-medium text-xs text-navy leading-snug line-clamp-1">
                          “{t.quote_highlight}”
                        </p>
                      ) : null}
                      <p className="text-xs text-navy/70 line-clamp-2 leading-relaxed">
                        {t.testimonial_text}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      {hasVideo && t.video_url ? (
                        <button
                          type="button"
                          onClick={() => setPreviewVideo({ url: t.video_url!, provider: t.video_provider, name: t.full_name })}
                          className="inline-flex items-center gap-1 rounded bg-icy-100 px-2 py-1 font-mono text-[10px] text-navy hover:bg-icy-200"
                        >
                          ▶ Watch Video
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] text-navy/50">Written Story</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${statusBadge}`}>
                          {t.status}
                        </span>
                        {t.is_featured ? (
                          <span className="rounded bg-berry/10 px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider text-berry font-bold">
                            ★ Featured
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-navy/60">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {t.status !== "approved" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleApprove(t.id, t.full_name)}
                          className="rounded bg-navy px-2.5 py-1 text-xs font-semibold text-paper hover:bg-navy-600 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      ) : null}

                      {t.status !== "rejected" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (rejectPromptId === t.id) {
                              handleReject(t.id, t.full_name);
                            } else {
                              setRejectPromptId(t.id);
                            }
                          }}
                          className="rounded border border-berry/30 px-2.5 py-1 text-xs font-medium text-berry hover:bg-berry/5"
                        >
                          {rejectPromptId === t.id ? "Confirm Reject" : "Reject"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleToggleFeature(t.id, t.is_featured, t.full_name)}
                        className={`rounded border hairline px-2 py-1 text-xs font-medium ${
                          t.is_featured ? "bg-berry/10 text-berry" : "text-navy/70 hover:bg-icy-100"
                        }`}
                      >
                        {t.is_featured ? "Unfeature" : "Feature"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingItem(t)}
                        className="rounded border hairline bg-paper px-2 py-1 text-xs font-medium text-navy hover:bg-icy-100"
                      >
                        Edit
                      </button>

                      {isAdmin ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleDelete(t.id, t.full_name)}
                          className="rounded border border-berry/20 px-2 py-1 text-xs font-medium text-berry hover:bg-berry/10"
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

