import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import {
  PERFECT,
  STANDARD,
  formatGap,
  formatTime,
  rankOf,
} from "../_lib/judge";
import type { Rank } from "../_lib/judge";
import { gapOf, readResult } from "../_lib/result";
import type { Result } from "../_lib/result";

const night = {
  far: ["#232d5c", "#0e1430"],
  halo: ["#d6e0ff", "#a0b2f0", "#7890dc"],
  moon: ["#fffdf4", "#f1efe2", "#d9d9d2"],
  near: ["#4a5891", "#2d3868", "#101632"],
} as const;

const ink = {
  dim: "rgba(244,246,255,0.32)",
  gap: "#ff8a6a",
  gold: "#ffd27a",
  moon: "#f4f6ff",
};

const W = 1200;
const H = 630;
const MOON = { r: 74, x: 1010, y: 150 };
const RULER = { left: 84, mid: 600, right: 1116, y: 560 };
const ZOOM = 50;

const roll = (i: number, salt: number) => {
  const value = Math.sin(i * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
};

const FLAKES = Array.from({ length: 140 }, (_, i) => ({
  o: 0.25 + roll(i, 3) * 0.6,
  r: 0.8 + roll(i, 2) ** 3 * 4.2,
  x: roll(i, 0) * W,
  y: roll(i, 1) * H,
}));

const ridge = (base: number, height: number, salt: number) => {
  const points = Array.from({ length: 61 }, (_, i) => {
    const u = i / 60;
    const y =
      base -
      height *
        (0.5 +
          0.3 * Math.sin(u * 5.1 + salt) +
          0.2 * Math.sin(u * 13.7 + salt * 2));
    return `${(u * W).toFixed(1)},${y.toFixed(1)}`;
  });
  return `M0,${H} L${points.join(" L")} L${W},${H} Z`;
};

const FAR = ridge(520, 70, 1.3);
const NEAR = ridge(585, 36, 4.1);

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "Stop it right on",
    detail: "The timer vanishes after 3 seconds.",
  },
  ja: {
    caption: "ぴったりで、止める。",
    detail: "タイマーは3秒で消える。",
  },
};

const Moons = ({ level, color }: { level: number; color: string }) => (
  <div style={{ display: "flex", gap: 14 }}>
    {Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        style={{
          backgroundColor: i < level ? color : "transparent",
          border: `2px solid ${i < level ? color : ink.dim}`,
          borderRadius: 999,
          boxShadow: i < level ? "0 0 18px rgba(214,224,255,0.6)" : "none",
          display: "flex",
          height: 30,
          width: 30,
        }}
      />
    ))}
  </div>
);

const Ruler = ({ gap, label }: { gap: number; label: string }) => {
  const span = (RULER.right - RULER.left) / 2;
  const near = Math.max(-ZOOM, Math.min(ZOOM, gap));
  const pin = RULER.mid + (near / ZOOM) * span;
  const ticks = Array.from(
    { length: (ZOOM / 5) * 2 + 1 },
    (_, i) => i * 5 - ZOOM
  );
  const color = gap === 0 ? ink.gold : ink.gap;
  return (
    <div
      style={{
        display: "flex",
        height: 90,
        left: 0,
        position: "absolute",
        top: RULER.y - 50,
        width: W,
      }}
    >
      <svg height={90} viewBox={`0 ${RULER.y - 50} ${W} 90`} width={W}>
        <line
          stroke={ink.dim}
          strokeWidth={2}
          x1={RULER.left}
          x2={RULER.right}
          y1={RULER.y}
          y2={RULER.y}
        />
        {ticks.map((step) => {
          const x = RULER.mid + (step / ZOOM) * span;
          const size = step % 10 === 0 ? 16 : 8;
          return (
            <line
              key={step}
              stroke={ink.moon}
              strokeOpacity={step % 10 === 0 ? 0.55 : 0.28}
              strokeWidth={2}
              x1={x}
              x2={x}
              y1={RULER.y}
              y2={RULER.y - size}
            />
          );
        })}
        {gap === 0 ? null : (
          <rect
            fill={ink.gap}
            fillOpacity={0.6}
            height={10}
            rx={5}
            width={Math.abs(pin - RULER.mid)}
            x={Math.min(pin, RULER.mid)}
            y={RULER.y - 5}
          />
        )}
        <line
          stroke={ink.gold}
          strokeWidth={4}
          x1={RULER.mid}
          x2={RULER.mid}
          y1={RULER.y - 34}
          y2={RULER.y + 12}
        />
        <circle cx={RULER.mid} cy={RULER.y - 42} fill={ink.gold} r={7} />
        <path
          d={`M${pin - 12} ${RULER.y - 40}h24l-12 18z`}
          fill={gap === 0 ? ink.gold : ink.moon}
        />
        <line
          stroke={gap === 0 ? ink.gold : ink.moon}
          strokeWidth={3}
          x1={pin}
          x2={pin}
          y1={RULER.y - 24}
          y2={RULER.y + 10}
        />
      </svg>
      <div
        style={{
          color: ink.gold,
          display: "flex",
          fontSize: 24,
          left: RULER.mid + 18,
          position: "absolute",
          top: -6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color,
          display: "flex",
          fontSize: 26,
          left: Math.max(RULER.left, Math.min(RULER.right - 110, pin - 55)),
          position: "absolute",
          top: 58,
          width: 110,
          justifyContent: "center",
        }}
      >
        {formatGap(gap)}
      </div>
    </div>
  );
};

interface Face {
  tag: string;
  headline: string;
  side: string;
  caption: string;
  detail: string;
  dare: string;
  center: string;
  gap: number;
  rank: Rank | null;
}

const faceOf = (result: Result | null, lang: Lang): Face => {
  const words = copy[lang];
  if (result === null) {
    return {
      ...pitch[lang],
      center: "",
      dare: "",
      gap: 0,
      headline: formatTime(STANDARD),
      rank: null,
      side: "",
      tag: words.modes.standard,
    };
  }
  const gap = gapOf(result);
  const rank = rankOf(gap);
  const shared = {
    caption: rank.name[lang],
    dare: gap === 0 ? words.challenge.match : words.challenge.dare,
    detail: rank.line[lang],
    gap,
    rank,
  };
  return result.day === null
    ? {
        ...shared,
        center: formatTime(STANDARD),
        headline: formatTime(result.time),
        side: formatGap(gap),
        tag: words.modes.standard,
      }
    : {
        ...shared,
        center: "0",
        headline: formatGap(gap),
        side: "",
        tag: words.challenge.day(result.day),
      };
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const { unit } = copy[lang];
  const { tag, headline, side, caption, detail, dare, center, gap, rank } =
    faceOf(result, lang);
  const perfect = rank?.level === PERFECT;
  const font = await loadMincho(
    `${headline}${unit}${caption}${detail}${dare}${tag}${side}${center}間まMa0123456789.+−±`
  );

  return new ImageResponse(
    <div
      style={{
        backgroundImage:
          "linear-gradient(180deg, #04060f 0%, #0b1230 48%, #1c2752 82%, #141c3d 100%)",
        color: ink.moon,
        display: "flex",
        fontFamily: "Shippori Mincho",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <svg
        height={H}
        style={{ left: 0, position: "absolute", top: 0 }}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
      >
        <defs>
          <radialGradient id="og-halo">
            <stop offset="0" stopColor={night.halo[0]} stopOpacity="0.38" />
            <stop offset="0.3" stopColor={night.halo[1]} stopOpacity="0.14" />
            <stop offset="1" stopColor={night.halo[2]} stopOpacity="0" />
          </radialGradient>
          <radialGradient cx="0.38" cy="0.35" id="og-moon" r="0.75">
            <stop offset="0" stopColor={night.moon[0]} />
            <stop offset="0.7" stopColor={night.moon[1]} />
            <stop offset="1" stopColor={night.moon[2]} />
          </radialGradient>
          <linearGradient id="og-far" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={night.far[0]} />
            <stop offset="1" stopColor={night.far[1]} />
          </linearGradient>
          <linearGradient id="og-near" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={night.near[0]} />
            <stop offset="0.5" stopColor={night.near[1]} />
            <stop offset="1" stopColor={night.near[2]} />
          </linearGradient>
        </defs>
        <circle cx={MOON.x} cy={MOON.y} fill="url(#og-halo)" r={MOON.r * 6} />
        <circle cx={MOON.x} cy={MOON.y} fill="url(#og-moon)" r={MOON.r} />
        <path d={FAR} fill="url(#og-far)" />
        <path d={NEAR} fill="url(#og-near)" />
        {FLAKES.map((flake) => (
          <circle
            cx={flake.x}
            cy={flake.y}
            fill={ink.moon}
            key={`${flake.x}-${flake.y}`}
            opacity={flake.o}
            r={flake.r}
          />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 84,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          top: 64,
          width: 860,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 34,
            gap: 22,
          }}
        >
          <span style={{ fontSize: 44 }}>間</span>
          <span style={{ color: ink.gold, fontSize: 26, letterSpacing: 6 }}>
            {lang === "en" ? "Ma" : "ま"}
          </span>
          <span style={{ color: ink.dim, fontSize: 26 }}>·</span>
          <span style={{ fontSize: 28, letterSpacing: 2 }}>{tag}</span>
        </div>
        <div
          style={{
            alignItems: "baseline",
            color: perfect ? ink.gold : ink.moon,
            display: "flex",
            fontSize: 176,
            lineHeight: 1,
            marginTop: 18,
          }}
        >
          {headline}
          <span style={{ fontSize: 56, marginLeft: 14 }}>{unit}</span>
          {side === "" ? null : (
            <span
              style={{
                color: perfect ? ink.gold : ink.gap,
                fontSize: 52,
                marginLeft: 34,
              }}
            >
              {side}
            </span>
          )}
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 28,
            marginTop: 24,
          }}
        >
          <span
            style={{
              color: perfect ? ink.gold : ink.moon,
              fontSize: 52,
            }}
          >
            {caption}
          </span>
          {rank ? (
            <Moons color={perfect ? ink.gold : ink.moon} level={rank.level} />
          ) : null}
        </div>
        <div style={{ fontSize: 30, marginTop: 12, opacity: 0.82 }}>
          {detail}
        </div>
        {dare === "" ? null : (
          <div style={{ color: ink.gold, fontSize: 30, marginTop: 18 }}>
            {dare}
          </div>
        )}
      </div>
      {result ? <Ruler gap={gap} label={center} /> : null}
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
