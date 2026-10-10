"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ArrowUpRight, Maximize2 } from "lucide-react";
import { featuredProjects } from "@/content/projects";
import { site } from "@/content/site";
import type { Project } from "@/content/types";
import { getShots, type Shot } from "@/lib/shots";
import { pad } from "@/lib/format";
import { SectionHead } from "@/components/ui/SectionHead";
import { TechChips } from "@/components/ui/TechChips";
import { Lightbox } from "@/components/ui/Lightbox";
import { useProjectDialog } from "./ProjectDialog";

interface Entry {
  project: Project;
  shots: Shot[];
  n: number;
}

const entries: Entry[] = featuredProjects.map((project, i) => ({ project, shots: getShots(project), n: i + 1 }));
/** The first three are told at length, each with its own composition; the rest are compact. */
const lead = entries.slice(0, 3);
const more = entries.slice(3);

type Open = (entry: Entry, index: number) => void;

/** A screenshot shown whole, at its own aspect ratio, that opens the viewer. */
function ShotButton({ entry, index, onOpen, sizes, priority }: { entry: Entry; index: number; onOpen: Open; sizes: string; priority?: boolean }) {
  const shot = entry.shots[index];
  if (!shot) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(entry, index)}
      aria-label={`Enlarge screenshot: ${shot.caption}, ${entry.project.name}`}
      className="group relative block w-full cursor-zoom-in overflow-hidden border border-line bg-raise text-left transition-colors hover:border-[#4a4a44] focus-visible:border-signal"
    >
      <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes={sizes} priority={priority} className="h-auto w-full" />
      <span aria-hidden="true" className="absolute bottom-2 right-2 grid size-8 place-items-center bg-ink/85 text-paper">
        <Maximize2 size={14} />
      </span>
    </button>
  );
}

/** A small, uncropped preview: the whole screenshot is contained in a fixed frame. */
function ThumbButton({ entry, index, onOpen }: { entry: Entry; index: number; onOpen: Open }) {
  const shot = entry.shots[index];
  if (!shot) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(entry, index)}
      aria-label={`Enlarge screenshot: ${shot.caption}, ${entry.project.name}`}
      className="relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden border border-line bg-raise transition-colors hover:border-[#4a4a44] focus-visible:border-signal"
    >
      <Image src={shot.src} alt="" fill sizes="(min-width: 1024px) 12vw, 22vw" className="object-contain" />
    </button>
  );
}

function Thumbs({ entry, onOpen, from = 1, max = 4 }: { entry: Entry; onOpen: Open; from?: number; max?: number }) {
  const idx = entry.shots.map((_, i) => i).slice(from, from + max);
  if (!idx.length) return null;
  return (
    <ul className="grid grid-cols-4 gap-3" aria-label={`More ${entry.project.name} screenshots`}>
      {idx.map((i) => (
        <li key={i}>
          <ThumbButton entry={entry} index={i} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}

function Actions({ project }: { project: Project }) {
  const { open } = useProjectDialog();
  const link =
    "mono inline-flex items-center gap-1.5 py-2 text-mute underline decoration-line underline-offset-4 transition-colors hover:text-paper hover:decoration-signal";
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <button
        type="button"
        onClick={(e) => open(project.slug, e.currentTarget)}
        aria-label={`Open the ${project.name} case study`}
        className="mono group inline-flex items-center gap-3 border border-paper px-5 py-3.5 text-paper transition-colors hover:bg-paper hover:text-ink"
      >
        Case study
        <ArrowUpRight size={15} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>
      <a href={`https://github.com/${site.github.owner}/${project.repo}`} target="_blank" rel="noopener noreferrer" className={link}>
        Source on GitHub <ArrowUpRight size={13} aria-hidden="true" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {project.live ? (
        <a href={project.live} target="_blank" rel="noopener noreferrer" className={link}>
          Live demo <ArrowUpRight size={13} aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </div>
  );
}

function Meta({ project, n }: { project: Project; n: number }) {
  return (
    <p className="mono flex flex-wrap items-center gap-x-3 gap-y-1 text-mute">
      <span className="text-signal">{pad(n)}</span>
      <span aria-hidden="true" className="h-px w-6 bg-line" />
      <span>{project.kind}</span>
      <span className="text-dim">{project.year}</span>
    </p>
  );
}

function Built({ project }: { project: Project }) {
  if (!project.built) return null;
  return (
    <div className="mt-6 border-l border-signal pl-4">
      <p className="mono text-dim">What I built</p>
      <p className="mt-1.5 text-base leading-relaxed text-paper">{project.built}</p>
    </div>
  );
}

function Decisions({ project, count }: { project: Project; count: number }) {
  const list = project.decisions?.slice(0, count) ?? [];
  if (!list.length) return null;
  return (
    <div>
      <h4 className="mono text-dim">Decisions I can point to</h4>
      <dl className="mt-3 divide-y divide-line border-y border-line">
        {list.map((d) => (
          <div key={d.title} className="py-3.5">
            <dt className="text-sm font-medium text-paper">{d.title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-mute">{d.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Large case study, image left. */
function LeadA({ entry, onOpen }: { entry: Entry; onOpen: Open }) {
  const { project } = entry;
  return (
    <article aria-labelledby={`p-${project.slug}`} className="grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
      <div className="min-w-0 space-y-3">
        <ShotButton entry={entry} index={0} onOpen={onOpen} sizes="(min-width: 1024px) 58vw, 100vw" priority />
        <Thumbs entry={entry} onOpen={onOpen} />
      </div>
      <div className="min-w-0">
        <Meta project={project} n={entry.n} />
        <h3 id={`p-${project.slug}`} className="display mt-4 text-[clamp(2.8rem,5.4vw,5.2rem)]">
          {project.name}
        </h3>
        <p className="serif mt-4 text-[clamp(1.3rem,2vw,1.9rem)] leading-[1.15] text-paper">{project.tagline}</p>
        <p className="mt-5 text-base leading-relaxed text-mute">{project.summary}</p>
        <Built project={project} />
        <div className="mt-8">
          <Decisions project={project} count={2} />
        </div>
        <div className="mt-6">
          <TechChips items={project.stack} />
        </div>
        <div className="mt-8">
          <Actions project={project} />
        </div>
      </div>
    </article>
  );
}

/** Large case study, image right, with the engineering notes beside the picture. */
function LeadB({ entry, onOpen }: { entry: Entry; onOpen: Open }) {
  const { project } = entry;
  return (
    <article aria-labelledby={`p-${project.slug}`} className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <div className="order-2 min-w-0 lg:order-1">
        <Meta project={project} n={entry.n} />
        <h3 id={`p-${project.slug}`} className="display mt-4 text-[clamp(2.8rem,5.4vw,5.2rem)]">
          {project.name}
        </h3>
        <p className="serif mt-4 text-[clamp(1.3rem,2vw,1.9rem)] leading-[1.15] text-paper">{project.tagline}</p>
        <p className="mt-5 text-base leading-relaxed text-mute">{project.summary}</p>
        <Built project={project} />
        <ul className="mt-6 space-y-2 text-sm leading-snug text-mute" aria-label={`${project.name} features`}>
          {project.highlights.slice(0, 4).map((h) => (
            <li key={h} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.55em] h-px w-3 shrink-0 bg-signal" />
              {h}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <TechChips items={project.stack} />
        </div>
        <div className="mt-8">
          <Actions project={project} />
        </div>
      </div>
      <div className="order-1 min-w-0 space-y-3 lg:order-2">
        <ShotButton entry={entry} index={0} onOpen={onOpen} sizes="(min-width: 1024px) 58vw, 100vw" />
        <Thumbs entry={entry} onOpen={onOpen} />
      </div>
    </article>
  );
}

/** Large case study, picture across the full width and the story set in columns beneath it. */
function LeadC({ entry, onOpen }: { entry: Entry; onOpen: Open }) {
  const { project } = entry;
  return (
    <article aria-labelledby={`p-${project.slug}`}>
      <div className="mx-auto max-w-[1200px]">
        <ShotButton entry={entry} index={0} onOpen={onOpen} sizes="(min-width: 1280px) 1200px, 100vw" />
        <div className="mt-3">
          <Thumbs entry={entry} onOpen={onOpen} max={4} />
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-5">
          <Meta project={project} n={entry.n} />
          <h3 id={`p-${project.slug}`} className="display mt-4 text-[clamp(2.8rem,5.4vw,5.2rem)]">
            {project.name}
          </h3>
          <p className="serif mt-4 text-[clamp(1.3rem,2vw,1.9rem)] leading-[1.15] text-paper">{project.tagline}</p>
        </div>
        <div className="min-w-0 lg:col-span-4">
          <p className="text-base leading-relaxed text-mute">{project.summary}</p>
          <Built project={project} />
          <div className="mt-6">
            <TechChips items={project.stack} />
          </div>
          <div className="mt-8">
            <Actions project={project} />
          </div>
        </div>
        <div className="min-w-0 lg:col-span-3">
          <Decisions project={project} count={2} />
        </div>
      </div>
    </article>
  );
}

/** Compact card: whole screenshot in a fixed, letterboxed frame (contained, never cropped). */
function Compact({ entry, onOpen }: { entry: Entry; onOpen: Open }) {
  const { project, shots } = entry;
  const { open } = useProjectDialog();
  const first = shots[0];
  return (
    <article aria-labelledby={`p-${project.slug}`} className="flex h-full flex-col border border-line bg-ink p-5 md:p-6">
      {first ? (
        <button
          type="button"
          onClick={() => onOpen(entry, 0)}
          aria-label={`Enlarge screenshot: ${first.caption}, ${project.name}`}
          className="relative mb-6 block aspect-[16/10] w-full cursor-zoom-in overflow-hidden border border-line bg-raise transition-colors hover:border-[#4a4a44] focus-visible:border-signal"
        >
          <Image src={first.src} alt={first.alt} fill sizes="(min-width: 768px) 46vw, 100vw" className="object-contain" />
          <span aria-hidden="true" className="absolute bottom-2 right-2 grid size-8 place-items-center bg-ink/85 text-paper">
            <Maximize2 size={14} />
          </span>
        </button>
      ) : (
        <div className="mono mb-6 grid aspect-[16/10] w-full place-items-center border border-dashed border-line text-dim">No screenshots published</div>
      )}
      <Meta project={project} n={entry.n} />
      <h3 id={`p-${project.slug}`} className="display mt-3 text-[clamp(2rem,3vw,2.8rem)]">
        {project.name}
      </h3>
      <p className="serif mt-2 text-xl leading-[1.15] text-paper">{project.tagline}</p>
      <p className="mt-4 text-sm leading-relaxed text-mute">{project.built ?? project.summary}</p>
      <div className="mt-5">
        <TechChips items={project.stack} limit={5} />
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-6">
        <button
          type="button"
          onClick={(e) => open(project.slug, e.currentTarget)}
          aria-label={`Open the ${project.name} case study`}
          className="mono group inline-flex items-center gap-2 border border-paper px-4 py-3 text-paper transition-colors hover:bg-paper hover:text-ink"
        >
          Case study <ArrowUpRight size={14} aria-hidden="true" />
        </button>
        <a
          href={`https://github.com/${site.github.owner}/${project.repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mono inline-flex items-center gap-1.5 py-2 text-mute underline decoration-line underline-offset-4 transition-colors hover:text-paper hover:decoration-signal"
        >
          GitHub <ArrowUpRight size={13} aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {project.live ? (
          <a
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            className="mono inline-flex items-center gap-1.5 py-2 text-mute underline decoration-line underline-offset-4 transition-colors hover:text-paper hover:decoration-signal"
          >
            Live <ArrowUpRight size={13} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Featured Projects as personal case studies. Plain document flow: no pinning, no sticky
 * stage, no horizontal pan — every block takes its own height, so nothing can overlap.
 */
export function SelectedWork() {
  const [viewer, setViewer] = useState<{ slug: string; index: number } | null>(null);
  const onOpen = useCallback<Open>((entry, index) => setViewer({ slug: entry.project.slug, index }), []);
  const onClose = useCallback(() => setViewer(null), []);

  const current = viewer ? entries.find((e) => e.project.slug === viewer.slug) : undefined;

  return (
    <section id="work" aria-labelledby="work-title" className="relative pt-28 md:pt-40">
      <div className="pad-x">
        <SectionHead
          index="02"
          eyebrow="Featured projects"
          id="work-title"
          title="The work I'd start with."
          aside={`${pad(entries.length)} case studies`}
        />
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-mute md:text-lg">
          The first three get the long version. Every one links to its source, and each claim comes from the repository&rsquo;s own README.
        </p>

        <div className="mt-16 space-y-24 md:mt-24 md:space-y-36">
          {lead[0] ? <LeadA entry={lead[0]} onOpen={onOpen} /> : null}
          {lead[1] ? <LeadB entry={lead[1]} onOpen={onOpen} /> : null}
          {lead[2] ? <LeadC entry={lead[2]} onOpen={onOpen} /> : null}
        </div>

        {more.length ? (
          <div className="mt-24 md:mt-36">
            <h3 className="mono border-b border-line pb-4 text-dim">More featured work</h3>
            <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:gap-8">
              {more.map((e) => (
                <li key={e.project.slug}>
                  <Compact entry={e} onOpen={onOpen} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <Lightbox
        title={current?.project.name ?? ""}
        shots={current?.shots ?? []}
        index={viewer?.index ?? null}
        onIndex={(i) => setViewer((v) => (v ? { ...v, index: i } : v))}
        onClose={onClose}
      />
    </section>
  );
}
