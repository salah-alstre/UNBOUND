import type { CSSProperties } from "react";

/**
 * The hero's signature scene: abstract software windows, drawn from plain
 * blocks and hairlines. They are decorative (the whole scene is aria-hidden)
 * and never pretend to be a real interface.
 *
 * `Monogram` is the identity element that sits at the centre of the scene (and
 * as a small badge on narrow screens): there is no profile photo, so the
 * portfolio is signed with a mark instead of an invented face.
 */

type Kind = "code" | "layout" | "bars" | "wave" | "tiles";

interface Place {
  l: string;
  t: string;
  w: string;
}

export interface WinSpec {
  id: string;
  label: string;
  kind: Kind;
  /** Placement below `lg`, as percentages of the scene box. */
  m: Place;
  /** Placement from `lg`. */
  d: Place;
  /** How strongly the window follows the cursor. */
  depth: number;
  /** Resting tilt in degrees. */
  rot: number;
  /** Idle float: amplitude (px), period (s). */
  float: [number, number];
  z: number;
}

export const heroWindows: WinSpec[] = [
  { id: "core", label: "core.rs", kind: "code", m: { l: "4%", t: "4%", w: "46%" }, d: { l: "2%", t: "3%", w: "40%" }, depth: 0.9, rot: -2.2, float: [9, 6.4], z: 3 },
  { id: "view", label: "view.tsx", kind: "layout", m: { l: "44%", t: "26%", w: "52%" }, d: { l: "56%", t: "9%", w: "42%" }, depth: 0.55, rot: 1.6, float: [7, 7.8], z: 2 },
  { id: "store", label: "store.db", kind: "bars", m: { l: "2%", t: "52%", w: "40%" }, d: { l: "0%", t: "75%", w: "38%" }, depth: 1.25, rot: 2.4, float: [11, 5.6], z: 4 },
  { id: "signal", label: "signal", kind: "wave", m: { l: "46%", t: "64%", w: "50%" }, d: { l: "50%", t: "77%", w: "46%" }, depth: 0.75, rot: -1.4, float: [8, 8.6], z: 5 },
  { id: "tiles", label: "tiles", kind: "tiles", m: { l: "30%", t: "42%", w: "22%" }, d: { l: "44%", t: "1%", w: "11%" }, depth: 1.5, rot: 4, float: [12, 5.2], z: 1 },
];

const bar = "h-[5px] bg-line";

function Body({ kind }: { kind: Kind }) {
  switch (kind) {
    case "code": {
      const rows: Array<[number, number, boolean?]> = [
        [0, 38], [1, 62], [1, 44, true], [2, 70], [2, 30], [1, 54], [0, 22], [0, 48],
      ];
      return (
        <div className="space-y-[7px] p-3">
          {rows.map(([indent, w, hot], i) => (
            <div key={i} className="flex gap-2" style={{ paddingLeft: indent * 12 }}>
              <span className="w-3 shrink-0 text-right font-mono text-[7px] leading-[5px] text-dim">{i + 1}</span>
              <span className={`${bar} ${hot ? "!bg-signal" : ""}`} style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      );
    }
    case "layout":
      return (
        <div className="grid grid-cols-[28%_1fr] gap-2 p-3">
          <div className="space-y-[7px]">
            <div className={`${bar} w-full !bg-signal`} />
            <div className={`${bar} w-4/5`} />
            <div className={`${bar} w-3/5`} />
            <div className={`${bar} w-4/5`} />
          </div>
          <div className="space-y-2">
            <div className="h-9 border border-line" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 border border-line" />
              <div className="h-12 border border-line bg-line/60" />
            </div>
            <div className={`${bar} w-2/3`} />
          </div>
        </div>
      );
    case "bars": {
      const hs = [34, 58, 44, 76, 52, 88, 62];
      return (
        <div className="flex h-24 items-end gap-[6px] p-3">
          {hs.map((h, i) => (
            <span key={i} className={`flex-1 ${i === 5 ? "bg-signal" : "bg-line"}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      );
    }
    case "wave": {
      const n = 28;
      return (
        <div className="flex h-20 items-center gap-[3px] p-3">
          {Array.from({ length: n }, (_, i) => {
            const h = Math.round(18 + 62 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21)));
            return <span key={i} className={`flex-1 ${i === 17 ? "bg-signal" : "bg-line"}`} style={{ height: `${h}%` }} />;
          })}
        </div>
      );
    }
    case "tiles":
      return (
        <div className="grid grid-cols-3 gap-[5px] p-2.5">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className={`aspect-square ${i === 4 ? "bg-signal" : "border border-line"}`} />
          ))}
        </div>
      );
  }
}

export function HeroWindow({ spec }: { spec: WinSpec }) {
  const style = {
    "--l": spec.m.l,
    "--t": spec.m.t,
    "--w": spec.m.w,
    "--ld": spec.d.l,
    "--td": spec.d.t,
    "--wd": spec.d.w,
    zIndex: spec.z,
  } as CSSProperties;

  return (
    <div
      data-win
      data-hero
      data-depth={spec.depth}
      data-float={spec.float.join(",")}
      className="absolute left-[var(--l)] top-[var(--t)] w-[var(--w)] lg:left-[var(--ld)] lg:top-[var(--td)] lg:w-[var(--wd)]"
      style={style}
    >
      <div data-win-float>
        <div data-win-mid>
          <div
            data-win-inner
            className="fine:pointer-events-auto fine:cursor-grab fine:active:cursor-grabbing select-none border border-[#34342f] bg-raise shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] transition-[border-color] duration-300 data-[unbound=true]:border-signal"
            style={{ rotate: `${spec.rot}deg` }}
          >
            <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
              <span className="size-[7px] border border-dim" />
              <span className="size-[7px] border border-dim" />
              <span className="size-[7px] bg-dim" />
              <span className="mono ml-auto text-[0.58rem] text-dim">{spec.label}</span>
            </div>
            <Body kind={spec.kind} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Monogram({ small = false, className = "" }: { small?: boolean; className?: string }) {
  return (
    <div
      data-hero
      aria-hidden="true"
      className={`relative flex items-center justify-center border border-[#34342f] bg-raise [container-type:inline-size] ${small ? "size-16" : "aspect-square shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)]"} ${className}`}
    >
      <span className="corners" style={{ ["--m" as string]: small ? "8px" : "16px", ["--c" as string]: "var(--color-signal)" }} />
      <span className="display select-none text-paper" style={{ fontSize: small ? "62cqw" : "58cqw", lineHeight: 1 }}>
        S<span className="text-signal">.</span>
      </span>
      {small ? null : (
        <>
          <span className="mono absolute left-3 top-3 text-[0.58rem] text-dim">Salah</span>
          <span className="mono absolute right-3 top-3 text-[0.58rem] text-dim">Dev</span>
          <span className="mono absolute bottom-3 left-3 text-[0.58rem] text-dim">Since 2022</span>
          <span className="mono absolute bottom-3 right-3 text-[0.58rem] text-signal">●</span>
        </>
      )}
    </div>
  );
}
