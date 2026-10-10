"use client";

import { useRef } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { hero, site } from "@/content/site";
import { Draggable, FINE_POINTER, NO_PREF, gsap, scrollToId, useGSAP } from "@/components/motion/gsap";
import { HeroWindow, Monogram, heroWindows } from "./HeroScene";

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const resetBtn = useRef<HTMLButtonElement>(null);
  const resetFn = useRef<() => void>(() => undefined);

  useGSAP(
    () => {
      const section = root.current;
      const frameEl = frame.current;
      const sceneEl = scene.current;
      if (!section || !frameEl || !sceneEl) return;

      const wins = gsap.utils.toArray<HTMLElement>("[data-win]", sceneEl);
      const floats = wins.map((w) => w.querySelector<HTMLElement>("[data-win-float]")!);
      const mids = wins.map((w) => w.querySelector<HTMLElement>("[data-win-mid]")!);
      const inners = wins.map((w) => w.querySelector<HTMLElement>("[data-win-inner]")!);

      // How many windows currently sit outside the frame — the "unbound" count.
      const recount = () => {
        const f = frameEl.getBoundingClientRect();
        let n = 0;
        inners.forEach((el) => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const out = cx < f.left || cx > f.right || cy < f.top || cy > f.bottom;
          el.dataset.unbound = String(out);
          if (out) n += 1;
        });
        if (count.current) count.current.textContent = `${n} / ${wins.length}`;
        if (resetBtn.current) resetBtn.current.dataset.dirty = String(inners.some((el) => Number(gsap.getProperty(el, "x")) !== 0 || Number(gsap.getProperty(el, "y")) !== 0));
      };

      const mm = gsap.matchMedia();
      mm.add({ noPref: NO_PREF, fine: FINE_POINTER }, (ctx) => {
        const { noPref, fine } = ctx.conditions as { noPref: boolean; fine: boolean };

        if (noPref) {
          const words = section.querySelectorAll("[data-hero-word]");
          const bits = gsap.utils.toArray<HTMLElement>("[data-hero]:not([data-win])", section);
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          // y is pinned to 0 so GSAP's parse of the CSS translateY(112%) can't leave a pixel offset behind.
          tl.fromTo(words, { yPercent: 112, y: 0 }, { yPercent: 0, y: 0, duration: 1.25, stagger: 0.09 }, 0.15)
            .fromTo(bits, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.5)
            .fromTo(wins, { autoAlpha: 0, scale: 0.9, y: 50 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.2, stagger: 0.11 }, 0.35);

          // Idle drift — each window on its own period so they never move in sync.
          wins.forEach((w, i) => {
            const [amp = 8, dur = 6] = (w.dataset.float ?? "8,6").split(",").map(Number);
            gsap.to(floats[i]!, { y: amp, rotation: i % 2 ? 0.6 : -0.6, duration: dur, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.4 });
          });

          // The scene drifts upward faster than the page as the hero leaves.
          gsap.to(sceneEl, {
            yPercent: -10,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
          });
        }

        if (fine) {
          if (noPref) {
            const quick = mids.map((el) => ({
              x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
              y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
            }));
            const onMove = (e: PointerEvent) => {
              const r = section.getBoundingClientRect();
              const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
              const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
              quick.forEach((q, i) => {
                const depth = Number(wins[i]!.dataset.depth ?? 1);
                q.x(-nx * depth * 22);
                q.y(-ny * depth * 16);
              });
            };
            const onLeave = () => quick.forEach((q) => (q.x(0), q.y(0)));
            section.addEventListener("pointermove", onMove);
            section.addEventListener("pointerleave", onLeave);
            return () => {
              section.removeEventListener("pointermove", onMove);
              section.removeEventListener("pointerleave", onLeave);
            };
          }
        }
        return undefined;
      });

      // Dragging is user-initiated, so it works with reduced motion too — mouse and trackpad only.
      let z = 20;
      const drags = window.matchMedia(FINE_POINTER).matches
        ? Draggable.create(inners, {
            type: "x,y",
            minimumMovement: 3,
            onPress() {
              z += 1;
              (this.target as HTMLElement).closest<HTMLElement>("[data-win]")!.style.zIndex = String(z);
            },
            onDrag: recount,
            onDragEnd: recount,
          })
        : [];

      resetFn.current = () => {
        gsap.to(inners, { x: 0, y: 0, duration: 0.9, ease: "expo.inOut", stagger: 0.05, onUpdate: recount, onComplete: recount });
      };
      recount();

      return () => {
        drags.forEach((d) => d.kill());
        mm.revert();
        resetFn.current = () => undefined;
      };
    },
    { scope: root },
  );

  const goto = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(href.slice(1));
  };

  return (
    <section ref={root} id="top" aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col pt-[var(--nav-h)]">
      <div className="pad-x flex flex-1 flex-col pb-5 pt-3 md:pt-5">
        <div ref={frame} className="relative flex flex-1 flex-col px-5 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
          <span className="corners" aria-hidden="true" />

          <div data-hero className="mono flex items-center justify-between text-mute">
            <span className="flex items-center gap-2">
              <span className="inline-block size-1.5 animate-pulse bg-signal motion-reduce:animate-none" aria-hidden="true" />
              Portfolio of {site.name}
            </span>
            <span className="hidden sm:inline">Writing code since {site.startedYear}</span>
          </div>

          {/* Identity + copy: normal flow, always above the decorative scene in reading order. */}
          <div className="relative z-10 my-auto flex flex-col py-10 short:py-5 lg:max-w-[56%] lg:py-14">
            <Monogram small className="mb-6 lg:hidden short:hidden" />

            <p data-hero className="mono mb-3 text-mute md:mb-4">
              <span className="text-signal">{hero.greeting}</span>
            </p>

            <h1 id="hero-title" aria-label={`${site.name} — ${hero.title}`}>
              <span aria-hidden="true" className="display block text-[clamp(4.75rem,17vw,8.5rem)] md:text-[clamp(6rem,15vw,12rem)] lg:text-[clamp(6rem,11.5vw,12rem)]">
                <span className="w">
                  <span data-hero-word>{site.name}</span>
                </span>
                <span className="text-signal">.</span>
              </span>
              <span aria-hidden="true" className="display mt-4 block max-w-[20ch] text-balance text-[clamp(1.75rem,6.4vw,2.25rem)] leading-[1.02] md:mt-6 md:max-w-none md:text-[clamp(2rem,3.4vw,3.1rem)]">
                {hero.title.split(" ").map((word, wi, arr) => (
                  <span key={`${word}-${wi}`}>
                    <span className="w">
                      <span data-hero-word className={word === "Developer" ? "serif pr-[0.06em] text-[1.08em] font-normal tracking-[-0.02em] text-signal" : undefined}>
                        {word}
                      </span>
                    </span>
                    {wi < arr.length - 1 ? " " : null}
                  </span>
                ))}
              </span>
            </h1>

            <p data-hero className="serif mt-5 text-[1.35rem] leading-snug text-paper md:text-[1.6rem]">
              {hero.support}
            </p>

            <p data-hero className="mt-4 max-w-xl text-base leading-relaxed text-mute md:text-[1.0625rem]">
              {hero.intro}
            </p>

            <div data-hero className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={hero.primary.href}
                onClick={goto(hero.primary.href)}
                className="mono group inline-flex items-center gap-3 bg-signal px-5 py-3.5 text-ink transition-transform duration-300 hover:-translate-y-0.5"
              >
                {hero.primary.label}
                <ArrowDownRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </a>
              <a
                href={hero.secondary.href}
                onClick={goto(hero.secondary.href)}
                className="mono group inline-flex items-center gap-3 border border-paper/40 px-5 py-3.5 text-paper transition-colors hover:border-paper"
              >
                {hero.secondary.label}
                <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>

            <ul data-hero className="mono mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-mute">
              {[
                { label: "GitHub", href: site.links.github },
                { label: "LinkedIn", href: site.links.linkedin },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 py-1.5 transition-colors hover:text-signal">
                    {l.label}
                    <ArrowUpRight size={13} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>

            <dl data-hero className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-5">
              {hero.facts.map((f) => (
                <div key={f.k}>
                  <dt className="mono text-dim">{f.k}</dt>
                  <dd className="mt-1.5 text-sm text-paper md:text-base">{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Decorative composition: supports the identity element, never carries content. */}
          <div
            ref={scene}
            aria-hidden="true"
            className="pointer-events-none relative mt-2 h-[88vw] max-h-[520px] lg:absolute lg:inset-y-6 lg:right-6 lg:mt-0 lg:h-auto lg:max-h-none lg:w-[44%]"
          >
            <Monogram className="absolute left-[27%] top-[33%] hidden w-[46%] lg:flex" />
            {heroWindows.map((w) => (
              <HeroWindow key={w.id} spec={w} />
            ))}
          </div>
        </div>

        <div data-hero className="mono hidden items-center justify-between pt-4 text-dim md:flex">
          <p className="flex items-center gap-4">
            <span>Drag the windows. Nothing here is fixed.</span>
            <span className="text-mute">
              Unbound <span ref={count} className="text-signal" aria-live="off">0 / {heroWindows.length}</span>
            </span>
            <button
              ref={resetBtn}
              type="button"
              onClick={() => resetFn.current()}
              data-dirty="false"
              className="flex items-center gap-1.5 text-mute transition-opacity hover:text-paper data-[dirty=false]:pointer-events-none data-[dirty=false]:opacity-0"
              aria-label="Reset the hero windows to their original positions"
              tabIndex={-1}
            >
              <RotateCcw size={12} aria-hidden="true" /> Reset
            </button>
          </p>
          <p>Scroll ↓</p>
        </div>
      </div>
    </section>
  );
}
