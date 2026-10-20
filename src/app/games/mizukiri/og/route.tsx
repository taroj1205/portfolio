import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { langFrom } from "../_lib/i18n";
import type { Lang } from "../_lib/i18n";
import { palettes } from "../_lib/render";
import { describe, distanceParts, readResult } from "../_lib/result";
import type { Result } from "../_lib/result";

const W = 1200;
const H = 630;
const HORIZON = 360;

const loadMincho = async (text: string) => {
  const sheet = await fetch(
    `https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&text=${encodeURIComponent(text)}`
  );
  const css = await sheet.text();
  const source =
    /src: url\((?<source>.+?)\) format\('(?:opentype|truetype)'\)/u.exec(css)
      ?.groups?.source;
  if (source === undefined) {
    throw new Error("Shippori Mincho is unavailable");
  }
  const font = await fetch(source);
  return await font.arrayBuffer();
};

const ridge = (base: number, amp: number, fuji: boolean) => {
  const points: string[] = [`0,${HORIZON}`];
  for (let x = 0; x <= W; x += 10) {
    const u = x / W;
    let lift =
      amp *
      (0.5 + 0.3 * Math.sin(u * 5.1 + 1.3) + 0.15 * Math.sin(u * 13.7 + 0.4));
    if (fuji) {
      const away = Math.abs(x - 1010) / 360;
      if (away < 1) {
        lift = Math.max(lift, 150 * Math.min(0.94, (1 - away) ** 1.35));
      }
    }
    points.push(`${x},${(base - lift).toFixed(1)}`);
  }
  points.push(`${W},${HORIZON}`);
  return points.join(" ");
};

const cardText = (result: Result | null, lang: Lang) => {
  const en = lang === "en";
  const story = result ? describe(result, lang) : null;
  const [value, unit] = result
    ? distanceParts(result.distance)
    : [en ? "Mizukiri" : "水切り", ""];
  let detail = en ? "Just flick your phone" : "スマホではじくだけ";
  if (result) {
    detail = en
      ? `${result.skips} skips · throw ${result.quality}%`
      : `${result.skips}回跳ねた · 投げの質 ${result.quality}%`;
  }
  return {
    caption:
      story?.title ?? (en ? "How far will it skip?" : "どこまで跳ねる？"),
    detail,
    rarity: story?.rarity ?? null,
    unit,
    value,
  };
};

export const GET = async (request: NextRequest) => {
  const result = readResult(Object.fromEntries(request.nextUrl.searchParams));
  const palette = palettes[result?.sky ?? "dusk"];
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const { caption, detail, rarity, unit, value } = cardText(result, lang);
  const font = await loadMincho(
    `${value}${unit}${caption}${detail}${rarity ?? ""}水切り石`
  );
  const sunX = W * Math.max(palette.sunX, 0.62);
  const sunY = HORIZON - Math.max(HORIZON * palette.sunY, 64);
  const mist = `${palette.mist}${Math.round(palette.mistAlpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
  const rings = Array.from(
    { length: Math.min(result?.skips ?? 9, 14) },
    (_, i) => {
      const d = 1.6 + i * 1.1;
      return { r: 260 / d, x: 820 + i * 9, y: HORIZON + 300 / d };
    }
  );

  return new ImageResponse(
    <div
      style={{
        backgroundImage: `linear-gradient(180deg, ${palette.water[0]} ${HORIZON}px, ${palette.water[1]} 450px, ${palette.water[2]})`,
        color: palette.light ? "#22314a" : "#fffaf3",
        display: "flex",
        fontFamily: "Shippori Mincho",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundImage: `linear-gradient(180deg, ${palette.sky[0]}, ${palette.sky[1]} 58%, ${palette.sky[2]})`,
          display: "flex",
          height: HORIZON,
          left: 0,
          position: "absolute",
          top: 0,
          width: W,
        }}
      />
      <div
        style={{
          backgroundImage: `radial-gradient(circle, ${palette.glow}cc 0%, ${palette.glow}44 22%, ${palette.glow}00 60%)`,
          display: "flex",
          height: 900,
          left: sunX - 450,
          position: "absolute",
          top: sunY - 450,
          width: 900,
        }}
      />
      <div
        style={{
          backgroundColor: palette.sun,
          borderRadius: 999,
          display: "flex",
          height: 56,
          left: sunX - 28,
          position: "absolute",
          top: sunY - 28,
          width: 56,
        }}
      />
      <svg
        height={H}
        style={{ left: 0, position: "absolute", top: 0 }}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
      >
        <polygon fill={palette.ridges[0]} points={ridge(HORIZON, 70, true)} />
        <polygon fill={palette.ridges[1]} points={ridge(HORIZON, 34, false)} />
        <rect
          fill={palette.glint}
          height="3"
          opacity="0.5"
          width="120"
          x={sunX - 60}
          y={HORIZON + 30}
        />
        <rect
          fill={palette.glint}
          height="3"
          opacity="0.35"
          width="180"
          x={sunX - 70}
          y={HORIZON + 70}
        />
        <rect
          fill={palette.glint}
          height="4"
          opacity="0.3"
          width="240"
          x={sunX - 140}
          y={HORIZON + 130}
        />
        {rings.map((ring) => (
          <ellipse
            cx={ring.x}
            cy={ring.y}
            fill="none"
            key={ring.y}
            rx={ring.r}
            ry={ring.r * 0.16}
            stroke={palette.ring}
            strokeOpacity="0.55"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div
        style={{
          backgroundImage: `linear-gradient(180deg, ${palette.mist}00, ${mist}, ${palette.mist}00)`,
          display: "flex",
          height: 90,
          left: 0,
          position: "absolute",
          top: HORIZON - 45,
          width: W,
        }}
      />
      <div
        style={{
          bottom: 64,
          display: "flex",
          flexDirection: "column",
          left: 80,
          position: "absolute",
          textShadow: palette.light ? "none" : "0 4px 30px rgba(0,0,0,0.35)",
        }}
      >
        {result ? (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: 30,
              gap: 16,
              letterSpacing: 12,
            }}
          >
            水切り
            <div
              style={{
                alignItems: "center",
                backgroundColor: "#c8352b",
                borderRadius: 6,
                display: "flex",
                fontSize: 20,
                height: 34,
                justifyContent: "center",
                letterSpacing: 0,
                width: 34,
              }}
            >
              石
            </div>
          </div>
        ) : null}
        <div
          style={{
            alignItems: "baseline",
            display: "flex",
            fontSize: result ? 190 : 150,
            lineHeight: 1,
            marginTop: 8,
          }}
        >
          {value}
          {result ? (
            <span style={{ fontSize: 64, marginLeft: 12 }}>{unit}</span>
          ) : null}
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 48,
            gap: 20,
            marginTop: 8,
          }}
        >
          {caption}
          {rarity === null ? null : (
            <span
              style={{
                backgroundColor: "#ffd27a",
                borderRadius: 999,
                color: "#2a1d05",
                fontSize: 24,
                padding: "6px 18px",
              }}
            >
              {rarity}
            </span>
          )}
        </div>
        <div style={{ fontSize: 28, marginTop: 12, opacity: 0.8 }}>
          {detail}
        </div>
      </div>
    </div>,
    {
      fonts: [
        { data: font, name: "Shippori Mincho", style: "normal", weight: 700 },
      ],
      height: H,
      width: W,
    }
  );
};
