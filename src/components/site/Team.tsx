import Image from "next/image";

/**
 * Team — verified roster and biographies recovered from the existing site.
 * Photographs recovered from the client's published pages. Nothing invented.
 */
const TEAM = [
  {
    name: "Erin Chouinard",
    role: "Founder, Executive Director",
    bio: "Erin has worked in advocacy in local communities over the last 8 years. She brought this work to her college campus and founded an organization teaching students how to advocate on and interact with legislation. Erin has experience creating organizations from the ground up, recruiting and leading teams, and creating change.",
    photo: "/team/erin-chouinard.jpg",
  },
  {
    name: "Sav Perera",
    role: "Director of Technology",
    bio: "Sav is a software engineer and is pursuing his master's degree in ML specialization at the Georgia Institute of Technology. He has had experience developing frontend solutions across multiple organizations, working with React, TypeScript, Python, C++, and Java to build and improve web applications. His work has spanned performance optimization, feature development, and UI enhancements across a variety of projects.",
    photo: "/team/sav-perera.jpg",
  },
  {
    name: "Ariana Warden",
    role: "Director of Finance",
    bio: "Ariana is a financial analyst who has worked in Equities Research for three years. She has also worked at various startups in Business Development and Operations Strategy roles. Ariana graduated from Cornell University with a degree in Operations Research and Information Engineering.",
    photo: "/team/ariana-warden.jpg",
  },
  {
    name: "Governor Jim Douglas",
    role: "Advisory Director",
    bio: "James Douglas, Advisory Board Member, was the 80th governor of Vermont from 2003 to 2011 and serves as a political expert on the board.",
    photo: "/team/james-douglas.jpg",
  },
];

export default function Team() {
  return (
    <section id="team" className="relative bg-paper" aria-labelledby="team-heading">
      <div className="shell py-20 sm:py-28">
        <div className="flex flex-col gap-6 border-b hairline pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-berry">The Team</p>
            <h2 id="team-heading" className="mt-3 font-display text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-navy">
              Citizens, close to the work.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-navy/65">
            An advocates' project turned civic platform — built by people who have
            been teaching Americans to speak to their government for years.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden border hairline bg-icy/10 sm:grid-cols-2 xl:grid-cols-4">
          {TEAM.map((member, i) => (
            <article
              key={member.name}
              data-reveal
              style={{ "--reveal-delay": i } as React.CSSProperties}
              className="group relative bg-paper"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={member.photo}
                  alt={`Portrait of ${member.name}`}
                  fill
                  sizes="(min-width: 1240px) 300px, (min-width: 640px) 45vw, 90vw"
                  className="object-cover grayscale transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-900/55 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
              <div className="border-t hairline p-5 sm:p-6">
                <h3 className="font-display text-xl font-semibold leading-tight text-navy">
                  {member.name}
                </h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-berry">
                  {member.role}
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-navy/70">{member.bio}</p>
              </div>
              <span className="absolute right-4 top-4 border hairline-light bg-paper/85 px-2 py-1 font-mono text-[9px] tracking-[0.18em] text-navy/50 backdrop-blur-sm">
                0{i + 1}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
