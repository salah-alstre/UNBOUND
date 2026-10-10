import { ImageResponse } from "next/og";
import { hero, site } from "@/content/site";

export const alt = `${site.name} — ${hero.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#050505", color: "#ece9e1", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, position: "relative" }}>
        <div style={{ position: "absolute", top: 40, left: 40, right: 40, bottom: 40, border: "1px solid #2a2a27", display: "flex" }} />
        <div style={{ position: "absolute", top: 120, right: 90, width: 250, height: 170, border: "2px solid #ece9e1", background: "#0d0d0c", display: "flex" }} />
        <div style={{ position: "absolute", top: 90, right: 60, width: 250, height: 170, background: "#d4ff3f", display: "flex" }} />
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: "#9b988f" }}>PORTFOLIO — SINCE {site.startedYear}</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.92, letterSpacing: -4 }}>
          <div style={{ display: "flex", fontSize: 190, fontWeight: 800 }}>
            {site.name}
            <span style={{ color: "#d4ff3f" }}>.</span>
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700, letterSpacing: -2, marginTop: 20 }}>{hero.title}</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#9b988f" }}>{hero.support}</div>
      </div>
    ),
    size,
  );
}
