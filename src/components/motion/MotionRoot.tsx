"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, NO_PREF } from "./gsap";

/**
 * Page-wide reveal choreography: any `[data-reveal]` rises into place and any
 * `[data-split]` heading lifts its words out of a mask when scrolled into view.
 * Everything is created inside a matchMedia context, so it is reverted on
 * unmount and never runs under `prefers-reduced-motion`.
 */
export function MotionRoot() {
  useEffect(() => {
    const root = document.documentElement;
    const mm = gsap.matchMedia();

    mm.add(NO_PREF, () => {
      root.classList.add("motion-ok");

      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        const words = el.querySelectorAll(".w > span");
        if (!words.length) return;
        gsap.fromTo(
          words,
          // `y` is pinned to 0 on both ends: the CSS starting transform is parsed by GSAP into pixels,
          // and a stale pixel offset would keep the word masked after yPercent reaches 0.
          { yPercent: 112, y: 0 },
          {
            yPercent: 0,
            y: 0,
            duration: 1.05,
            stagger: 0.07,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const delay = Number(el.dataset.revealDelay ?? 0);
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            delay,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          },
        );
      });

      return () => root.classList.remove("motion-ok");
    });

    root.classList.add("motion-ready");

    // Layout settles once fonts and images are in; recompute every trigger then.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => undefined);
    window.addEventListener("load", refresh);

    // Honour a deep link such as /#contact. html has scroll-padding-top, so the
    // native scroll already clears the header; it runs again once fonts and
    // images have settled the layout, unless the visitor has scrolled meanwhile.
    const hash = decodeURIComponent(window.location.hash.slice(1));
    let raf = 0;
    const toHash = () => document.getElementById(hash)?.scrollIntoView({ block: "start" });
    let settle: () => void = () => {};
    if (hash) {
      let userMoved = false;
      const mark = () => {
        userMoved = true;
      };
      window.addEventListener("wheel", mark, { passive: true, once: true });
      window.addEventListener("touchstart", mark, { passive: true, once: true });
      window.addEventListener("keydown", mark, { once: true });
      raf = requestAnimationFrame(toHash);
      settle = () => {
        if (!userMoved) {
          ScrollTrigger.refresh();
          toHash();
        }
      };
      window.addEventListener("load", settle);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", settle);
      window.removeEventListener("load", refresh);
      mm.revert();
      root.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
