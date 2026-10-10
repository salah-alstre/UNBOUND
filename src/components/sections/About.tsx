import { about, hero, site } from "@/content/site";
import { SectionHead } from "@/components/ui/SectionHead";
import { ExternalLink } from "@/components/ui/ExternalLink";

/**
 * Personal profile: an identity card on the left, the story on the right.
 * No pinning, no scroll-linked motion — it is ordinary flow and always readable.
 */
export function About() {
  const [lead, ...rest] = about.paragraphs;
  return (
    <section id="about" aria-labelledby="about-title" className="relative pt-28 md:pt-40">
      <div className="pad-x">
        <SectionHead index="01" eyebrow={about.eyebrow} id="about-title" title={about.heading} />

        <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          {/* Identity card — a branded placeholder where a portrait would go; no photo is implied. */}
          <aside aria-label="Profile" data-reveal className="self-start">
            <div className="relative border border-[#34342f] bg-raise p-6 md:p-8">
              <span className="corners" style={{ ["--m" as string]: "14px", ["--c" as string]: "var(--color-signal)" }} />
              <div className="flex items-start justify-between gap-6">
                <div aria-hidden="true" className="display grid size-20 shrink-0 place-items-center border border-line text-5xl md:size-24 md:text-6xl">
                  <span>
                    S<span className="text-signal">.</span>
                  </span>
                </div>
                <p className="mono text-right text-mute">
                  Developer
                  <br />
                  Since {site.startedYear}
                </p>
              </div>
              <p className="display mt-8 text-4xl md:text-5xl">{site.name}</p>
              <p className="serif mt-2 text-xl text-paper md:text-2xl">{hero.title}</p>

              <dl className="mt-8 divide-y divide-line border-y border-line">
                {about.facts.map((f) => (
                  <div key={f.k} className="flex items-baseline justify-between gap-6 py-3.5">
                    <dt className="mono text-dim">{f.k}</dt>
                    <dd className="text-right text-sm text-paper">{f.v}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mono mt-6 flex flex-wrap gap-x-6 gap-y-2 text-paper">
                <li>
                  <ExternalLink href={site.links.github}>GitHub</ExternalLink>
                </li>
                <li>
                  <ExternalLink href={site.links.linkedin}>LinkedIn</ExternalLink>
                </li>
              </ul>
            </div>
          </aside>

          <div>
            <p data-reveal className="serif text-[clamp(1.6rem,2.8vw,2.4rem)] leading-[1.15] text-paper">
              {lead}
            </p>
            <div className="mt-8 space-y-6 text-base leading-relaxed text-mute md:text-[1.0625rem]">
              {rest.map((p) => (
                <p key={p} data-reveal>
                  {p}
                </p>
              ))}
            </div>

            <h3 className="mono mt-14 text-dim">How I work</h3>
            <ul className="mt-4 grid gap-px border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
              {about.approach.map((a) => (
                <li key={a.k} data-reveal className="py-5 md:px-6 md:first:pl-0 md:last:pr-0">
                  <p className="display text-xl">{a.k}</p>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{a.v}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
