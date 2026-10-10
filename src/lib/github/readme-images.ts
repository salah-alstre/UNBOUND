import { site } from "@/content/site";

const RAW_HOST = "raw.githubusercontent.com";

/** Hosts / patterns that are never a real product screenshot. */
const REJECT = [
  /shields\.io/i,
  /badge/i,
  /\.svg(\?|$)/i,
  /logo/i,
  /favicon/i,
  /icon/i,
  /github\.com\/[^/]+\/[^/]+\/(actions|workflows)\//i,
  /avatars\.githubusercontent/i,
  /claude/i,
  /terminal/i,
];

interface Found {
  url: string;
  alt: string;
}

function extract(markdown: string): Found[] {
  const found: Found[] = [];
  // Markdown images: ![alt](url "title")
  for (const m of markdown.matchAll(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    if (m[2]) found.push({ url: m[2], alt: m[1] ?? "" });
  }
  // HTML images: <img ... src="url" ... alt="...">
  for (const m of markdown.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const alt = /\balt\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1] ?? "";
    if (src) found.push({ url: src, alt });
  }
  return found;
}

/**
 * Resolves README image references to an absolute raw.githubusercontent.com URL.
 * Handles relative paths (`docs/a.png`, `./a.png`, `/a.png`) and
 * `github.com/<owner>/<repo>/blob/<branch>/<path>?raw=true` links.
 * Anything hosted elsewhere is dropped because next/image only allows the raw host.
 */
export function resolveImageUrl(ref: string, repo: string, branch: string): string | null {
  const cleaned = ref.trim().replace(/#.*$/, "").replace(/\?raw=true$/i, "");
  const base = `https://${RAW_HOST}/${site.github.owner}/${repo}/${branch}/`;

  let url: URL;
  try {
    if (/^https?:\/\//i.test(cleaned)) {
      url = new URL(cleaned);
    } else if (cleaned.startsWith("//")) {
      url = new URL(`https:${cleaned}`);
    } else {
      url = new URL(cleaned.replace(/^\.?\//, ""), base);
    }
  } catch {
    return null;
  }

  if (url.hostname === "github.com") {
    const m = new RegExp(`^/${site.github.owner}/([^/]+)/(?:blob|raw)/([^/]+)/(.+)$`, "i").exec(url.pathname);
    if (!m?.[1] || !m[2] || !m[3]) return null;
    return `https://${RAW_HOST}/${site.github.owner}/${m[1]}/${m[2]}/${m[3]}`;
  }
  if (url.hostname === RAW_HOST && url.pathname.toLowerCase().startsWith(`/${site.github.owner}/`)) {
    return `https://${RAW_HOST}${url.pathname}`;
  }
  return null;
}

/** First README image that looks like a genuine screenshot and resolves to the raw host. */
export function pickReadmeImage(markdown: string, repo: string, branch: string): string | null {
  for (const { url, alt } of extract(markdown)) {
    if (REJECT.some((re) => re.test(url) || re.test(alt))) continue;
    if (!/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url)) continue;
    const resolved = resolveImageUrl(url, repo, branch);
    if (resolved) return resolved;
  }
  return null;
}
