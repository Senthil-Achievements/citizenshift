"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import HalftoneWordmarkFooter, { FooterColumn } from "@/components/ui/halftone-wordmark-footer";
import JoinModal from "@/components/site/JoinModal";

export default function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [joinOpen, setJoinOpen] = useState(false);

  // Intelligently route hash anchors so they smooth-scroll on home, and navigate safely from subpages
  const resolveHash = (hash: string) => (isHome ? hash : `/${hash}`);

  const columns: FooterColumn[] = [
    {
      title: "Explore",
      links: [
        { label: "Home", href: resolveHash("#home") },
        { label: "Explore Legislation", href: resolveHash("#legislation") },
        { label: "Stories & Voices", href: isHome ? "#stories" : "/testimonials" },
        { label: "About Mission", href: resolveHash("#about") },
        { label: "The Team", href: resolveHash("#team") },
      ],
    },
    {
      title: "Support",
      links: [
        {
          label: "Donate (ActBlue)",
          href: "https://secure.actblue.com/donate/citizenshift-1",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          label: "Join the Movement",
          href: resolveHash("#join"),
          onClick: (e) => {
            e.preventDefault();
            setJoinOpen(true);
          },
        },
        { label: "Explore Feed", href: resolveHash("#legislation") },
        { label: "Nonpartisan Charter", href: resolveHash("#charter") },
      ],
    },
    {
      title: "Contact",
      links: [
        {
          label: "erin.chouinard@citizenshift.us",
          href: "mailto:erin.chouinard@citizenshift.us?subject=CitizenShift%20Inquiry",
        },
        {
          label: "Instagram",
          href: "https://instagram.com/citizenshift",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          label: "Twitter / X",
          href: "https://x.com/citizenshift",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          label: "Facebook",
          href: "https://facebook.com/citizenshift",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          label: "LinkedIn",
          href: "https://www.linkedin.com/company/citizenshift/posts/?feedView=all",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        { label: "New York, NY", href: resolveHash("#contact") },
        { label: "Privacy & Terms", href: "/privacy" },
      ],
    },
  ];

  return (
    <div className="w-full relative">
      <HalftoneWordmarkFooter
        wordmark="citizenshift"
        label="CitizenShift"
        meta="© 2026 · Bringing Power to the People · New York, NY"
        columns={columns}
        preset="night"
        palette={{
          background: "#060913", // Seamless CitizenShift Deep Midnight
          ink: "#e3f3fc",        // Icy paper ink
          warm: "#c2121f",       // CitizenShift Berry red on hover/push
        }}
        dotGap={6}
        radius={85}
        crop={0.2}
        grain={0.45}
        height="560px"
        backToTop={true}
        interactive={true}
        className="border-none"
      />

      {/* Self-contained Join the Movement modal triggered directly from the footer */}
      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} intent="join" />
    </div>
  );
}
