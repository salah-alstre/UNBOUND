import assetMeta from "@/content/asset-meta.json";
import { archiveOverrides } from "@/content/categories";
import { projectByRepo } from "@/content/projects";
import { site } from "@/content/site";
import { classifyRepo } from "./classify";
import type { Repo, RepoPreview, SourceRepo } from "./types";

type AssetMeta = Record<string, Record<string, { w: number; h: number; src: string }>>;
const assets = assetMeta as AssetMeta;

/** Local optimised screenshot of a curated project, if the manifest shipped one. */
export function localPreview(slug: string, shotName: string, alt: string): RepoPreview | null {
  const dims = assets[slug]?.[shotName];
  if (!dims) return null;
  return {
    src: `/projects/${slug}/${shotName}.webp`,
    width: dims.w,
    height: dims.h,
    local: true,
    alt,
  };
}

export function normalizeRepo(raw: SourceRepo): Repo {
  const curated = projectByRepo(raw.name);
  const override = archiveOverrides[raw.name];

  let preview: RepoPreview | null = null;
  if (curated) {
    for (const shot of curated.shots) {
      preview = localPreview(curated.slug, shot.name, shot.alt);
      if (preview) break;
    }
  }
  if (!preview && raw.readmeImage) {
    preview = { src: raw.readmeImage, local: false, alt: `${raw.name} — screenshot from the repository README` };
  }

  const homepage = curated?.live ?? (raw.homepage && /^https?:\/\//i.test(raw.homepage) ? raw.homepage : null);

  return {
    id: raw.id,
    name: raw.name,
    title: curated?.name ?? raw.name,
    url: raw.html_url,
    live: homepage,
    // Curated copy wins; then GitHub's own description; then an optional archive tagline.
    description: curated?.tagline ?? raw.description?.trim() ?? override?.tagline ?? "",
    language: raw.language,
    topics: raw.topics ?? [],
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    pushedAt: raw.pushed_at,
    license: raw.license?.spdx_id && raw.license.spdx_id !== "NOASSERTION" ? raw.license.spdx_id : null,
    archived: raw.archived,
    category: classifyRepo(raw),
    featured: curated?.featured ?? override?.featured ?? false,
    curated: curated?.slug ?? null,
    preview,
  };
}

export function normalizeAll(items: SourceRepo[]): Repo[] {
  const hidden = new Set<string>(site.github.hiddenRepos);
  return items
    .filter((r) => !r.private && !r.fork && !hidden.has(r.name))
    .map(normalizeRepo)
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
}
