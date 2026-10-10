import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/** Outbound link: new tab, no opener, announced to screen readers, consistent underline treatment. */
export function ExternalLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 underline decoration-line underline-offset-4 transition-colors hover:text-signal hover:decoration-signal ${className}`}
    >
      {children}
      <ArrowUpRight size={12} aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
