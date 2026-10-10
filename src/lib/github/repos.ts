import "server-only";
import { archiveOverrides } from "@/content/categories";
import { projectByRepo } from "@/content/projects";
import { site } from "@/content/site";
import fallback from "./fallback.json";
import { fetchAllRepos, fetchReadme } from "./client";
import { normalizeAll } from "./normalize";
import { pickReadmeImage } from "./readme-images";
import { GitHubError, type RawRepo, type RepoResult, type SourceRepo } from "./types";

interface Snapshot {
  fetchedAt: string;
  repos: SourceRepo[];
}

const CONCURRENCY = 6;

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i] as T);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Curated projects ship their own optimised screenshots; only the rest need README discovery. */
function needsReadmeImage(repo: RawRepo): boolean {
  if (projectByRepo(repo.name)) return false;
  if (archiveOverrides[repo.name]?.noPreview) return false;
  if (repo.name === site.github.owner) return false;
  return true;
}

async function loadLive(): Promise<SourceRepo[]> {
  const raws = await fetchAllRepos();
  if (raws.length === 0) throw new GitHubError("parse", "GitHub returned no public repositories");
  return mapPool(raws, CONCURRENCY, async (repo): Promise<SourceRepo> => {
    if (!needsReadmeImage(repo)) return { ...repo, readmeImage: null };
    const md = await fetchReadme(repo.name, repo.default_branch);
    return { ...repo, readmeImage: md ? pickReadmeImage(md, repo.name, repo.default_branch) : null };
  });
}

function describe(err: unknown): string {
  if (err instanceof GitHubError) {
    if (err.kind === "rate-limit") return "GitHub's rate limit was reached, so this is a saved snapshot.";
    if (err.kind === "network") return "GitHub could not be reached, so this is a saved snapshot.";
    return "GitHub returned an unexpected response, so this is a saved snapshot.";
  }
  return "GitHub data is temporarily unavailable, so this is a saved snapshot.";
}

/**
 * Live repositories when GitHub answers; otherwise the committed snapshot.
 * Never throws — the page must render either way.
 */
export async function getRepos(): Promise<RepoResult> {
  try {
    const items = await loadLive();
    return { repos: normalizeAll(items), source: "live", fetchedAt: new Date().toISOString(), notice: null };
  } catch (err) {
    const snap = fallback as unknown as Snapshot;
    return {
      repos: normalizeAll(snap.repos),
      source: "fallback",
      fetchedAt: snap.fetchedAt,
      notice: describe(err),
    };
  }
}
