import { ImageResponse } from "next/og";

const bar = (px: number, top: number, width: number) => ({
  backgroundColor: "rgba(255, 122, 69, 0.55)",
  borderRadius: px,
  height: px * 0.022,
  left: px * ((1 - width) / 2),
  position: "absolute" as const,
  top: px * top,
  width: px * width,
});

export const appIcon = (px: number) =>
  new ImageResponse(
    <div
      style={{
        background: "linear-gradient(180deg, #1e36c9 0%, #2b4cff 70%)",
        display: "flex",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #ffb27a 0%, #ff7a45 100%)",
          borderRadius: px,
          height: px * 0.4,
          left: px * 0.3,
          position: "absolute",
          top: px * 0.3,
          width: px * 0.4,
        }}
      />
      <div
        style={{
          backgroundColor: "#f5f1ea",
          bottom: 0,
          height: px * 0.38,
          left: 0,
          position: "absolute",
          width: "100%",
        }}
      />
      <div style={bar(px, 0.67, 0.26)} />
      <div style={bar(px, 0.75, 0.16)} />
      <div style={bar(px, 0.83, 0.08)} />
    </div>,
    { height: px, width: px }
  );
