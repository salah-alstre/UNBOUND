"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, RotateCcw, Search, Star } from "lucide-react";
import { explorerFilters, type ExplorerFilter } from "@/content/categories";
import type { Repo, RepoSource } from "@/lib/github/types";
import { monthYear, pad } from "@/lib/format";
import { SectionHead } from "@/components/ui/SectionHead";
import { gsap, prefersReducedMotion } from "@/components/motion/gsap";
import { useProjectDialog } from "@/components/work/ProjectDialog";

interface Props {
  repos: Repo[];
  source: RepoSource;
  fetchedAt: string;
  notice: string | null;
}

type SortKey = "updated" | "created" | "name" | "stars";

const sorts: { id: SortKey; label: string }[] = [
  { id: "updated", label: "Recently updated" },
  { id: "created", label: "Newest" },
  { id: "name", label: "Name" },
  { id: "stars", label: "Stars" },
];

const PAGE = 12;

function matches(filter: ExplorerFilter, r: Repo): boolean {
  if (filter === "all") return true;
  if (filter === "featured") return r.featured;
  return r.category === filter;
}

function sortRepos(list: Repo[], key: SortKey): Repo[] {
  const out = [...list];
  switch (key) {
    case "updated":
      return out.sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
    case "created":
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "name":
      return out.sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));
    case "stars":
      return out.sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt));
  }
}

/** Typographic tile used wherever a repository has no authentic image. */
function Mark({ title, language, large = false }: { title: string; language: string | null; large?: boolean }) {
  const letters = title
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <div className="relative flex h-full w-full items-end justify-between overflow-hidden bg-raise p-2.5">
      <span className={`display text-paper/90 ${large ? "text-6xl" : "text-2xl"}`}>{letters || "·"}</span>
      {language ? <span className="mono text-[0.58rem] text-dim">{language}</span> : null}
      <span aria-hidden="true" className="absolute right-2 top-2 size-1.5 bg-signal" />
    </div>
  );
}

function Thumb({ repo }: { repo: Repo }) {
  const p = repo.preview;
  if (!p) return <Mark title={repo.title} language={repo.language} />;
  return (
    <Image
      src={p.src}
      alt=""
      width={p.width ?? 640}
      height={p.height ?? 400}
      sizes="120px"
      loading="lazy"
      className="h-full w-full object-contain"
    />
  );
}

export function Explorer({ repos, source, fetchedAt, notice }: Props) {
  const { open } = useProjectDialog();
  const [filter, setFilter] = useState<ExplorerFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [shown, setShown] = useState(PAGE);
  const [hover, setHover] = useState<Repo | null>(null);
  const floater = useRef<HTMLDivElement>(null);
  const quick = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);

  const counts = useMemo(() => {
    const c = {} as Record<ExplorerFilter, number>;
    for (const f of explorerFilters) c[f.id] = repos.filter((r) => matches(f.id, r)).length;
    return c;
  }, [repos]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = repos.filter((r) => {
      if (!matches(filter, r)) return false;
      if (!q) return true;
      const hay = `${r.title} ${r.name} ${r.description} ${r.language ?? ""} ${r.topics.join(" ")}`.toLowerCase();
      return q.split(/\s+/).every((t) => hay.includes(t));
    });
    return sortRepos(list, sort);
  }, [repos, filter, query, sort]);

  const visible = results.slice(0, shown);
  const dirty = filter !== "all" || query !== "" || sort !== "updated";

  // Cursor-following preview — mouse and trackpad only.
  useEffect(() => {
    const el = floater.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const d = prefersReducedMotion() ? 0 : 0.55;
    quick.current = {
      x: gsap.quickTo(el, "x", { duration: d, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: d, ease: "power3.out" }),
    };
    const onMove = (e: PointerEvent) => {
      quick.current?.x(e.clientX + 28);
      quick.current?.y(e.clientY - 90);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.killTweensOf(el);
      quick.current = null;
    };
  }, []);

  const reset = () => {
    setFilter("all");
    setQuery("");
    setSort("updated");
    setShown(PAGE);
  };

  const rowInner = (r: Repo, i: number) => (
    <>
      <span className="mono hidden w-10 shrink-0 text-dim sm:block">{pad(i + 1)}</span>
      <span className="relative h-14 w-[5.5rem] shrink-0 overflow-hidden border border-line bg-raise sm:h-16 sm:w-28" aria-hidden="true">
        <Thumb repo={r} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="display text-[clamp(1.35rem,2.4vw,2rem)] transition-colors group-hover:text-signal group-focus-visible:text-signal">{r.title}</span>
          {r.curated ? <span className="mono border border-line px-1.5 py-0.5 text-[0.58rem] text-signal">Case study</span> : null}
        </span>
        <span className="mt-1.5 line-clamp-2 block max-w-2xl text-sm leading-relaxed text-mute">{r.description || "No description provided."}</span>
      </span>
      <span className="mono hidden shrink-0 text-right text-mute md:block md:w-44">
        <span className="block text-paper">{r.language ?? "—"}</span>
        <span className="mt-1 flex items-center justify-end gap-3">
          {r.stars > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star size={11} aria-hidden="true" />
              <span className="sr-only">Stars: </span>
              {r.stars}
            </span>
          ) : null}
          <span>{monthYear(r.pushedAt)}</span>
        </span>
      </span>
      <ArrowUpRight size={18} aria-hidden="true" className="shrink-0 text-dim transition-[transform,color] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal group-focus-visible:text-signal" />
    </>
  );

  const rowClass = "group flex w-full items-center gap-4 border-b border-line py-4 text-left transition-colors hover:bg-raise/60 focus-visible:bg-raise/60 sm:gap-5 sm:py-5 md:px-2";

  return (
    <section id="archive" aria-labelledby="archive-title" className="relative pt-28 md:pt-44">
      <div className="pad-x">
        <SectionHead
          index="03"
          eyebrow="All projects"
          id="archive-title"
          title="Everything I have made public."
          aside="Read from GitHub on the server. New public repositories appear here on their own."
        />

        {notice ? (
          <p role="status" className="mono mt-6 border border-line px-4 py-3 text-mute">
            <span className="text-signal">Offline snapshot</span> — {notice}
          </p>
        ) : null}

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-6">
          <div role="group" aria-label="Filter repositories by category" className="flex flex-wrap gap-2">
            {explorerFilters.map((f) => {
              const on = filter === f.id;
              const n = counts[f.id];
              if (f.id !== "all" && n === 0) return null;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setFilter(f.id);
                    setShown(PAGE);
                  }}
                  className={`mono inline-flex items-center gap-2 border px-3.5 py-2.5 transition-colors ${on ? "border-signal bg-signal text-ink" : "border-line text-mute hover:border-paper hover:text-paper"}`}
                >
                  {f.label}
                  <span className={on ? "text-ink/70" : "text-dim"}>{n}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search repositories</span>
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShown(PAGE);
                }}
                placeholder="Search by name, language or topic"
                autoComplete="off"
                spellCheck={false}
                className="mono w-full border border-line bg-transparent py-3.5 pl-11 pr-4 normal-case tracking-normal text-paper placeholder:text-dim focus:border-paper focus:outline-none focus-visible:outline-none"
              />
            </label>
            <label className="mono flex items-center gap-3 text-mute">
              <span>Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="mono border border-line bg-ink px-3 py-3 text-paper focus:border-paper focus:outline-none"
              >
                {sorts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={reset}
              disabled={!dirty}
              className="mono inline-flex items-center gap-2 py-3 text-mute transition-opacity hover:text-paper disabled:pointer-events-none disabled:opacity-30"
            >
              <RotateCcw size={12} aria-hidden="true" /> Reset
            </button>
          </div>
        </div>

        <p role="status" aria-live="polite" className="mono mt-8 flex items-center justify-between text-mute">
          <span>
            {results.length === 0 ? "No matches" : `Showing ${Math.min(shown, results.length)} of ${results.length}`}
          </span>
          <span className="hidden text-dim sm:inline">
            {source === "live" ? "Live from GitHub" : "Snapshot"} · {monthYear(fetchedAt)}
          </span>
        </p>

        {/* Index */}
        <ul className="mt-3 list-none border-t border-line" onPointerLeave={() => setHover(null)}>
          {visible.map((r, i) => (
            <li
              key={r.id}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setHover(r);
              }}
            >
              {r.curated ? (
                <button type="button" onClick={(e) => open(r.curated!, e.currentTarget)} className={rowClass} aria-label={`${r.title} — open case study`}>
                  {rowInner(r, i)}
                </button>
              ) : (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className={rowClass} aria-label={`${r.title} — open on GitHub (new tab)`}>
                  {rowInner(r, i)}
                </a>
              )}
            </li>
          ))}
        </ul>

        {results.length === 0 ? (
          <div className="border-b border-line py-20 text-center">
            <p className="serif text-3xl text-paper">Nothing matches that.</p>
            <p className="mt-3 text-mute">Try a shorter search or another category.</p>
            <button type="button" onClick={reset} className="mono mt-6 border border-paper px-5 py-3 text-paper transition-colors hover:bg-paper hover:text-ink">
              Clear filters
            </button>
          </div>
        ) : null}

        {results.length > shown ? (
          <div className="flex justify-center py-12">
            <button
              type="button"
              onClick={() => setShown((s) => s + PAGE)}
              className="mono inline-flex items-center gap-3 border border-paper px-6 py-4 text-paper transition-colors hover:bg-paper hover:text-ink"
            >
              Load {Math.min(PAGE, results.length - shown)} more
              <span className="text-dim">{results.length - shown} left</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Hover preview, pointer devices only */}
      <div
        ref={floater}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden w-[280px] fine:block"
        style={{ opacity: hover ? 1 : 0, transition: "opacity 200ms" }}
      >
        <div className="aspect-[16/10] overflow-hidden border border-paper bg-raise shadow-[0_30px_60px_-20px_rgb(0_0_0/0.95)]">
          {hover ? (
            hover.preview ? (
              <Image
                src={hover.preview.src}
                alt=""
                width={hover.preview.width ?? 640}
                height={hover.preview.height ?? 400}
                sizes="280px"
                className="h-full w-full object-contain"
              />
            ) : (
              <Mark title={hover.title} language={hover.language} large />
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}
