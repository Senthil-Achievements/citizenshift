"use client";

import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "#home" },
      { label: "Explore Legislation", href: "#legislation" },
      { label: "Stories & Voices", href: "/testimonials" },
      { label: "About Mission", href: "#about" },
      { label: "The Team", href: "#team" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Donate (ActBlue)", href: "https://secure.actblue.com/donate/citizenshift-1" },
      { label: "Join the Movement", href: "#home" },
      { label: "Explore Feed", href: "#legislation" },
      { label: "Nonpartisan Charter", href: "#about" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "erin.chouinard@citizenshift.us", href: "mailto:erin.chouinard@citizenshift.us" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/citizenshift/posts/?feedView=all" },
      { label: "New York, NY", href: "#contact" },
      { label: "Privacy & Terms", href: "#contact" },
    ],
  },
];

export default function Footer() {
  return (
    <div className="w-full">
      <HalftoneWordmarkFooter
        wordmark="citizenshift"
        label="CitizenShift"
        meta="© 2026 · Bringing Power to the People · New York, NY"
        columns={COLUMNS}
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
    </div>
  );
}
