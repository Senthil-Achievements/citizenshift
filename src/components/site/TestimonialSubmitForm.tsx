"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitPublicTestimonialAction } from "@/lib/admin/actions";

export function TestimonialSubmitForm() {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<"file" | "url">("file");
  const [videoLinkInput, setVideoLinkInput] = useState("");

  // Share helpers
  const [copied, setCopied] = useState(false);

  const formUrl = typeof window !== "undefined" ? window.location.href : "https://citizenshift.us/testimonials/submit";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Share your experience with CitizenShift",
          text: "Tell us how nonpartisan bill tracking and civic insights helped your community.",
          url: formUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: "avatar" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = kind === "video";
    if (isVideo) setUploadingVideo(true);
    else setUploadingAvatar(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/testimonials/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "File upload failed.");
      } else {
        if (isVideo) setVideoUrl(data.url);
        else setAvatarUrl(data.url);
      }
    } catch {
      setError("Network error while uploading file.");
    } finally {
      if (isVideo) setUploadingVideo(false);
      else setUploadingAvatar(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const fullName = String(fd.get("full_name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const organization = String(fd.get("organization") ?? "").trim();
    const role = String(fd.get("role") ?? "").trim();
    const text = String(fd.get("testimonial_text") ?? "").trim();
    const quoteHighlight = String(fd.get("quote_highlight") ?? "").trim();
    const consent = fd.get("consent_given") === "on";
    const hp = String(fd.get("hp_website") ?? "");

    let finalVideoUrl = videoUrl;
    let finalProvider: "direct" | "youtube" | "vimeo" | null = videoUrl ? "direct" : null;

    if (videoType === "url" && videoLinkInput.trim()) {
      finalVideoUrl = videoLinkInput.trim();
      if (finalVideoUrl.includes("youtube.com") || finalVideoUrl.includes("youtu.be")) {
        finalProvider = "youtube";
      } else if (finalVideoUrl.includes("vimeo.com")) {
        finalProvider = "vimeo";
      } else {
        finalProvider = "direct";
      }
    }

    if (!consent) {
      setError("Please check the consent box to grant permission for publication.");
      return;
    }

    startTransition(async () => {
      const res = await submitPublicTestimonialAction({
        full_name: fullName,
        email,
        organization: organization || undefined,
        role: role || undefined,
        testimonial_text: text,
        quote_highlight: quoteHighlight || undefined,
        avatar_url: avatarUrl || undefined,
        video_url: finalVideoUrl || undefined,
        video_provider: finalProvider,
        consent_given: true,
        hp_website: hp,
      });

      if (!res.ok) {
        setError(res.message || `Submission failed (${res.code}).`);
      } else {
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="rounded-xl border hairline bg-paper p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-icy-100 text-2xl text-navy">
          ✓
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold text-navy">
          Thank you for sharing your experience!
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-navy/70 leading-relaxed">
          Your feedback has been submitted to the CitizenShift editorial queue. Our team reviews
          each submission to protect civic community standards. Your email address remains strictly
          confidential and will never be displayed publicly.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/testimonials"
            className="rounded-full bg-navy px-6 py-2.5 text-xs font-semibold text-paper transition hover:bg-navy-600"
          >
            Explore Public Testimonials
          </Link>
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-full border hairline bg-paper px-6 py-2.5 text-xs font-medium text-navy hover:bg-icy-100"
          >
            {copied ? "Link Copied!" : "Invite Others to Submit"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Shareable header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border hairline bg-icy-50 p-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-navy/50">
            Shareable Submission Form
          </p>
          <p className="text-xs text-navy/70">
            Share this link with your community, team, or coalition members. No account needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-full border hairline bg-paper px-3.5 py-1.5 text-xs font-medium text-navy shadow-xs transition hover:bg-icy-100"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            type="button"
            onClick={handleNativeShare}
            className="rounded-full bg-navy px-3.5 py-1.5 text-xs font-medium text-paper transition hover:bg-navy-600"
          >
            Share...
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-berry/30 bg-berry/5 p-4 text-xs text-berry">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-6 rounded-xl border hairline bg-paper p-6 sm:p-8 shadow-xs">
        {/* Anti-spam honeypot */}
        <input
          type="text"
          name="hp_website"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: "none" }}
          aria-hidden="true"
        />

        <div>
          <h3 className="font-display text-xl font-semibold text-navy">Submit Your Civic Feedback</h3>
          <p className="mt-1 text-xs text-navy/60">
            Your insights help improve nonpartisan civic transparency for voters, advocates, and students across America.
          </p>
        </div>

        {/* Name and Email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs">
            <span className="font-medium text-navy">
              Full Name <span className="text-berry">*</span>
            </span>
            <input
              name="full_name"
              required
              placeholder="e.g. Maria Gonzalez"
              className="rounded-md border hairline bg-paper px-3.5 py-2 text-sm text-navy focus:border-navy focus:outline-none"
            />
          </label>

          <label className="grid gap-1.5 text-xs">
            <span className="font-medium text-navy">
              Email Address <span className="text-berry">*</span>
            </span>
            <input
              name="email"
              type="email"
              required
              placeholder="name@example.org"
              className="rounded-md border hairline bg-paper px-3.5 py-2 text-sm text-navy focus:border-navy focus:outline-none"
            />
            <span className="text-[11px] text-navy/40">
              Kept strictly private — never published or shared.
            </span>
          </label>
        </div>

        {/* Organization and Role */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs">
            <span className="font-medium text-navy">Organization / Affiliation (optional)</span>
            <input
              name="organization"
              placeholder="e.g. League of Women Voters or Independent"
              className="rounded-md border hairline bg-paper px-3.5 py-2 text-sm text-navy focus:border-navy focus:outline-none"
            />
          </label>

          <label className="grid gap-1.5 text-xs">
            <span className="font-medium text-navy">Role / Title (optional)</span>
            <input
              name="role"
              placeholder="e.g. Grassroots Volunteer or Legal Researcher"
              className="rounded-md border hairline bg-paper px-3.5 py-2 text-sm text-navy focus:border-navy focus:outline-none"
            />
          </label>
        </div>

        {/* Testimonial Text */}
        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-navy">
            Your Feedback / Story <span className="text-berry">*</span>
          </span>
          <textarea
            name="testimonial_text"
            required
            rows={5}
            placeholder="How has CitizenShift helped you follow legislation, contact representatives, or understand bills? Share your real experience..."
            className="rounded-md border hairline bg-paper p-3 text-sm text-navy focus:border-navy focus:outline-none leading-relaxed"
          />
        </label>

        {/* Quote highlight */}
        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-navy">Key Quote / Takeaway (optional)</span>
          <input
            name="quote_highlight"
            placeholder="e.g. CitizenShift made tracking congressional votes simple and trustworthy."
            className="rounded-md border hairline bg-paper px-3.5 py-2 text-sm text-navy focus:border-navy focus:outline-none"
          />
        </label>

        {/* Profile Photo */}
        <div className="border-t hairline pt-4">
          <span className="text-xs font-medium text-navy">Profile Photo (optional)</span>
          <p className="text-[11px] text-navy/50 mb-3">Upload a headshot or photo to appear alongside your name (JPEG, PNG, WebP up to 5MB).</p>

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileUpload(e, "avatar")}
              disabled={uploadingAvatar}
              className="text-xs text-navy file:mr-3 file:rounded-full file:border-0 file:bg-icy-100 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-navy hover:file:bg-icy-200"
            />
            {uploadingAvatar ? <span className="text-xs text-navy/60">Uploading photo...</span> : null}
            {avatarUrl ? <span className="font-mono text-xs text-navy">✓ Photo uploaded</span> : null}
          </div>
        </div>

        {/* Video Testimonial Options */}
        <div className="rounded-lg border hairline bg-icy-50/70 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-navy">Video Testimonial (Optional)</span>
              <p className="text-[11px] text-navy/60">
                Videos make stories extra engaging, but written-only feedback is just as welcome!
              </p>
            </div>
            <div className="flex rounded-md border hairline bg-paper p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setVideoType("file")}
                className={`rounded px-3 py-1 font-medium ${videoType === "file" ? "bg-navy text-paper" : "text-navy/70"}`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setVideoType("url")}
                className={`rounded px-3 py-1 font-medium ${videoType === "url" ? "bg-navy text-paper" : "text-navy/70"}`}
              >
                Video Link
              </button>
            </div>
          </div>

          {videoType === "file" ? (
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => handleFileUpload(e, "video")}
                disabled={uploadingVideo}
                className="text-xs text-navy file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-paper hover:file:bg-navy-600"
              />
              {uploadingVideo ? <span className="text-xs text-navy/60">Uploading video (up to 50MB)...</span> : null}
              {videoUrl ? <span className="font-mono text-xs text-navy">✓ Video uploaded</span> : null}
            </div>
          ) : (
            <label className="grid gap-1.5 text-xs">
              <span className="text-navy/70">YouTube or Vimeo Link</span>
              <input
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                value={videoLinkInput}
                onChange={(e) => setVideoLinkInput(e.target.value)}
                className="rounded-md border hairline bg-paper px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none"
              />
            </label>
          )}
        </div>

        {/* Mandatory Explicit Consent Checkbox */}
        <div className="rounded-lg border hairline bg-paper p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="consent_given"
              required
              className="mt-1 h-4 w-4 rounded border-navy text-navy focus:ring-navy"
            />
            <span className="text-xs text-navy leading-relaxed">
              <strong>Explicit Publication Consent:</strong> I grant CitizenShift non-exclusive permission to publish my name, organization, role, and written or video testimonial on its public platform and civic informational materials. I understand my email address will remain confidential.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/testimonials"
            className="text-xs text-navy/60 hover:text-navy hover:underline"
          >
            ← View All Testimonials
          </Link>

          <button
            type="submit"
            disabled={pending || uploadingAvatar || uploadingVideo}
            className="rounded-full bg-navy px-7 py-3 text-xs font-semibold text-paper shadow-sm transition hover:bg-navy-600 disabled:opacity-50"
          >
            {pending ? "Submitting..." : "Submit Testimonial"}
          </button>
        </div>
      </form>
    </div>
  );
}

