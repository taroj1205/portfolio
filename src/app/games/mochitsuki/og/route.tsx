import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { ogImage } from "../../_lib/og";
import { dataUri } from "../../_lib/svg";
import { sceneDoc } from "../_lib/art";
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
  dim: "rgba(255,246,240,0.66)",
  gold: "#ffd27a",
  scrim:
    "linear-gradient(90deg, rgba(6,5,24,0.92) 0%, rgba(6,5,24,0.78) 38%, rgba(6,5,24,0) 62%)",
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

const FRAME = { size: 560, x: 640, y: 76 };

const Art = ({ result }: { result: Result | null }) => (
  <div
    style={{
      backgroundImage: `url(${dataUri(
        sceneDoc(W, H, FRAME, {
          hurt: result?.ending === "hand",
          lift: result === null ? 0.7 : 0,
          reach: result?.ending === "hand" ? 1 : 0,
          smooth: result === null ? 1 : smoothness(result.pounds),
        })
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

export const GET = async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = readResult(params);
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const { tag, headline, caption, detail, dare, perfect } = faceOf(
    result,
    lang
  );
  const font = await loadMincho(
    `${tag}${headline}${caption}${detail}${dare}${copy.ja.name}${copy.ja.reading}${copy.en.reading}0123456789BPM回·`
  );

  return await ogImage(
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
          <span style={{ fontSize: 44 }}>{copy.ja.name}</span>
          <span style={{ color: ink.gold, fontSize: 24, letterSpacing: 4 }}>
            {copy[lang].reading}
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
