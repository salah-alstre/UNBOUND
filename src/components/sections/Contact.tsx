"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { contact, site } from "@/content/site";
import { SectionHead } from "@/components/ui/SectionHead";
import { ExternalLink } from "@/components/ui/ExternalLink";

const mailto = `mailto:${site.links.email}?subject=${encodeURIComponent(contact.subject)}`;

const profiles = [
  { label: "GitHub", note: "The source of everything on this page", href: site.links.github, handle: `@${site.github.owner}` },
  { label: "LinkedIn", note: "Background and work history", href: site.links.linkedin, handle: "Salah Alden" },
];

export function Contact() {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<number | undefined>(undefined);

  const copy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(site.links.email);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    timer.current = window.setTimeout(() => setCopied("idle"), 2400);
  };

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative pt-28 md:pt-40">
      <div className="pad-x">
        <SectionHead index="06" eyebrow={contact.eyebrow} id="contact-title" title={contact.heading} />

        <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
          <div>
            <p data-reveal className="max-w-xl text-base leading-relaxed text-mute md:text-lg">
              {contact.body}
            </p>
            <a
              data-reveal
              href={mailto}
              className="display group mt-10 inline-flex max-w-full items-center gap-4 break-all text-[clamp(1.4rem,3.6vw,3.4rem)] leading-none transition-colors hover:text-signal"
            >
              <span>{site.links.email}</span>
              <ArrowUpRight aria-hidden="true" className="size-[0.7em] shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
            </a>
            <div data-reveal className="mt-8 flex flex-wrap items-center gap-4">
              <a href={mailto} className="mono inline-flex items-center gap-2.5 bg-signal px-5 py-3.5 text-ink transition-opacity hover:opacity-90">
                Send an email
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <button type="button" onClick={copy} className="mono inline-flex items-center gap-2.5 border border-line px-5 py-3.5 text-paper transition-colors hover:border-paper">
                {copied === "ok" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied === "ok" ? "Copied" : copied === "fail" ? "Copy failed — select it above" : "Copy address"}
              </button>
              <span className="sr-only" role="status" aria-live="polite">
                {copied === "ok" ? "Email address copied" : copied === "fail" ? "Could not copy the address" : ""}
              </span>
            </div>
          </div>

          <div>
            <h3 className="mono text-dim">Elsewhere</h3>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {profiles.map((p) => (
                <li key={p.label} data-reveal>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-6 py-6 transition-colors hover:text-signal"
                  >
                    <span>
                      <span className="display block text-3xl md:text-4xl">{p.label}</span>
                      <span className="mono mt-2 block text-mute">
                        {p.handle} · {p.note}
                      </span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-6 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mono mt-5 text-mute">
              Also on <ExternalLink href={site.links.instagram}>Instagram</ExternalLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
