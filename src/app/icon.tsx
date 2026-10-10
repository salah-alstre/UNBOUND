import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 10, border: "3px solid #ece9e1" }} />
        <div style={{ position: "absolute", right: 6, top: 6, width: 20, height: 20, background: "#d4ff3f" }} />
        <div style={{ color: "#ece9e1", fontSize: 30, fontWeight: 800, display: "flex" }}>S</div>
      </div>
    ),
    size,
  );
}
