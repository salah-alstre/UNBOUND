"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";

let registered = false;

/** Registers every GSAP plugin once. Safe to call from any client module. */
export function registerGsap(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Draggable, useGSAP);
  gsap.defaults({ ease: "expo.out", duration: 0.9 });
  registered = true;
}

registerGsap();

export const REDUCED = "(prefers-reduced-motion: reduce)";
export const NO_PREF = "(prefers-reduced-motion: no-preference)";
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED).matches;
}

/** Height of the fixed header, i.e. the distance every in-page target must clear. */
export function navHeight(): number {
  return document.getElementById("site-nav")?.getBoundingClientRect().height ?? 0;
}

/** Smooth-scrolls to a section (instantly under reduced motion) and keeps the hash in sync. */
export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  // Home is the top of the document; every other target stops just under the fixed header.
  const offset = id === "top" ? 0 : navHeight();
  if (prefersReducedMotion()) {
    window.scrollTo({ top: id === "top" ? 0 : el.getBoundingClientRect().top + window.scrollY - offset, behavior: "auto" });
  } else {
    gsap.to(window, { scrollTo: { y: el, offsetY: offset, autoKill: true }, duration: 1.15, ease: "power3.inOut" });
  }
  history.replaceState(null, "", `#${id}`);
  // Move keyboard/screen-reader focus with the viewport.
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

export { gsap, ScrollTrigger, Draggable, useGSAP };
