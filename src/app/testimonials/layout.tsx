import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import RevealObserver from "@/components/motion/RevealObserver";

export const metadata: Metadata = {
  title: "Civic Feedback & Testimonials — CitizenShift",
  description:
    "Hear directly from voters, community advocates, journalists, and civic leaders using CitizenShift to track legislation and demand government accountability.",
};

export default function TestimonialsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RevealObserver />
      <Header />
      <main id="main" className="min-h-screen bg-icy-50 pt-16 sm:pt-20">
        {children}
      </main>
      <Footer />
    </>
  );
}

