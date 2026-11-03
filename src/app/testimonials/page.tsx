import type { Metadata } from "next";
import Link from "next/link";
import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { listPublicTestimonials } from "@/lib/cms/testimonials";
import { TestimonialFeed } from "@/components/site/TestimonialFeed";

export const metadata: Metadata = {
  title: "Civic Feedback & Testimonials — CitizenShift",
  description:
    "Hear directly from voters, community advocates, journalists, and civic leaders using CitizenShift to track legislation and demand government accountability.",
};

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const db = isAdminClientAvailable() ? getAdminClient() : null;
  const res = await listPublicTestimonials(db, { limit: 100 });

  return (
    <div className="min-h-screen bg-icy-50">
      {/* Header section */}
      <section className="border-b hairline bg-paper py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-berry font-semibold">
            Civic Community Feedback
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-5xl">
            Bringing Power to the People
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-navy/70 leading-relaxed">
            Real experiences from citizens, organizers, and researchers across the nation who rely on
            CitizenShift for byte-exact legislative transparency and civic empowerment.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/testimonials/submit"
              className="rounded-full bg-navy px-6 py-3 text-xs font-semibold text-paper shadow-xs transition hover:bg-navy-600"
            >
              Share Your Story
            </Link>
            <Link
              href="/explore"
              className="rounded-full border hairline bg-paper px-6 py-3 text-xs font-medium text-navy hover:bg-icy-100"
            >
              Explore Legislation
            </Link>
          </div>
        </div>
      </section>

      {/* Main feed */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <TestimonialFeed testimonials={res.rows} />
      </section>

      {/* Bottom CTA */}
      <section className="border-t hairline bg-paper py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
            Has CitizenShift made an impact on your civic advocacy?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-navy/70 leading-relaxed">
            Whether you recorded a 30-second video message or wrote a short paragraph, we want to hear your story. Submissions take under two minutes.
          </p>
          <div className="mt-6">
            <Link
              href="/testimonials/submit"
              className="inline-block rounded-full bg-navy px-7 py-3 text-xs font-semibold text-paper hover:bg-navy-600"
            >
              Submit Your Experience →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

