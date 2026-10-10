#!/usr/bin/env node
/**
 * Downloads the curated project screenshots from the public GitHub repos,
 * converts them to optimised WebP (full + small variant) and writes
 * `src/content/asset-meta.json` with the real pixel dimensions.
 *
 *   npm run assets
 *
 * Source of truth for which images ship: the MANIFEST below. Only app captures
 * that were reviewed by hand are listed (no terminals, no private data).
 */
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "projects");
const CACHE = path.join(ROOT, ".cache", "assets");
const OWNER = "salah-alstre";

/** slug -> { repo, branch, files: [outName, repoPath] } */
const MANIFEST = {
  veilock: {
    repo: "Veilock",
    branch: "main",
    files: [
      ["dashboard", "docs/screenshots/dashboard.png"],
      ["protect", "docs/screenshots/protect-file.png"],
      ["vaults", "docs/screenshots/vaults.png"],
      ["passwords", "docs/screenshots/passwords.png"],
      ["arabic", "docs/screenshots/arabic-rtl.png"],
      ["lock", "docs/screenshots/lock-screen.png"],
    ],
  },
  remotex: {
    repo: "RemoteX",
    branch: "main",
    files: [
      ["home", "docs/images/home-dark.png"],
      ["session", "docs/images/session.png"],
      ["transfer", "docs/images/file-transfer.png"],
      ["diagnostics", "docs/images/diagnostics.png"],
      ["elevated", "docs/images/session-elevated.png"],
    ],
  },
  rimlight: {
    repo: "recording-application",
    branch: "main",
    files: [
      ["dashboard", "docs/images/dashboard.png"],
      ["library", "docs/images/library.png"],
      ["overlay", "docs/images/overlay.png"],
      ["diagnostics", "docs/images/diagnostics.png"],
    ],
  },
  namaa: {
    repo: "Namaa",
    branch: "main",
    files: [
      ["home", "docs/screenshots/home.png"],
      ["mathematics", "docs/screenshots/mathematics.png"],
      ["arabic", "docs/screenshots/arabic-home.png"],
      ["progress", "docs/screenshots/progress.png"],
      ["listening", "docs/screenshots/listening.png"],
    ],
  },
  folderforge: {
    repo: "FolderForge",
    branch: "main",
    files: [
      ["icons", "docs/screenshots/icons.jpg"],
      ["packs", "docs/screenshots/icon-packs.jpg"],
      ["developer", "docs/screenshots/developer.jpg"],
      ["arabic", "docs/screenshots/arabic.jpg"],
    ],
  },
  snapvault: {
    repo: "Screenshot-Manager",
    branch: "main",
    files: [
      ["dashboard", "docs/screenshots/dashboard.png"],
      ["library", "docs/screenshots/library.png"],
      ["search", "docs/screenshots/ocr-search.png"],
      ["viewer", "docs/screenshots/viewer.png"],
      ["arabic", "docs/screenshots/arabic-rtl.png"],
    ],
  },
  auralis: {
    repo: "Voice-Changer",
    branch: "main",
    files: [
      ["dashboard", "docs/images/dashboard.png"],
      ["mixer", "docs/images/mixer.png"],
      ["voices", "docs/images/voice-changer.png"],
    ],
  },
  "voice-commander": {
    repo: "voice-control",
    branch: "main",
    files: [
      ["dashboard", "docs/screenshots/dashboard-en.png"],
      ["commands", "docs/screenshots/commands.png"],
      ["workflows", "docs/screenshots/workflows.png"],
      ["arabic", "docs/screenshots/dashboard-ar.png"],
    ],
  },
  windows: {
    repo: "Windows",
    branch: "main",
    files: [
      ["desktop", "docs/screenshots/desktop.png"],
      ["multitasking", "docs/screenshots/multitasking.png"],
      ["explorer", "docs/screenshots/file-explorer.png"],
      ["start", "docs/screenshots/start-menu.png"],
      ["settings", "docs/screenshots/settings.png"],
    ],
  },
  tahadi: {
    repo: "Tahadi",
    branch: "main",
    files: [
      ["lobby", "public/tahdi1.png"],
      ["home", "public/tahdi2.png"],
    ],
  },
  buildx: {
    repo: "BuildX",
    branch: "main",
    files: [
      ["builder", "public/BuildX2.png"],
      ["compat", "public/BuildX3.png"],
    ],
  },
  stockflow: {
    repo: "StockFlow",
    branch: "main",
    files: [["banner", "public/StockFlow.png"]],
  },
  "ram-power": {
    repo: "RAM-POWER",
    branch: "master",
    files: [
      ["hero", "docs/screenshots/hero.jpg"],
      ["gallery", "docs/screenshots/gallery.jpg"],
      ["fog", "docs/screenshots/cold-can-fog.jpg"],
    ],
  },
};

const FULL_W = 1600;
const SMALL_W = 640;

async function download(url, dest) {
  try {
    await stat(dest);
    return readFile(dest);
  } catch {
    /* not cached */
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return buf;
}

const meta = {};
let failures = 0;

for (const [slug, spec] of Object.entries(MANIFEST)) {
  meta[slug] = {};
  await mkdir(path.join(OUT, slug), { recursive: true });
  for (const [name, repoPath] of spec.files) {
    const url = `https://raw.githubusercontent.com/${OWNER}/${spec.repo}/${spec.branch}/${repoPath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    try {
      const src = await download(url, path.join(CACHE, slug, `${name}${path.extname(repoPath)}`));
      const img = sharp(src);
      const info = await img.metadata();
      const w = Math.min(info.width ?? FULL_W, FULL_W);
      const full = await sharp(src)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      await writeFile(path.join(OUT, slug, `${name}.webp`), full.data);
      const sw = Math.min(info.width ?? SMALL_W, SMALL_W);
      await sharp(src)
        .resize({ width: sw, withoutEnlargement: true })
        .webp({ quality: 74, effort: 5 })
        .toFile(path.join(OUT, slug, `${name}-sm.webp`));
      meta[slug][name] = { w: full.info.width, h: full.info.height, src: url };
      console.log(`ok   ${slug}/${name}  ${full.info.width}x${full.info.height}  ${(full.data.length / 1024).toFixed(0)} KB`);
    } catch (err) {
      failures++;
      console.error(`FAIL ${slug}/${name}: ${err.message}`);
    }
  }
}

await mkdir(path.join(ROOT, "src", "content"), { recursive: true });
await writeFile(path.join(ROOT, "src", "content", "asset-meta.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(failures ? `\n${failures} failure(s)` : "\nAll assets written.");
process.exit(failures ? 1 : 0);
