// Regenerates src/lib/github/fallback.json — the snapshot the site serves when
// GitHub is unreachable or rate-limited. Run: npm run snapshot
// Optional: GITHUB_TOKEN in the environment for a higher rate limit.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "salah-alstre";
const RAW = "raw.githubusercontent.com";

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "salah-unbound-snapshot",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

const KEEP = [
  "id", "name", "html_url", "description", "fork", "private", "archived", "language", "topics",
  "homepage", "stargazers_count", "forks_count", "created_at", "updated_at", "pushed_at",
  "default_branch", "license",
];

// Mirrors src/lib/github/readme-images.ts
const REJECT = [/shields\.io/i, /badge/i, /\.svg(\?|$)/i, /logo/i, /favicon/i, /icon/i,
  /github\.com\/[^/]+\/[^/]+\/(actions|workflows)\//i, /avatars\.githubusercontent/i, /claude/i, /terminal/i];

function extract(md) {
  const out = [];
  for (const m of md.matchAll(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) if (m[2]) out.push({ url: m[2], alt: m[1] ?? "" });
  for (const m of md.matchAll(/<img\b[^>]*>/gi)) {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(m[0])?.[1];
    const alt = /\balt\s*=\s*["']([^"']*)["']/i.exec(m[0])?.[1] ?? "";
    if (src) out.push({ url: src, alt });
  }
  return out;
}

function resolve(ref, repo, branch) {
  const cleaned = ref.trim().replace(/#.*$/, "").replace(/\?raw=true$/i, "");
  const base = `https://${RAW}/${OWNER}/${repo}/${branch}/`;
  let url;
  try {
    if (/^https?:\/\//i.test(cleaned)) url = new URL(cleaned);
    else if (cleaned.startsWith("//")) url = new URL(`https:${cleaned}`);
    else url = new URL(cleaned.replace(/^\.?\//, ""), base);
  } catch { return null; }
  if (url.hostname === "github.com") {
    const m = new RegExp(`^/${OWNER}/([^/]+)/(?:blob|raw)/([^/]+)/(.+)$`, "i").exec(url.pathname);
    return m ? `https://${RAW}/${OWNER}/${m[1]}/${m[2]}/${m[3]}` : null;
  }
  if (url.hostname === RAW && url.pathname.toLowerCase().startsWith(`/${OWNER}/`)) return `https://${RAW}${url.pathname}`;
  return null;
}

function pick(md, repo, branch) {
  for (const { url, alt } of extract(md)) {
    if (REJECT.some((re) => re.test(url) || re.test(alt))) continue;
    if (!/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url)) continue;
    const r = resolve(url, repo, branch);
    if (r) return r;
  }
  return null;
}

async function main() {
  const projects = await readFile(join(root, "src/content/projects.ts"), "utf8");
  const curated = new Set([...projects.matchAll(/\brepo:\s*"([^"]+)"/g)].map((m) => m[1].toLowerCase()));
  const cats = await readFile(join(root, "src/content/categories.ts"), "utf8");
  const noPreview = new Set(
    [...cats.matchAll(/(?:"([^"]+)"|([\w-]+)):\s*\{[^}]*noPreview:\s*true/g)].map((m) => (m[1] ?? m[2]).toLowerCase()),
  );

  let url = `https://api.github.com/users/${OWNER}/repos?per_page=100&type=owner&sort=pushed`;
  const raws = [];
  for (let page = 0; url && page < 10; page++) {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitHub responded ${res.status} ${res.statusText}`);
    raws.push(...(await res.json()));
    url = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get("link") ?? "")?.[1] ?? null;
  }

  const repos = [];
  for (const r of raws) {
    const slim = Object.fromEntries(KEEP.map((k) => [k, r[k] ?? null]));
    slim.topics = r.topics ?? [];
    slim.private = Boolean(r.private);
    let readmeImage = null;
    const skip = curated.has(r.name.toLowerCase()) || noPreview.has(r.name.toLowerCase()) || r.name === OWNER;
    if (!skip) {
      const res = await fetch(`https://${RAW}/${OWNER}/${r.name}/${r.default_branch}/README.md`).catch(() => null);
      if (res?.ok) readmeImage = pick(await res.text(), r.name, r.default_branch);
    }
    repos.push({ ...slim, readmeImage });
  }

  const out = { fetchedAt: new Date().toISOString(), repos };
  await writeFile(join(root, "src/lib/github/fallback.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`Snapshot: ${repos.length} repositories, ${repos.filter((r) => r.readmeImage).length} README previews.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
