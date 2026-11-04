"use client";

import TeamLanyardRail, { LanyardMember } from "@/components/ui/team-lanyard-rail";

const TEAM_MEMBERS: LanyardMember[] = [
  {
    id: "ada",
    name: "Ada Lindqvist",
    role: "Head of Design",
    team: "ACME · DESIGN",
    tone: 0,
    image: "/team/erin-chouinard.jpg",
    bio: "Turns complex systems into clear, tactile interfaces. Obsessed with spring physics, accessible typography, and civic empowerment.",
    tags: ["Design Systems", "Civics", "UI"],
    idNumber: "276333587",
    links: [
      { label: "Twitter", href: "https://twitter.com" },
      { label: "Dribbble", href: "https://dribbble.com" },
    ],
  },
  {
    id: "ravi",
    name: "Ravi Menon",
    role: "Engineering Lead",
    team: "ACME · PLATFORM",
    tone: 1,
    image: "/team/sav-perera.jpg",
    bio: "Keeps the build green and the on-call quiet. Happiest deleting old code.",
    tags: ["Platform", "Rust", "Since 2020"],
    idNumber: "848381083",
    links: [
      { label: "Email", href: "mailto:ravi@citizenshift.us" },
      { label: "Calendar", href: "https://calendar.google.com" },
    ],
  },
  {
    id: "imani",
    name: "Imani Okafor",
    role: "Product Manager",
    team: "ACME · PRODUCT",
    tone: 2,
    image: "/team/ariana-warden.jpg",
    bio: "Connects constituents with live legislative records. Former Capitol fellow focused on transparent, nonpartisan civic advocacy tools.",
    tags: ["Legislation", "Product", "Strategy"],
    idNumber: "848381083",
    links: [
      { label: "LinkedIn", href: "https://linkedin.com" },
      { label: "Email", href: "mailto:imani@citizenshift.us" },
    ],
  },
  {
    id: "kenji",
    name: "Kenji Arata",
    role: "iOS Engineer",
    team: "ACME · MOBILE",
    tone: 3,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    bio: "Architect of the one-tap advocacy pipeline. Crafts swift, accessible mobile tools for everyday American citizens.",
    tags: ["iOS", "Swift", "APIs"],
    idNumber: "717619636",
    links: [
      { label: "GitHub", href: "https://github.com" },
      { label: "Twitter", href: "https://twitter.com" },
    ],
  },
  {
    id: "lucia",
    name: "Lucia Ferreira",
    role: "People & Culture",
    team: "ACME · PEOPLE",
    tone: 4,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    bio: "Empowers a distributed network of civic educators, union organizers, and grassroots community fellows across all 50 states.",
    tags: ["Community", "Culture", "Advocacy"],
    idNumber: "139811973",
    links: [
      { label: "LinkedIn", href: "https://linkedin.com" },
      { label: "Email", href: "mailto:lucia@citizenshift.us" },
    ],
  },
  {
    id: "mateo",
    name: "Mateo Ruiz",
    role: "Backend Engineer",
    team: "ACME · PLATFORM",
    tone: 5,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    bio: "Real-time sync pipelines connecting Congress.gov and all 50 state legislative record repositories with zero editorial bias.",
    tags: ["LegisCan", "PostgreSQL", "Go"],
    idNumber: "180448397",
    links: [
      { label: "GitHub", href: "https://github.com" },
      { label: "Email", href: "mailto:mateo@citizenshift.us" },
    ],
  },
  {
    id: "mila",
    name: "Mila Novak",
    role: "Brand Designer",
    team: "ACME · DESIGN",
    tone: 6,
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    bio: "Translates complex constitutional and statutory language into clean editorial visual systems and open public records.",
    tags: ["Editorial", "Typography", "Civic"],
    idNumber: "087977698",
    links: [
      { label: "Dribbble", href: "https://dribbble.com" },
      { label: "Twitter", href: "https://twitter.com" },
    ],
  },
  {
    id: "noah",
    name: "Noah Mensah",
    role: "Customer Success",
    team: "ACME · SUPPORT",
    tone: 7,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    bio: "Guides 800+ municipal workers and citizen researchers through real-time committee markup, floor voting, and sponsor records.",
    tags: ["Constituents", "Support", "Civics"],
    idNumber: "038953879",
    links: [
      { label: "Email", href: "mailto:noah@citizenshift.us" },
      { label: "Calendar", href: "https://calendar.google.com" },
    ],
  },
];

export default function Team() {
  return (
    <section id="team" className="relative" aria-label="Meet The Team">
      <TeamLanyardRail
        members={TEAM_MEMBERS}
        subtitle="MEET THE TEAM · EIGHT PEOPLE"
        title="A team wall you can flip through, right on the page."
      />
    </section>
  );
}
