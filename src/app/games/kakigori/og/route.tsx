import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { ogImage } from "../../_lib/og";
import { dataUri } from "../../_lib/svg";
import { ORIGIN, SCENE, sceneDoc } from "../_lib/art";
import { copy } from "../_lib/copy";
import { FOOT, heightOf } from "../_lib/pile";
import {
  PERFECT,
  heightText,
  profileOf,
  rankOf,
  readResult,
  syrupOf,
} from "../_lib/result";
import type { Result } from "../_lib/result";
import { syrups } from "../_lib/syrups";

const W = 1200;
const H = 630;
const ROOM = 570;
const CENTRE = 880;
const FLOOR = 612;

const SAMPLE: Result = {
  outline: [2, 9, 18, 25, 29, 32, 34, 35, 35, 34, 32, 29, 25, 18, 9, 2],
  tenths: 140,
  toppled: false,
};

const ink = {
  dim: "rgba(240,248,255,0.8)",
  gold: "#ffe08a",
  scrim:
    "linear-gradient(90deg, rgba(8,32,72,0.92) 0%, rgba(8,32,72,0.72) 40%, rgba(8,32,72,0) 62%)",
  text: "#fffaf3",
};

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "Pile it high,\nkeep it standing.",
    detail: "How high can your shaved ice go?",
  },
  ja: {
    caption: "崩さずに、\n高く盛る。",
    detail: "かき氷、どこまで高く盛れる？",
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
      tag: "",
    };
  }

  const rank = rankOf(result.tenths);
  const words = copy[lang];
  const syrup = syrups[syrupOf(result.tenths)].name[lang];

  return {
    caption: rank.name[lang],
    dare: words.challenge.dare,
    detail: result.toppled ? words.result.toppled : syrup,
    headline: heightText(result.tenths),
    perfect: rank.level === PERFECT,
    tag: words.challenge.received,
  };
};

const Art = ({ result }: { result: Result | null }) => {
  const shown = result ?? SAMPLE;
  const profile = profileOf(shown);
  const k = Math.min(0.62, ROOM / (heightOf(profile) + FOOT + 30));
  const size = SCENE * k;

  const frame = {
    size,
    x: CENTRE - ORIGIN.x * k,
    y: FLOOR - FOOT * k - ORIGIN.y * k,
  };

  return (
    <div
      style={{
        backgroundImage: `url(${dataUri(
          sceneDoc(
            W,
            H,
            frame,
            {
              lean: 0,
              profile,
              syrup: syrupOf(shown.tenths),
              toppled: shown.toppled,
            },
            false
          )
        )})`,
        backgroundSize: `${W}px ${H}px`,
        display: "flex",
        height: H,
        left: 0,
        position: "absolute",
        top: 0,
        width: W,
      }}
    />
  );
};

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);

  const { tag, headline, caption, detail, dare, perfect } = faceOf(
    result,
    lang
  );

  const font = await loadMincho(
    `${tag}${headline}${caption}${detail}${dare}${copy.ja.name}${copy.ja.reading}${copy.en.reading}0123456789.cm`
  );

  return await ogImage(
    <div
      style={{
        backgroundImage: "linear-gradient(180deg, #1f76d8 0%, #6fb8f2 100%)",
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
          backgroundImage: ink.scrim,
          height: H,
          left: 0,
          position: "absolute",
          top: 0,
          width: W,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 72,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.45)",
          top: result === null ? 150 : 84,
          width: 560,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ color: ink.gold, fontSize: 22, letterSpacing: 4 }}>
            {copy[lang].reading}
          </span>
          <span style={{ fontSize: 44 }}>{copy.ja.name}</span>
        </div>
        {tag === "" ? null : (
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
        )}
        <div
          style={{
            color: result === null ? ink.text : ink.gold,
            display: "flex",
            fontSize: result === null ? 60 : 128,
            lineHeight: 1.1,
            marginTop: 30,
            whiteSpace: "pre-line",
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
              opacity: 0.85,
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
