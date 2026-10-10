import type { ExplorerCategory } from "./types";

export type ExplorerFilter = "all" | "featured" | ExplorerCategory;

export const explorerFilters: { id: ExplorerFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "featured", label: "Featured" },
  { id: "web", label: "Web" },
  { id: "desktop", label: "Desktop" },
  { id: "fullstack", label: "Full-Stack" },
  { id: "tools", label: "Utilities" },
  { id: "experiments", label: "Experiments" },
];

/**
 * Manual classification for archive repos that are not part of the curated
 * projects. Repos missing here are classified by `classifyRepo` in
 * src/lib/github/classify.ts, so new public repositories appear automatically.
 *
 * `tagline` is optional and only used when GitHub has no description.
 */
export const archiveOverrides: Record<
  string,
  { category: ExplorerCategory; tagline?: string; featured?: boolean; /** Skip README image discovery for this repo. */ noPreview?: boolean }
> = {
  "gta6-vice-city": { category: "experiments", tagline: "An unofficial fan-made web experience.", noPreview: true },
  NeuroMotion: { category: "experiments" },
  zoom_clone: { category: "fullstack" },
  gsap_cocktails: { category: "experiments" },
  "ai-image-generator": { category: "tools" },
  "Contact-Form": { category: "web" },
  "Devr-Profile": { category: "web" },
  CertifyMe: { category: "web" },
  "BillingZone-main": { category: "tools" },
  "E-Drive-Showcase": { category: "web" },
  "Image-Search-Engine": { category: "tools" },
  salahcv: { category: "web" },
  Apple: { category: "web" },
  "BMW-Elegance": { category: "web" },
  "Dev-profile": { category: "web" },
  "ev-bmw": { category: "web" },
  "netflix-": { category: "web", noPreview: true },
  salahAppServer: { category: "experiments" },
  AwesomeProject: { category: "experiments" },
};

/** Language names whose presence hints at a desktop application. */
export const desktopLanguages = ["Rust", "C#", "C++", "C", "Go", "Kotlin", "Swift"];
