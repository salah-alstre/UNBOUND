import assetMeta from "@/content/asset-meta.json";
import type { Project } from "@/content/types";

type AssetMeta = Record<string, Record<string, { w: number; h: number; src: string }>>;
const assets = assetMeta as AssetMeta;

export interface Shot {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

/** Optimised local screenshots of a curated project; shots missing from the manifest are skipped. */
export function getShots(project: Project): Shot[] {
  const out: Shot[] = [];
  for (const s of project.shots) {
    const dims = assets[project.slug]?.[s.name];
    if (!dims) continue;
    out.push({
      src: `/projects/${project.slug}/${s.name}.webp`,
      width: dims.w,
      height: dims.h,
      alt: s.alt,
      caption: s.caption,
    });
  }
  return out;
}
