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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "https://citizenshift-rebuild.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
    siteName: "CitizenShift",
    title: "CitizenShift — Bringing Power to the People",
    description: TAGLINE,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CitizenShift — Bringing Power to the People",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CitizenShift — Bringing Power to the People",
    description: TAGLINE,
    images: ["/og-image.jpg"],
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
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body suppressHydrationWarning>
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
