import type { Metadata } from "next";
import Link from "next/link";
import { TestimonialSubmitForm } from "@/components/site/TestimonialSubmitForm";

export const metadata: Metadata = {
  title: "Submit Civic Feedback & Stories — CitizenShift",
  description:
    "Share how CitizenShift helped you follow legislation, track congressional votes, and engage with representatives. Written and video submissions welcome.",
};

export default function TestimonialSubmitPage() {
  return (
    <div className="min-h-screen bg-icy-50 py-12 sm:py-16">
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
            Every submission helps show how accessible, byte-exact legislative transparency impacts voters, educators, journalists, and civic advocates across our country.
          </p>
        </div>

        <TestimonialSubmitForm />
      </div>
    </div>
  );
}

