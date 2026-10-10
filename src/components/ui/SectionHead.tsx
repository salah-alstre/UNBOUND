import type { ReactNode } from "react";
import { SplitWords } from "@/components/motion/SplitWords";

/**
 * Shared section opener: numbered eyebrow, masked-word heading, optional aside.
 * Pure layout in normal flow — no animation of its own beyond the shared reveals.
 */
export function SectionHead({
  index,
  eyebrow,
  id,
  title,
  aside,
  size = "lg",
}: {
  index: string;
  eyebrow: string;
  id: string;
  title: string;
  aside?: ReactNode;
  size?: "lg" | "md";
}) {
  return (
    <div className="border-b border-line pb-8">
      <div className="flex items-baseline justify-between gap-6">
        <p className="mono text-signal">
          {index} — {eyebrow}
        </p>
        {aside ? <div className="mono hidden text-mute md:block">{aside}</div> : null}
      </div>
      <SplitWords
        as="h2"
        id={id}
        text={title}
        className={`display mt-6 block max-w-5xl ${
          size === "lg" ? "text-[clamp(2.4rem,6.4vw,6rem)]" : "text-[clamp(2.1rem,4.6vw,4.2rem)]"
        }`}
      />
    </div>
  );
}
