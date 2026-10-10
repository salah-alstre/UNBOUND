"use client";

import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Maximize2, X } from "lucide-react";
import { projects, projectBySlug, featuredProjects } from "@/content/projects";
import { site } from "@/content/site";
import { getShots } from "@/lib/shots";
import { pad } from "@/lib/format";
import { gsap, prefersReducedMotion } from "@/components/motion/gsap";
import { TechChips } from "@/components/ui/TechChips";
import { Lightbox } from "@/components/ui/Lightbox";

/** Featured projects first, in their curated order, then the rest of the curated set. */
const ordered = [...featuredProjects, ...projects.filter((p) => !featuredProjects.some((f) => f.slug === p.slug))];

interface DialogApi {
  /** Opens the case study. `origin` is the element the dialog grows out of (and returns to). */
  open: (slug: string, origin?: HTMLElement | null) => void;
}

const Ctx = createContext<DialogApi>({ open: () => undefined });
export const useProjectDialog = () => useContext(Ctx);

function insetFrom(el: HTMLElement | null): string | null {
  if (!el || !el.isConnected) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  const top = Math.max(0, r.top);
  const left = Math.max(0, r.left);
  const right = Math.max(0, window.innerWidth - r.right);
  const bottom = Math.max(0, window.innerHeight - r.bottom);
  return `inset(${top}px ${right}px ${bottom}px ${left}px)`;
}

export function ProjectDialogProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const originRef = useRef<HTMLElement | null>(null);
  const closingRef = useRef(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);

  const project = slug ? projectBySlug(slug) : undefined;
  const index = project ? ordered.findIndex((p) => p.slug === project.slug) : -1;

  const open = useCallback((next: string, origin?: HTMLElement | null) => {
    originRef.current = origin ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    closingRef.current = false;
    setViewer(null);
    setSlug(next);
    setNonce((n) => n + 1);
  }, []);

  // Present the dialog once the project content has rendered.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !slug) return;
    dialog.scrollTop = 0;
    if (dialog.open) {
      // Switching project from inside the dialog: just fade the new content in.
      if (!prefersReducedMotion()) gsap.fromTo(dialog.querySelectorAll("[data-dlg-in]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06 });
      return;
    }
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    if (prefersReducedMotion()) return;
    const from = insetFrom(originRef.current);
    const tl = gsap.timeline();
    if (from) {
      tl.fromTo(dialog, { clipPath: from }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.85, ease: "expo.inOut", clearProps: "clipPath" });
    } else {
      tl.fromTo(dialog, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, clearProps: "opacity,visibility" });
    }
    tl.fromTo(dialog.querySelectorAll("[data-dlg-in]"), { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07 }, from ? "-=0.45" : "-=0.2");
    return () => {
      tl.kill();
    };
    // `nonce` re-runs the presentation when the same slug is reopened.
  }, [slug, nonce]);

  const close = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open || closingRef.current) return;
    closingRef.current = true;
    setViewer(null);
    const finish = () => {
      dialog.close();
      gsap.set(dialog, { clearProps: "all" });
      document.documentElement.style.overflow = "";
      setSlug(null);
      const origin = originRef.current;
      if (origin?.isConnected) origin.focus({ preventScroll: true });
    };
    if (prefersReducedMotion()) return finish();
    const to = insetFrom(originRef.current);
    if (to) {
      gsap.to(dialog, { clipPath: to, duration: 0.7, ease: "expo.inOut", onComplete: finish });
    } else {
      gsap.to(dialog, { autoAlpha: 0, duration: 0.3, onComplete: finish });
    }
  }, []);

  // ESC → animated close instead of the browser's instant one.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [close]);

  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  const step = (dir: 1 | -1) => {
    if (index < 0) return;
    const next = ordered[(index + dir + ordered.length) % ordered.length];
    if (next) {
      setViewer(null);
      setSlug(next.slug);
      setNonce((n) => n + 1);
    }
  };

  const api = useMemo<DialogApi>(() => ({ open }), [open]);
  const shots = project ? getShots(project) : [];
  const prev = index >= 0 ? ordered[(index - 1 + ordered.length) % ordered.length] : undefined;
  const next = index >= 0 ? ordered[(index + 1) % ordered.length] : undefined;

  return (
    <Ctx.Provider value={api}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="case-title"
        className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-ink p-0 open:block"
      >
        {project ? (
          <div key={project.slug}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink/90 px-[var(--gutter)] py-3 backdrop-blur-sm">
              <button type="button" onClick={close} className="mono group flex items-center gap-3 py-2 text-paper" autoFocus>
                <X size={16} aria-hidden="true" />
                <span>Close</span>
                <span className="hidden text-dim sm:inline">Esc</span>
              </button>
              <p className="mono text-mute" aria-live="polite">
                Case study {pad(index + 1)} / {pad(ordered.length)}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => step(-1)} aria-label={`Previous project: ${prev?.name ?? ""}`} className="grid size-10 place-items-center text-paper hover:text-signal">
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => step(1)} aria-label={`Next project: ${next?.name ?? ""}`} className="grid size-10 place-items-center text-paper hover:text-signal">
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <article className="pad-x mx-auto max-w-[1500px] pb-24 pt-14 md:pt-20">
              <header>
                <p data-dlg-in className="mono text-signal">
                  {project.kind} · {project.year}
                </p>
                <h2 id="case-title" data-dlg-in className="display mt-5 text-[clamp(3.4rem,13vw,11rem)]">
                  {project.name}
                </h2>
                <p data-dlg-in className="serif mt-6 max-w-3xl text-[clamp(1.5rem,3.2vw,2.6rem)] leading-[1.1] text-paper">
                  {project.tagline}
                </p>
              </header>

              <dl data-dlg-in className="mt-12 grid gap-px border-y border-line md:grid-cols-3">
                <div className="py-5 md:pr-6">
                  <dt className="mono text-dim">Status</dt>
                  <dd className="mt-2 text-sm text-paper">{project.status}</dd>
                </div>
                <div className="py-5 md:px-6 md:[border-inline:1px_solid_var(--color-line)]">
                  <dt className="mono text-dim">Stack</dt>
                  <dd className="mt-2">
                    <TechChips items={project.stack} />
                  </dd>
                </div>
                <div className="py-5 md:pl-6">
                  <dt className="mono text-dim">Links</dt>
                  <dd className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <a className="inline-flex items-center gap-1 text-paper underline decoration-line underline-offset-4 hover:decoration-signal" href={`https://github.com/${site.github.owner}/${project.repo}`} target="_blank" rel="noopener noreferrer">
                      Source on GitHub <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                    {project.live ? (
                      <a className="inline-flex items-center gap-1 text-paper underline decoration-line underline-offset-4 hover:decoration-signal" href={project.live} target="_blank" rel="noopener noreferrer">
                        Live demo <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                  </dd>
                </div>
              </dl>

              <div data-dlg-in className="mt-14 grid gap-12 lg:grid-cols-[1.25fr_1fr]">
                <div className="space-y-6 text-[1.0625rem] leading-relaxed text-mute">
                  <p className="text-xl leading-snug text-paper md:text-2xl">{project.summary}</p>
                  {project.built ? (
                    <div className="border-l border-signal pl-4">
                      <p className="mono text-dim">What I built</p>
                      <p className="mt-1.5 text-base leading-relaxed text-paper">{project.built}</p>
                    </div>
                  ) : null}
                  {project.story.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
                <div>
                  <h3 className="mono text-dim">What is in it</h3>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {project.highlights.map((h) => (
                      <li key={h} className="py-3 text-sm leading-snug text-paper">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {project.decisions?.length ? (
                <section data-dlg-in aria-label="Engineering decisions" className="mt-16">
                  <h3 className="mono text-dim">Decisions I can point to</h3>
                  <dl className="mt-4 grid gap-px border-y border-line md:grid-cols-2">
                    {project.decisions.map((d) => (
                      <div key={d.title} className="py-5 md:odd:pr-8 md:even:border-l md:even:border-line md:even:pl-8">
                        <dt className="text-base font-medium text-paper">{d.title}</dt>
                        <dd className="mt-1.5 text-sm leading-relaxed text-mute">{d.body}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              {shots.length > 0 ? (
                <section aria-label={`${project.name} screenshots`} className="mt-20 space-y-14">
                  {shots.map((s, i) => (
                    <figure key={s.src} data-dlg-in className={s.width / s.height < 1.3 ? "mx-auto max-w-3xl" : ""}>
                      <button
                        type="button"
                        onClick={() => setViewer(i)}
                        aria-label={`Enlarge screenshot: ${s.caption}, ${project.name}`}
                        className="relative block w-full cursor-zoom-in overflow-hidden border border-line bg-raise hover:border-[#4a4a44] focus-visible:border-signal"
                      >
                        <Image
                          src={s.src}
                          alt={s.alt}
                          width={s.width}
                          height={s.height}
                          sizes="(min-width: 1500px) 1400px, 100vw"
                          className="h-auto w-full"
                          loading={i < 2 ? "eager" : "lazy"}
                        />
                        <span aria-hidden="true" className="absolute bottom-2 right-2 grid size-8 place-items-center bg-ink/85 text-paper">
                          <Maximize2 size={14} />
                        </span>
                      </button>
                      <figcaption className="mono mt-3 flex justify-between text-mute">
                        <span>{s.caption}</span>
                        <span className="text-dim">
                          {pad(i + 1)} / {pad(shots.length)}
                        </span>
                      </figcaption>
                    </figure>
                  ))}
                </section>
              ) : (
                <p className="mono mt-20 border border-dashed border-line p-6 text-mute">
                  No screenshots published for this project. The repository README is the source of truth.
                </p>
              )}

              <nav aria-label="More case studies" className="mt-24 grid border-t border-line md:grid-cols-2">
                {[
                  { p: prev, dir: -1 as const, label: "Previous" },
                  { p: next, dir: 1 as const, label: "Next" },
                ].map(({ p, dir, label }) =>
                  p ? (
                    <button key={label} type="button" onClick={() => step(dir)} className={`group py-8 text-left md:py-12 ${dir === 1 ? "md:border-l md:border-line md:pl-10 md:text-right" : "md:pr-10"}`}>
                      <span className="mono text-dim">{label}</span>
                      <span className="display mt-2 block text-4xl transition-colors group-hover:text-signal md:text-6xl">{p.name}</span>
                    </button>
                  ) : null,
                )}
              </nav>
            </article>
          </div>
        ) : null}
      </dialog>
      <Lightbox title={project?.name ?? ""} shots={shots} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />
    </Ctx.Provider>
  );
}
