"use client";

import { skillGroups } from "@/content/skills";
import { projectBySlug } from "@/content/projects";
import { SectionHead } from "@/components/ui/SectionHead";
import { useProjectDialog } from "@/components/work/ProjectDialog";

/**
 * Six plain categories. Every tool listed is used in a public project, and each card
 * links to those projects: evidence instead of progress bars.
 */
export function Skills() {
  const { open } = useProjectDialog();

  return (
    <section id="skills" aria-labelledby="skills-title" className="relative pt-28 md:pt-40">
      <div className="pad-x">
        <SectionHead index="05" eyebrow="Skills" id="skills-title" title="What I work with, and where I've used it." />

        <ul className="mt-12 grid gap-px border border-line bg-line md:mt-16 md:grid-cols-2 xl:grid-cols-3">
          {skillGroups.map((g) => (
            <li key={g.id} className="flex flex-col bg-ink p-6 md:p-8">
              <h3 className="display text-2xl md:text-3xl">{g.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mute">{g.statement}</p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label={`${g.label} technologies`}>
                {g.tools.map((t) => (
                  <li key={t} className="mono border border-line bg-raise px-2.5 py-1.5 text-paper">
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <p className="mono text-dim">Used in</p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {g.proof.map((slug) => {
                    const p = projectBySlug(slug);
                    if (!p) return null;
                    return (
                      <li key={slug}>
                        <button
                          type="button"
                          onClick={(e) => open(slug, e.currentTarget)}
                          aria-label={`Open the ${p.name} case study`}
                          className="py-1.5 text-sm text-mute underline decoration-line underline-offset-4 transition-colors hover:text-signal hover:decoration-signal"
                        >
                          {p.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
