import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { hero, site } from "@/content/site";
import { MotionRoot } from "@/components/motion/MotionRoot";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  axes: ["opsz", "wdth"],
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", display: "swap" });

const title = `${site.name} — ${hero.title}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.links.github }],
  creator: site.name,
  keywords: [
    "Salah",
    "Salah portfolio",
    "developer portfolio",
    "software developer",
    "full-stack developer",
    "Rust",
    "Tauri",
    "React",
    "Next.js",
    "TypeScript",
    "Windows desktop applications",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: `${site.name} — Portfolio`,
    title,
    description: site.description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title, description: site.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
      jobTitle: hero.title,
      email: `mailto:${site.links.email}`,
      sameAs: [site.links.github, site.links.linkedin, site.links.instagram],
      knowsAbout: ["Rust", "Tauri", "React", "Next.js", "TypeScript", "Windows desktop applications"],
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: `${site.name} — Portfolio`,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": `${site.url}/#person` },
    },
  ],
};

/** Runs before first paint so hidden-until-animated states never flash for reduced-motion visitors. */
const motionFlag = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion-ok')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={site.locale}
      className={`${bricolage.variable} ${instrument.variable} ${geistMono.variable} ${notoArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
      </head>
      <body>
        <a
          href="#main"
          className="mono fixed left-4 top-4 z-[100] -translate-y-24 bg-signal px-3 py-2 text-ink focus:translate-y-0"
        >
          Skip to content
        </a>
        <MotionRoot />
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
