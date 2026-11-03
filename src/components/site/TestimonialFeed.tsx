"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicTestimonial } from "@/lib/cms/types";

function VideoEmbed({
  url,
  provider,
}: {
  url: string;
  provider: "direct" | "youtube" | "vimeo" | null;
}) {
  if (provider === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
    }
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-navy/10">
        <iframe
          src={embedUrl}
          title="CitizenShift Testimonial Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  if (provider === "vimeo" || url.includes("vimeo.com")) {
    const vimeoId = url.split("vimeo.com/")[1]?.split("?")[0] || "";
    const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-navy/10">
        <iframe
          src={embedUrl}
          title="CitizenShift Testimonial Video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  // Direct video file (MP4, WebM, MOV)
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-navy/90">
      <video
        src={url}
        controls
        preload="metadata"
        className="h-full w-full object-cover"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export function TestimonialFeed({
  testimonials,
}: {
  testimonials: PublicTestimonial[];
}) {
  const [filter, setFilter] = useState<"all" | "video" | "text">("all");

  const filtered = testimonials.filter((t) => {
    if (filter === "video") return Boolean(t.video_url);
    if (filter === "text") return !t.video_url;
    return true;
  });

  const featured = testimonials.find((t) => t.is_featured);

  return (
    <div className="space-y-12">
      {/* Featured Spotlight */}
      {featured ? (
        <section className="relative overflow-hidden rounded-2xl border hairline bg-paper p-6 sm:p-10 shadow-xs">
          <div className="absolute right-6 top-6">
            <span className="rounded-full bg-berry/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-berry font-semibold">
              ★ Featured Civic Voice
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            {featured.video_url ? (
              <div className="lg:col-span-6">
                <VideoEmbed url={featured.video_url} provider={featured.video_provider} />
              </div>
            ) : null}

            <div className={featured.video_url ? "lg:col-span-6" : "lg:col-span-12 max-w-3xl"}>
              {featured.quote_highlight ? (
                <blockquote className="font-display text-2xl font-semibold text-navy sm:text-3xl leading-snug">
                  “{featured.quote_highlight}”
                </blockquote>
              ) : null}

              <p className="mt-4 text-sm text-navy/80 leading-relaxed">
                {featured.testimonial_text}
              </p>

              <div className="mt-6 flex items-center gap-3">
                {featured.avatar_url ? (
                  <img
                    src={featured.avatar_url}
                    alt={featured.full_name}
                    className="h-11 w-11 rounded-full object-cover border hairline"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-icy-100 font-display text-sm font-semibold text-navy">
                    {featured.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-navy text-sm">{featured.full_name}</div>
                  <div className="text-xs text-navy/60">
                    {featured.role ? `${featured.role}` : ""}
                    {featured.role && featured.organization ? ` · ` : ""}
                    {featured.organization ? `${featured.organization}` : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Filter Tabs & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b hairline pb-4">
        <div className="flex items-center gap-1.5 rounded-lg border hairline bg-paper p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-3.5 py-1.5 font-medium transition ${
              filter === "all" ? "bg-navy text-paper shadow-xs" : "text-navy/70 hover:bg-icy-50"
            }`}
          >
            All Feedback ({testimonials.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("video")}
            className={`rounded-md px-3.5 py-1.5 font-medium transition ${
              filter === "video" ? "bg-navy text-paper shadow-xs" : "text-navy/70 hover:bg-icy-50"
            }`}
          >
            Video Testimonials ({testimonials.filter((t) => Boolean(t.video_url)).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("text")}
            className={`rounded-md px-3.5 py-1.5 font-medium transition ${
              filter === "text" ? "bg-navy text-paper shadow-xs" : "text-navy/70 hover:bg-icy-50"
            }`}
          >
            Written Stories ({testimonials.filter((t) => !t.video_url).length})
          </button>
        </div>

        <Link
          href="/testimonials/submit"
          className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper transition hover:bg-navy-600"
        >
          + Submit Your Story
        </Link>
      </div>

      {/* Testimonials Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border hairline bg-paper p-12 text-center">
          <p className="text-sm text-navy/60">No testimonials found in this category.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const hasVideo = Boolean(t.video_url);
            return (
              <article
                key={t.id}
                className="flex flex-col justify-between rounded-xl border hairline bg-paper p-6 shadow-xs transition hover:border-navy/30"
              >
                <div>
                  {hasVideo && t.video_url ? (
                    <div className="mb-4">
                      <VideoEmbed url={t.video_url} provider={t.video_provider} />
                    </div>
                  ) : null}

                  {t.quote_highlight ? (
                    <h3 className="font-display text-base font-semibold text-navy leading-snug">
                      “{t.quote_highlight}”
                    </h3>
                  ) : null}

                  <p
                    className={`text-xs text-navy/75 leading-relaxed ${
                      t.quote_highlight ? "mt-2.5" : "mt-0"
                    }`}
                  >
                    {t.testimonial_text}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t hairline pt-4">
                  {t.avatar_url ? (
                    <img
                      src={t.avatar_url}
                      alt={t.full_name}
                      className="h-9 w-9 rounded-full object-cover border hairline"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-icy-100 font-display text-xs font-semibold text-navy">
                      {t.full_name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-navy">{t.full_name}</p>
                    <p className="truncate text-[11px] text-navy/55">
                      {t.role ? t.role : ""}
                      {t.role && t.organization ? " · " : ""}
                      {t.organization ? t.organization : ""}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

