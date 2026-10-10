"use client";

import { useEffect, useRef, useState } from "react";
import { Command, Menu, X } from "lucide-react";
import { nav, site } from "@/content/site";
import { navHeight, scrollToId } from "@/components/motion/gsap";

interface Props {
  onOpenPalette: () => void;
}

export function Nav({ onOpenPalette }: Props) {
  const [active, setActive] = useState<string>("");
  const [menu, setMenu] = useState(false);
  const [solid, setSolid] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  // Scroll progress + solid background once the hero is left behind.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      setSolid(window.scrollY > 48);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Active section, from scroll position: the last section whose top has reached
  // the header line. Deterministic, so a nav click always lands on its own item,
  // and the final section wins once the page bottoms out.
  useEffect(() => {
    const els = nav.map((n) => document.getElementById(n.id)).filter((e): e is HTMLElement => !!e);
    let raf = 0;
    const spy = () => {
      raf = 0;
      const line = navHeight() + 24;
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      let current = els[0]?.id ?? "";
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(atEnd ? (els[els.length - 1]?.id ?? current) : current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(spy);
    };
    spy();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", onScroll);
    };
  }, []);

  // Mobile menu: lock scroll, close on Escape.
  useEffect(() => {
    if (!menu) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu(false);
    // Let the scroll lock release before measuring.
    requestAnimationFrame(() => scrollToId(id));
  };

  return (
    <header
      id="site-nav"
      className="fixed inset-x-0 top-0 z-50">
      {/* The blur lives on its own layer: a backdrop-filter on the header itself would make it the containing block for the fixed mobile menu below and collapse it. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[var(--nav-h)] transition-colors duration-500 ${solid || menu ? "bg-ink/85 backdrop-blur-sm" : "bg-transparent"}`}
      />
      <div className="pad-x flex h-[var(--nav-h)] items-center justify-between">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setMenu(false);
            scrollToId("top");
          }}
          className="group flex items-baseline gap-3 text-paper"
          aria-label={`${site.name} — ${site.role} — back to top`}
        >
          <span className="display text-[1.6rem] leading-none tracking-tight">
            {site.name}
            <span className="text-signal" aria-hidden="true">.</span>
          </span>
          <span className="mono hidden text-dim transition-colors group-hover:text-mute sm:inline md:hidden 2xl:inline">
            Full-Stack &amp; Software Developer
          </span>
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-5 xl:gap-7">
            {nav.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={go(n.id)}
                  aria-current={active === n.id ? "location" : undefined}
                  className={`mono group relative flex items-baseline gap-1.5 py-2 transition-colors ${active === n.id ? "text-paper" : "text-mute hover:text-paper"}`}
                >
                  <span className={`hidden xl:inline ${active === n.id ? "text-signal" : "text-dim"}`}>{n.index}</span>
                  {n.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-px h-px origin-left bg-signal transition-transform duration-500 ${active === n.id ? "scale-x-100" : "scale-x-0"}`}
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenPalette}
            className="mono hidden items-center gap-2 border border-line px-3 py-2 text-mute transition-colors hover:border-paper hover:text-paper sm:flex"
            aria-label="Open command palette"
          >
            <Command size={13} aria-hidden="true" />
            <span>K</span>
          </button>
          <button
            ref={menuBtn}
            type="button"
            onClick={() => setMenu((m) => !m)}
            className="mono flex items-center gap-2 py-2 pl-3 text-paper lg:hidden"
            aria-expanded={menu}
            aria-controls="mobile-menu"
          >
            {menu ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            <span>{menu ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-line" aria-hidden="true">
        <div ref={bar} className="h-full origin-left bg-signal" style={{ transform: "scaleX(0)" }} />
      </div>

      <div
        id="mobile-menu"
        hidden={!menu}
        className="fixed inset-x-0 top-[var(--nav-h)] bottom-0 z-40 overflow-y-auto bg-ink lg:hidden"
      >
        <nav aria-label="Mobile" className="pad-x flex min-h-full flex-col justify-between py-8">
          <ul className="divide-y divide-line border-y border-line">
            {nav.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={go(n.id)}
                  className="group flex items-baseline justify-between py-4"
                  aria-current={active === n.id ? "location" : undefined}
                >
                  <span className={`display text-[clamp(2.4rem,11vw,4rem)] ${active === n.id ? "text-signal" : "text-paper"}`}>{n.label}</span>
                  <span className="mono text-dim">{n.index}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mono mt-10 text-dim">{site.tagline}</p>
        </nav>
      </div>
    </header>
  );
}
