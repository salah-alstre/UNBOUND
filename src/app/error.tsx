"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="pad-x flex min-h-[100svh] flex-col justify-center">
      <p className="mono text-signal">Error</p>
      <h1 className="display mt-4 text-[clamp(3rem,10vw,9rem)]">Something broke.</h1>
      <p className="mt-6 max-w-md text-mute">The page failed to render. Try again; if it keeps happening, the rest of the site is still reachable by email.</p>
      <button type="button" onClick={reset} className="mono mt-10 w-fit bg-signal px-5 py-3.5 text-ink">
        Try again
      </button>
    </main>
  );
}
