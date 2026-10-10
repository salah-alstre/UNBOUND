import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="pad-x flex min-h-[100svh] flex-col justify-center">
      <p className="mono text-signal">404</p>
      <h1 className="display mt-4 text-[clamp(3rem,12vw,10rem)]">Out of bounds.</h1>
      <p className="mt-6 max-w-md text-mute">That page doesn’t exist. The portfolio is a single page, so everything lives at the top.</p>
      <Link href="/" className="mono mt-10 inline-block w-fit bg-signal px-5 py-3.5 text-ink">
        Back to the start
      </Link>
    </main>
  );
}
