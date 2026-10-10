import { archiveOverrides, desktopLanguages } from "@/content/categories";
import { projectByRepo } from "@/content/projects";
import type { ExplorerCategory } from "@/content/types";
import type { RawRepo } from "./types";

const DESKTOP_TOPICS = ["tauri", "electron", "desktop", "desktop-app", "windows", "wpf", "winui"];
const BACKEND_TOPICS = ["socket-io", "websocket", "express", "nodejs", "api", "backend", "discord-bot"];
const TOOL_TOPICS = ["cli", "tool", "tools", "utility", "generator"];
const EXPERIMENT_RE = /(clone|experiment|playground|sandbox|test|demo|neuro|fan)/i;

/**
 * Category for a repository: curated project > archive override > heuristics.
 * The heuristics are what let a brand-new public repo land somewhere sensible
 * without anyone editing a file.
 */
export function classifyRepo(repo: RawRepo): ExplorerCategory {
  const curated = projectByRepo(repo.name);
  if (curated) return curated.category;

  const override = archiveOverrides[repo.name];
  if (override) return override.category;

  const topics = (repo.topics ?? []).map((t) => t.toLowerCase());
  const has = (list: string[]) => list.some((t) => topics.includes(t));

  if (has(DESKTOP_TOPICS) || (repo.language && desktopLanguages.includes(repo.language))) return "desktop";
  if (has(BACKEND_TOPICS) && repo.homepage) return "fullstack";
  if (has(TOOL_TOPICS)) return "tools";
  if (EXPERIMENT_RE.test(repo.name)) return "experiments";
  return "web";
}
