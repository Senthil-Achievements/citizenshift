import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import RevealObserver from "@/components/motion/RevealObserver";

export const metadata: Metadata = {
  title: "Bill Detail — CitizenShift",
  description:
    "Official legislative record detail: bill information, sponsor, progress, official summary and original bill text.",
};

/** Chrome for everything under citizenshift.us/explore — same header/footer. */
export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RevealObserver />
      <Header />
      <main id="main" className="bg-icy-50">{children}</main>
      <Footer />
    </>
  );
}
