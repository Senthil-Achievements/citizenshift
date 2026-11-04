"use client";

import InfiniteGallery from "@/components/ui/3d-gallery-photography";

export const CIVIC_GALLERY_IMAGES = [
  {
    src: "/photo/dome.jpg",
    alt: "United States Capitol Dome and Congressional Halls",
  },
  {
    src: "/photo/hearing.jpg",
    alt: "Senate Committee Public Legislative Hearing",
  },
  {
    src: "/photo/townhall.jpg",
    alt: "Grassroots Townhall Civic Assembly",
  },
  {
    src: "/photo/crowd.jpg",
    alt: "Civic Coalition Advocacy and Representation",
  },
  {
    src: "/photo/hero.jpg",
    alt: "Capitol Rotunda Architecture and Public Record",
  },
  {
    src: "/images/auth/auth-visual.png",
    alt: "Evening Washington DC Capitol Complex",
  },
  {
    src: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    alt: "Supreme Court Architecture and Equal Justice",
  },
  {
    src: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80",
    alt: "Constituent Voting Ballot and Democracy in Action",
  },
  {
    src: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    alt: "Library of Congress Historic Legislative Records",
  },
  {
    src: "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?auto=format&fit=crop&w=1200&q=80",
    alt: "State Legislature Capitol Rotunda Assembly",
  },
];

export default function DemoOne() {
  return (
    <main className="min-h-screen h-full w-full bg-navy-950 text-paper">
      <InfiniteGallery
        images={CIVIC_GALLERY_IMAGES}
        speed={1.2}
        zSpacing={3}
        visibleCount={10}
        falloff={{ near: 0.8, far: 14 }}
        className="h-screen w-full rounded-lg overflow-hidden"
      />
      <div className="h-screen inset-0 pointer-events-none fixed flex items-center justify-center text-center px-3 mix-blend-exclusion text-white">
        <h1 className="font-display text-4xl md:text-7xl tracking-tight">
          <span className="italic">CitizenShift</span>
        </h1>
      </div>

      <div className="text-center fixed bottom-10 left-0 right-0 font-mono uppercase text-[11px] font-semibold text-icy/80">
        <p>Use mouse wheel, arrow keys, or touch to navigate</p>
        <p className="opacity-60">Auto-play resumes after 3 seconds of inactivity</p>
      </div>
    </main>
  );
}
