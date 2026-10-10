"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Maximize2, Minimize2, X } from "lucide-react";
import type { Shot } from "@/lib/shots";
import { pad } from "@/lib/format";

/**
 * Screenshot viewer on a native modal <dialog>: focus is trapped and restored by the browser,
 * Esc closes only this layer (so it can sit on top of the case-study dialog), and arrow keys
 * step through the set. Images are never cropped: "Fit" scales the whole screenshot into the
 * viewport, "Actual size" shows it at its real pixel width inside a scroll area.
 */
export function Lightbox({
  title,
  shots,
  index,
  onIndex,
  onClose,
}: {
  title: string;
  shots: Shot[];
  /** `null` keeps the viewer closed. */
  index: number | null;
  onIndex: (next: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Actual-size is remembered per screenshot, so stepping to another one resets to Fit without an effect.
  const [actualSrc, setActualSrc] = useState<string | null>(null);
  const isOpen = index !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      const previous = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = previous;
        if (dialog.open) dialog.close();
      };
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onClose]);

  const count = shots.length;
  const shot = index !== null ? shots[index] : undefined;
  const actual = shot !== undefined && actualSrc === shot.src;
  const go = (dir: 1 | -1) => {
    if (index === null || count < 2) return;
    onIndex((index + dir + count) % count);
  };

  return (
    <dialog
      ref={ref}
      aria-label={`${title} screenshots`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none border-0 bg-ink p-0 text-paper open:flex open:flex-col"
    >
      {shot ? (
        <>
          <div className="flex items-center justify-between gap-4 border-b border-line px-[var(--gutter)] py-3">
            <button type="button" onClick={onClose} className="mono flex items-center gap-3 py-2 text-paper" autoFocus>
              <X size={16} aria-hidden="true" />
              Close
            </button>
            <p className="mono min-w-0 truncate text-mute" aria-live="polite">
              <span className="text-paper">{title}</span> · {shot.caption} · {pad((index ?? 0) + 1)} / {pad(count)}
            </p>
            <button
              type="button"
              onClick={() => setActualSrc(actual ? null : (shot?.src ?? null))}
              aria-pressed={actual}
              className="mono hidden items-center gap-2 py-2 text-paper hover:text-signal sm:flex"
            >
              {actual ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />}
              {actual ? "Fit to screen" : "Actual size"}
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <div className={`absolute inset-0 grid place-items-center p-4 md:px-20 md:py-6 ${actual ? "overflow-auto" : ""}`}>
              <Image
                key={shot.src}
                src={shot.src}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                sizes={actual ? `${shot.width}px` : "100vw"}
                quality={90}
                className={actual ? "h-auto max-h-none w-auto max-w-none" : "h-auto max-h-full w-auto max-w-full"}
                style={actual ? { width: shot.width } : undefined}
              />
            </div>
            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous screenshot"
                  className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center border border-line bg-ink/80 text-paper backdrop-blur-sm hover:border-signal hover:text-signal"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next screenshot"
                  className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center border border-line bg-ink/80 text-paper backdrop-blur-sm hover:border-signal hover:text-signal"
                >
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </dialog>
  );
}
