import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { backdrop, scene } from "../_components/art";
import { START_BPM } from "../_lib/beat";
import { copy } from "../_lib/copy";
import {
  PERFECT,
  poundsText,
  rankOf,
  readResult,
  smoothness,
  tempoText,
} from "../_lib/result";
import type { Result } from "../_lib/result";

const W = 1200;
const H = 630;
const ink = {
  dim: "rgba(255,246,240,0.6)",
  fire: "#ff9a52",
  gold: "#ffd27a",
  text: "#fffaf3",
};

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "Pound it on the beat.",
    detail: "Faster and faster. Don't hit the hand.",
  },
  ja: {
    caption: "拍で、つけ。",
    detail: "どんどん速くなる。手はつくな。",
  },
};

interface Face {
  tag: string;
  headline: string;
  caption: string;
  detail: string;
  dare: string;
  perfect: boolean;
}

const faceOf = (result: Result | null, lang: Lang): Face => {
  if (result === null) {
    return {
      caption: pitch[lang].detail,
      dare: "",
      detail: "",
      headline: pitch[lang].caption,
      perfect: false,
      tag: tempoText(START_BPM),
    };
  }
  const rank = rankOf(result.pounds);
  const words = copy[lang];
  return {
    caption: rank.name[lang],
    dare: words.challenge.dare,
    detail: `${words.result.tempo(tempoText(result.tempo))} · ${words.ending[result.ending]}`,
    headline: poundsText(result.pounds, lang),
    perfect: rank.level === PERFECT,
    tag: words.challenge.received,
  };
};

const Art = ({ result }: { result: Result | null }) => (
  <svg
    height={H}
    style={{ left: 0, position: "absolute", top: 0 }}
    viewBox={`0 0 ${W} ${H}`}
    width={W}
  >
    <defs>
      <radialGradient id="og-fire">
        <stop offset="0" stopColor={ink.fire} stopOpacity="0.42" />
        <stop offset="1" stopColor={ink.fire} stopOpacity="0" />
      </radialGradient>
    </defs>
    {backdrop({
      drape: 118,
      flakes: 70,
      height: H,
      id: "og-back",
      lanterns: [
        { size: 44, x: 640, y: 168 },
        { size: 44, x: 1130, y: 168 },
      ],
      width: W,
    })}
    <ellipse cx={920} cy={520} fill="url(#og-fire)" rx={360} ry={230} />
    <g transform="translate(640 76) scale(560)">
      {scene({
        hurt: result?.ending === "hand",
        id: "og-scene",
        lift: result === null ? 0.7 : 0,
        reach: result?.ending === "hand" ? 1 : 0,
        smooth: result === null ? 1 : smoothness(result.pounds),
      })}
    </g>
  </svg>
);

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const { tag, headline, caption, detail, dare, perfect } = faceOf(
    result,
    lang
  );
  const font = await loadMincho(
    `${tag}${headline}${caption}${detail}${dare}餅つきもちつきMochitsuki0123456789BPM回·`
  );

  return new ImageResponse(
    <div
      style={{
        backgroundImage:
          "linear-gradient(180deg, #141027 0%, #0b0814 55%, #1a0d0c 100%)",
        color: ink.text,
        display: "flex",
        fontFamily: "Shippori Mincho",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <Art result={result} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 72,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          top: 128,
          width: 560,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 34,
            gap: 20,
          }}
        >
          <span style={{ fontSize: 44 }}>餅つき</span>
          <span style={{ color: ink.gold, fontSize: 24, letterSpacing: 4 }}>
            {lang === "en" ? "Mochitsuki" : "もちつき"}
          </span>
        </div>
        <div
          style={{
            color: ink.dim,
            display: "flex",
            fontSize: 28,
            marginTop: 14,
          }}
        >
          {tag}
        </div>
        <div
          style={{
            color: result === null ? ink.text : ink.gold,
            display: "flex",
            fontSize: result === null ? 76 : 128,
            lineHeight: 1,
            marginTop: 30,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            color: perfect ? ink.gold : ink.text,
            display: "flex",
            fontSize: result === null ? 32 : 52,
            marginTop: 24,
          }}
        >
          {caption}
        </div>
        {detail === "" ? null : (
          <div
            style={{
              display: "flex",
              fontSize: 28,
              marginTop: 10,
              opacity: 0.82,
            }}
          >
            {detail}
          </div>
        )}
        {dare === "" ? null : (
          <div
            style={{
              color: ink.gold,
              display: "flex",
              fontSize: 30,
              marginTop: 22,
            }}
          >
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
