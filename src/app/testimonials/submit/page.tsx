import type { Metadata } from "next";
import Link from "next/link";
import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";
import { getCampaignBySlug } from "@/lib/cms/testimonials";
import { TestimonialSubmitForm } from "@/components/site/TestimonialSubmitForm";

export const metadata: Metadata = {
  title: "Submit Civic Feedback & Stories — CitizenShift",
  description:
    "Share how CitizenShift helped you follow legislation, track congressional votes, and engage with representatives. Written and video submissions welcome.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ c?: string; campaign?: string }>;
}

export default async function TestimonialSubmitPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawSlug = params.c || params.campaign;

  const db = isAdminClientAvailable() ? getAdminClient() : null;
  const campaign = rawSlug ? await getCampaignBySlug(db, rawSlug) : null;

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/testimonials"
            className="font-mono text-xs text-navy/60 hover:text-navy hover:underline"
          >
            ← Public Testimonials
          </Link>
          <h1 className="mt-3 font-display text-3xl font-semibold text-navy sm:text-4xl">
            Share Your CitizenShift Experience
          </h1>
          <p className="mt-2 text-sm text-navy/70 leading-relaxed">
            Every submission helps show how accessible, byte-exact legislative transparency impacts voters, educators, journalists, and civic advocates across our country. No account or login required.
          </p>

          {/* Active campaign banner */}
          {campaign && campaign.status === "active" ? (
            <div className="mt-5 rounded-lg border border-navy/20 bg-icy-100 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-navy px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper font-semibold">
                  Campaign Initiative
                </span>
                <span className="text-xs font-semibold text-navy">{campaign.name}</span>
              </div>
              {campaign.description ? (
                <p className="mt-1.5 text-xs text-navy/70">{campaign.description}</p>
              ) : null}
            </div>
          ) : null}

          {/* Revoked campaign notice */}
          {campaign && campaign.status === "revoked" ? (
            <div className="mt-5 rounded-lg border border-berry/30 bg-berry/5 p-4 text-xs text-navy/80">
              <span className="font-semibold text-berry">Campaign Concluded:</span> The special submission
              link for <em>{campaign.name}</em> has been closed. You are still welcome to submit your story
              through our standard community feedback form below!
            </div>
          ) : null}
        </div>

        <TestimonialSubmitForm
          campaign={
            campaign
              ? {
                  name: campaign.name,
                  slug: campaign.slug,
                  isRevoked: campaign.status === "revoked",
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
