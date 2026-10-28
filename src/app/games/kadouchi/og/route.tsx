import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { ogImage } from "../../_lib/og";
import { dataUri } from "../../_lib/svg";
import { VIEW, sceneDoc } from "../_lib/art";
import { copy } from "../_lib/copy";
import { kinds, prizeIds, scoreOf } from "../_lib/prizes";
import { PERFECT, pointsText, rankOf, readResult } from "../_lib/result";
import type { Result } from "../_lib/result";

const W = 1200;
const H = 630;
const CENTRE = 880;

const JOIN: Record<Lang, string> = { en: ", ", ja: "・" };

const PITCH_SIZE: Record<Lang, number> = { en: 66, ja: 62 };

const NAMED = 3;

const SAMPLE: Result = { got: ["caramel", "hanabi", "bear"] };

const ink = {
  dim: "rgba(255,240,230,0.8)",
  gold: "#ffd27a",
  scrim:
    "linear-gradient(90deg, rgba(18,12,42,0.94) 0%, rgba(18,12,42,0.75) 42%, rgba(18,12,42,0) 64%)",
  text: "#fff8ec",
};

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "Knock it off\nthe shelf.",
    detail: "Big prizes fall only to a corner shot.",
  },
  ja: {
    caption: "角を撃って、\n棚から落とす。",
    detail: "大物は、角を狙わないと倒れない。",
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

const detailOf = (result: Result, lang: Lang) => {
  const words = copy[lang].result;

  if (result.got.length === 0) {
    return words.none;
  }

  return result.got.length > NAMED
    ? words.haul(result.got.length)
    : result.got.map((id) => kinds[id].name[lang]).join(JOIN[lang]);
};

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

  const score = scoreOf(result.got);
  const rank = rankOf(score);
  const words = copy[lang];

  return {
    caption: rank.name[lang],
    dare: words.challenge.dare,
    detail: detailOf(result, lang),
    headline: pointsText(score, lang),
    perfect: rank.level === PERFECT,
    tag: words.challenge.received,
  };
};

const Art = ({ result }: { result: Result | null }) => {
  const shown = result ?? SAMPLE;
  const k = (H - 20) / VIEW.h;

  const frame = {
    size: 1000 * k,
    x: CENTRE - (VIEW.x + VIEW.w / 2) * k,
    y: 10 - VIEW.y * k,
  };

  return (
    <div
      style={{
        backgroundImage: `url(${dataUri(
          sceneDoc(W, H, frame, {
            got: shown.got,
            gun: false,
            standing: prizeIds.filter((id) => !shown.got.includes(id)),
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
    `${tag}${headline}${caption}${detail}${dare}${copy.ja.name}${copy.ja.reading}${copy.en.reading}0123456789点pts`
  );

  return await ogImage(
    <div
      style={{
        backgroundImage: "linear-gradient(180deg, #120c2a 0%, #3a1430 100%)",
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
          top: result === null ? 140 : 80,
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
            fontSize: result === null ? PITCH_SIZE[lang] : 128,
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
            fontSize: result === null ? 30 : 52,
            marginTop: 24,
          }}
        >
          {caption}
        </div>
        {detail === "" ? null : (
          <div
            style={{
              display: "flex",
              fontSize: 26,
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
