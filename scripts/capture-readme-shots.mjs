// Captures the README screenshots from a running production server.
//   npm run build && npx next start -p 3100 &
//   node scripts/capture-readme-shots.mjs http://localhost:3100
// Output: docs/screenshots/{hero,projects,portfolio}.png (page pixels only, no browser chrome).
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync, writeFileSync, statSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3100";
const out = "docs/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--hide-scrollbars"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(base, { waitUntil: "networkidle" });
// Reserve no scrollbar gutter, so the frame is pure page content edge to edge.
await page.addStyleTag({ content: "html{scrollbar-gutter:auto!important}" });
await page.evaluate(() => document.fonts.ready);

const settle = async (ms = 1800) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter((i) => i.loading !== "lazy" || i.getBoundingClientRect().top < innerHeight * 2).map((i) => (i.complete ? 1 : i.decode().catch(() => 0))));
  });
  await page.waitForTimeout(ms);
};

// Walk the page once so every reveal animation has fired and lazy images are loaded.
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 500) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(120);
}
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await settle(3500);

const shoot = async (name, scrollTo) => {
  if (scrollTo) await page.evaluate(scrollTo);
  await settle(2200);
  await page.mouse.move(0, 0);
  const buf = await page.screenshot({ type: "png" });
  const opt = await sharp(buf).png({ palette: true, quality: 92, effort: 10, colours: 256, dither: 0.6 }).toBuffer();
  writeFileSync(`${out}/${name}.png`, opt);
  console.log(name, `${(statSync(`${out}/${name}.png`).size / 1024).toFixed(0)} KB`);
};

const at = (sel, offset = 0) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - ${offset}); })()`;

const which = process.argv[3] ?? "all";
if (which === "all" || which === "hero") await shoot("hero");
if (which === "all" || which === "projects") await shoot("projects", at("#work article", 90));
if (which === "all" || which === "portfolio") {
  // The About section is taller than 900px, so this one frame is a little taller to show it whole.
  await page.setViewportSize({ width: 1440, height: 1200 });
  await shoot("portfolio", at("#about", -37));
}
await browser.close();
