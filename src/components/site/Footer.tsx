import Image from "next/image";
import Link from "next/link";

const EMAIL = "erin.chouinard@citizenshift.us";
const LINKEDIN = "https://www.linkedin.com/company/citizenshift/posts/?feedView=all";
const DONATE = "https://secure.actblue.com/donate/citizenshift-1";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Navigate",
    links: [
      { label: "Home", href: "#home" },
      { label: "Explore Legislation", href: "#legislation" },
      { label: "Stories & Testimonials", href: "/testimonials" },
      { label: "About", href: "#about" },
      { label: "The Team", href: "#team" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Donate", href: DONATE, external: true },
      { label: "Join the Movement", href: "#home" },
      { label: "Explore Legislation", href: "#legislation" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#contact" },
      { label: "Terms of Use", href: "#contact" },
      { label: "Declaration of Nonpartisanship", href: "#about" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t hairline-light bg-navy-900 text-paper">
      <div className="grain pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="shell relative py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          {/* brand + mission */}
          <div className="md:col-span-6">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="CitizenShift" width={44} height={44} className="size-11 rounded-full ring-1 ring-paper/20" />
              <div>
                <p className="font-display text-xl font-semibold">CitizenShift</p>
                <p className="eyebrow mt-0.5 text-berry">Bringing power to the people</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-icy/70">
              CitizenShift increases civic engagement by making legislation more
              accessible, understandable, and actionable for every American. We do not
              support or oppose candidates for public office, and we take no stand for
              or against any political party.
            </p>
            <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm" aria-label="Footer primary">
              <Link href="#home" className="u-link text-icy/80 hover:text-paper">Home</Link>
              <Link href="#legislation" className="u-link text-icy/80 hover:text-paper">Explore Legislation</Link>
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="u-link text-icy/80 hover:text-paper">LinkedIn</a>
              <a href={`mailto:${EMAIL}`} className="u-link break-all text-icy/80 hover:text-paper">erin.chouinard@citizenshift.us</a>
            </nav>
          </div>

          {/* link columns */}
          <div className="grid gap-8 sm:grid-cols-3 md:col-span-6">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="eyebrow text-icy/40">{col.title}</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((link) => (
                    <li key={link.label + link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="u-link text-icy/75 hover:text-paper"
                        >
                          {link.label} ↗
                        </a>
                      ) : (
                        <Link href={link.href} className="u-link text-icy/75 hover:text-paper">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t hairline-light pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-icy/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} CitizenShift — New York, NY</span>
          <span className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-berry" aria-hidden="true" />
            Nonpartisan · Accessible · Free
          </span>
        </div>
      </div>
    </footer>
  );
}
