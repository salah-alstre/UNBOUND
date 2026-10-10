import type { ExplorerCategory } from "@/content/types";

/** The subset of the GitHub REST `repos` payload this site reads. */
export interface RawRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  private?: boolean;
  archived: boolean;
  language: string | null;
  topics?: string[];
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  license: { spdx_id: string | null; name: string } | null;
}

/** A repository as stored in the snapshot / passed through the loader. */
export interface SourceRepo extends RawRepo {
  /** Absolute raw.githubusercontent.com URL of the first usable README image, if any. */
  readmeImage: string | null;
}

export interface RepoPreview {
  src: string;
  /** Intrinsic size when known (curated local assets). */
  width?: number;
  height?: number;
  /** Local, optimised copy shipped in /public (true) or a remote raw GitHub URL (false). */
  local: boolean;
  alt: string;
}

/** The normalised repository model the UI consumes. */
export interface Repo {
  id: number;
  name: string;
  /** Display name — curated name when available, otherwise the repo name. */
  title: string;
  url: string;
  live: string | null;
  description: string;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  license: string | null;
  archived: boolean;
  category: ExplorerCategory;
  featured: boolean;
  /** Slug of the curated project this repo belongs to. */
  curated: string | null;
  preview: RepoPreview | null;
}

export type RepoSource = "live" | "fallback";

export interface RepoResult {
  repos: Repo[];
  source: RepoSource;
  /** ISO timestamp of when the data was produced. */
  fetchedAt: string;
  /** Human-readable reason when the fallback snapshot was used. */
  notice: string | null;
}

export type GitHubErrorKind = "rate-limit" | "network" | "http" | "parse";

export class GitHubError extends Error {
  constructor(
    readonly kind: GitHubErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}
