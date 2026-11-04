import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SVGFollower } from "@/components/ui/svg-follower";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const TAGLINE = "Understand legislation. Stay informed. Make your voice heard.";

export const metadata: Metadata = {
  metadataBase: new URL("https://citizenshift.us"),
  title: {
    default: "CitizenShift — Bringing Power to the People",
    template: "%s — CitizenShift",
  },
  description:
    "CitizenShift is a nonpartisan platform that makes legislation accessible, understandable, and actionable for every American. " +
    TAGLINE,
  keywords: [
    "civic engagement",
    "legislation",
    "bills",
    "congress",
    "nonpartisan",
    "participation",
    "democracy",
  ],
  openGraph: {
    type: "website",
    url: "https://citizenshift.us",
    siteName: "CitizenShift",
    title: "CitizenShift — Bringing Power to the People",
    description: TAGLINE,
    images: [{ url: "/photo/hero.jpg", width: 1920, height: 1080, alt: "The United States Capitol at dusk" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CitizenShift — Bringing Power to the People",
    description: TAGLINE,
    images: ["/photo/hero.jpg"],
  },
  icons: { icon: "/brand/logo.png", apple: "/brand/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#173b57",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: "CitizenShift",
  url: "https://citizenshift.us",
  email: "erin.chouinard@citizenshift.us",
  address: {
    "@type": "PostalAddress",
    addressLocality: "New York",
    addressRegion: "NY",
    addressCountry: "US",
  },
  sameAs: ["https://www.linkedin.com/company/citizenshift/"],
  description:
    "CitizenShift increases civic engagement by making legislation more accessible, understandable, and actionable for every American.",
  nonpartisan: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <SVGFollower
          colors={["#f43f5e", "#38bdf8", "#fbbf24", "#34d399", "#818cf8"]}
          removeDelay={350}
        />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
