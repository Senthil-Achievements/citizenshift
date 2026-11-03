"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setTestimonialStatusAction,
  setTestimonialPublishStateAction,
  setTestimonialFeatureAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  createTestimonialCampaignAction,
  revokeTestimonialCampaignAction,
} from "@/lib/admin/actions";
import type { TestimonialRow, TestimonialCampaign } from "@/lib/cms/types";

const INPUT =
  "w-full rounded border hairline bg-paper px-3 py-1.5 text-xs text-navy focus:border-navy focus:outline-none";

function getYouTubeId(url: string): string {
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1]?.split("?")[0] || "";
  }
  if (url.includes("watch?v=")) {
    return url.split("watch?v=")[1]?.split("&")[0] || "";
  }
  if (url.includes("youtube.com/shorts/")) {
    return url.split("youtube.com/shorts/")[1]?.split("?")[0] || "";
  }
  return "";
}

function getVimeoId(url: string): string {
  if (url.includes("vimeo.com/")) {
    return url.split("vimeo.com/")[1]?.split("?")[0] || "";
  }
  return "";
}

export function TestimonialManager({
  testimonials,
  campaigns = [],
  isAdmin,
}: {
  testimonials: TestimonialRow[];
  campaigns?: TestimonialCampaign[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // Main Section Navigation: "submissions" vs "campaigns"
  const [activeTab, setActiveTab] = useState<"submissions" | "campaigns">("submissions");

  // Filters for submissions
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [formatFilter, setFormatFilter] = useState<"all" | "video" | "text">("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Panels
  const [editingItem, setEditingItem] = useState<TestimonialRow | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; provider: string | null; name: string } | null>(null);
  const [historyItem, setHistoryItem] = useState<TestimonialRow | null>(null);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);

  // Moderation notes prompt
  const [rejectPromptId, setRejectPromptId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Share copy state
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://citizenshift.us";

  const generalFormUrl = `${baseUrl}/testimonials/submit`;

  const copyToClipboard = (text: string, identifier: string = "general") => {
    navigator.clipboard.writeText(text);
    setCopiedLink(identifier);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  /* ---------------------- Submissions Moderation Handlers ---------------------- */

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
      const res = await setTestimonialStatusAction(id, "rejected", rejectNote || "Declined during moderation review");
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

  const handleTogglePublish = (id: string, currentPublishState: "published" | "draft" | "archived", name: string) => {
    const nextState = currentPublishState === "published" ? "draft" : "published";
    startTransition(async () => {
      const res = await setTestimonialPublishStateAction(id, nextState);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Failed to change publish state: ${res.code}` });
      } else {
        setFeedback({
          tone: "ok",
          text: `${nextState === "published" ? "Published" : "Unpublished (moved to draft)"} testimonial from ${name}.`,
        });
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

  const handleReorder = (id: string, newOrder: number, name: string) => {
    startTransition(async () => {
      const res = await updateTestimonialAction(id, { sort_order: newOrder });
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Failed to update order: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: `Updated display order for ${name} to ${newOrder}.` });
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Permanently delete testimonial from ${name}? This action cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteTestimonialAction(id);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Delete failed: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: `Permanently deleted testimonial from ${name}.` });
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
        setFeedback({ tone: "ok", text: "Testimonial metadata updated successfully." });
        setEditingItem(null);
        router.refresh();
      }
    });
  };

  /* ---------------------- Campaign Handlers ---------------------- */

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const name = String(fd.get("name") ?? "").trim();
    const slug = String(fd.get("slug") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();

    startTransition(async () => {
      const res = await createTestimonialCampaignAction({
        name,
        slug,
        description: description || undefined,
      });

      if (!res.ok) {
        setFeedback({ tone: "err", text: res.message || `Campaign creation failed: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: `Created campaign submission link: ${name}` });
        setShowCreateCampaignModal(false);
        router.refresh();
      }
    });
  };

  const handleRevokeCampaign = (id: string, name: string) => {
    if (!confirm(`Revoke campaign link "${name}"? Anyone visiting this link will see that the campaign has concluded.`)) {
      return;
    }
    startTransition(async () => {
      const res = await revokeTestimonialCampaignAction(id);
      if (!res.ok) {
        setFeedback({ tone: "err", text: `Failed to revoke campaign: ${res.code}` });
      } else {
        setFeedback({ tone: "ok", text: `Revoked campaign link for "${name}".` });
        router.refresh();
      }
    });
  };

  // Filter pipeline
  const filteredTestimonials = testimonials.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (formatFilter === "video" && !t.video_url) return false;
    if (formatFilter === "text" && Boolean(t.video_url)) return false;
    if (campaignFilter !== "all") {
      if (campaignFilter === "general" && t.campaign_id !== null) return false;
      if (campaignFilter !== "general" && t.campaign_id !== campaignFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.full_name.toLowerCase().includes(q);
      const matchOrg = t.organization?.toLowerCase().includes(q) ?? false;
      const matchEmail = t.email.toLowerCase().includes(q);
      const matchText = t.testimonial_text.toLowerCase().includes(q);
      const matchCampaign = t.campaign_name?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchOrg && !matchEmail && !matchText && !matchCampaign) return false;
    }
    return true;
  });

  const pendingCount = testimonials.filter((t) => t.status === "pending").length;
  const approvedCount = testimonials.filter((t) => t.status === "approved").length;
  const rejectedCount = testimonials.filter((t) => t.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Distribution & Sharing Toolkit */}
      <div className="rounded-lg border hairline bg-paper p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50 font-semibold">
              Public Submission Distribution
            </span>
            <p className="mt-0.5 text-xs text-navy/70">
              Share the official public submission URL with constituents, organizations, and grassroots advocates. No account required.
            </p>
            <p className="mt-1 font-mono text-[11px] text-navy/80 select-all">{generalFormUrl}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(generalFormUrl, "general")}
              className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper shadow-xs transition hover:bg-navy-600"
            >
              {copiedLink === "general" ? "✓ Copied!" : "📋 Copy Public URL"}
            </button>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                "Share your story on CitizenShift — nonpartisan civic transparency: " + generalFormUrl,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#25D366] px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
              title="Distribute via WhatsApp"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent("CitizenShift Civic Feedback Form")}&body=${encodeURIComponent(
                "We invite you to share your experience with CitizenShift:\n\n" + generalFormUrl,
              )}`}
              className="rounded-full border hairline bg-paper px-3.5 py-2 text-xs font-medium text-navy hover:bg-icy-100 transition"
              title="Distribute via Email"
            >
              Email
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                "Share your story on CitizenShift — nonpartisan bill tracking and civic insights:",
              )}&url=${encodeURIComponent(generalFormUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border hairline bg-paper px-3.5 py-2 text-xs font-medium text-navy hover:bg-icy-100 transition"
              title="Distribute on X"
            >
              X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generalFormUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border hairline bg-paper px-3.5 py-2 text-xs font-medium text-navy hover:bg-icy-100 transition"
              title="Distribute on LinkedIn"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      {feedback ? (
        <div
          className={`border p-3 text-xs flex items-center justify-between ${
            feedback.tone === "ok" ? "border-navy/20 bg-icy-100 text-navy" : "border-berry/30 bg-berry/5 text-berry"
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="ml-4 font-bold text-xs">
            ✕
          </button>
        </div>
      ) : null}

      {/* Main Section Tabs */}
      <div className="flex border-b hairline">
        <button
          type="button"
          onClick={() => setActiveTab("submissions")}
          className={`px-5 py-2.5 text-xs font-semibold transition border-b-2 ${
            activeTab === "submissions"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-navy/60 hover:text-navy"
          }`}
        >
          Review Submissions ({testimonials.length})
          {pendingCount > 0 ? (
            <span className="ml-2 rounded-full bg-berry px-1.5 py-0.2 text-[10px] text-paper">
              {pendingCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={`px-5 py-2.5 text-xs font-semibold transition border-b-2 ${
            activeTab === "campaigns"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-navy/60 hover:text-navy"
          }`}
        >
          Campaign Sharing Links ({campaigns.length})
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: SUBMISSIONS REVIEW QUEUE                                   */}
      {/* ===================================================================== */}
      {activeTab === "submissions" ? (
        <div className="space-y-4">
          {/* Review Queue Filters & Search */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border hairline bg-paper p-4">
            {/* Status tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-md px-3 py-1.5 font-medium transition ${
                  statusFilter === "all" ? "bg-navy text-paper shadow-xs" : "text-navy/70 hover:bg-icy-100"
                }`}
              >
                All ({testimonials.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`relative rounded-md px-3 py-1.5 font-medium transition ${
                  statusFilter === "pending" ? "bg-navy text-paper shadow-xs" : "text-navy/70 hover:bg-icy-100"
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
                className={`rounded-md px-3 py-1.5 font-medium transition ${
                  statusFilter === "approved" ? "bg-navy text-paper shadow-xs" : "text-navy/70 hover:bg-icy-100"
                }`}
              >
                Approved ({approvedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("rejected")}
                className={`rounded-md px-3 py-1.5 font-medium transition ${
                  statusFilter === "rejected" ? "bg-navy text-paper shadow-xs" : "text-navy/70 hover:bg-icy-100"
                }`}
              >
                Rejected ({rejectedCount})
              </button>
            </div>

            {/* Campaign & Format filters & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Campaign Filter Dropdown */}
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="rounded border hairline bg-paper px-2.5 py-1 text-xs text-navy focus:border-navy focus:outline-none"
              >
                <option value="all">All Campaigns</option>
                <option value="general">General Form (No Campaign)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.status === "revoked" ? "(Revoked)" : ""}
                  </option>
                ))}
              </select>

              <div className="flex rounded-md border hairline bg-paper p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFormatFilter("all")}
                  className={`rounded px-2.5 py-1 ${formatFilter === "all" ? "bg-navy text-paper font-medium" : "text-navy/60"}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter("video")}
                  className={`rounded px-2.5 py-1 ${formatFilter === "video" ? "bg-navy text-paper font-medium" : "text-navy/60"}`}
                >
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => setFormatFilter("text")}
                  className={`rounded px-2.5 py-1 ${formatFilter === "text" ? "bg-navy text-paper font-medium" : "text-navy/60"}`}
                >
                  Text
                </button>
              </div>

              <input
                type="search"
                placeholder="Search name, text, campaign, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded border hairline bg-paper px-3 py-1 text-xs text-navy focus:border-navy focus:outline-none w-44 sm:w-56"
              />
            </div>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto border hairline bg-paper">
            <table className="w-full text-left text-sm text-navy">
              <thead className="border-b hairline bg-icy-50 font-mono text-[10px] uppercase tracking-wider text-navy/60">
                <tr>
                  <th className="px-4 py-3">Submitter & Organization</th>
                  <th className="px-4 py-3">Feedback & Highlight</th>
                  <th className="px-4 py-3">Campaign / Source</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Status / Publish</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline">
                {filteredTestimonials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-xs text-navy/50">
                      No testimonials found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTestimonials.map((t) => {
                    const hasVideo = Boolean(t.video_url);
                    const isPublished = t.publish_state === "published";
                    const statusBadge =
                      t.status === "approved"
                        ? "bg-navy/10 text-navy font-semibold"
                        : t.status === "pending"
                          ? "bg-berry/15 text-berry font-bold"
                          : "bg-navy/5 text-navy/40";

                    return (
                      <tr key={t.id} className="transition hover:bg-icy-50/50">
                        {/* Submitter info */}
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
                              <div className="font-mono text-[10px] text-navy/45">{t.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Feedback content */}
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

                        {/* Campaign Attribution */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {t.campaign_name ? (
                            <span className="inline-flex items-center gap-1 rounded bg-icy-100 px-2 py-0.5 font-mono text-[10px] font-medium text-navy">
                              🎯 {t.campaign_name}
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-navy/40">General Form</span>
                          )}
                        </td>

                        {/* Format */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {hasVideo && t.video_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewVideo({
                                  url: t.video_url!,
                                  provider: t.video_provider,
                                  name: t.full_name,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded bg-navy/10 px-2 py-1 font-mono text-[10px] font-semibold text-navy hover:bg-navy/20"
                            >
                              ▶ Video ({t.video_provider || "file"})
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] text-navy/55">Written Story</span>
                          )}
                        </td>

                        {/* Status & Publish */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${statusBadge}`}>
                              {t.status}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider ${
                                isPublished ? "bg-emerald-100 text-emerald-800 font-semibold" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {isPublished ? "● Published" : "○ Draft/Hidden"}
                            </span>
                            {t.is_featured ? (
                              <span className="rounded bg-berry/10 px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider text-berry font-bold">
                                ★ Featured
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Display Order */}
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleReorder(t.id, Math.max(0, t.sort_order - 1), t.full_name)}
                              className="rounded border hairline px-1 py-0.5 text-[10px] hover:bg-icy-100"
                              title="Move up"
                            >
                              ▲
                            </button>
                            <span className="w-5 text-center">{t.sort_order}</span>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleReorder(t.id, t.sort_order + 1, t.full_name)}
                              className="rounded border hairline px-1 py-0.5 text-[10px] hover:bg-icy-100"
                              title="Move down"
                            >
                              ▼
                            </button>
                          </div>
                        </td>

                        {/* Submitted Date */}
                        <td className="px-4 py-3 font-mono text-xs text-navy/60 whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>

                        {/* Moderation Actions */}
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          {/* Approve / Reject */}
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
                            rejectPromptId === t.id ? (
                              <div className="inline-flex items-center gap-1">
                                <input
                                  placeholder="Reason..."
                                  value={rejectNote}
                                  onChange={(e) => setRejectNote(e.target.value)}
                                  className="rounded border hairline px-2 py-0.5 text-[11px] text-navy w-24"
                                />
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() => handleReject(t.id, t.full_name)}
                                  className="rounded bg-berry px-2 py-1 text-[11px] font-semibold text-paper"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectPromptId(null)}
                                  className="text-[11px] text-navy/60"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => setRejectPromptId(t.id)}
                                className="rounded border border-berry/30 px-2 py-1 text-xs font-medium text-berry hover:bg-berry/5"
                              >
                                Reject
                              </button>
                            )
                          ) : null}

                          {/* Publish / Unpublish */}
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleTogglePublish(t.id, t.publish_state, t.full_name)}
                            className={`rounded border hairline px-2 py-1 text-xs font-medium ${
                              isPublished
                                ? "bg-paper text-navy/70 hover:bg-icy-100"
                                : "bg-navy/10 text-navy font-semibold hover:bg-navy/20"
                            }`}
                            title={isPublished ? "Hide from public view" : "Publish to live public page"}
                          >
                            {isPublished ? "Unpublish" : "Publish"}
                          </button>

                          {/* Feature / Unfeature */}
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleToggleFeature(t.id, t.is_featured, t.full_name)}
                            className={`rounded border hairline px-2 py-1 text-xs font-medium ${
                              t.is_featured ? "bg-berry/10 text-berry font-semibold" : "text-navy/70 hover:bg-icy-100"
                            }`}
                          >
                            {t.is_featured ? "★ Unfeature" : "☆ Feature"}
                          </button>

                          {/* Edit Metadata */}
                          <button
                            type="button"
                            onClick={() => setEditingItem(t)}
                            className="rounded border hairline bg-paper px-2 py-1 text-xs font-medium text-navy hover:bg-icy-100"
                          >
                            Edit
                          </button>

                          {/* History & Details */}
                          <button
                            type="button"
                            onClick={() => setHistoryItem(t)}
                            className="rounded border hairline bg-paper px-2 py-1 text-xs font-medium text-navy hover:bg-icy-100"
                            title="View submission dates, consent, and moderation history"
                          >
                            History
                          </button>

                          {/* Delete */}
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
      ) : null}

      {/* ===================================================================== */}
      {/* SECTION 2: CAMPAIGN SHARING LINKS MANAGEMENT                          */}
      {/* ===================================================================== */}
      {activeTab === "campaigns" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border hairline bg-paper p-4">
            <div>
              <h3 className="font-display text-base font-semibold text-navy">
                Campaign-Specific Submission Links
              </h3>
              <p className="text-xs text-navy/60">
                Generate dedicated URLs for specific outreach initiatives, coalitions, or classroom drives. Track which campaign drives each story, and revoke links when initiatives conclude.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateCampaignModal(true)}
              className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper shadow-xs transition hover:bg-navy-600"
            >
              + Generate New Campaign Link
            </button>
          </div>

          <div className="overflow-x-auto border hairline bg-paper">
            <table className="w-full text-left text-sm text-navy">
              <thead className="border-b hairline bg-icy-50 font-mono text-[10px] uppercase tracking-wider text-navy/60">
                <tr>
                  <th className="px-4 py-3">Campaign Name & Description</th>
                  <th className="px-4 py-3">Campaign Slug & Share URL</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submissions</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-xs text-navy/50">
                      No campaign links created yet. Click "+ Generate New Campaign Link" above to start.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => {
                    const campaignUrl = `${baseUrl}/testimonials/submit?c=${encodeURIComponent(c.slug)}`;
                    const isRevoked = c.status === "revoked";

                    return (
                      <tr key={c.id} className="transition hover:bg-icy-50/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-xs text-navy">{c.name}</p>
                          {c.description ? (
                            <p className="text-[11px] text-navy/60 line-clamp-1 mt-0.5">{c.description}</p>
                          ) : null}
                        </td>

                        <td className="px-4 py-3 max-w-xs">
                          <p className="font-mono text-[11px] text-navy truncate">{campaignUrl}</p>
                          <span className="font-mono text-[10px] text-navy/40">slug: {c.slug}</span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-semibold ${
                              isRevoked ? "bg-berry/15 text-berry" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isRevoked ? "Revoked / Closed" : "Active"}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                          {c.submission_count ?? 0} stories
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-navy/60 whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(campaignUrl, c.id)}
                            className="rounded border hairline bg-paper px-2.5 py-1 text-xs font-medium text-navy hover:bg-icy-100"
                          >
                            {copiedLink === c.id ? "✓ Copied!" : "Copy Link"}
                          </button>

                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                              `Share your story for ${c.name} on CitizenShift: ` + campaignUrl,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block rounded bg-[#25D366] px-2 py-1 text-[11px] font-semibold text-white hover:opacity-90"
                            title="Distribute via WhatsApp"
                          >
                            WhatsApp
                          </a>

                          <a
                            href={`mailto:?subject=${encodeURIComponent(c.name + " on CitizenShift")}&body=${encodeURIComponent(
                              `We'd love to hear your feedback for ${c.name}:\n\n` + campaignUrl,
                            )}`}
                            className="inline-block rounded border hairline bg-paper px-2 py-1 text-[11px] font-medium text-navy hover:bg-icy-100"
                            title="Distribute via Email"
                          >
                            Email
                          </a>

                          {!isRevoked ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleRevokeCampaign(c.id, c.name)}
                              className="rounded border border-berry/30 px-2.5 py-1 text-xs font-medium text-berry hover:bg-berry/5"
                              title="Revoke this submission link"
                            >
                              Revoke Link
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] text-navy/40 italic">Revoked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ===================================================================== */}
      {/* MODALS                                                                */}
      {/* ===================================================================== */}

      {/* Create Campaign Modal */}
      {showCreateCampaignModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateCampaign}
            className="w-full max-w-lg rounded-lg border hairline bg-paper p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b hairline pb-3">
              <h3 className="font-display text-lg font-semibold text-navy">
                Generate Campaign Submission Link
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateCampaignModal(false)}
                className="text-navy/60 hover:text-navy text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <label className="grid gap-1 text-xs">
              <span className="font-medium text-navy">Campaign / Outreach Name *</span>
              <input
                name="name"
                required
                placeholder="e.g. Clean Water Coalition 2026 Drive"
                className={INPUT}
              />
            </label>

            <label className="grid gap-1 text-xs">
              <span className="font-medium text-navy">Custom URL Slug *</span>
              <input
                name="slug"
                required
                placeholder="e.g. clean-water-2026"
                className={INPUT}
              />
              <span className="text-[11px] text-navy/50">
                Will produce link: <code className="font-mono">/testimonials/submit?c=slug</code>
              </span>
            </label>

            <label className="grid gap-1 text-xs">
              <span className="font-medium text-navy">Description / Campaign Purpose (optional)</span>
              <textarea
                name="description"
                rows={3}
                placeholder="Brief internal note or banner description shown to contributors on the form..."
                className={INPUT}
              />
            </label>

            <div className="flex justify-end gap-3 pt-3 border-t hairline">
              <button
                type="button"
                onClick={() => setShowCreateCampaignModal(false)}
                className="rounded border hairline px-4 py-2 text-xs font-medium text-navy/70 hover:bg-icy-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded bg-navy px-5 py-2 text-xs font-semibold text-paper hover:bg-navy-600 disabled:opacity-50"
              >
                Create Campaign Link
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Video Preview Modal */}
      {previewVideo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-lg border hairline bg-paper p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold text-navy">
                Video Preview: {previewVideo.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="text-navy/60 hover:text-navy text-lg leading-none"
              >
                ✕
              </button>
            </div>
            {previewVideo.provider === "youtube" || previewVideo.url.includes("youtube.com") || previewVideo.url.includes("youtu.be") ? (
              <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(previewVideo.url)}`}
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : previewVideo.provider === "vimeo" || previewVideo.url.includes("vimeo.com") ? (
              <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
                <iframe
                  src={`https://player.vimeo.com/video/${getVimeoId(previewVideo.url)}`}
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
                <video src={previewVideo.url} controls className="h-full w-full" />
              </div>
            )}
            <div className="mt-4 flex justify-between items-center text-xs text-navy/60">
              <span className="font-mono truncate max-w-md">{previewVideo.url}</span>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="rounded bg-navy px-4 py-1.5 font-semibold text-paper"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Moderation History & Audit Details Modal */}
      {historyItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border hairline bg-paper p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b hairline pb-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-navy">
                  Submission History & Metadata
                </h3>
                <p className="text-xs text-navy/60">ID: {historyItem.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryItem(null)}
                className="text-navy/60 hover:text-navy text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded border hairline p-3 bg-icy-50/50">
                <p className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Submitter Name</p>
                <p className="font-semibold text-navy mt-1">{historyItem.full_name}</p>
              </div>
              <div className="rounded border hairline p-3 bg-icy-50/50">
                <p className="font-mono text-[10px] uppercase tracking-wider text-navy/50">
                  Email (Strictly Private)
                </p>
                <p className="font-semibold text-navy mt-1 font-mono">{historyItem.email}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded border hairline p-3 bg-icy-50/50">
                <p className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Organization</p>
                <p className="text-navy mt-1">{historyItem.organization || "—"}</p>
              </div>
              <div className="rounded border hairline p-3 bg-icy-50/50">
                <p className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Role / Title</p>
                <p className="text-navy mt-1">{historyItem.role || "—"}</p>
              </div>
            </div>

            {/* Campaign Attribution */}
            <div className="rounded border hairline p-3 bg-icy-50/50 text-xs">
              <p className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Campaign Attribution</p>
              <p className="font-semibold text-navy mt-1">
                {historyItem.campaign_name ? (
                  <>🎯 {historyItem.campaign_name} (ID: {historyItem.campaign_id})</>
                ) : (
                  "General Form Submission (No Campaign)"
                )}
              </p>
            </div>

            <div className="rounded border hairline p-3 bg-paper text-xs space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Full Testimonial Text</p>
              <p className="text-navy leading-relaxed whitespace-pre-wrap">{historyItem.testimonial_text}</p>
            </div>

            {historyItem.quote_highlight ? (
              <div className="rounded border hairline p-3 bg-paper text-xs space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Quote Highlight</p>
                <p className="font-display text-navy italic">“{historyItem.quote_highlight}”</p>
              </div>
            ) : null}

            {/* Moderation & Consent audit logs */}
            <div className="rounded border hairline p-4 bg-icy-50 space-y-2 text-xs">
              <h4 className="font-mono text-[10px] uppercase tracking-wider text-navy/60 font-semibold">
                Audit & Compliance Timeline
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 text-[11px]">
                <div>
                  <span className="text-navy/50">Submitted At:</span>{" "}
                  <span className="font-mono text-navy">{new Date(historyItem.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-navy/50">Explicit Consent:</span>{" "}
                  <span className="font-mono text-navy">
                    {historyItem.consent_given ? "✓ Granted" : "✗ Missing"} (
                    {new Date(historyItem.consent_timestamp).toLocaleString()})
                  </span>
                </div>
                <div>
                  <span className="text-navy/50">Moderated By:</span>{" "}
                  <span className="font-mono text-navy">{historyItem.moderated_by || "Pending"}</span>
                </div>
                <div>
                  <span className="text-navy/50">Moderated At:</span>{" "}
                  <span className="font-mono text-navy">
                    {historyItem.moderated_at ? new Date(historyItem.moderated_at).toLocaleString() : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-navy/50">Current Status:</span>{" "}
                  <span className="font-mono font-semibold text-navy uppercase">{historyItem.status}</span>
                </div>
                <div>
                  <span className="text-navy/50">Publish State:</span>{" "}
                  <span className="font-mono font-semibold text-navy uppercase">{historyItem.publish_state}</span>
                </div>
              </div>

              {historyItem.moderation_notes ? (
                <div className="mt-2 pt-2 border-t hairline text-xs">
                  <span className="text-navy/50 font-medium">Moderator Notes:</span>
                  <p className="mt-0.5 text-navy italic">{historyItem.moderation_notes}</p>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryItem(null)}
                className="rounded bg-navy px-4 py-2 text-xs font-semibold text-paper"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Metadata Modal */}
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs">
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
                className="text-navy/60 hover:text-navy text-lg leading-none"
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
                <span className="font-mono text-[10px] uppercase tracking-wider text-navy/50">Display Sort Order</span>
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
    </div>
  );
}
