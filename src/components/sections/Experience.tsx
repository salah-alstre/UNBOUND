"use client";

import { experience } from "@/content/experience";
import { projectBySlug } from "@/content/projects";
import type { ExperienceEntry } from "@/content/types";
import { SectionHead } from "@/components/ui/SectionHead";
import { useProjectDialog } from "@/components/work/ProjectDialog";

const kindLabel: Record<ExperienceEntry["kind"], string> = {
  start: "Beginning",
  personal: "Personal projects",
  professional: "Professional · 6 months",
  milestone: "Milestone",
  now: "Now",
};

/**
 * Chronological timeline, oldest first, in ordinary document flow: a date column,
 * a rail, and the entry. The professional role is the only boxed entry, so it reads
 * as different from self-directed work.
 */
export function Experience() {
  const { open } = useProjectDialog();

  return (
    <section id="experience" aria-labelledby="experience-title" className="relative pt-28 md:pt-40">
      <div className="pad-x">
        <SectionHead
          index="04"
          eyebrow="Experience"
          id="experience-title"
          title="Since 2022, in the order it happened."
          aside={`${experience.length} stages`}
        />

        <ol className="mt-12 md:mt-16">
          {experience.map((e, i) => {
            const pro = e.kind === "professional";
            return (
              <li
                key={e.id}
                className="relative grid gap-x-10 border-l border-line pb-12 pl-8 last:border-transparent last:pb-0 md:grid-cols-[11rem_minmax(0,1fr)] md:border-l-0 md:pl-0 lg:grid-cols-[14rem_minmax(0,1fr)]"
              >
                <div className="md:pr-8 md:text-right">
                  <p className={`mono ${e.placeholder ? "text-dim" : "text-signal"}`}>{e.period}</p>
                  <p className="mono mt-1 text-dim">{kindLabel[e.kind]}</p>
                </div>

                {/* rail + marker for md and up; below md the li's own left border is the rail */}
                <span
                  aria-hidden="true"
                  className={`absolute -left-[4px] top-1.5 size-[7px] rounded-full md:left-[11rem] md:-translate-x-1/2 lg:left-[14rem] ${
                    pro ? "bg-signal shadow-[0_0_0_5px_rgb(212_255_63/0.16)]" : e.kind === "now" ? "bg-signal" : "bg-paper"
                  }`}
                />
                {i < experience.length - 1 ? (
                  <span aria-hidden="true" className="absolute bottom-0 top-3 hidden w-px bg-line md:left-[11rem] md:block lg:left-[14rem]" />
                ) : null}

                <div className="mt-3 md:mt-0 md:pl-10">
                  <div
                    data-reveal
                    className={
                      pro
                        ? `border bg-raise p-6 md:p-8 ${e.placeholder ? "border-dashed border-[#4a4a44]" : "border-signal/50"}`
                        : ""
                    }
                  >
                    <h3 className={`display ${pro ? "text-2xl md:text-4xl" : "text-xl md:text-3xl"}`}>{e.title}</h3>
                    <p className={`mono mt-2 ${e.placeholder ? "text-dim" : "text-mute"}`}>{e.place}</p>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-mute">{e.body}</p>
                    {e.placeholder ? (
                      <p className="mono mt-4 inline-block border border-dashed border-line px-2.5 py-1 text-dim">
                        Details to be added
                      </p>
                    ) : null}
                    {e.proof?.length ? (
                      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Projects from this stage">
                        {e.proof.map((slug) => {
                          const p = projectBySlug(slug);
                          if (!p) return null;
                          return (
                            <li key={slug}>
                              <button
                                type="button"
                                onClick={(ev) => open(slug, ev.currentTarget)}
                                className="mono border border-line px-3 py-2 text-paper transition-colors hover:border-signal hover:text-signal"
                                aria-label={`Open the ${p.name} case study`}
                              >
                                {p.name}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
