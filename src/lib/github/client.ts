import { site } from "@/content/site";
import { GitHubError, type RawRepo } from "./types";

const API = "https://api.github.com";
const REVALIDATE_SECONDS = 60 * 60; // ISR window for all GitHub traffic
const MAX_PAGES = 10; // 1,000 repositories is far beyond a personal account

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "salah-unbound-portfolio",
  };
  // Server-only. Never prefixed with NEXT_PUBLIC_, so it cannot reach the client bundle.
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function nextLink(link: string | null): string | null {
  if (!link) return null;
  for (const part of link.split(",")) {
    const m = /<([^>]+)>;\s*rel="next"/.exec(part);
    if (m?.[1]) return m[1];
  }
  return null;
}

async function request(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: headers(),
      next: { revalidate: REVALIDATE_SECONDS, tags: ["github"] },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (err) {
    throw new GitHubError("network", err instanceof Error ? err.message : "Network request failed");
  }

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0" || res.status === 429) {
      throw new GitHubError("rate-limit", "GitHub API rate limit reached", res.status);
    }
  }
  if (!res.ok) {
    throw new GitHubError("http", `GitHub responded with ${res.status}`, res.status);
  }
  return res;
}

/** Fetches every public repository of the configured owner, following pagination. */
export async function fetchAllRepos(): Promise<RawRepo[]> {
  const all: RawRepo[] = [];
  let url: string | null = `${API}/users/${site.github.owner}/repos?per_page=100&type=owner&sort=pushed`;

  for (let page = 0; url && page < MAX_PAGES; page++) {
    const res: Response = await request(url);
    let batch: unknown;
    try {
      batch = await res.json();
    } catch {
      throw new GitHubError("parse", "GitHub returned a response that is not valid JSON");
    }
    if (!Array.isArray(batch)) throw new GitHubError("parse", "Unexpected GitHub payload shape");
    for (const item of batch) {
      if (isRawRepo(item)) all.push(item);
    }
    url = nextLink(res.headers.get("link"));
  }
  return all;
}

function isRawRepo(v: unknown): v is RawRepo {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "number" &&
    typeof r.name === "string" &&
    typeof r.html_url === "string" &&
    typeof r.created_at === "string" &&
    typeof r.default_branch === "string"
  );
}

/** README text from raw.githubusercontent.com — does not count against the REST quota. */
export async function fetchReadme(repo: string, branch: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${site.github.owner}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/README.md`;
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["github"] },
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}
