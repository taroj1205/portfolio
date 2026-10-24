import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { ogImage } from "../../_lib/og";
import { inkSvg, paperSvg } from "../_components/ink-svg";
import { copy } from "../_lib/copy";
import { modelTrace } from "../_lib/model";
import { rankOf, readResult } from "../_lib/result";

const ink = {
  glow: "#fff1d6",
  gold: "#ffd27a",
  seal: "#c8352b",
  star: "#fffaf3",
};

const W = 1200;
const H = 630;
const PAPER = { size: 500, x: 78, y: 65 };
const MARGIN = 46;

const STARS = Array.from({ length: 120 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43_758.5453;
  const b = Math.sin(i * 78.233) * 12_543.1234;
  const u = a - Math.floor(a);
  const v = b - Math.floor(b);
  return {
    o: 0.25 + ((u * 7) % 1) * 0.55,
    r: 0.5 + ((v * 5) % 1) * 1.4,
    x: u * W,
    y: v * H,
  };
});

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "Draw a circle in one stroke",
    detail: "How close to perfect can you get?",
  },
  ja: {
    caption: "一筆で、まるを描く",
    detail: "真円にどこまで近づける？",
  },
};

const pitchSize: Record<Lang, { size: number; spacing: number }> = {
  en: { size: 72, spacing: 4 },
  ja: { size: 84, spacing: 12 },
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const words = copy[lang];
  const rank = result ? rankOf(result.score) : null;
  const headline = result ? result.score.toFixed(1) : words.name;
  const caption = rank ? rank.name[lang] : pitch[lang].caption;
  const line = rank ? rank.line[lang] : pitch[lang].detail;
  const dare = result ? words.challenge.dare : "";
  const seal = rank?.seal ?? ["円", "相"];
  const headlineSize = result ? { size: 150, spacing: 0 } : pitchSize[lang];
  const font = await loadMincho(
    `${headline}${caption}${line}${dare}${seal.join("")}%${copy.ja.name}ひとふでのつき${copy.en.name}`
  );

  return await ogImage(
    <div
      style={{
        backgroundImage:
          "radial-gradient(circle at 28% 50%, #1d1a3f 0%, #0c1027 50%, #04050c 100%)",
        color: ink.star,
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
          <radialGradient id="og-glow">
            <stop offset="0" stopColor={ink.glow} stopOpacity="0.28" />
            <stop offset="1" stopColor={ink.glow} stopOpacity="0" />
          </radialGradient>
        </defs>
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
        <circle
          cx={PAPER.x + PAPER.size / 2}
          cy={PAPER.y + PAPER.size / 2}
          fill="url(#og-glow)"
          r={PAPER.size * 0.85}
        />
        {paperSvg({ id: "og", ...PAPER })}
        {inkSvg({
          id: "og",
          size: PAPER.size - MARGIN * 2,
          trace: result?.trace ?? modelTrace,
          x: PAPER.x + MARGIN,
          y: PAPER.y + MARGIN,
        })}
      </svg>
      <div
        style={{
          alignItems: "center",
          backgroundColor: ink.seal,
          borderRadius: 6,
          boxShadow: "0 2px 10px rgba(120,20,10,0.35)",
          color: "#fff4ec",
          display: "flex",
          flexDirection: "column",
          fontSize: 26,
          height: 74,
          justifyContent: "center",
          left: PAPER.x + PAPER.size - 98,
          lineHeight: 1.05,
          position: "absolute",
          top: PAPER.y + PAPER.size - 98,
          transform: "rotate(-3deg)",
          width: 74,
        }}
      >
        <span>{seal[0]}</span>
        <span>{seal[1]}</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 650,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.45)",
          top: result ? 96 : 120,
          width: 500,
        }}
      >
        <div
          style={{
            alignItems: "baseline",
            color: ink.gold,
            display: "flex",
            fontSize: 30,
            gap: 18,
            letterSpacing: 10,
          }}
        >
          {result ? copy.ja.name : "ひとふでのつき"}
          {result && lang === "en" ? (
            <span style={{ fontSize: 24, letterSpacing: 2 }}>
              {copy.en.name}
            </span>
          ) : null}
        </div>
        <div
          style={{
            alignItems: "baseline",
            display: "flex",
            fontSize: headlineSize.size,
            letterSpacing: headlineSize.spacing,
            lineHeight: 1,
            marginTop: 18,
          }}
        >
          {headline}
          {result ? (
            <span style={{ fontSize: 64, marginLeft: 10 }}>%</span>
          ) : null}
        </div>
        <div
          style={{
            color: result ? ink.gold : ink.star,
            fontSize: result ? 52 : 44,
            marginTop: 26,
          }}
        >
          {caption}
        </div>
        <div style={{ fontSize: 30, marginTop: 14, opacity: 0.82 }}>{line}</div>
        {dare === "" ? null : (
          <div style={{ fontSize: 30, marginTop: 40, opacity: 0.95 }}>
            {dare}
          </div>
        )}
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
