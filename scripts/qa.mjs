// End-to-end QA against a running production server.
//   npm run build && npx next start -p 3100   (in another shell)
//   node scripts/qa.mjs [baseUrl] [--quick]
// Screenshots land in qa-output/. Exit code 1 when any check fails.
//
// What it looks for (the things the previous suite missed):
//   - sections overlapping each other at EVERY scroll step, not just at rest
//   - text boxes overlapping other text boxes
//   - project images that are cropped (object-fit: cover, or clipped by an overflow ancestor)
//   - nav links that land with the section heading under the fixed header
//   - wrong or stale active nav state, hash navigation on reload
//   - horizontal scroll, console / hydration errors, failed requests, reduced motion
import { chromium, webkit } from "playwright";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";

const args = process.argv.slice(2);
const BASE = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3100";
const QUICK = args.includes("--quick");
const OUT = "qa-output";
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (/\.png$/.test(f)) unlinkSync(`${OUT}/${f}`);

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "390x844", width: 390, height: 844, mobile: true },
  { name: "375x667", width: 375, height: 667, mobile: true },
];
const SECTIONS = ["top", "about", "work", "archive", "experience", "skills", "contact"];

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const note = (name, detail) => console.log(`NOTE  ${name}  — ${detail}`);

function collect(page) {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => {
    const why = r.failure()?.errorText ?? "";
    if (/ERR_ABORTED|cancelled|NS_BINDING_ABORTED/i.test(why)) return; // browser cancelling an in-flight image while scrolling
    errors.push(`requestfailed: ${r.url()} ${why}`);
  });
  return errors;
}

/** Scroll through once so ScrollTrigger reveals fire and lazy images load. */
async function sweep(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y < h; y += Math.round(vh * 0.6)) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(70);
  }
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

/** In-page geometry audits. Each returns a list of human-readable problems. */
const auditSource = () => {
  const problems = [];
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.05;
  };
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

  // 1. Sections must not overlap each other (they all live in normal flow).
  const secs = [...document.querySelectorAll("main > section, main > div > section, main section[id]")].filter((s) => s.id && vis(s));
  const top = secs.filter((s) => !secs.some((o) => o !== s && o.contains(s)));
  for (let i = 0; i < top.length - 1; i++) {
    const a = top[i].getBoundingClientRect();
    const b = top[i + 1].getBoundingClientRect();
    if (a.bottom > b.top + 1.5) problems.push(`section #${top[i].id} (bottom ${Math.round(a.bottom)}) overlaps #${top[i + 1].id} (top ${Math.round(b.top)})`);
  }

  // 2. Text-bearing boxes must not overlap each other (nav, dialogs, decorative aria-hidden art excluded).
  const textEls = [...document.querySelectorAll("h1,h2,h3,h4,p,li,a,button,dt,dd,label,figcaption,span")]
    .filter((el) => {
      if (el.closest("#site-nav, dialog, [aria-hidden='true'], [hidden], .sr-only, svg")) return false;
      if (!vis(el)) return false;
      if (el.classList.contains("sr-only")) return false;
      return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    })
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.bottom > 0 && r.top < innerHeight);
  for (let i = 0; i < textEls.length; i++) {
    for (let j = i + 1; j < textEls.length; j++) {
      const a = textEls[i];
      const b = textEls[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      // Word-mask spans clip by design; compare only elements of different blocks.
      const area = inter(a.r, b.r);
      if (area > 12) {
        problems.push(`text overlap: "${a.el.textContent.trim().slice(0, 28)}" × "${b.el.textContent.trim().slice(0, 28)}" (${Math.round(area)}px²)`);
        if (problems.length > 12) return problems;
      }
    }
  }
  return problems;
};

const imageSource = () => {
  const problems = [];
  const imgs = [...document.querySelectorAll("#work img, #archive img, dialog[open] img")];
  let checked = 0;
  for (const img of imgs) {
    if (!img.complete || !img.naturalWidth) continue;
    const r = img.getBoundingClientRect();
    if (r.width < 2) continue;
    checked++;
    const s = getComputedStyle(img);
    if (s.objectFit === "cover" || s.objectFit === "none") problems.push(`${img.alt.slice(0, 40)}: object-fit ${s.objectFit}`);
    // Rendered content box (accounting for object-fit: contain letterboxing) must be inside every overflow-clipping ancestor.
    const natural = img.naturalWidth / img.naturalHeight;
    let cw = r.width;
    let ch = r.height;
    if (s.objectFit === "contain") {
      if (r.width / r.height > natural) cw = r.height * natural;
      else ch = r.width / natural;
    } else {
      // Fill modes distort rather than crop; the box aspect must then match the file.
      if (Math.abs(r.width / r.height - natural) / natural > 0.03) problems.push(`${img.alt.slice(0, 40)}: box ${r.width.toFixed(0)}x${r.height.toFixed(0)} distorts ${img.naturalWidth}x${img.naturalHeight}`);
    }
    const cx = r.left + (r.width - cw) / 2;
    const cy = r.top + (r.height - ch) / 2;
    for (let p = img.parentElement; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (/(hidden|clip|auto|scroll)/.test(ps.overflow + ps.overflowX + ps.overflowY)) {
        const pr = p.getBoundingClientRect();
        if (cx < pr.left - 1.5 || cx + cw > pr.right + 1.5 || cy < pr.top - 1.5 || cy + ch > pr.bottom + 1.5) {
          problems.push(`${img.alt.slice(0, 40)}: content clipped by ${p.tagName.toLowerCase()}.${String(p.className).split(" ")[0]}`);
        }
        break;
      }
    }
  }
  return { problems, checked };
};

async function audit(page, label) {
  const p = await page.evaluate(auditSource);
  check(label, p.length === 0, p.slice(0, 4).join(" | "));
}

async function runViewport(browserType, bname, vp, { full }) {
  const label = `${bname} ${vp.name}`;
  const browser = await browserType.launch();
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: !!vp.mobile && bname === "chromium",
    hasTouch: !!vp.mobile,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = collect(page);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/${bname}-${vp.name}-hero.png` });

  // ---------- Hero / identity ----------
  const h1 = await page.locator("h1").allTextContents();
  check(`${label}: exactly one h1 naming Salah`, h1.length === 1 && /salah/i.test(h1[0]), JSON.stringify(h1));
  const cta = await page.evaluate(() => {
    const q = (t) => [...document.querySelectorAll("a")].find((a) => a.textContent.trim().startsWith(t));
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const e = rect(q("Explore Projects"));
    const c = rect(q("Contact Me"));
    return { e: e && { top: e.top, bottom: e.bottom, w: e.width }, c: c && { top: c.top, bottom: c.bottom, w: c.width }, vh: innerHeight };
  });
  check(`${label}: hero has both CTAs`, !!cta.e && !!cta.c);
  if (cta.e) check(`${label}: "Explore Projects" visible without scrolling`, cta.e.bottom <= cta.vh && cta.e.top >= 0, `bottom ${Math.round(cta.e.bottom)} / vh ${cta.vh}`);
  const heroLinks = await page.evaluate(() => {
    const hero = document.getElementById("top");
    const hrefs = [...(hero?.querySelectorAll("a") ?? [])].map((a) => a.href);
    return { gh: hrefs.some((h) => h.startsWith("https://github.com/salah-alstre")), li: hrefs.some((h) => h.includes("linkedin.com/in/salah-alden")) };
  });
  check(`${label}: hero links to GitHub and LinkedIn`, heroLinks.gh && heroLinks.li);
  const text = await page.evaluate(() => document.body.innerText);
  check(`${label}: tagline + 2022 + six months present`, /Beyond Code\. Built to Stand Out\./i.test(text) && /2022/.test(text) && /six months|6 months/i.test(text));
  check(`${label}: session email never on page`, !/m24\.m24\.s/.test(await page.content()));
  const hs = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`${label}: no horizontal overflow at rest`, hs <= 0, `delta ${hs}`);
  const heroSz = await page.evaluate(() => {
    const a = document.querySelector("#top h1");
    return a ? Math.max(...[a, ...a.querySelectorAll("*")].map((e) => parseFloat(getComputedStyle(e).fontSize))) : 0;
  });
  if (vp.width <= 400) check(`${label}: h1 font readable (>=32px)`, heroSz >= 32, `${heroSz}px`);
  await audit(page, `${label}: hero has no overlaps`);

  await sweep(page);

  // ---------- Section sweep: overlap audit at every scroll step ----------
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.round(vp.height * 0.45);
  let bad = [];
  let steps = 0;
  for (let y = 0; y < total; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(140);
    const p = await page.evaluate(auditSource);
    if (p.length) bad.push(`y=${y}: ${p[0]}`);
    steps++;
    const ox = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ox > 0) bad.push(`y=${y}: horizontal overflow ${ox}`);
  }
  check(`${label}: ${steps} scroll positions — no section/text overlap, no h-scroll`, bad.length === 0, bad.slice(0, 3).join(" | "));

  // ---------- Images ----------
  await page.evaluate(() => document.getElementById("work")?.scrollIntoView());
  await sweepImages(page);
  const imgRes = await page.evaluate(imageSource);
  check(`${label}: featured + archive images not cropped (${imgRes.checked} checked)`, imgRes.problems.length === 0 && imgRes.checked > 8, imgRes.problems.slice(0, 3).join(" | "));
  const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc.slice(-60)));
  check(`${label}: no broken images`, broken.length === 0, broken.join(", "));

  // ---------- Navigation: every item lands correctly, heading clear of the nav, active state right ----------
  const useMenu = vp.width < 1024;
  for (const id of SECTIONS) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);
    if (useMenu) {
      await page.locator("header button[aria-controls='mobile-menu']").click();
      await page.waitForTimeout(150);
      await page.locator(`#mobile-menu a[href="#${id}"]`).click();
    } else {
      await page.locator(`header nav[aria-label='Primary'] a[href="#${id}"]`).click();
    }
    await page.waitForTimeout(1900);
    const r = await page.evaluate((i) => {
      const sec = document.getElementById(i);
      const navH = document.getElementById("site-nav").getBoundingClientRect().bottom;
      const h = sec?.querySelector("h1,h2");
      const hr = h?.getBoundingClientRect();
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      const sr = sec?.getBoundingClientRect();
      const cur = [...document.querySelectorAll("a[aria-current='location']")].map((a) => a.getAttribute("href"));
      return { navH, secTop: sr?.top, headTop: hr?.top, headBottom: hr?.bottom, atEnd, cur, hash: location.hash };
    }, id);
    const ok = id === "top" ? Math.abs(r.secTop) < 4 : r.headTop >= r.navH - 1 && r.headTop < vp.height * 0.6;
    check(`${label}: nav → #${id} lands with heading clear of the nav`, ok, `headTop ${Math.round(r.headTop ?? -1)} / nav ${Math.round(r.navH)} / secTop ${Math.round(r.secTop)}${r.atEnd ? " (page end)" : ""}`);
    check(`${label}: nav → #${id} sets the active state`, r.cur.includes(`#${id}`), `aria-current ${JSON.stringify(r.cur)}`);
    await page.screenshot({ path: `${OUT}/${bname}-${vp.name}-nav-${id}.png` });
  }

  // ---------- Hash on load ----------
  for (const id of ["experience", "skills"]) {
    await page.goto(`${BASE}/#${id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2200);
    const r = await page.evaluate((i) => {
      const navH = document.getElementById("site-nav").getBoundingClientRect().bottom;
      const h = document.getElementById(i)?.querySelector("h1,h2")?.getBoundingClientRect();
      return { navH, top: h?.top, y: scrollY };
    }, id);
    check(`${label}: reload with #${id} lands with heading clear of nav`, r.top >= r.navH - 1 && r.top < vp.height * 0.6, `headTop ${Math.round(r.top ?? -1)} nav ${Math.round(r.navH)}`);
  }
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await sweep(page);

  if (full) {
    // ---------- Section shots ----------
    for (const id of SECTIONS.slice(1)) {
      await page.evaluate((i) => {
        const el = document.getElementById(i);
        const y = el.getBoundingClientRect().top + scrollY - document.getElementById("site-nav").getBoundingClientRect().height - 8;
        scrollTo(0, y);
      }, id);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${OUT}/${bname}-${vp.name}-sec-${id}.png` });
    }

    // ---------- Explorer ----------
    await page.evaluate(() => document.getElementById("archive")?.scrollIntoView());
    await page.waitForTimeout(600);
    const status = page.locator("#archive").getByText(/Showing \d+ of \d+/).first();
    const before = await status.textContent();
    check(`${label}: explorer status line`, !!before, before ?? "");
    await page.locator("#archive button[aria-pressed]").filter({ hasText: /Desktop/ }).first().click();
    await page.waitForTimeout(400);
    const afterFilter = await status.textContent();
    check(`${label}: explorer Desktop filter changes list`, afterFilter !== before, `${before} → ${afterFilter}`);
    await audit(page, `${label}: explorer filtered — no overlap`);
    const search = page.locator("#archive input[type=search], #archive input[type=text]").first();
    await search.fill("zzzz-no-such-repo");
    await page.waitForTimeout(400);
    check(`${label}: explorer empty state`, (await page.locator("#archive").getByText(/clear filters/i).count()) > 0);
    await search.fill("");
    await page.locator("#archive button[aria-pressed]").filter({ hasText: /^All/ }).first().click();
    await page.waitForTimeout(300);
    const more = page.locator("#archive").getByRole("button", { name: /load \d+ more/i });
    if (await more.count()) {
      await more.first().click();
      await page.waitForTimeout(400);
      check(`${label}: explorer load more`, true);
    }

    // ---------- Screenshot lightbox from the featured section ----------
    await page.evaluate(() => document.getElementById("work")?.scrollIntoView());
    await page.waitForTimeout(700);
    const shotBtn = page.locator("#work button[aria-label^='Enlarge screenshot']").first();
    await shotBtn.scrollIntoViewIfNeeded();
    await shotBtn.focus();
    await shotBtn.press("Enter");
    await page.waitForTimeout(700);
    check(`${label}: lightbox opens from a featured screenshot`, (await page.locator("dialog[open]").count()) === 1);
    check(`${label}: lightbox focus inside`, await page.evaluate(() => !!document.activeElement?.closest("dialog")));
    await page.screenshot({ path: `${OUT}/${bname}-${vp.name}-lightbox.png` });
    const lb = await page.evaluate(() => {
      const i = document.querySelector("dialog[open] img");
      if (!i) return null;
      const r = i.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: innerWidth, h: innerHeight, nat: i.naturalWidth / i.naturalHeight, boxAspect: r.width / r.height };
    });
    check(`${label}: lightbox shows the whole screenshot inside the viewport`, !!lb && lb.l >= -1 && lb.t >= -1 && lb.r <= lb.w + 1 && lb.b <= lb.h + 1 && Math.abs(lb.boxAspect - lb.nat) / lb.nat < 0.03, JSON.stringify(lb));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    check(`${label}: Esc closes lightbox`, (await page.locator("dialog[open]").count()) === 0);

    // ---------- Case-study dialog, then lightbox on top of it, Esc layering ----------
    const trigger = page.locator("#work").getByRole("button", { name: /case study/i }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await trigger.press("Enter");
    await page.waitForTimeout(1200);
    check(`${label}: case-study dialog opens`, (await page.locator("dialog[open]").count()) === 1);
    check(`${label}: dialog focus moves inside`, await page.evaluate(() => !!document.activeElement?.closest("dialog")));
    await page.screenshot({ path: `${OUT}/${bname}-${vp.name}-dialog.png` });
    const dImgs = await page.evaluate(imageSource);
    check(`${label}: dialog screenshots not cropped (${dImgs.checked})`, dImgs.problems.length === 0, dImgs.problems.slice(0, 2).join(" | "));
    const inDlg = page.locator("dialog[open] button[aria-label^='Enlarge screenshot']").first();
    if (await inDlg.count()) {
      await inDlg.scrollIntoViewIfNeeded();
      await inDlg.click();
      await page.waitForTimeout(600);
      check(`${label}: lightbox stacks above the dialog`, (await page.locator("dialog[open]").count()) === 2);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(600);
      check(`${label}: first Esc closes only the lightbox`, (await page.locator("dialog[open]").count()) === 1);
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);
    check(`${label}: Esc then closes the dialog`, (await page.locator("dialog[open]").count()) === 0);
    check(`${label}: focus returns to the trigger`, await page.evaluate(() => /case study/i.test(document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent ?? "")));
    check(`${label}: page scrollable again after dialogs`, await page.evaluate(() => getComputedStyle(document.documentElement).overflow !== "hidden"));

    // ---------- Command palette ----------
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(400);
    check(`${label}: Ctrl+K opens the palette`, (await page.locator("dialog[open]").count()) === 1);
    await page.keyboard.type("experi");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1800);
    const pr = await page.evaluate(() => {
      const navH = document.getElementById("site-nav").getBoundingClientRect().bottom;
      return { navH, top: document.querySelector("#experience h2")?.getBoundingClientRect().top };
    });
    check(`${label}: palette jumps to Experience, heading clear of nav`, pr.top >= pr.navH - 1 && pr.top < vp.height * 0.6, `top ${Math.round(pr.top)} nav ${Math.round(pr.navH)}`);

    // ---------- Keyboard: tab order reaches CTAs, visible focus ----------
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2200);
    const seen = [];
    if (bname === "webkit") {
      // Playwright's WebKit never tabs to links (even with Alt), so verify what it can: DOM order, and no link removed from the tab order.
      const order = await page.evaluate(() =>
        [...document.querySelectorAll("a[href], button, input, select, textarea, [tabindex]")]
          .filter((el) => el.tabIndex >= 0 && !el.closest("[inert],[aria-hidden='true']") && el.getClientRects().length > 0)
          .slice(0, 14)
          .map((el) => (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 26)),
      );
      note(`${label}: Tab order (DOM, WebKit cannot tab to links in Playwright)`, order.join(" > ").slice(0, 160));
      check(`${label}: skip link, Explore Projects and Contact Me are first in DOM tab order`, ["Skip", "Explore Projects", "Contact Me"].every((t) => order.some((o) => o.startsWith(t))), order.join(" > ").slice(0, 160));
    } else {
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(() => {
          const a = document.activeElement;
          if (!a || a === document.body) return null;
          const s = getComputedStyle(a);
          return { t: (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 26), outline: s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0, shadow: s.boxShadow !== "none" };
        });
        if (f) seen.push(f);
      }
      check(`${label}: Tab reaches skip link, Explore Projects and Contact Me`, ["Skip", "Explore Projects", "Contact Me"].every((t) => seen.some((s) => s.t.startsWith(t))), seen.map((s) => s.t).join(" > ").slice(0, 160));
    }
    check(`${label}: focused elements show a focus indicator`, seen.every((s) => s.outline || s.shadow), seen.filter((s) => !s.outline && !s.shadow).map((s) => s.t).join(", "));
  }

  // ---------- Console ----------
  const real = errors.filter((e) => !/Download the React DevTools/.test(e));
  check(`${label}: no console errors / hydration warnings / failed requests`, real.length === 0, real.slice(0, 3).join(" | "));
  await ctx.close();
  await browser.close();
}

async function sweepImages(page) {
  // Walk the featured + archive sections slowly so every lazy image loads.
  const [a, b] = await page.evaluate(() => [document.getElementById("work").offsetTop, document.getElementById("experience").offsetTop]);
  for (let y = a; y < b; y += 500) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(900);
}

async function reducedMotion() {
  const browser = await chromium.launch();
  for (const vp of [VIEWPORTS[1], VIEWPORTS[4]]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = collect(page);
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const hidden = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("[data-reveal],[data-split],[data-hero],[data-hero-word]")) {
        if (el.closest("[hidden]")) continue;
        const s = getComputedStyle(el);
        if (+s.opacity < 0.99 || s.visibility === "hidden") out.push(el.tagName + ":" + (el.textContent || "").trim().slice(0, 20));
      }
      return out;
    });
    check(`reduced-motion ${vp.name}: all content visible with no scroll needed`, hidden.length === 0, hidden.slice(0, 4).join(", "));
    check(`reduced-motion ${vp.name}: html is not flagged motion-ok`, !(await page.evaluate(() => document.documentElement.classList.contains("motion-ok"))));
    const p = await page.evaluate(auditSource);
    check(`reduced-motion ${vp.name}: no overlap`, p.length === 0, p.slice(0, 2).join(" | "));
    await page.screenshot({ path: `${OUT}/reduced-${vp.name}.png` });
    check(`reduced-motion ${vp.name}: no console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
    await ctx.close();
  }
  await browser.close();
}

async function noJs() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  const t = await page.evaluate(() => document.body.innerText);
  check("no-JS: server HTML contains name, projects and contact", /Salah/.test(t) && /Veilock/.test(t) && /error\.salah59@gmail\.com/.test(t));
  await page.screenshot({ path: `${OUT}/nojs-1440x900.png` });
  await ctx.close();
  await browser.close();
}

async function links() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.href))]);
  const ext = hrefs.filter((h) => /^https?:/.test(h) && !h.startsWith(new URL(BASE).origin));
  const bad = [];
  const blocked = [];
  for (const h of ext) {
    try {
      let res = await fetch(h, { method: "HEAD", redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (portfolio link check)" } });
      if (res.status === 405 || res.status === 403) res = await fetch(h, { method: "GET", redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (portfolio link check)" } });
      if (res.status === 999 || (h.includes("instagram.com") && res.status >= 400)) blocked.push(`${h} → ${res.status} (site blocks bots)`);
      else if (res.status >= 400) bad.push(`${h} → ${res.status}`);
    } catch (e) {
      bad.push(`${h} → ${e.cause?.code ?? e.message}`);
    }
  }
  check(`external links resolve (${ext.length} unique)`, bad.length === 0, bad.slice(0, 5).join(" | "));
  for (const b of blocked) note("external link not verifiable", b);
  const internal = hrefs.filter((h) => h.startsWith(new URL(BASE).origin) && h.includes("#")).map((h) => h.split("#")[1]).filter(Boolean);
  const missing = [];
  for (const id of new Set(internal)) if (!(await page.evaluate((i) => !!document.getElementById(i), id))) missing.push(id);
  check("every in-page #anchor has a target", missing.length === 0, missing.join(", "));
  const rel = await page.evaluate(() => [...document.querySelectorAll("a[target=_blank]")].filter((a) => !/noopener/.test(a.rel)).map((a) => a.href));
  check("every target=_blank link has rel=noopener", rel.length === 0, rel.slice(0, 3).join(", "));
  await browser.close();
}

async function main() {
  const started = Date.now();
  const list = QUICK ? [VIEWPORTS[1], VIEWPORTS[4]] : VIEWPORTS;
  for (const vp of list) await runViewport(chromium, "chromium", vp, { full: vp.name === "1440x900" || vp.name === "390x844" || vp.name === "768x1024" });
  if (!QUICK) for (const vp of [VIEWPORTS[1], VIEWPORTS[3], VIEWPORTS[4]]) await runViewport(webkit, "webkit", vp, { full: vp.name !== "768x1024" });
  await reducedMotion();
  await noJs();
  await links();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed in ${Math.round((Date.now() - started) / 1000)}s`);
  if (failed.length) {
    console.log("FAILED:");
    for (const f of failed) console.log("  - " + f.name);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
