import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { ogImage } from "../../_lib/og";
import { sparklerDefs, sparklerParts } from "../_components/sparkler-svg";
import { copy } from "../_lib/copy";
import { LAST, phases } from "../_lib/phases";
import {
  finished,
  formatTime,
  reachedOf,
  readResult,
  titleOf,
} from "../_lib/result";

const ink = {
  dim: "rgba(255,250,243,0.32)",
  gold: "#ffd27a",
  star: "#fffaf3",
  warm: "#ff9a4a",
};

const W = 1200;
const H = 630;
const HERO = { x: 930, y: 330 };

const STARS = Array.from({ length: 110 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43_758.5453;
  const b = Math.sin(i * 78.233) * 12_543.1234;
  const u = a - Math.floor(a);
  const v = b - Math.floor(b);
  return {
    o: 0.2 + ((u * 7) % 1) * 0.5,
    r: 0.6 + ((v * 5) % 1) * 1.3,
    x: u * W,
    y: v * H * 0.7,
  };
});

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "How long can you hold it?",
    detail: "It only burns while you hold on",
  },
  ja: {
    caption: "火玉を落とさず、どこまで持てる？",
    detail: "押しているあいだだけ、火がともる",
  },
};

const pitchSize: Record<Lang, number> = { en: 68, ja: 100 };

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const words = copy[lang];
  const reached = result ? reachedOf(result) : LAST;
  const done = result !== null && finished(result);
  const { caption, detail } = result
    ? { caption: titleOf(result, lang), detail: words.challenge.dare }
    : pitch[lang];
  const headline = result ? formatTime(result.time) : words.name;
  const unit = result ? words.unit : "";
  const spacing = lang === "ja" ? 18 : 4;
  const ladder = phases.map((phase) => phase.name.ja).join("");
  const font = await loadMincho(
    `${headline}${unit}${caption}${detail}${ladder}${copy.ja.name}ひだまのいっしょう火${words.result.finished}`
  );
  const art = sparklerParts({
    id: "og",
    phase: result ? reached : 2,
    scale: 2.1,
    top: 0,
    x: HERO.x,
    y: HERO.y,
  });

  return await ogImage(
    <div
      style={{
        backgroundImage:
          "linear-gradient(180deg, #04050d 0%, #0a0a18 55%, #170e0d 100%)",
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
        {sparklerDefs("og")}
        <defs>
          <radialGradient id="og-wash">
            <stop offset="0" stopColor={ink.warm} stopOpacity="0.38" />
            <stop offset="1" stopColor={ink.warm} stopOpacity="0" />
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
        <circle cx={HERO.x} cy={HERO.y} fill="url(#og-wash)" r={420} />
        <ellipse
          cx={HERO.x}
          cy={H - 30}
          fill="url(#og-wash)"
          rx={360}
          ry={50}
        />
        {art.back}
        {art.sparks}
        {art.front}
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 84,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.45)",
          top: 88,
          width: 640,
        }}
      >
        {result ? (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: 32,
              gap: 16,
              letterSpacing: 12,
            }}
          >
            {copy.ja.name}
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
              火
            </div>
          </div>
        ) : (
          <div style={{ color: ink.gold, fontSize: 30, letterSpacing: 14 }}>
            ひだまのいっしょう
          </div>
        )}
        <div
          style={{
            alignItems: "baseline",
            display: "flex",
            fontSize: result ? 168 : pitchSize[lang],
            letterSpacing: result ? 0 : spacing,
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
            alignItems: "center",
            color: done ? ink.gold : ink.star,
            display: "flex",
            fontSize: result ? 50 : 38,
            gap: 18,
            marginTop: 18,
          }}
        >
          {caption}
          {done ? (
            <div
              style={{
                backgroundColor: ink.gold,
                borderRadius: 40,
                color: "#2a1d05",
                display: "flex",
                flexShrink: 0,
                fontSize: 26,
                paddingBottom: 6,
                paddingLeft: 18,
                paddingRight: 18,
                paddingTop: 6,
              }}
            >
              {words.result.finished}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            gap: 22,
            marginTop: 30,
          }}
        >
          {phases.map((phase, index) => (
            <div
              key={phase.reading}
              style={{ color: index <= reached ? ink.gold : ink.dim }}
            >
              {phase.name.ja}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 28, marginTop: 22, opacity: 0.78 }}>
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
