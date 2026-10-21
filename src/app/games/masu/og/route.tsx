import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { loadMincho } from "../../_lib/font";
import { langFrom } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { cupSvg } from "../_components/cup-svg";
import { copy } from "../_lib/copy";
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
import { box, fillOf, paint } from "../_lib/scene";
import type { Fill } from "../_lib/scene";

const ink = {
  dim: "rgba(255,250,243,0.6)",
  gold: "#ffd27a",
  spill: "#ff8a6a",
  text: "#fffaf3",
};

const W = 1200;
const H = 630;

const pitch: Record<Lang, { caption: string; detail: string }> = {
  en: {
    caption: "Can you stop right before it spills?",
    detail: "It keeps trickling after you let go",
  },
  ja: {
    caption: "こぼれる直前で、止められる？",
    detail: "離しても、とくとく垂れる",
  },
};

const brimming: Fill = { dome: 3.6, glass: null, level: box.height };

const cardOf = (poured: Glass | null, lang: Lang) => {
  const words = copy[lang];
  if (poured === null) {
    return {
      caption: pitch[lang].caption,
      detail: pitch[lang].detail,
      fill: brimming,
      headline: words.name,
      label: "ます",
      line: null,
      size: 150,
      spill: null,
    };
  }
  const spilled = spilledOf(poured);
  return {
    caption: `${rankOf(poured).name[lang]} · ${lineOf(poured, lang)}`,
    detail: words.challenge.dare,
    fill: fillOf(poured.pour, poured.outcome.volume),
    headline: spilled ? words.spilled : percent(poured.outcome.tenths),
    label: words.tension,
    line: spilled
      ? words.result.lost(poured.spilled)
      : words.result.stopped(signed(heightOf(poured)), poured.kept),
    size: spilled ? 124 : 168,
    spill: spilled ? { ml: poured.spilled, seed: poured.pour.seed } : null,
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

export const GET = async (request: NextRequest) => {
  const result = readResult(Object.fromEntries(request.nextUrl.searchParams));
  const lang = langFrom(request.nextUrl.searchParams.get("l") ?? undefined);
  const poured = result === null ? null : glassOf(result);
  const { caption, detail, fill, headline, label, line, size, spill } = cardOf(
    poured,
    lang
  );
  const font = await loadMincho(
    `${headline}${caption}${detail}${label}${line ?? ""}0123456789.%+−·枡ます`
  );

  return new ImageResponse(
    <div
      style={{
        backgroundImage: `linear-gradient(180deg, ${paint.night} 0%, ${paint.room} 55%, ${paint.counter} 100%)`,
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
          backgroundImage: `linear-gradient(180deg, rgba(42,23,13,0) 0%, ${paint.counter} 45%, ${paint.counterDark} 100%)`,
          display: "flex",
          height: 330,
          left: 0,
          position: "absolute",
          top: 300,
          width: W,
        }}
      />
      <div
        style={{
          backgroundImage: `radial-gradient(circle at 50% 45%, rgba(255,207,138,0.32), rgba(255,207,138,0) 62%)`,
          display: "flex",
          height: 640,
          left: 640,
          position: "absolute",
          top: 0,
          width: 560,
        }}
      />
      <svg
        height={560}
        style={{ left: 650, position: "absolute", top: 50 }}
        viewBox="-70 -72 140 140"
        width={560}
      >
        {cupSvg({ fill, id: "og", spill })}
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          left: 80,
          position: "absolute",
          textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          top: 84,
          width: 620,
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: ink.gold,
            display: "flex",
            fontSize: 30,
            gap: 18,
            letterSpacing: lang === "ja" ? 10 : 2,
          }}
        >
          {poured === null ? null : (
            <div
              style={{
                alignItems: "center",
                backgroundColor: "#c8352b",
                borderRadius: 6,
                color: ink.text,
                display: "flex",
                fontSize: 24,
                height: 40,
                justifyContent: "center",
                letterSpacing: 0,
                width: 40,
              }}
            >
              枡
            </div>
          )}
          {label}
        </div>
        <div
          style={{
            alignItems: "baseline",
            display: "flex",
            color: headColour(poured),
            fontSize: size,
            letterSpacing: poured === null && lang === "ja" ? 20 : 0,
            lineHeight: 1,
            marginTop: 16,
          }}
        >
          {headline}
          {poured === null || spill !== null ? null : (
            <span style={{ fontSize: 64, marginLeft: 8 }}>%</span>
          )}
        </div>
        <div
          style={{
            color: poured === null ? ink.text : ink.gold,
            display: "flex",
            fontSize: poured === null ? 40 : 34,
            lineHeight: 1.4,
            marginTop: 20,
          }}
        >
          {caption}
        </div>
        {line === null ? null : (
          <div style={{ display: "flex", fontSize: 32, marginTop: 18 }}>
            {line}
          </div>
        )}
        <div
          style={{
            color: ink.dim,
            display: "flex",
            fontSize: 28,
            marginTop: 26,
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
