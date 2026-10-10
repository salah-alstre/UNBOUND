import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="pad-x pb-10 pt-10">
      <div className="mono flex flex-col gap-3 border-t border-line pt-6 text-dim md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name}. {site.tagline}
        </p>
        <p className="flex flex-wrap gap-x-6 gap-y-1">
          <a href={site.links.github} target="_blank" rel="noopener noreferrer" className="hover:text-paper">
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-paper">
            LinkedIn<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={site.links.previousPortfolio} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:text-paper hover:decoration-signal">
            Earlier portfolio
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href="#top" className="hover:text-paper">
            Back to top ↑
          </a>
        </p>
      </div>
    </footer>
  );
}
