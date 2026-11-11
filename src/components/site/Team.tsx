"use client";

import TeamLanyardRail, { LanyardMember } from "@/components/ui/team-lanyard-rail";

const TEAM_MEMBERS: LanyardMember[] = [
  {
    id: "erin-chouinard",
    name: "Erin Chouinard",
    role: "Executive Director",
    team: "FOUNDER, EXECUTIVE DIRECTOR",
    tone: 0, // Crimson Berry
    image: "/team/erin-chouinard.jpg",
    bio: "Erin has worked in advocacy in local communities over the last 8 years. She brought this work to her college campus and founded an organization teaching students how to advocate on and interact with legislation. Erin has experience creating organizations from the ground up, recruiting and leading teams, and creating change.",
    socials: {
      instagram: "https://instagram.com/citizenshift",
      twitter: "https://x.com/citizenshift",
      linkedin: "https://www.linkedin.com/company/citizenshift/posts/?feedView=all",
    },
  },
  {
    id: "sav-perera",
    name: "Sav Perera",
    role: "Director of Technology",
    team: "DIRECTOR OF TECHNOLOGY",
    tone: 1, // Royal Blue
    image: "/team/sav-perera.jpg",
    bio: "Sav is a software engineer and is pursuing his master's degree in ML specialization at the Georgia Institute of Technology. He has had experience developing frontend solutions across multiple organizations, working with React, TypeScript, Python, C++, and Java to build and improve web applications. His work has spanned performance optimization, feature development, and UI enhancements across a variety of projects.",
    socials: {
      instagram: "https://instagram.com/citizenshift",
      twitter: "https://x.com/citizenshift",
      linkedin: "https://www.linkedin.com/company/citizenshift/posts/?feedView=all",
    },
  },
  {
    id: "ariana-warden",
    name: "Ariana Warden",
    role: "Director of Finance",
    team: "DIRECTOR OF FINANCE",
    tone: 2, // Emerald Mint
    image: "/team/ariana-warden.jpg",
    bio: "Ariana is a financial analyst who has worked in Equities Research for three years. She has also worked at various startups in Business Development and Operations Strategy roles. Ariana graduated from Cornell University with a degree in Operations Research and Information Engineering.",
    socials: {
      instagram: "https://instagram.com/citizenshift",
      twitter: "https://x.com/citizenshift",
      linkedin: "https://www.linkedin.com/company/citizenshift/posts/?feedView=all",
    },
  },
  {
    id: "james-douglas",
    name: "Governor Jim Douglas",
    role: "Advisory Director",
    team: "ADVISORY DIRECTOR",
    tone: 3, // Amber Gold
    image: "/team/james-douglas.jpg",
    bio: "James Douglas, Advisory Board Member, was the 80th governor of Vermont from 2003 to 2011 and serves as a political expert on the board.",
    socials: {
      instagram: "https://instagram.com/citizenshift",
      twitter: "https://x.com/citizenshift",
      linkedin: "https://www.linkedin.com/company/citizenshift/posts/?feedView=all",
    },
  },
];

export default function Team() {
  return (
    <div id="team" className="scroll-mt-24">
      <TeamLanyardRail
        members={TEAM_MEMBERS}
        subtitle="MEET THE TEAM · FOUR LEADERS"
        title="A team wall you can flip through, right on the page."
      />
    </div>
  );
}
