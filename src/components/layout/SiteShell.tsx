"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { CommandPalette } from "./CommandPalette";

/** Client frame: owns the palette state and its global shortcut. Page content stays server-rendered. */
export function SiteShell({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Nav onOpenPalette={() => setPalette(true)} />
      {children}
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </>
  );
}
