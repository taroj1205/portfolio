import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { orbDefs, orbSvg } from "../_components/orb-svg";
import { TIER, TOP, bodies } from "../_lib/bodies";
import { readCareer } from "../_lib/career";
import { copy } from "../_lib/copy";
import { formatScore, readResult, titleOf } from "../_lib/result";

const ink = {
  band: "#d6dcff",
  bandEdge: "#6a5bd6",
  bandMid: "#8f8cf0",
  core: "#fff4dc",
  coreEdge: "#a08cff",
  gold: "#ffd27a",
  ring: "#dce4ff",
  star: "#fffaf3",
  unknown: "#0a0d1c",
  unknownEdge: "#ffffff",
};

const W = 1200;
const H = 630;
const HERO = { x: 905, y: 318 };

const STARS = Array.from({ length: 140 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43_758.5453;
  const b = Math.sin(i * 78.233) * 12_543.1234;
  const u = a - Math.floor(a);
  const v = b - Math.floor(b);
  return {
    o: 0.3 + ((u * 7) % 1) * 0.6,
    r: 0.6 + ((v * 5) % 1) * 1.6,
    x: u * W,
    y: v * H,
  };
});

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "From stardust to a black hole",
    detail: "Drag to aim, let go, merge the matches",
  },
  ja: {
    caption: "星屑からブラックホールまで",
    detail: "同じ星をくっつけて、育てよう",
  },
};

const heroRadius = (tier: number) => {
  if (tier === TOP) {
    return 120;
  }
  if (tier === TIER.saturn) {
    return 130;
  }
  return Math.min(175, 70 + tier * 12);
};

const cardOf = (params: Record<string, string>, lang: Lang) => {
  const words = copy[lang];
  const result = readResult(params);
  if (result) {
    return {
      detail: words.result.stats(result.merges, result.chain),
      galaxies: result.galaxies,
      score: result.score,
      tag: "",
      top: result.top,
    };
  }
  const career = readCareer(params);
  if (career) {
    return {
      detail: words.career.summary(career.runs, career.merges, career.chain),
      galaxies: career.galaxies,
      score: career.best,
      tag: `${words.career.title} · ${words.best}`,
      top: career.top,
    };
  }
  return null;
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const words = copy[lang];
  const card = cardOf(params, lang);
  const hero = card?.top ?? TIER.saturn;
  const reached = card?.top ?? TOP;
  const { caption, detail } = card
    ? { caption: titleOf(card, lang), detail: card.detail }
    : pitch[lang];
  const headline = card ? formatScore(card.score, lang) : words.name;
  const unit = card ? words.points : "";
  const tag = card?.tag ?? "";
  const font = await loadMincho(
    `${headline}${unit}${caption}${detail}${tag}星合ほしあい`
  );

  return new ImageResponse(
    <div
      style={{
        backgroundImage:
          "radial-gradient(circle at 75% 50%, #231c52 0%, #0d1029 48%, #04050c 100%)",
        color: "#fffaf3",
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
        {orbDefs("og")}
        <defs>
          <radialGradient id="og-band">
            <stop offset="0" stopColor={ink.band} stopOpacity="0.32" />
            <stop offset="0.6" stopColor={ink.bandMid} stopOpacity="0.1" />
            <stop offset="1" stopColor={ink.bandEdge} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="og-core">
            <stop offset="0" stopColor={ink.core} stopOpacity="0.5" />
            <stop offset="1" stopColor={ink.coreEdge} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx={W / 2}
          cy={H / 2}
          fill="url(#og-band)"
          rx={W * 0.75}
          ry={110}
          transform={`rotate(-22 ${W / 2} ${H / 2})`}
        />
        {STARS.map((star) => (
          <circle
            cx={star.x}
            cy={star.y}
            fill={ink.star}
            key={`${star.x}-${star.y}`}
            opacity={star.o}
            r={star.r}
          />
        ))}
        <circle cx={HERO.x} cy={HERO.y} fill="url(#og-core)" r={300} />
        <circle
          cx={HERO.x}
          cy={HERO.y}
          fill="none"
          r={262}
          stroke={ink.ring}
          strokeDasharray="2 10"
          strokeLinecap="round"
          strokeOpacity="0.4"
          strokeWidth="2.5"
        />
        {orbSvg({
          id: "og",
          r: heroRadius(hero),
          tier: hero,
          x: HERO.x,
          y: HERO.y,
        })}
        {bodies.map((kind, tier) => {
          const r = 9 + tier * 1.6;
          const x = 96 + tier * 43 + tier * tier * 0.6;
          return tier <= reached ? (
            <g key={kind.name.en}>{orbSvg({ id: "og", r, tier, x, y: 540 })}</g>
          ) : (
            <circle
              cx={x}
              cy={540}
              fill={ink.unknown}
              key={kind.name.en}
              r={r}
              stroke={ink.unknownEdge}
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 84,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.45)",
          top: 92,
          width: 640,
        }}
      >
        {card ? (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: 32,
              gap: 16,
              letterSpacing: 12,
            }}
          >
            星合
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
              星
            </div>
            {tag === "" ? null : (
              <div
                style={{
                  color: ink.gold,
                  display: "flex",
                  fontSize: 24,
                  letterSpacing: 4,
                  marginLeft: 8,
                }}
              >
                {tag}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: ink.gold, fontSize: 30, letterSpacing: 14 }}>
            ほしあい
          </div>
        )}
        <div
          style={{
            alignItems: "baseline",
            display: "flex",
            fontSize: card ? 168 : 150,
            letterSpacing: card ? 0 : 24,
            lineHeight: 1,
            marginTop: 14,
          }}
        >
          {headline}
          {unit === "" ? null : (
            <span style={{ fontSize: 60, marginLeft: 14 }}>{unit}</span>
          )}
        </div>
        <div
          style={{
            color: card !== null && card.galaxies > 0 ? ink.gold : ink.star,
            fontSize: card ? 50 : 44,
            marginTop: 18,
          }}
        >
          {caption}
        </div>
        <div style={{ fontSize: 28, marginTop: 14, opacity: 0.78 }}>
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
