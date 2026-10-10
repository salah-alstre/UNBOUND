export type SkillGroupId = "frontend" | "backend" | "desktop" | "databases" | "uiux" | "tools";
export type ExplorerCategory = "desktop" | "fullstack" | "web" | "tools" | "experiments";

export interface ProjectShot {
  /** File name (without extension) in public/projects/<slug>/. Must exist in asset-meta.json. */
  name: string;
  alt: string;
  caption: string;
}

/** A decision or constraint, always backed by something the repository's README states. */
export interface ProjectDecision {
  title: string;
  body: string;
}

export interface Project {
  slug: string;
  /** Exact GitHub repository name. */
  repo: string;
  name: string;
  /** Mono metadata line, e.g. "Desktop · Windows". */
  kind: string;
  category: ExplorerCategory;
  year: string;
  status: string;
  tagline: string;
  summary: string;
  /** What I built — one sentence in first person, verifiable from the repository. */
  built?: string;
  /** README-based paragraphs. */
  story: string[];
  highlights: string[];
  /** Engineering decisions and constraints, each traceable to the README. */
  decisions?: ProjectDecision[];
  stack: string[];
  shots: ProjectShot[];
  live?: string;
  featured: boolean;
}

export interface ExperienceEntry {
  id: string;
  period: string;
  title: string;
  place: string;
  body: string;
  /** Marks the one entry whose details the owner still has to supply. */
  placeholder?: boolean;
  /** Kind of entry: drives the timeline styling. */
  kind: "start" | "personal" | "professional" | "milestone" | "now";
  /** Project slugs that evidence this entry. */
  proof?: string[];
}

export interface SkillGroup {
  id: SkillGroupId;
  label: string;
  statement: string;
  tools: string[];
  /** Project slugs that use these tools. */
  proof: string[];
}
