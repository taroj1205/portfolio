import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { ogImage } from "../../_lib/og";
import { dataUri } from "../../_lib/svg";
import { RESTING, posed, sceneDoc } from "../_lib/art";
import { copy } from "../_lib/copy";
import { kinds } from "../_lib/fish";
import {
  PERFECT,
  bragOf,
  countOf,
  countText,
  rankOf,
  rarestOf,
  readResult,
  shelfOf,
} from "../_lib/result";
import type { Result } from "../_lib/result";

const W = 1200;
const H = 630;
const FRAME = { size: 600, x: 590, y: 15 };

const ink = {
  dim: "rgba(240,248,255,0.66)",
  gold: "#ffd27a",
  scrim:
    "linear-gradient(90deg, rgba(8,10,26,0.94) 0%, rgba(8,10,26,0.8) 42%, rgba(8,10,26,0) 62%)",
  text: "#fffaf3",
};

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "Dip gently,\nlift gently.",
    detail: "How many can one paper scoop?",
  },
  ja: {
    caption: "そっと入れて、\nそっとすくう。",
    detail: "ポイ一枚で、何匹すくえる？",
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

  const count = countOf(result);
  const rank = rankOf(count);
  const rarest = rarestOf(result);
  const words = copy[lang];

  return {
    caption: rank.name[lang],
    dare: count === 0 ? words.challenge.beat : words.challenge.dare,
    detail:
      rarest !== null && kinds[rarest].tier !== "common"
        ? bragOf(rarest, lang)
        : rank.line[lang],
    headline: countText(count, lang),
    perfect: rank.level === PERFECT,
    tag: words.challenge.received,
  };
};

const Art = ({ result }: { result: Result | null }) => (
  <div
    style={{
      backgroundImage: `url(${dataUri(
        sceneDoc(W, H, FRAME, {
          bowl: result === null ? ["wakin", "sarasa", "ogon"] : shelfOf(result),
          poi: { torn: result !== null, ...RESTING },
          swimmers: posed(result === null ? 3 : countOf(result) + 11, 9),
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
    `${tag}${headline}${caption}${detail}${dare}${copy.ja.name}${copy.ja.reading}${copy.en.reading}0123456789匹fish`
  );

  return await ogImage(
    <div
      style={{
        backgroundImage:
          "linear-gradient(180deg, #0b0a1c 0%, #08101c 55%, #0a1622 100%)",
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
          top: result === null ? 150 : 90,
          width: 540,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
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
