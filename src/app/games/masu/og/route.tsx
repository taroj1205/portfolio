import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { dataUri, stillDoc } from "../_lib/art";
import { copy } from "../_lib/copy";
import { drawList } from "../_lib/draw";
import {
  brimful,
  glassOf,
  heightOf,
  lineOf,
  percent,
  rankOf,
  readResult,
  signed,
  spilledOf,
} from "../_lib/result";
import type { Glass } from "../_lib/result";
import { stillOf } from "../_lib/still";

const ink = {
  dim: "rgba(255,250,243,0.62)",
  gold: "#ffd27a",
  scrim:
    "linear-gradient(90deg, rgba(8,4,2,0.9) 0%, rgba(8,4,2,0.72) 40%, rgba(8,4,2,0) 64%)",
  spill: "#ff8a6a",
  text: "#fffaf3",
};

const W = 1200;
const H = 630;

const pitch: Record<Lang, { caption: string; detail: string; size: number }> = {
  en: {
    caption: "Can you stop right before it spills?",
    detail: "It keeps trickling after you let go",
    size: 92,
  },
  ja: {
    caption: "こぼれる直前で、止められる？",
    detail: "離しても、とくとく垂れる",
    size: 84,
  },
};

const cardOf = (poured: Glass | null, lang: Lang) => {
  const words = copy[lang];
  if (poured === null) {
    return {
      caption: pitch[lang].caption,
      detail: pitch[lang].detail,
      headline: words.name,
      label: lang === "ja" ? words.reading : copy.ja.name,
      numbers: null,
      quip: null,
      size: pitch[lang].size,
    };
  }
  const spilled = spilledOf(poured);
  return {
    caption: rankOf(poured).name[lang],
    detail: words.challenge.dare,
    headline: spilled ? words.spilled : percent(poured.outcome.tenths),
    label: words.tension,
    numbers: spilled
      ? words.result.lost(poured.spilled)
      : words.result.stopped(signed(heightOf(poured)), poured.kept),
    quip: lineOf(poured, lang),
    size: spilled ? 124 : 168,
  };
};

const headColour = (poured: Glass | null) => {
  if (poured === null) {
    return ink.text;
  }
  if (spilledOf(poured)) {
    return ink.spill;
  }
  return brimful(poured) ? ink.gold : ink.text;
};

const frameOf = (poured: Glass | null) =>
  poured !== null && spilledOf(poured)
    ? { cx: 900, cy: 318, scale: 2.6 }
    : { cx: 880, cy: 384, scale: 2.9 };

export const GET = async (request: NextRequest) => {
  const result = readResult(Object.fromEntries(request.nextUrl.searchParams));
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const poured = result === null ? null : glassOf(result);
  const { caption, detail, headline, label, numbers, quip, size } = cardOf(
    poured,
    lang
  );
  const font = await loadMincho(
    `${headline}${caption}${detail}${label}${numbers ?? ""}${quip ?? ""}${copy.ja.name}${copy.ja.reading}${copy.en.reading}0123456789.%+−·`
  );
  const scene = stillDoc(W, H, frameOf(poured), drawList(stillOf(poured)));

  return new ImageResponse(
    <div
      style={{
        backgroundColor: "#0b0604",
        color: ink.text,
        display: "flex",
        fontFamily: "Shippori Mincho",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundImage: `url(${dataUri(scene)})`,
          backgroundSize: `${W}px ${H}px`,
          display: "flex",
          height: H,
          left: 0,
          position: "absolute",
          top: 0,
          width: W,
        }}
      />
      <div
        style={{
          backgroundImage: ink.scrim,
          display: "flex",
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
          left: 80,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          top: poured === null ? 150 : 72,
          width: 600,
        }}
      >
        {poured === null ? null : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 22,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: ink.gold, fontSize: 20, letterSpacing: 3 }}>
              {copy[lang].reading}
            </span>
            <span style={{ fontSize: 40 }}>{copy.ja.name}</span>
          </div>
        )}
        <div
          style={{
            color: ink.gold,
            display: "flex",
            fontSize: poured === null ? 26 : 30,
            letterSpacing: lang === "ja" ? 6 : 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            alignItems: "baseline",
            color: headColour(poured),
            display: "flex",
            flexWrap: "wrap",
            fontSize: size,
            letterSpacing: poured === null && lang === "ja" ? 6 : 0,
            lineHeight: 1.05,
            marginTop: 14,
          }}
        >
          {headline}
          {poured === null || spilledOf(poured) ? null : (
            <span style={{ fontSize: 64, marginLeft: 8 }}>%</span>
          )}
        </div>
        <div
          style={{
            color: poured === null ? ink.text : ink.gold,
            display: "flex",
            fontSize: poured === null ? 38 : 34,
            lineHeight: 1.4,
            marginTop: 20,
          }}
        >
          {caption}
        </div>
        {quip === null ? null : (
          <div style={{ display: "flex", fontSize: 30, marginTop: 10 }}>
            {quip}
          </div>
        )}
        {numbers === null ? null : (
          <div
            style={{
              color: ink.dim,
              display: "flex",
              fontSize: 28,
              marginTop: 16,
            }}
          >
            {numbers}
          </div>
        )}
        <div
          style={{
            color: ink.dim,
            display: "flex",
            fontSize: 28,
            marginTop: 24,
          }}
        >
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
