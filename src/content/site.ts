/**
 * Central identity + copy. Everything personal lives here, so the site can be
 * edited without touching a component.
 */
export const site = {
  name: "Salah",
  handle: "salah-alstre",
  brand: "SALAH / UNBOUND",
  tagline: "Beyond Code. Built to Stand Out.",
  role: "Full-Stack / Web / Software Developer",
  description:
    "Salah builds desktop applications in Rust and Tauri and web applications in React and Next.js — offline-first where it matters, bilingual where it counts.",
  /** Canonical origin. Set NEXT_PUBLIC_SITE_URL in production. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  locale: "en",
  startedYear: 2022,
  links: {
    github: "https://github.com/salah-alstre",
    linkedin: "https://www.linkedin.com/in/salah-alden-8aba5a322/",
    instagram: "https://instagram.com/error_dev1/",
    email: "error.salah59@gmail.com",
    previousPortfolio: "https://devr-profile.vercel.app/",
  },
  github: {
    owner: "salah-alstre",
    /** The profile repository carries the README only; it is hidden from the archive. */
    hiddenRepos: ["salah-alstre"],
  },
} as const;

/**
 * Single-page sections, in page order. `id` is the element id; `label` is what
 * the navigation shows; `title` is the full section name (palette, footer).
 */
export const nav = [
  { id: "top", label: "Home", title: "Home", index: "00" },
  { id: "about", label: "About", title: "About", index: "01" },
  { id: "work", label: "Featured", title: "Featured Projects", index: "02" },
  { id: "archive", label: "All Projects", title: "All Projects", index: "03" },
  { id: "experience", label: "Experience", title: "Experience", index: "04" },
  { id: "skills", label: "Skills", title: "Skills", index: "05" },
  { id: "contact", label: "Contact", title: "Contact", index: "06" },
] as const;

export type SectionId = (typeof nav)[number]["id"];

export const hero = {
  greeting: "Hi, I'm",
  roles: ["Full-Stack", "Desktop", "Web"] as const,
  /** Shown under the name; the line the visitor reads first after "Salah". */
  title: "Full-Stack & Software Developer",
  /** Supporting line — the old headline, kept as a voice rather than the identity. */
  support: "I build beyond the browser.",
  intro:
    "I've been writing code since 2022 and spent six months working inside a company. These days I ship Windows desktop applications in Rust and Tauri and web applications in React and Next.js — offline-first where it matters, bilingual where it counts.",
  primary: { label: "Explore Projects", href: "#work" },
  secondary: { label: "Contact Me", href: "#contact" },
  facts: [
    { k: "Coding since", v: "2022" },
    { k: "In a company", v: "6 months" },
    { k: "Languages", v: "English · العربية" },
  ],
};

export const about = {
  eyebrow: "About me",
  heading: "I'm Salah — I build software that stays out of your way.",
  paragraphs: [
    "I started writing code in 2022. The first years were websites — landing pages, small apps, a lot of animation — and they taught me how interfaces behave before anyone has clicked anything.",
    "Along the way I spent six months working professionally inside a company, as part of a team rather than on my own.",
    "Over time the questions got heavier. What happens when the network is gone? Where does the data live? What should the program never do without asking? That pulled me toward full-stack and Windows desktop software, where Rust owns the machine-facing work and a React interface sits on top of it.",
    "Most of what I ship now is local-first: no account to create, no telemetry, files that stay on the computer they belong to. Several of the apps are fully bilingual, with real right-to-left layouts rather than a mirrored afterthought.",
  ],
  approach: [
    { k: "Local-first", v: "Data stays on the machine it belongs to unless the user chooses otherwise." },
    { k: "Honest READMEs", v: "If something is unsigned, unaudited or partly built, the repository says so." },
    { k: "Both directions", v: "English and Arabic are designed together, right-to-left included." },
  ],
  facts: [
    { k: "Writing code since", v: "2022" },
    { k: "Professional role", v: "6 months, in a company" },
    { k: "Languages", v: "English · العربية" },
    { k: "Interests", v: "Full-stack · Desktop" },
  ],
};

export const contact = {
  eyebrow: "Contact",
  heading: "Let's talk.",
  body: "If you have a product that needs a careful desktop build, a sharp web front end, or both, write to me. A short note about what you are making is the best start. I read every message myself.",
  subject: "Hello from your portfolio",
};
