"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowUpRight, CornerDownLeft, Search } from "lucide-react";
import { nav, site } from "@/content/site";
import { featuredProjects } from "@/content/projects";
import { scrollToId } from "@/components/motion/gsap";
import { useProjectDialog } from "@/components/work/ProjectDialog";

type Item = { id: string; group: "Go to" | "Case studies" | "Elsewhere"; label: string; hint: string; run: () => void };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { open: openProject } = useProjectDialog();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const uid = useId();

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const n of nav) out.push({ id: `s-${n.id}`, group: "Go to", label: n.title, hint: n.index, run: () => scrollToId(n.id) });
    for (const p of featuredProjects) out.push({ id: `p-${p.slug}`, group: "Case studies", label: p.name, hint: p.kind, run: () => openProject(p.slug) });
    const ext = (id: string, label: string, href: string) =>
      out.push({ id, group: "Elsewhere", label, hint: "New tab", run: () => void window.open(href, "_blank", "noopener,noreferrer") });
    ext("x-github", "GitHub", site.links.github);
    ext("x-linkedin", "LinkedIn", site.links.linkedin);
    out.push({ id: "x-mail", group: "Elsewhere", label: "Write an email", hint: "Mail app", run: () => void (window.location.href = `mailto:${site.links.email}`) });
    return out;
  }, [openProject]);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.hint} ${it.group}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [items, query]);

  // Open / close the native dialog in step with the `open` prop.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setQuery("");
      setActive(0);
      d.showModal();
      requestAnimationFrame(() => input.current?.focus());
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (it: Item | undefined) => {
    if (!it) return;
    onClose();
    // Let the modal release focus and scroll lock before the target takes over.
    window.setTimeout(it.run, 60);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(Math.max(0, results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active]);
    }
  };

  const activeId = results[active] ? `${uid}-${results[active]!.id}` : undefined;
  let lastGroup = "";

  return (
    <dialog
      ref={dialog}
      aria-label="Command palette"
      onClose={() => {
        onClose();
        returnTo.current?.focus?.();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      className="m-auto w-[min(92vw,38rem)] self-start border border-line bg-raise p-0 text-paper backdrop:bg-black/70 open:mt-[12svh]"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={16} aria-hidden="true" className="text-mute" />
        <input
          ref={input}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${uid}-list`}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label="Search sections and projects"
          autoComplete="off"
          spellCheck={false}
          placeholder="Jump to a section or project"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
          className="h-14 w-full bg-transparent text-base text-paper outline-none placeholder:text-dim"
        />
        <kbd className="mono border border-line px-1.5 py-0.5 text-dim">Esc</kbd>
      </div>

      <ul ref={list} id={`${uid}-list`} role="listbox" aria-label="Results" className="max-h-[52svh] overflow-y-auto py-2">
        {results.length === 0 ? (
          <li role="presentation" className="px-4 py-6 text-mute">
            Nothing matches “{query}”.
          </li>
        ) : null}
        {results.map((it, i) => {
          const header = it.group !== lastGroup;
          lastGroup = it.group;
          return (
            <li key={it.id} role="presentation">
              {header ? <p className="mono px-4 pb-1 pt-3 text-dim">{it.group}</p> : null}
              <div
                id={`${uid}-${it.id}`}
                role="option"
                aria-selected={i === active}
                data-i={i}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(it)}
                className="flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 aria-selected:bg-paper aria-selected:text-ink"
              >
                <span className="text-base">{it.label}</span>
                <span className="mono flex items-center gap-2 opacity-70">
                  {it.hint}
                  {it.group === "Elsewhere" ? <ArrowUpRight size={12} aria-hidden="true" /> : i === active ? <CornerDownLeft size={12} aria-hidden="true" /> : null}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}
