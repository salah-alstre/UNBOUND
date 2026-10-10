import type { ExperienceEntry } from "./types";

/**
 * Timeline, oldest first.
 *
 * TO EDIT: the professional entry (`id: "company"`) is waiting for real
 * details. Replace `period` and `place`, extend `body`, and delete the
 * `placeholder: true` line — the bracketed markers disappear from the page.
 *
 * Milestone periods come from the creation dates of the public repositories;
 * "2022" is the year I started writing code.
 */
export const experience: ExperienceEntry[] = [
  {
    id: "start",
    kind: "start",
    period: "2022",
    title: "First lines of code",
    place: "Self-taught",
    body: "Started building for the web: pages, small apps and a lot of experiments with motion.",
  },
  {
    id: "web-portfolio",
    kind: "personal",
    period: "2023 – 2025",
    title: "Websites and front-end builds",
    place: "Public repositories",
    body: "Landing pages, interface components, a streaming-style trailer hub, an AI image generator, a Zoom-style video app and a GSAP cocktail site. The earliest public repository dates from May 2023.",
    proof: ["ram-power"],
  },
  {
    id: "company",
    kind: "professional",
    period: "[ Dates to be added ]",
    title: "Developer — 6 months of professional experience",
    place: "[ Company name to be added ]",
    body: "Six months working inside a company on real products with a team. Role details, stack and responsibilities are to be added.",
    placeholder: true,
  },
  {
    id: "realtime",
    kind: "milestone",
    period: "2026",
    title: "Real-time and full-stack",
    place: "Tahadi · BuildX · StockFlow",
    body: "A server-authoritative multiplayer games platform, a guided PC-builder storefront and an offline inventory and point-of-sale app.",
    proof: ["tahadi", "buildx", "stockflow"],
  },
  {
    id: "desktop",
    kind: "milestone",
    period: "Sep – Oct 2026",
    title: "Desktop software in Rust and Tauri",
    place: "Windows applications",
    body: "A run of Windows applications where Rust owns the machine-facing work and React owns the interface. Offline-first, bilingual, documented honestly.",
    proof: ["windows", "remotex", "rimlight", "snapvault", "auralis", "folderforge", "veilock", "namaa"],
  },
  {
    id: "now",
    kind: "now",
    period: "Now",
    title: "Building in public",
    place: "github.com/salah-alstre",
    body: "New repositories land in the archive the moment they are public.",
  },
];
