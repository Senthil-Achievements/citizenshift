"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/3d-testimonails";

export interface CivicTestimonial {
  name: string;
  role: string;
  username: string;
  body: string;
  img: string;
  location: string;
}

export const CIVIC_TESTIMONIALS: CivicTestimonial[] = [
  {
    name: "Elena Rostova",
    role: "Environmental Fellow",
    username: "@elena_eco",
    body: "Clean Water Act tracking helped our watershed coalition submit timely testimony before the Senate hearing.",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    location: "Washington, DC",
  },
  {
    name: "Marcus Vance",
    role: "Civics Educator",
    username: "@mvance_edu",
    body: "Finally, federal bills in plain English. My high school students can dissect legislation without partisan spin.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    location: "Columbus, OH",
  },
  {
    name: "Sarah Jenkins",
    role: "Public Sector Advocate",
    username: "@sjenkins_civic",
    body: "The one-tap advocate button made it effortless for 800+ municipal workers to reach their representatives.",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    location: "Austin, TX",
  },
  {
    name: "David Chen",
    role: "Law Researcher",
    username: "@dchen_law",
    body: "Reading the actual statutory code side-by-side with plain language summaries is a masterclass in transparency.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
    location: "New York, NY",
  },
  {
    name: "Maya Lin",
    role: "Investigative Reporter",
    username: "@mayalin_news",
    body: "The byte-exact legislative record is indispensable for our investigative desk. 100% verified public data.",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80",
    location: "Chicago, IL",
  },
  {
    name: "Robert MacIntyre",
    role: "County Fire Chief",
    username: "@chief_robert",
    body: "Tracked the Wildfire Emergency Act from introduction to committee markup. Crucial for rural first responders.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80",
    location: "Redding, CA",
  },
  {
    name: "Amara Washington",
    role: "Community Organizer",
    username: "@amara_organize",
    body: "Voters in our district finally know who sponsored which bill and where funding actually flows.",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80",
    location: "Atlanta, GA",
  },
  {
    name: "Carlos Ray",
    role: "Policy Analyst",
    username: "@cray_policy",
    body: "CitizenShift bridges the civic knowledge divide better than any institutional dashboard I have used.",
    img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80",
    location: "Miami, FL",
  },
];

function CivicTestimonialCard({ img, name, username, body, location, role }: CivicTestimonial) {
  return (
    <Card className="w-[280px] shrink-0 border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-white/25">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 ring-1 ring-white/20">
            <AvatarImage src={img} alt={name} className="object-cover" loading="lazy" />
            <AvatarFallback className="bg-white/10 text-xs font-bold text-white">
              {name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <figcaption className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
              <span>{name}</span>
            </figcaption>
            <p className="text-[11px] font-mono uppercase tracking-wider text-white/50 truncate">
              {role} · {location}
            </p>
          </div>
        </div>
        <blockquote className="mt-3.5 text-xs leading-relaxed text-white/80 line-clamp-3">
          “{body}”
        </blockquote>
      </CardContent>
    </Card>
  );
}

export function Testimonials3D() {
  return (
    <div
      className="relative mx-auto flex h-[500px] w-full max-w-5xl flex-row items-center justify-center overflow-hidden [perspective:800px] select-none"
      style={{
        contain: "layout paint",
      }}
    >
      {/* 3D Tilted container — isolated with transform-gpu */}
      <div
        className="flex flex-row items-center gap-4 sm:gap-6 transform-gpu will-change-transform"
        style={{
          transform:
            "translateX(-30px) translateY(0px) translateZ(0px) rotateX(14deg) rotateY(-6deg) rotateZ(8deg)",
        }}
      >
        {/* Column 1: Downwards */}
        <Marquee vertical pauseOnHover repeat={2} className="[--duration:36s]">
          {CIVIC_TESTIMONIALS.map((review) => (
            <CivicTestimonialCard key={`col1-${review.username}`} {...review} />
          ))}
        </Marquee>

        {/* Column 2: Upwards (reverse) */}
        <Marquee vertical pauseOnHover reverse repeat={2} className="[--duration:42s]">
          {CIVIC_TESTIMONIALS.slice().reverse().map((review) => (
            <CivicTestimonialCard key={`col2-${review.username}`} {...review} />
          ))}
        </Marquee>

        {/* Column 3: Downwards */}
        <Marquee vertical pauseOnHover repeat={2} className="hidden sm:flex [--duration:38s]">
          {CIVIC_TESTIMONIALS.map((review) => (
            <CivicTestimonialCard key={`col3-${review.username}`} {...review} />
          ))}
        </Marquee>

        {/* Column 4: Upwards (reverse) */}
        <Marquee vertical pauseOnHover reverse repeat={2} className="hidden lg:flex [--duration:44s]">
          {CIVIC_TESTIMONIALS.slice().reverse().map((review) => (
            <CivicTestimonialCard key={`col4-${review.username}`} {...review} />
          ))}
        </Marquee>
      </div>

      {/* Seamless Edge Vignettes into Midnight Canvas */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#060913] via-[#060913]/85 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060913] via-[#060913]/85 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#060913] via-[#060913]/85 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#060913] via-[#060913]/85 to-transparent z-10" />
    </div>
  );
}

export default Testimonials3D;
